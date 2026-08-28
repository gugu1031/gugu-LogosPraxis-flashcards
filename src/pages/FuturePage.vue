<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  PhArrowLeft as ArrowLeft,
  PhClipboardText as ClipboardText,
  PhLockKey as LockKey,
  PhUsersThree as UsersThree
} from "@phosphor-icons/vue";

const route = useRoute();
const moduleInfo = computed(() => {
  const map = {
    community: {
      title: "研友社区",
      icon: UsersThree,
      description: "未来可承载公开卡组、学习小组与批注讨论，但不会公开转载本地文献正文。",
      capabilities: ["公共卡组元数据", "主题讨论与举报", "用户资料与隐私控制"]
    },
    "mock-exam": {
      title: "在线模考",
      icon: ClipboardText,
      description: "未来可提供限时答题、题目编排与主观题自评，本期不接入远程题库。",
      capabilities: ["选择题与简答题", "计时与交卷", "本地错题回流闪卡"]
    },
    collaboration: {
      title: "多人协同",
      icon: LockKey,
      description: "未来可共享自建卡片和自有批注，文献文件与受保护原文仍保持权限隔离。",
      capabilities: ["协作空间", "增量同步", "细粒度访问控制"]
    }
  };
  return map[route.params.module as keyof typeof map] ?? map.community;
});
</script>

<template>
  <div class="future-page">
    <RouterLink to="/settings" class="back-link"><ArrowLeft :size="17" />返回设置</RouterLink>
    <section class="future-card panel">
      <div class="future-icon"><component :is="moduleInfo.icon" :size="32" /></div>
      <span>远期功能入口</span>
      <h1>{{ moduleInfo.title }}</h1>
      <p>{{ moduleInfo.description }}</p>
      <div class="future-capabilities">
        <div v-for="item in moduleInfo.capabilities" :key="item">{{ item }}</div>
      </div>
      <aside>
        一期只保留路由、数据模型边界与调用接口，不连接账号、云端数据库或公共内容分发服务。
      </aside>
    </section>
  </div>
</template>

<style scoped>
.future-page {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  align-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 30%),
    var(--bg);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  width: min(100%, 640px);
  margin-bottom: 14px;
  color: var(--text-soft);
  font-size: 11px;
}

.future-card {
  width: min(100%, 640px);
  padding: clamp(30px, 6vw, 58px);
}

.future-icon {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border-radius: 19px;
  color: var(--accent);
  background: var(--accent-soft);
}

.future-card > span {
  display: block;
  margin-top: 28px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.future-card h1 {
  margin: 7px 0 14px;
  font-family: var(--font-serif);
  font-size: clamp(30px, 6vw, 48px);
}

.future-card > p {
  margin: 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.8;
}

.future-capabilities {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 28px;
}

.future-capabilities div {
  display: grid;
  min-height: 74px;
  place-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text-soft);
  background: var(--surface-solid);
  font-size: 10px;
  text-align: center;
}

.future-card aside {
  margin-top: 24px;
  padding: 14px 16px;
  border-left: 3px solid var(--accent);
  border-radius: 0 11px 11px 0;
  color: var(--text-faint);
  background: var(--accent-soft);
  font-size: 10px;
  line-height: 1.65;
}

@media (max-width: 560px) {
  .future-capabilities {
    grid-template-columns: 1fr;
  }

  .future-capabilities div {
    min-height: 52px;
  }
}
</style>
