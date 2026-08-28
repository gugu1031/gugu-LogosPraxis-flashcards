<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { TextLayer, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist";

const props = defineProps<{
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  highlights: string[];
}>();

const emit = defineEmits<{
  rendered: [{ width: number; height: number }];
}>();

const canvas = ref<HTMLCanvasElement>();
const textLayer = ref<HTMLDivElement>();
const root = ref<HTMLDivElement>();
const loading = ref(true);
const renderError = ref("");
let renderTask: RenderTask | undefined;
let activeTextLayer: TextLayer | undefined;
let renderGeneration = 0;

const isCancelledRender = (reason: unknown) =>
  reason instanceof Error &&
  (reason.name === "RenderingCancelledException" || reason.message.toLowerCase().includes("cancel"));

const applySavedHighlights = () => {
  if (!textLayer.value || !props.highlights.length) return;
  const values = props.highlights.map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean);
  for (const span of textLayer.value.querySelectorAll("span")) {
    const text = span.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (text.length > 1 && values.some((value) => value.includes(text) || text.includes(value))) {
      span.classList.add("saved-highlight");
    }
  }
};

const render = async () => {
  if (!canvas.value || !textLayer.value || !root.value) return;
  const generation = ++renderGeneration;
  loading.value = true;
  renderError.value = "";
  renderTask?.cancel();
  activeTextLayer?.cancel();
  textLayer.value.replaceChildren();

  try {
    const page = await props.document.getPage(props.pageNumber);
    if (generation !== renderGeneration) return;

    const viewport = page.getViewport({ scale: props.scale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.value.getContext("2d", { alpha: false });
    if (!context) throw new Error("浏览器无法创建 PDF 画布");

    root.value.style.width = `${viewport.width}px`;
    root.value.style.height = `${viewport.height}px`;
    canvas.value.width = Math.floor(viewport.width * outputScale);
    canvas.value.height = Math.floor(viewport.height * outputScale);
    canvas.value.style.width = `${viewport.width}px`;
    canvas.value.style.height = `${viewport.height}px`;
    textLayer.value.style.width = `${viewport.width}px`;
    textLayer.value.style.height = `${viewport.height}px`;

    renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
    });
    await renderTask.promise;
    if (generation !== renderGeneration) return;

    const textContent = await page.getTextContent();
    activeTextLayer = new TextLayer({
      textContentSource: textContent,
      container: textLayer.value,
      viewport
    });
    await activeTextLayer.render();
    if (generation !== renderGeneration) return;

    await nextTick();
    applySavedHighlights();
    loading.value = false;
    emit("rendered", { width: viewport.width, height: viewport.height });
  } catch (reason) {
    if (generation !== renderGeneration || isCancelledRender(reason)) return;
    renderError.value = reason instanceof Error ? reason.message : "当前页面渲染失败";
    loading.value = false;
    root.value.style.width ||= "min(680px, 80vw)";
    root.value.style.height ||= "min(880px, 72vh)";
  }
};

watch(
  () => [props.pageNumber, props.scale, props.document, props.highlights],
  () => void render(),
  { deep: true }
);

onMounted(() => void render());
onBeforeUnmount(() => {
  renderGeneration += 1;
  renderTask?.cancel();
  activeTextLayer?.cancel();
});
</script>

<template>
  <div ref="root" class="pdf-page" :class="{ loading }">
    <canvas ref="canvas" />
    <div ref="textLayer" class="textLayer" />
    <div v-if="loading" class="pdf-page-loading">
      <span />
      <span />
      <span />
    </div>
    <div v-else-if="renderError" class="pdf-page-error" role="alert">
      <strong>这一页暂时没有渲染出来</strong>
      <p>{{ renderError }}</p>
      <button type="button" @click="render">重新加载本页</button>
    </div>
  </div>
</template>

<style scoped>
.pdf-page {
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
  background: #f8f8f6;
  box-shadow: 0 12px 46px rgb(18 25 21 / 0.18);
}

canvas {
  position: absolute;
  inset: 0;
  display: block;
}

.textLayer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  line-height: 1;
  opacity: 1;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  caret-color: CanvasText;
  z-index: 2;
}

.textLayer :deep(span),
.textLayer :deep(br) {
  position: absolute;
  color: transparent;
  white-space: pre;
  cursor: text;
  transform-origin: 0 0;
}

.textLayer :deep(span.saved-highlight) {
  color: transparent;
  background: rgb(214 185 90 / 0.32);
  border-radius: 2px;
}

.textLayer :deep(::selection) {
  color: transparent;
  background: rgb(73 116 89 / 0.34);
}

.pdf-page-loading {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  align-content: center;
  gap: 14px;
  padding: 14%;
  background: #f3f3f0;
}

.pdf-page-loading span {
  height: 12px;
  border-radius: 4px;
  background: #e1e3de;
}

.pdf-page-loading span:nth-child(2) {
  width: 84%;
}

.pdf-page-loading span:nth-child(3) {
  width: 68%;
}

.pdf-page-error {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  padding: 32px;
  color: #4d554f;
  background: #f5f5f1;
  text-align: center;
}

.pdf-page-error strong {
  font-family: var(--font-serif);
  font-size: 15px;
}

.pdf-page-error p {
  max-width: 440px;
  margin: 0;
  color: #7b817d;
  font-size: 10px;
  line-height: 1.6;
}

.pdf-page-error button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #d5d8d3;
  border-radius: 10px;
  color: #435c4b;
  background: #fff;
  font-size: 10px;
}
</style>
