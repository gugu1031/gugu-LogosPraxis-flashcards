<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  PhArrowLeft as ArrowLeft,
  PhCaretLeft as CaretLeft,
  PhCaretRight as CaretRight,
  PhCardsThree as CardsThree,
  PhCopy as Copy,
  PhHighlighterCircle as HighlighterCircle,
  PhMinus as Minus,
  PhMoon as Moon,
  PhNotePencil as NotePencil,
  PhPlus as Plus,
  PhSidebarSimple as SidebarSimple,
  PhSun as Sun,
  PhX as X
} from "@phosphor-icons/vue";
import { db } from "@/db";
import PdfPageView from "@/components/PdfPageView.vue";
import CardEditorModal from "@/components/CardEditorModal.vue";
import EmptyState from "@/components/EmptyState.vue";
import { loadPdfDocument } from "@/services/pdf";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";
import type { Annotation, StudyCard } from "@/types";

const route = useRoute();
const router = useRouter();
const study = useStudyStore();
const app = useAppStore();
const book = computed(() => study.books.find((item) => item.id === String(route.params.id)));
const loading = ref(true);
const error = ref("");
// PDF.js 的 PDFDocumentProxy 含有原生私有字段，必须避开 Vue 的深层响应式代理。
// 否则 getPage() 会在浏览器中报 “Cannot read private member” 并呈现空白页。
const pdf = shallowRef<PDFDocumentProxy>();
const page = ref(Math.max(1, Number(route.query.page) || book.value?.lastOpenedPage || 1));
const scale = ref(1.15);
const sideOpen = ref(true);
const focusMode = ref(false);
const selectedText = ref("");
const selectionPoint = ref({ x: 0, y: 0 });
const cardEditorOpen = ref(false);
const noteEditorOpen = ref(false);
const noteText = ref("");
const readerRoot = ref<HTMLElement>();

const pageCount = computed(() => pdf.value?.numPages ?? book.value?.pageCount ?? 0);
const currentAnnotations = computed(() =>
  study.annotations.filter((item) => item.bookId === book.value?.id && item.page === page.value)
);
const allBookAnnotations = computed(() =>
  study.annotations.filter((item) => item.bookId === book.value?.id).sort((a, b) => a.page - b.page)
);
const linkedCards = computed(() =>
  study.cards.filter((card) => card.sources.some((source) => source.bookId === book.value?.id))
);
const source = computed(() =>
  book.value
    ? {
        bookId: book.value.id,
        page: page.value,
        quote: selectedText.value
      }
    : undefined
);

const load = async () => {
  if (!book.value?.fileId) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const stored = await db.files.get(book.value.fileId);
    if (!stored) throw new Error("本地 PDF 文件已不存在，请重新导入。");
    const document = markRaw(await loadPdfDocument(stored.blob));
    pdf.value = document;
    page.value = Math.min(Math.max(1, page.value), document.numPages);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "无法打开 PDF";
  } finally {
    loading.value = false;
  }
};

const savePosition = async () => {
  if (!book.value) return;
  await study.updateBook({
    ...book.value,
    lastOpenedPage: page.value,
    lastOpenedAt: new Date().toISOString()
  });
};

const goPage = async (value: number) => {
  page.value = Math.min(Math.max(1, value), pageCount.value || 1);
  await router.replace({ query: { ...route.query, page: String(page.value) } });
  await savePosition();
  readerRoot.value?.querySelector(".reader-canvas")?.scrollTo({ top: 0, behavior: "smooth" });
};

const handleSelection = () => {
  window.setTimeout(() => {
    const selection = window.getSelection();
    const value = selection?.toString().replace(/\s+/g, " ").trim() ?? "";
    if (!value || value.length < 2) {
      selectedText.value = "";
      return;
    }
    const anchor = selection?.anchorNode?.parentElement;
    if (!anchor?.closest(".textLayer")) return;
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    selectedText.value = value.slice(0, 1600);
    selectionPoint.value = {
      x: Math.min(window.innerWidth - 250, Math.max(12, rect?.left ?? 12)),
      y: Math.max(70, (rect?.top ?? 80) - 52)
    };
  }, 0);
};

const saveHighlight = async () => {
  if (!book.value || !selectedText.value) return;
  const timestamp = new Date().toISOString();
  const annotation: Annotation = {
    id: crypto.randomUUID(),
    bookId: book.value.id,
    page: page.value,
    text: selectedText.value,
    note: "",
    color: "amber",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await study.saveAnnotation(annotation);
  selectedText.value = "";
  window.getSelection()?.removeAllRanges();
  app.notify("划线已保存", `第 ${page.value} 页`, "success");
};

const openNote = () => {
  noteText.value = "";
  noteEditorOpen.value = true;
};

const saveNote = async () => {
  if (!book.value || !selectedText.value) return;
  const timestamp = new Date().toISOString();
  await study.saveAnnotation({
    id: crypto.randomUUID(),
    bookId: book.value.id,
    page: page.value,
    text: selectedText.value,
    note: noteText.value.trim(),
    color: "sage",
    createdAt: timestamp,
    updatedAt: timestamp
  });
  noteEditorOpen.value = false;
  selectedText.value = "";
  window.getSelection()?.removeAllRanges();
  app.notify("批注已保存", "已写入当前设备。", "success");
};

const copySelection = async () => {
  if (!selectedText.value) return;
  await navigator.clipboard.writeText(selectedText.value);
  app.notify("原文已复制", undefined, "success");
  selectedText.value = "";
};

const saveCard = async (card: StudyCard) => {
  await study.saveCard(card);
  cardEditorOpen.value = false;
  selectedText.value = "";
  window.getSelection()?.removeAllRanges();
  app.notify("闪卡已建立", "文献页码和摘录已自动关联。", "success");
};

const handleKeydown = (event: KeyboardEvent) => {
  if (["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) return;
  if (event.key === "ArrowLeft") void goPage(page.value - 1);
  if (event.key === "ArrowRight") void goPage(page.value + 1);
  if (event.key === "=" || event.key === "+") scale.value = Math.min(2.4, scale.value + 0.1);
  if (event.key === "-") scale.value = Math.max(0.55, scale.value - 0.1);
  if (event.key === "Escape") {
    selectedText.value = "";
    noteEditorOpen.value = false;
  }
};

watch(
  () => route.params.id,
  async () => {
    await pdf.value?.destroy();
    pdf.value = undefined;
    await load();
  }
);

onMounted(async () => {
  await nextTick();
  await load();
  window.addEventListener("keydown", handleKeydown);
  document.addEventListener("selectionchange", handleSelection);
});

onBeforeUnmount(() => {
  void savePosition();
  void pdf.value?.destroy();
  window.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("selectionchange", handleSelection);
});
</script>

<template>
  <div ref="readerRoot" class="reader-page" :class="{ 'focus-mode': focusMode, 'side-closed': !sideOpen }">
    <header class="reader-toolbar">
      <button class="icon-button" type="button" aria-label="返回图书馆" @click="router.push('/library')">
        <ArrowLeft :size="20" />
      </button>
      <div class="reader-title">
        <strong>{{ book?.title || "文献阅读" }}</strong>
        <span>{{ book?.authors.join("、") || book?.subCategory }}</span>
      </div>
      <div class="page-control">
        <button type="button" aria-label="上一页" :disabled="page <= 1" @click="goPage(page - 1)">
          <CaretLeft :size="17" />
        </button>
        <input
          :value="page"
          type="number"
          min="1"
          :max="pageCount"
          aria-label="当前页码"
          @change="goPage(Number(($event.target as HTMLInputElement).value))"
        />
        <span>/ {{ pageCount || "?" }}</span>
        <button type="button" aria-label="下一页" :disabled="page >= pageCount" @click="goPage(page + 1)">
          <CaretRight :size="17" />
        </button>
      </div>
      <div class="zoom-control">
        <button type="button" aria-label="缩小" @click="scale = Math.max(0.55, scale - 0.1)"><Minus :size="17" /></button>
        <span>{{ Math.round(scale * 100) }}%</span>
        <button type="button" aria-label="放大" @click="scale = Math.min(2.4, scale + 0.1)"><Plus :size="17" /></button>
      </div>
      <button class="icon-button" type="button" :aria-label="focusMode ? '退出专注模式' : '进入专注模式'" @click="focusMode = !focusMode">
        <Moon v-if="!focusMode" :size="19" />
        <Sun v-else :size="19" />
      </button>
      <button class="icon-button" type="button" aria-label="切换侧栏" @click="sideOpen = !sideOpen">
        <SidebarSimple :size="20" />
      </button>
    </header>

    <main class="reader-layout">
      <section class="reader-canvas">
        <div v-if="loading" class="reader-loading">
          <div class="document-skeleton"><span /><span /><span /><span /></div>
          <p>正在打开本地文献</p>
        </div>
        <EmptyState v-else-if="!book?.fileId" title="这本书还没有关联 PDF" description="回到图书馆选择本地文件，完成后即可阅读、划线和建立闪卡。">
          <button class="button button-primary" type="button" @click="router.push('/library')">前往图书馆</button>
        </EmptyState>
        <EmptyState v-else-if="error" title="无法打开文献" :description="error">
          <button class="button" type="button" @click="router.push('/library')">重新导入</button>
        </EmptyState>
        <PdfPageView
          v-else-if="pdf"
          :document="pdf"
          :page-number="page"
          :scale="scale"
          :highlights="currentAnnotations.map((item) => item.text)"
        />
      </section>

      <aside class="reader-side">
        <div class="side-tabs">
          <strong>关联内容</strong>
          <span>{{ linkedCards.length }} 张卡片 · {{ allBookAnnotations.length }} 条批注</span>
        </div>
        <div class="side-section">
          <h2>本文闪卡</h2>
          <RouterLink
            v-for="card in linkedCards.slice(0, 8)"
            :key="card.id"
            :to="`/review`"
            class="linked-card"
          >
            <CardsThree :size="18" />
            <div>
              <strong>{{ card.front }}</strong>
              <span v-if="card.sources.find((item) => item.bookId === book?.id)?.page">
                第 {{ card.sources.find((item) => item.bookId === book?.id)?.page }} 页
              </span>
            </div>
          </RouterLink>
          <p v-if="!linkedCards.length" class="side-empty">选中正文后，可以直接建立带页码的闪卡。</p>
        </div>
        <div class="side-section">
          <h2>批注与划线</h2>
          <button
            v-for="annotation in allBookAnnotations.slice(0, 12)"
            :key="annotation.id"
            class="annotation-item"
            type="button"
            @click="goPage(annotation.page)"
          >
            <span>第 {{ annotation.page }} 页</span>
            <p>{{ annotation.note || annotation.text }}</p>
          </button>
          <p v-if="!allBookAnnotations.length" class="side-empty">当前文献还没有批注。</p>
        </div>
      </aside>
    </main>

    <div
      v-if="selectedText"
      class="selection-menu"
      :style="{ left: `${selectionPoint.x}px`, top: `${selectionPoint.y}px` }"
    >
      <button type="button" @click="saveHighlight"><HighlighterCircle :size="17" />划线</button>
      <button type="button" @click="openNote"><NotePencil :size="17" />批注</button>
      <button type="button" @click="cardEditorOpen = true"><CardsThree :size="17" />制卡</button>
      <button type="button" @click="copySelection"><Copy :size="17" />复制</button>
    </div>

    <CardEditorModal
      v-if="cardEditorOpen && source"
      :source="source"
      :excerpt="selectedText"
      @close="cardEditorOpen = false"
      @save="saveCard"
    />

    <div v-if="noteEditorOpen" class="modal-backdrop" @mousedown.self="noteEditorOpen = false">
      <section class="note-dialog panel" role="dialog" aria-modal="true" aria-label="添加阅读批注">
        <header>
          <h2>添加批注</h2>
          <button class="icon-button" type="button" aria-label="关闭" @click="noteEditorOpen = false">
            <X :size="18" />
          </button>
        </header>
        <blockquote>{{ selectedText }}</blockquote>
        <div class="field">
          <label for="reader-note">你的思考</label>
          <textarea id="reader-note" v-model="noteText" autofocus placeholder="记录概念关联、疑问或答题启发" />
        </div>
        <footer>
          <button class="button" type="button" @click="noteEditorOpen = false">取消</button>
          <button class="button button-primary" type="button" @click="saveNote">保存批注</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
.reader-page {
  min-height: calc(100dvh - var(--safe-top));
  background: #cfd3ce;
}

:root[data-theme="night"] .reader-page,
.reader-page.focus-mode {
  background: #121612;
}

.reader-toolbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  min-height: 64px;
  grid-template-columns: 40px minmax(160px, 1fr) auto auto 40px 40px;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  backdrop-filter: blur(20px) saturate(125%);
  -webkit-backdrop-filter: blur(20px) saturate(125%);
}

.reader-title {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.reader-title strong,
.reader-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-title strong {
  font-family: var(--font-serif);
  font-size: 13px;
}

.reader-title span {
  color: var(--text-faint);
  font-size: 9px;
}

.page-control,
.zoom-control {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface-solid);
}

.page-control button,
.zoom-control button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--text-soft);
  background: transparent;
}

.page-control button:hover,
.zoom-control button:hover {
  background: var(--bg-soft);
}

.page-control button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.page-control input {
  width: 42px;
  border: 0;
  outline: 0;
  background: transparent;
  text-align: right;
  font-size: 11px;
}

.page-control span,
.zoom-control span {
  min-width: 45px;
  color: var(--text-faint);
  font-size: 10px;
  text-align: center;
}

.reader-layout {
  display: grid;
  height: calc(100dvh - 64px - var(--safe-top));
  grid-template-columns: minmax(0, 1fr) 330px;
}

.reader-canvas {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  padding: 36px;
}

.reader-side {
  overflow: auto;
  border-left: 1px solid var(--line);
  background: var(--surface);
}

.side-closed .reader-layout {
  grid-template-columns: 1fr;
}

.side-closed .reader-side,
.focus-mode .reader-side {
  display: none;
}

.focus-mode .reader-layout {
  grid-template-columns: 1fr;
}

.side-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  gap: 4px;
  padding: 18px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.side-tabs strong {
  font-size: 13px;
}

.side-tabs span {
  color: var(--text-faint);
  font-size: 9px;
}

.side-section {
  padding: 18px;
  border-bottom: 1px solid var(--line);
}

.side-section h2 {
  margin: 0 0 12px;
  color: var(--text-soft);
  font-size: 11px;
}

.linked-card {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 9px;
  padding: 10px;
  border-radius: 10px;
  color: var(--text-soft);
}

.linked-card:hover {
  background: var(--bg-soft);
}

.linked-card div {
  display: grid;
  gap: 3px;
}

.linked-card strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.linked-card span {
  color: var(--text-faint);
  font-size: 8px;
}

.side-empty {
  margin: 0;
  color: var(--text-faint);
  font-size: 10px;
  line-height: 1.6;
}

.annotation-item {
  display: grid;
  width: 100%;
  gap: 5px;
  padding: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  text-align: left;
}

.annotation-item:hover {
  background: var(--bg-soft);
}

.annotation-item span {
  color: var(--accent);
  font-size: 8px;
  font-weight: 700;
}

.annotation-item p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-soft);
  font-family: var(--font-serif);
  font-size: 10px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.selection-menu {
  position: fixed;
  z-index: 60;
  display: flex;
  gap: 3px;
  padding: 5px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface-raised);
  box-shadow: var(--shadow);
}

.selection-menu button {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  border: 0;
  border-radius: 8px;
  color: var(--text-soft);
  background: transparent;
  font-size: 10px;
}

.selection-menu button:hover {
  color: var(--text);
  background: var(--bg-soft);
}

.reader-loading {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 16px;
  min-height: 60dvh;
}

.document-skeleton {
  display: grid;
  width: min(460px, 70vw);
  height: 590px;
  align-content: start;
  gap: 17px;
  padding: 70px 55px;
  background: #f2f2ee;
  box-shadow: var(--shadow);
}

.document-skeleton span {
  height: 12px;
  border-radius: 4px;
  background: #dfe1dc;
}

.document-skeleton span:nth-child(2) {
  width: 88%;
}

.document-skeleton span:nth-child(3) {
  width: 95%;
}

.document-skeleton span:nth-child(4) {
  width: 72%;
}

.reader-loading p {
  color: var(--text-soft);
  font-size: 11px;
}

.note-dialog {
  width: min(600px, 100%);
  padding: 22px;
}

.note-dialog header,
.note-dialog footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.note-dialog h2 {
  margin: 0;
  font-size: 18px;
}

.note-dialog blockquote {
  max-height: 160px;
  margin: 18px 0;
  overflow: auto;
  padding: 14px 16px;
  border-left: 3px solid var(--accent);
  border-radius: 0 12px 12px 0;
  color: var(--text-soft);
  background: var(--accent-soft);
  font-family: var(--font-serif);
  font-size: 12px;
  line-height: 1.7;
}

.note-dialog footer {
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 900px) {
  .reader-toolbar {
    grid-template-columns: 40px 1fr auto 40px;
  }

  .zoom-control,
  .reader-toolbar > .icon-button:nth-last-child(2) {
    display: none;
  }

  .reader-layout {
    grid-template-columns: 1fr;
  }

  .reader-side {
    position: fixed;
    inset: 64px 0 0 auto;
    z-index: 25;
    width: min(330px, 90vw);
    box-shadow: -16px 0 40px rgb(12 18 14 / 0.22);
  }

  .side-closed .reader-side {
    display: none;
  }
}

@media (max-width: 600px) {
  .reader-toolbar {
    min-height: 58px;
    grid-template-columns: 36px 1fr auto 36px;
    padding: 8px 10px;
  }

  .reader-title span {
    display: none;
  }

  .page-control button {
    display: none;
  }

  .page-control span {
    min-width: 36px;
  }

  .reader-layout {
    height: calc(100dvh - 58px - var(--safe-top));
  }

  .reader-canvas {
    justify-content: flex-start;
    padding: 18px;
  }

  .selection-menu {
    right: 10px;
    left: 10px !important;
    justify-content: space-between;
    overflow-x: auto;
  }
}
</style>
