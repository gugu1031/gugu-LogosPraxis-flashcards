<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  PhArchiveBox as ArchiveBox,
  PhArrowSquareOut as ArrowSquareOut,
  PhBell as Bell,
  PhBooks as Books,
  PhCheck as Check,
  PhCloudSlash as CloudSlash,
  PhDatabase as Database,
  PhDeviceMobile as DeviceMobile,
  PhDownloadSimple as DownloadSimple,
  PhFileCode as FileJson,
  PhLockKey as LockKey,
  PhUploadSimple as UploadSimple,
  PhUsersThree as UsersThree
} from "@phosphor-icons/vue";
import PageHeader from "@/components/PageHeader.vue";
import { db } from "@/db";
import { exportFullBackup, importFullBackup } from "@/services/backup";
import { installPrompt, promptPwaInstall } from "@/services/install";
import { createInitialFsrsState } from "@/services/fsrs";
import {
  exportBlob,
  isNativeRuntime,
  nativePlatformLabel
} from "@/services/native";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";
import type { AppTheme, StudyCard } from "@/types";

const app = useAppStore();
const study = useStudyStore();
const backupInput = ref<HTMLInputElement>();
const cardsInput = ref<HTMLInputElement>();
const exporting = ref(false);
const importing = ref(false);
const persistent = ref(false);
const storage = ref({ used: 0, quota: 0 });
const nativeRuntime = isNativeRuntime();

const themes: Array<{ value: AppTheme; label: string; description: string }> = [
  { value: "paper", label: "柔和纸质", description: "中性浅灰纸面，适合长时间学习" },
  { value: "night", label: "深夜低蓝光", description: "低对比深绿黑，减少夜间刺激" },
  { value: "classic", label: "复古书卷", description: "偏暖纸色与宋体阅读氛围" }
];

const formatBytes = (value: number) => {
  if (!value) return "0 MB";
  const mb = value / 1024 / 1024;
  return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
};
const storagePercent = computed(() =>
  storage.value.quota ? Math.min(100, Math.round((storage.value.used / storage.value.quota) * 100)) : 0
);

const refreshStorage = async () => {
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    storage.value = { used: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
  }
  persistent.value = nativeRuntime || ((await navigator.storage?.persisted?.()) ?? false);
};

const requestPersistence = async () => {
  if (nativeRuntime) {
    persistent.value = true;
    app.notify("原生沙盒存储已启用", "学习数据保存在应用私有空间，仍建议定期导出备份。", "success");
    return;
  }
  const granted = (await navigator.storage?.persist?.()) ?? false;
  persistent.value = granted;
  app.notify(
    granted ? "持久存储已启用" : "浏览器未授予持久存储",
    granted ? "系统会尽量避免自动清理本应用数据。" : "建议定期导出完整备份。",
    granted ? "success" : "info"
  );
};

const exportBackup = async () => {
  exporting.value = true;
  try {
    const blob = await exportFullBackup();
    const action = await exportBlob(
      blob,
      `LogosPraxis-backup-${new Date().toISOString().slice(0, 10)}.zip`,
      "导出 LogosPraxis 完整备份"
    );
    app.notify(
      action === "shared" ? "备份已交给系统分享" : "完整备份已导出",
      "包含 PDF、卡片、批注、索引与学习记录。",
      "success"
    );
  } catch (error) {
    app.notify("备份导出失败", error instanceof Error ? error.message : "请稍后重试。", "error");
  } finally {
    exporting.value = false;
  }
};

const importBackup = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!window.confirm("导入完整备份会替换当前设备上的全部 LogosPraxis 数据。继续吗？")) {
    input.value = "";
    return;
  }
  importing.value = true;
  try {
    await importFullBackup(file);
    await study.refresh();
    await app.initialize();
    await refreshStorage();
    app.notify("备份恢复完成", "本地学习状态已经替换。", "success");
  } catch (error) {
    app.notify("备份导入失败", error instanceof Error ? error.message : "文件不兼容。", "error");
  } finally {
    importing.value = false;
    input.value = "";
  }
};

const exportCards = async () => {
  try {
    const blob = new Blob([JSON.stringify(study.cards, null, 2)], {
      type: "application/json"
    });
    const action = await exportBlob(
      blob,
      `LogosPraxis-cards-${new Date().toISOString().slice(0, 10)}.json`,
      "导出 LogosPraxis 闪卡"
    );
    app.notify(
      action === "shared" ? "闪卡已交给系统分享" : "闪卡 JSON 已导出",
      `${study.cards.length} 张卡片`,
      "success"
    );
  } catch (error) {
    app.notify("闪卡导出失败", error instanceof Error ? error.message : "请稍后重试。", "error");
  }
};

const importCards = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text()) as unknown;
    if (!Array.isArray(raw)) throw new Error("JSON 顶层必须是卡片数组");
    let imported = 0;
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const source = item as Partial<StudyCard>;
      if (typeof source.front !== "string" || typeof source.back !== "string") continue;
      const timestamp = new Date().toISOString();
      const card: StudyCard = {
        id: source.id && !study.cards.some((existing) => existing.id === source.id) ? source.id : crypto.randomUUID(),
        front: source.front.trim(),
        back: source.back.trim(),
        answerTemplate: source.answerTemplate,
        excerpt: source.excerpt,
        sources: Array.isArray(source.sources) ? source.sources : [],
        tags: source.tags ?? {
          subjects: ["未分类"],
          thinkers: [],
          questionTypes: ["简答题"],
          difficulty: "基础",
          eras: [],
          schools: []
        },
        flatTags: [],
        exam: source.exam,
        fsrs: source.fsrs ?? createInitialFsrsState(),
        suspended: source.suspended ?? false,
        createdAt: source.createdAt ?? timestamp,
        updatedAt: timestamp
      };
      await study.saveCard(card);
      imported += 1;
    }
    if (!imported) throw new Error("没有发现包含 front 与 back 字段的有效卡片");
    app.notify("闪卡导入完成", `已导入 ${imported} 张卡片。`, "success");
  } catch (error) {
    app.notify("闪卡导入失败", error instanceof Error ? error.message : "JSON 格式错误。", "error");
  } finally {
    input.value = "";
  }
};

const install = async () => {
  if (nativeRuntime) {
    app.notify("当前已是原生应用", `${nativePlatformLabel()} · 数据保存在本机。`, "success");
    return;
  }
  const result = await promptPwaInstall();
  if (result === "accepted") app.notify("安装已开始", "完成后可从桌面独立打开。", "success");
  else if (result === "unavailable") {
    app.notify("请从浏览器菜单安装", "iPhone 使用 Safari 的“添加到主屏幕”，桌面浏览器使用地址栏安装按钮。", "info");
  }
};

const removeAllPdfs = async () => {
  if (!window.confirm("移除全部本地 PDF、逐页索引和文献批注？闪卡与书目会保留。")) return;
  for (const book of [...study.localBooks]) await study.detachPdf(book);
  await db.annotations.clear();
  study.annotations = [];
  await refreshStorage();
  app.notify("本地文献已清理", "闪卡和书目仍然保留。", "success");
};

onMounted(() => void refreshStorage());
</script>

<template>
  <div class="page settings-page">
    <PageHeader title="设置" description="管理阅读外观、本地存储、完整备份与未来原生版本入口。" />

    <section class="settings-section">
      <div class="settings-heading">
        <h2>阅读外观</h2>
        <p>主题会同时作用于学习区与阅读器周边界面。</p>
      </div>
      <div class="theme-grid">
        <button
          v-for="item in themes"
          :key="item.value"
          type="button"
          :class="[`theme-${item.value}`, { active: app.theme === item.value }]"
          @click="app.setTheme(item.value)"
        >
          <div class="theme-preview">
            <span />
            <i />
            <i />
            <i />
          </div>
          <strong>{{ item.label }}</strong>
          <p>{{ item.description }}</p>
          <Check v-if="app.theme === item.value" :size="17" weight="bold" />
        </button>
      </div>
    </section>

    <section class="settings-section settings-two-columns">
      <article class="settings-card panel-flat">
        <div class="settings-card-icon"><Database :size="21" /></div>
        <div class="settings-card-body">
          <h2>设备存储</h2>
          <p>
            已用 {{ formatBytes(storage.used) }}，{{
              nativeRuntime ? "当前为应用私有沙盒" : `浏览器可用配额 ${formatBytes(storage.quota)}`
            }}
          </p>
          <div class="storage-scale" :aria-label="`存储使用率 ${storagePercent}%`">
            <i v-for="index in 20" :key="index" :class="{ active: index <= Math.ceil(storagePercent / 5) }" />
          </div>
          <div class="settings-card-actions">
            <button class="button" type="button" @click="requestPersistence">
              <LockKey :size="16" />
              {{ nativeRuntime ? "原生沙盒存储" : persistent ? "已启用持久存储" : "申请持久存储" }}
            </button>
            <button class="button button-danger" type="button" @click="removeAllPdfs">清理全部 PDF</button>
          </div>
        </div>
      </article>

      <article class="settings-card panel-flat">
        <div class="settings-card-icon"><ArchiveBox :size="21" /></div>
        <div class="settings-card-body">
          <h2>完整数据备份</h2>
          <p>ZIP 备份包含 PDF、索引、批注、闪卡、复习记录和设置。</p>
          <div class="settings-card-actions">
            <button class="button button-primary" type="button" :disabled="exporting" @click="exportBackup">
              <DownloadSimple :size="16" />
              {{ exporting ? "正在打包" : "导出完整备份" }}
            </button>
            <button class="button" type="button" :disabled="importing" @click="backupInput?.click()">
              <UploadSimple :size="16" />
              {{ importing ? "正在恢复" : "导入备份" }}
            </button>
            <input ref="backupInput" type="file" accept=".zip,application/zip" @change="importBackup" />
          </div>
        </div>
      </article>
    </section>

    <section class="settings-section settings-two-columns">
      <article class="settings-card panel-flat">
        <div class="settings-card-icon"><FileJson :size="21" /></div>
        <div class="settings-card-body">
          <h2>闪卡 JSON</h2>
          <p>用于与其他工具交换卡片。导入至少需要 front 与 back 字段。</p>
          <div class="settings-card-actions">
            <button class="button" type="button" @click="exportCards">导出卡片</button>
            <button class="button" type="button" @click="cardsInput?.click()">批量导入</button>
            <input ref="cardsInput" type="file" accept=".json,application/json" @change="importCards" />
          </div>
        </div>
      </article>

      <article class="settings-card panel-flat">
        <div class="settings-card-icon"><DeviceMobile :size="21" /></div>
        <div class="settings-card-body">
          <h2>安装到设备</h2>
          <p>
            {{ nativeRuntime ? `${nativePlatformLabel()}，可离线独立运行。` : "PWA 可离线独立运行，也可安装原生版本。" }}
          </p>
          <div class="settings-card-actions">
            <button class="button button-primary" type="button" @click="install">
              <DeviceMobile :size="16" />
              {{ nativeRuntime ? "查看原生状态" : installPrompt ? "安装应用" : "查看安装方式" }}
            </button>
          </div>
        </div>
      </article>
    </section>

    <section class="settings-section">
      <div class="settings-heading">
        <h2>未来功能</h2>
        <p>入口和数据边界已经隔离，一期不会写入未完成的远程逻辑。</p>
      </div>
      <div class="future-list panel-flat">
        <RouterLink to="/future/community">
          <UsersThree :size="20" />
          <div><strong>研友社区</strong><span>批注分享、公共卡组与主题讨论</span></div>
          <small>预留</small>
        </RouterLink>
        <RouterLink to="/future/mock-exam">
          <Bell :size="20" />
          <div><strong>在线模考</strong><span>选择题、简答题与限时答题</span></div>
          <small>预留</small>
        </RouterLink>
        <RouterLink to="/future/collaboration">
          <CloudSlash :size="20" />
          <div><strong>多人协同</strong><span>共享卡片与联合文献批注</span></div>
          <small>预留</small>
        </RouterLink>
      </div>
    </section>

    <section class="privacy-banner">
      <Books :size="22" />
      <div>
        <strong>隐私与版权边界</strong>
        <p>应用不上传本地文献，不在安装包内分发受保护教材，也不提供公开分享正文的能力。</p>
      </div>
      <a href="/docs/PRIVACY.md" target="_blank">
        查看说明
        <ArrowSquareOut :size="15" />
      </a>
    </section>
  </div>
</template>

<style scoped>
.settings-section {
  margin-top: 36px;
}

.settings-section:first-of-type {
  margin-top: 0;
}

.settings-heading {
  margin-bottom: 14px;
}

.settings-heading h2,
.settings-card h2 {
  margin: 0;
  font-size: 15px;
}

.settings-heading p,
.settings-card p {
  margin: 5px 0 0;
  color: var(--text-soft);
  font-size: 10px;
  line-height: 1.55;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-grid > button {
  position: relative;
  display: grid;
  gap: 7px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  color: var(--text);
  background: var(--surface);
  text-align: left;
}

.theme-grid > button.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent);
}

.theme-grid > button > svg {
  position: absolute;
  right: 16px;
  bottom: 17px;
  color: var(--accent);
}

.theme-grid strong {
  font-size: 12px;
}

.theme-grid p {
  margin: 0;
  color: var(--text-faint);
  font-size: 9px;
}

.theme-preview {
  display: grid;
  height: 74px;
  grid-template-columns: 22% 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 3px;
  padding: 11px;
  border-radius: 12px;
  background: var(--preview-bg);
}

.theme-preview span {
  grid-row: 1 / -1;
  border-radius: 6px;
  background: var(--preview-side);
}

.theme-preview i {
  border-radius: 4px;
  background: var(--preview-line);
}

.theme-preview i:nth-child(3) {
  width: 83%;
}

.theme-preview i:nth-child(4) {
  width: 68%;
}

.theme-paper {
  --preview-bg: #eef0ec;
  --preview-side: #d8dfd9;
  --preview-line: #69776f;
}

.theme-night {
  --preview-bg: #1a211c;
  --preview-side: #2b382f;
  --preview-line: #87998c;
}

.theme-classic {
  --preview-bg: #ded3c0;
  --preview-side: #c9bda7;
  --preview-line: #766f60;
}

.settings-two-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.settings-card {
  display: grid;
  min-height: 190px;
  grid-template-columns: 44px 1fr;
  gap: 14px;
  padding: 20px;
}

.settings-card-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  color: var(--accent);
  background: var(--accent-soft);
}

.settings-card-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.settings-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: auto;
  padding-top: 18px;
}

.settings-card-actions .button {
  min-height: 36px;
  padding: 0 11px;
  font-size: 10px;
}

.settings-card input[type="file"] {
  display: none;
}

.storage-scale {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  gap: 3px;
  margin-top: 16px;
}

.storage-scale i {
  height: 5px;
  border-radius: 3px;
  background: var(--bg-soft);
}

.storage-scale i.active {
  background: var(--accent);
}

.future-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
}

.future-list a {
  display: grid;
  min-height: 100px;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 18px;
  border-right: 1px solid var(--line);
}

.future-list a:last-child {
  border-right: 0;
}

.future-list a > svg {
  color: var(--accent);
}

.future-list a div {
  display: grid;
  gap: 4px;
}

.future-list strong {
  font-size: 11px;
}

.future-list span,
.future-list small {
  color: var(--text-faint);
  font-size: 9px;
}

.future-list small {
  padding: 4px 7px;
  border-radius: 6px;
  background: var(--bg-soft);
}

.privacy-banner {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 36px;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--line));
  border-radius: var(--radius-card);
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.privacy-banner strong {
  font-size: 11px;
}

.privacy-banner p {
  margin: 4px 0 0;
  color: var(--text-soft);
  font-size: 9px;
  line-height: 1.5;
}

.privacy-banner a {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .theme-grid,
  .future-list {
    grid-template-columns: 1fr;
  }

  .theme-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .future-list a {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .future-list a:last-child {
    border-bottom: 0;
  }
}

@media (max-width: 700px) {
  .theme-grid,
  .settings-two-columns {
    grid-template-columns: 1fr;
  }

  .privacy-banner {
    grid-template-columns: 28px 1fr;
  }

  .privacy-banner a {
    grid-column: 2;
  }
}
</style>
