<script setup lang="ts">
import { computed, ref } from "vue";
import {
  BlobReader,
  BlobWriter,
  ZipReader,
  type FileEntry
} from "@zip.js/zip.js";
import {
  PhArrowSquareOut as ArrowSquareOut,
  PhBookOpenText as BookOpenText,
  PhFilePdf as FilePdf,
  PhFunnel as Funnel,
  PhMagnifyingGlass as MagnifyingGlass,
  PhTrash as Trash,
  PhUploadSimple as UploadSimple,
  PhX as X
} from "@phosphor-icons/vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import BookCover from "@/components/BookCover.vue";
import EmptyState from "@/components/EmptyState.vue";
import { openResourceSources } from "@/data/openResources";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";
import type { Book, LibraryCategory } from "@/types";

const study = useStudyStore();
const app = useAppStore();
const router = useRouter();
const query = ref("");
const category = ref<"全部" | LibraryCategory>("全部");
const status = ref<"全部" | "已导入" | "仅书目">("全部");
const fileInput = ref<HTMLInputElement>();
const selectedInput = ref<HTMLInputElement>();
const selectedBook = ref<Book>();
const openResources = ref(false);
const resourceQuery = ref("");
const importingMany = ref(false);

const categories: Array<"全部" | LibraryCategory> = [
  "全部",
  "马理论",
  "马工程教材",
  "西方哲学",
  "西方马克思主义",
  "拓展阅读"
];

const filteredBooks = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase("zh-CN");
  return study.books
    .filter((book) => category.value === "全部" || book.category === category.value)
    .filter((book) => status.value === "全部" || (status.value === "已导入" ? book.status === "local" : book.status !== "local"))
    .filter((book) =>
      !needle
        ? true
        : `${book.title}${book.authors.join("")}${book.thinkers.join("")}${book.tags.join("")}`
            .toLocaleLowerCase("zh-CN")
            .includes(needle)
    )
    .sort((a, b) => {
      if (a.status === "local" && b.status !== "local") return -1;
      if (b.status === "local" && a.status !== "local") return 1;
      return a.title.localeCompare(b.title, "zh-CN");
    });
});

const normalizeTitle = (value: string) =>
  value
    .replace(/\.pdf$/i, "")
    .replace(/[《》【】（）、，：:\s\d\-_.]/g, "")
    .replace(/20\d{2}年?版/g, "")
    .toLocaleLowerCase("zh-CN");

const matchCatalog = (file: File) => {
  const filename = normalizeTitle(file.name);
  return study.books.find((book) => {
    const title = normalizeTitle(book.title);
    return filename.includes(title.slice(0, Math.min(title.length, 8))) || title.includes(filename.slice(0, 8));
  });
};

const processPdf = async (file: File, forcedBook?: Book) => {
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return;
  const book = forcedBook ?? matchCatalog(file);
  if (book) await study.importPdf(book, file);
  else await study.importUncataloguedPdf(file);
};

const processZip = async (file: File) => {
  const reader = new ZipReader(new BlobReader(file));
  try {
    const entries = await reader.getEntries();
    const pdfEntries = entries.filter(
      (entry): entry is FileEntry =>
        !entry.directory && entry.filename.toLowerCase().endsWith(".pdf")
    );
    if (!pdfEntries.length) throw new Error("压缩包中没有 PDF 文件");
    for (const entry of pdfEntries) {
      const blob = await entry.getData(new BlobWriter("application/pdf"));
      const name = entry.filename.split("/").pop() ?? entry.filename;
      await processPdf(new File([blob], name, { type: "application/pdf" }));
    }
    app.notify("压缩包导入完成", `已处理 ${pdfEntries.length} 份 PDF。`, "success");
  } finally {
    await reader.close();
  }
};

const handleBatchFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  if (!files.length) return;
  importingMany.value = true;
  try {
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".zip")) await processZip(file);
      else await processPdf(file);
    }
    app.notify("文献已写入本地", "PDF 正文与索引不会上传到任何服务器。", "success");
  } catch (error) {
    app.notify("导入未完成", error instanceof Error ? error.message : "请检查文件格式。", "error");
  } finally {
    importingMany.value = false;
    input.value = "";
  }
};

const chooseForBook = (book: Book) => {
  selectedBook.value = book;
  selectedInput.value?.click();
};

const handleSelectedFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !selectedBook.value) return;
  try {
    await processPdf(file, selectedBook.value);
    app.notify("文献已关联", `《${selectedBook.value.title}》已完成全文索引。`, "success");
  } catch (error) {
    app.notify("导入失败", error instanceof Error ? error.message : "无法解析该 PDF。", "error");
  } finally {
    input.value = "";
    selectedBook.value = undefined;
  }
};

const openBook = async (book: Book) => {
  if (book.status === "local") await router.push(`/reader/${book.id}`);
  else chooseForBook(book);
};

const detach = async (book: Book) => {
  if (!window.confirm(`移除《${book.title}》的本地 PDF 与全文索引？书目和关联闪卡会保留。`)) return;
  await study.detachPdf(book);
  app.notify("本地文件已移除", "书目和闪卡关联仍然保留。", "success");
};

const openResource = (source: (typeof openResourceSources)[number]) => {
  const value = resourceQuery.value.trim() || "马克思 资本论";
  window.open(source.searchUrl(value), "_blank", "noopener,noreferrer");
};
</script>

<template>
  <div class="page library-page">
    <PageHeader title="文献图书馆" description="统一管理本地 PDF、哲学史书目与逐页全文索引。文件始终留在当前设备。">
      <template #actions>
        <button class="button" type="button" @click="openResources = true">
          <ArrowSquareOut :size="17" />
          开放资源
        </button>
        <button class="button button-primary" type="button" :disabled="importingMany" @click="fileInput?.click()">
          <UploadSimple :size="18" />
          {{ importingMany ? "正在导入" : "批量导入" }}
        </button>
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept=".pdf,.zip,application/pdf,application/zip"
          multiple
          @change="handleBatchFiles"
        />
        <input
          ref="selectedInput"
          class="visually-hidden"
          type="file"
          accept=".pdf,application/pdf"
          @change="handleSelectedFile"
        />
      </template>
    </PageHeader>

    <section class="library-toolbar panel-flat">
      <label class="library-search">
        <MagnifyingGlass :size="19" />
        <input v-model="query" type="search" placeholder="检索书名、作者、哲学家或标签" />
      </label>
      <div class="status-filter">
        <Funnel :size="17" />
        <select v-model="status" aria-label="导入状态">
          <option>全部</option>
          <option>已导入</option>
          <option>仅书目</option>
        </select>
      </div>
    </section>

    <div class="category-scroll">
      <button
        v-for="item in categories"
        :key="item"
        type="button"
        :class="{ active: category === item }"
        @click="category = item"
      >
        {{ item }}
      </button>
    </div>

    <div class="library-summary">
      <span>{{ filteredBooks.length }} 本书目</span>
      <span>{{ study.localBooks.length }} 份本地 PDF</span>
      <span>{{ study.localBooks.reduce((sum, book) => sum + book.indexedPages, 0) }} 页可检索</span>
    </div>

    <section v-if="filteredBooks.length" class="book-grid">
      <article v-for="book in filteredBooks" :key="book.id" class="book-card panel-flat">
        <BookCover :book="book" size="medium" />
        <div class="book-body">
          <div class="book-status">
            <span :class="{ local: book.status === 'local', error: book.status === 'error' }">
              {{
                book.status === "local"
                  ? "已导入"
                  : book.status === "indexing"
                    ? "索引中"
                    : book.status === "error"
                      ? "需重试"
                      : "仅书目"
              }}
            </span>
            <small v-if="book.status === 'local'">{{ book.pageCount }} 页</small>
          </div>
          <h2>{{ book.title }}</h2>
          <p>{{ book.authors.join("、") || book.subCategory }}</p>
          <div class="book-tags">
            <span>{{ book.category }}</span>
            <span>{{ book.subCategory }}</span>
          </div>
          <div
            v-if="study.importProgress[book.id] && study.importProgress[book.id].phase !== 'done'"
            class="import-progress"
          >
            <span
              :style="{
                width: `${Math.round((study.importProgress[book.id].current / Math.max(study.importProgress[book.id].total, 1)) * 100)}%`
              }"
            />
            <small>{{ study.importProgress[book.id].message }}</small>
          </div>
          <p v-if="book.importError" class="book-error">{{ book.importError }}</p>
        </div>
        <div class="book-actions">
          <button class="button" type="button" @click="openBook(book)">
            <BookOpenText :size="17" />
            {{ book.status === "local" ? "继续阅读" : "关联 PDF" }}
          </button>
          <button
            v-if="book.status === 'local'"
            class="icon-button"
            type="button"
            aria-label="移除本地文件"
            @click="detach(book)"
          >
            <Trash :size="17" />
          </button>
        </div>
      </article>
    </section>
    <EmptyState v-else title="没有匹配的书目" description="试试缩短关键词，或者清除分类筛选。">
      <button class="button" type="button" @click="query = ''; category = '全部'; status = '全部'">清除筛选</button>
    </EmptyState>

    <div v-if="openResources" class="modal-backdrop" @mousedown.self="openResources = false">
      <section class="resource-dialog panel" role="dialog" aria-modal="true" aria-label="权威开放资源检索">
        <header>
          <div>
            <h2>权威开放资源检索</h2>
            <p>只提供检索入口，不自动抓取或镜像正文。获取后仍由你本地导入。</p>
          </div>
          <button class="icon-button" type="button" aria-label="关闭" @click="openResources = false">
            <X :size="19" />
          </button>
        </header>
        <div class="resource-search">
          <MagnifyingGlass :size="19" />
          <input v-model="resourceQuery" class="input" placeholder="输入著作、作者或概念" />
        </div>
        <div class="resource-list">
          <button v-for="source in openResourceSources" :key="source.id" type="button" @click="openResource(source)">
            <div>
              <strong>{{ source.name }}</strong>
              <span>{{ source.scope }}</span>
              <small>{{ source.note }}</small>
            </div>
            <ArrowSquareOut :size="18" />
          </button>
        </div>
        <footer>
          <FilePdf :size="18" />
          <span>下载前请核验页面许可、版本信息与所在地版权期限。</span>
        </footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
.visually-hidden {
  position: fixed;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.library-toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 10px;
}

.library-search {
  display: grid;
  grid-template-columns: 24px 1fr;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  color: var(--text-faint);
}

.library-search input {
  width: 100%;
  min-height: 44px;
  border: 0;
  outline: 0;
  color: var(--text);
  background: transparent;
}

.library-search input::placeholder {
  color: var(--text-faint);
}

.status-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
  border-left: 1px solid var(--line);
  color: var(--text-faint);
}

.status-filter select {
  min-height: 40px;
  padding: 0 30px 0 8px;
  border: 0;
  outline: 0;
  color: var(--text-soft);
  background: transparent;
  font-size: 12px;
}

.category-scroll {
  display: flex;
  gap: 6px;
  margin: 17px 0 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-scroll button {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-soft);
  background: var(--surface);
  font-size: 11px;
  white-space: nowrap;
}

.category-scroll button.active {
  color: var(--accent-contrast);
  border-color: var(--accent);
  background: var(--accent);
}

.library-summary {
  display: flex;
  gap: 18px;
  margin-bottom: 20px;
  color: var(--text-faint);
  font-size: 10px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.book-card {
  display: grid;
  min-height: 182px;
  grid-template-columns: 88px 1fr;
  gap: 17px;
  padding: 18px;
}

.book-body {
  min-width: 0;
}

.book-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.book-status span {
  color: var(--text-faint);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.book-status span.local {
  color: var(--accent);
}

.book-status span.error,
.book-error {
  color: var(--danger);
}

.book-status small {
  color: var(--text-faint);
  font-size: 9px;
}

.book-card h2 {
  margin: 8px 0 5px;
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 650;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card p {
  margin: 0;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-tags {
  display: flex;
  gap: 5px;
  margin-top: 12px;
  overflow: hidden;
}

.book-tags span {
  min-height: 22px;
  padding: 4px 7px;
  border-radius: 6px;
  color: var(--text-faint);
  background: var(--bg-soft);
  font-size: 9px;
  white-space: nowrap;
}

.book-actions {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 13px;
  border-top: 1px solid var(--line);
}

.book-actions .button {
  min-height: 36px;
  padding: 0 12px;
  font-size: 11px;
}

.book-actions .icon-button {
  width: 36px;
  height: 36px;
}

.import-progress {
  position: relative;
  height: 4px;
  margin-top: 14px;
  border-radius: 4px;
  background: var(--bg-soft);
}

.import-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 180ms ease;
}

.import-progress small {
  display: block;
  margin-top: 5px;
  color: var(--text-faint);
  font-size: 8px;
}

.book-error {
  margin-top: 8px !important;
  font-size: 9px !important;
}

.resource-dialog {
  width: min(670px, 100%);
  max-height: 84dvh;
  overflow: auto;
  padding: 22px;
}

.resource-dialog header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.resource-dialog h2 {
  margin: 0;
  font-size: 20px;
}

.resource-dialog header p {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 11px;
}

.resource-search {
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
  color: var(--text-faint);
}

.resource-list {
  display: grid;
  gap: 8px;
}

.resource-list button {
  display: grid;
  grid-template-columns: 1fr 24px;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: 13px;
  color: var(--text);
  background: var(--surface-solid);
  text-align: left;
}

.resource-list button:hover {
  border-color: var(--accent);
}

.resource-list button div {
  display: grid;
  gap: 4px;
}

.resource-list strong {
  font-size: 13px;
}

.resource-list span {
  color: var(--text-soft);
  font-size: 11px;
}

.resource-list small {
  color: var(--text-faint);
  font-size: 9px;
  line-height: 1.5;
}

.resource-dialog footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 10%, var(--surface));
  font-size: 10px;
  line-height: 1.5;
}

@media (max-width: 1080px) {
  .book-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .library-toolbar {
    grid-template-columns: 1fr;
  }

  .status-filter {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .library-summary {
    gap: 10px;
  }

  .book-card {
    grid-template-columns: 72px 1fr;
  }

  .book-card :deep(.book-cover) {
    width: 72px;
    height: 98px;
  }
}
</style>
