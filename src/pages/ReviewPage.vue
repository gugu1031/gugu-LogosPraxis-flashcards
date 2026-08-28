<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import {
  PhArrowLeft as ArrowLeft,
  PhBookOpenText as BookOpenText,
  PhCheckCircle as CheckCircle,
  PhPencilSimple as PencilSimple,
  PhPlus as Plus,
  PhSpeakerHigh as SpeakerHigh
} from "@phosphor-icons/vue";
import CardEditorModal from "@/components/CardEditorModal.vue";
import EmptyState from "@/components/EmptyState.vue";
import { previewIntervals } from "@/services/fsrs";
import { hapticReview, hapticSelection } from "@/services/native";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";
import type { ReviewRating, StudyCard } from "@/types";

const study = useStudyStore();
const app = useAppStore();
const flipped = ref(false);
const subject = ref("全部");
const reviewedCount = ref(0);
const startedAt = ref(Date.now());
const editing = ref<StudyCard>();
const creating = ref(false);
const initialTotal = ref(study.dueCards.length);

const subjects = computed(() => [
  "全部",
  ...new Set(study.cards.flatMap((card) => card.tags.subjects).filter(Boolean))
]);
const queue = computed(() =>
  study.dueCards.filter((card) => subject.value === "全部" || card.tags.subjects.includes(subject.value))
);
const current = computed(() => queue.value[0]);
const intervals = computed(() =>
  current.value ? previewIntervals(current.value.fsrs) : { 1: 1, 2: 1, 3: 1, 4: 1 }
);
const progress = computed(() => {
  const total = Math.max(initialTotal.value, reviewedCount.value + queue.value.length, 1);
  return Math.round((reviewedCount.value / total) * 100);
});

const ratings: Array<{ rating: ReviewRating; label: string; hint: string }> = [
  { rating: 1, label: "完全遗忘", hint: "重新学习" },
  { rating: 2, label: "困难", hint: "勉强想起" },
  { rating: 3, label: "尚可", hint: "正常回忆" },
  { rating: 4, label: "简单", hint: "迅速准确" }
];

const formatInterval = (days: number) => {
  if (days < 30) return `${days} 天`;
  if (days < 365) return `${Math.round(days / 30)} 月`;
  return `${(days / 365).toFixed(1)} 年`;
};

const rate = async (rating: ReviewRating) => {
  if (!current.value || !flipped.value) return;
  const duration = Math.max(1000, Date.now() - startedAt.value);
  try {
    await study.reviewCard(current.value, rating, duration);
    await hapticReview(rating).catch(() => undefined);
    reviewedCount.value += 1;
    flipped.value = false;
    startedAt.value = Date.now();
  } catch (error) {
    app.notify("复习记录保存失败", error instanceof Error ? error.message : "请稍后重试。", "error");
  }
};

const speak = () => {
  if (!current.value || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(current.value.front));
};

const saveCard = async (card: StudyCard) => {
  await study.saveCard(card);
  editing.value = undefined;
  creating.value = false;
  app.notify("卡片已保存", "已加入本地知识库。", "success");
};

const handleKeydown = (event: KeyboardEvent) => {
  if (editing.value || creating.value) return;
  if (event.code === "Space") {
    event.preventDefault();
    flipped.value = !flipped.value;
  }
  const value = Number(event.key);
  if (flipped.value && [1, 2, 3, 4].includes(value)) void rate(value as ReviewRating);
};

watch(subject, () => {
  flipped.value = false;
  initialTotal.value = queue.value.length;
  reviewedCount.value = 0;
});

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <div class="review-page">
    <header class="review-topbar">
      <RouterLink to="/" class="icon-button" aria-label="返回首页"><ArrowLeft :size="20" /></RouterLink>
      <div class="review-progress">
        <span :style="{ width: `${progress}%` }" />
      </div>
      <strong>{{ reviewedCount }} / {{ reviewedCount + queue.length }}</strong>
      <select v-model="subject" aria-label="按学科筛选">
        <option v-for="item in subjects" :key="item" :value="item">{{ item }}</option>
      </select>
      <button class="icon-button" type="button" aria-label="新建闪卡" @click="creating = true">
        <Plus :size="19" />
      </button>
    </header>

    <main v-if="current" class="review-stage">
      <div class="card-meta">
        <span v-if="current.exam" class="badge badge-exam">{{ current.exam.institution }}</span>
        <span
          v-if="current.exam"
          class="badge"
          :class="{ 'badge-forecast': current.exam.sourceKind === 'syllabus_forecast' }"
        >
          {{ current.exam.sourceKind === "syllabus_forecast" ? "大纲题 · 非真题" : "历年真题" }}
        </span>
        <span v-if="current.exam" class="badge">{{ current.exam.year }} 年</span>
        <span v-if="current.exam?.subjectCode" class="badge">{{ current.exam.subjectCode }}</span>
        <span v-if="current.exam" class="badge">{{ current.exam.questionType }}</span>
        <span class="badge badge-accent">{{ current.tags.subjects[0] || "未分类" }}</span>
        <template v-if="!current.exam">
          <span v-for="thinker in current.tags.thinkers.slice(0, 2)" :key="thinker" class="badge">{{ thinker }}</span>
          <span class="badge">{{ current.tags.difficulty }}</span>
        </template>
      </div>

      <button
        class="memory-card"
        :class="{ flipped }"
        type="button"
        :aria-label="flipped ? '查看问题' : '查看答案'"
        @click="flipped = !flipped"
      >
        <div class="memory-card-inner">
          <section class="memory-face memory-front">
            <span>
              {{
                current.exam
                  ? `${current.exam.institution} · ${
                      current.exam.sourceKind === "syllabus_forecast"
                        ? `${current.exam.year} 大纲题`
                        : `${current.exam.year} 真题`
                    }`
                  : "问题"
              }}
            </span>
            <h1>{{ current.front }}</h1>
            <p>
              {{
                current.exam
                  ? `${current.exam.subjectCode || current.exam.subjectName} · ${current.exam.questionType}，先按考试要求完整作答。`
                  : "先在心里完整组织答案，再翻面核对。"
              }}
            </p>
          </section>
          <section class="memory-face memory-back">
            <span>答案</span>
            <div class="answer-scroll">
              <p class="answer-main">{{ current.back }}</p>
              <div v-if="current.answerTemplate" class="answer-template">
                <strong>答题结构</strong>
                <p>{{ current.answerTemplate }}</p>
              </div>
              <div v-if="current.exam?.sourceTitle" class="exam-source">
                <strong>题目来源</strong>
                <p>{{ current.exam.sourceTitle }}</p>
              </div>
              <blockquote v-if="current.excerpt">{{ current.excerpt }}</blockquote>
            </div>
          </section>
        </div>
      </button>

      <div class="card-tools">
        <button type="button" @click="speak"><SpeakerHigh :size="18" />朗读题目</button>
        <button type="button" @click="editing = current"><PencilSimple :size="18" />编辑卡片</button>
        <RouterLink
          v-if="current.sources[0]"
          :to="`/reader/${current.sources[0].bookId}?page=${current.sources[0].page || 1}`"
        >
          <BookOpenText :size="18" />查看来源
        </RouterLink>
      </div>

      <div v-if="!flipped" class="flip-hint">
        <button
          class="button button-primary"
          type="button"
          @click="flipped = true; hapticSelection().catch(() => undefined)"
        >
          显示答案
        </button>
        <span>按空格键翻面</span>
      </div>
      <div v-else class="rating-grid">
        <button
          v-for="item in ratings"
          :key="item.rating"
          type="button"
          :data-rating="item.rating"
          @click="rate(item.rating)"
        >
          <span>{{ item.rating }}</span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.hint }} · {{ formatInterval(intervals[item.rating]) }}</small>
        </button>
      </div>
    </main>

    <main v-else class="review-complete">
      <EmptyState
        :title="reviewedCount ? '本轮复习完成' : '今天没有到期卡片'"
        :description="reviewedCount ? `已完成 ${reviewedCount} 次提取练习，新的到期时间已按 FSRS-4 计算。` : '可以新建卡片，或者回到文献阅读中积累新的问题。'"
      >
        <CheckCircle :size="28" weight="fill" class="complete-check" />
        <div class="complete-actions">
          <RouterLink to="/" class="button">返回首页</RouterLink>
          <button class="button button-primary" type="button" @click="creating = true">
            <Plus :size="17" />
            新建卡片
          </button>
        </div>
      </EmptyState>
    </main>

    <CardEditorModal
      v-if="editing || creating"
      :card="editing"
      @close="editing = undefined; creating = false"
      @save="saveCard"
    />
  </div>
</template>

<style scoped>
.review-page {
  min-height: 100dvh;
  padding: 18px 24px 32px;
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 28%),
    var(--bg);
}

.review-topbar {
  display: grid;
  width: min(100%, 1120px);
  min-height: 52px;
  grid-template-columns: 40px minmax(120px, 1fr) auto auto 40px;
  align-items: center;
  gap: 13px;
  margin: 0 auto;
}

.review-progress {
  height: 4px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--bg-soft);
}

.review-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 280ms ease;
}

.review-topbar > strong {
  color: var(--text-faint);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.review-topbar select {
  min-height: 38px;
  padding: 0 30px 0 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text-soft);
  background: var(--surface);
  font-size: 11px;
}

.review-stage {
  display: grid;
  width: min(100%, 840px);
  place-items: center;
  margin: 34px auto 0;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  min-height: 26px;
  margin-bottom: 14px;
}

.badge-exam {
  color: var(--accent-strong);
  border-color: color-mix(in srgb, var(--accent) 32%, var(--line));
  background: var(--accent-soft);
}

.badge-forecast {
  color: #8a5a1f;
  border-color: color-mix(in srgb, #c69043 38%, var(--line));
  background: color-mix(in srgb, #c69043 14%, var(--surface));
}

.memory-card {
  width: 100%;
  min-height: min(59dvh, 590px);
  padding: 0;
  border: 0;
  perspective: 1200px;
  background: transparent;
  text-align: left;
}

.memory-card-inner {
  position: relative;
  width: 100%;
  min-height: inherit;
  transform-style: preserve-3d;
  transition: transform 520ms cubic-bezier(0.2, 0.75, 0.24, 1);
}

.memory-card.flipped .memory-card-inner {
  transform: rotateY(180deg);
}

.memory-face {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  padding: clamp(30px, 7vw, 72px);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 26px;
  background: var(--surface-raised);
  box-shadow: var(--shadow);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.memory-face > span {
  align-self: start;
  margin-bottom: 28px;
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.memory-front h1 {
  max-width: 700px;
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(27px, 4vw, 45px);
  font-weight: 580;
  letter-spacing: -0.03em;
  line-height: 1.5;
}

.memory-front p {
  margin: 28px 0 0;
  color: var(--text-faint);
  font-size: 12px;
}

.memory-back {
  transform: rotateY(180deg);
}

.answer-scroll {
  max-height: 390px;
  overflow: auto;
  padding-right: 10px;
}

.answer-main {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(18px, 2.4vw, 25px);
  line-height: 2;
  white-space: pre-line;
}

.answer-template {
  margin-top: 30px;
  padding: 18px 20px;
  border-left: 3px solid var(--accent);
  border-radius: 0 12px 12px 0;
  background: var(--accent-soft);
}

.exam-source {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 16px;
  color: var(--text-faint);
  font-size: 10px;
}

.exam-source p {
  margin: 0;
}

.answer-template strong {
  font-size: 11px;
}

.answer-template p {
  margin: 7px 0 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.memory-back blockquote {
  margin: 24px 0 0;
  padding: 18px 0 0;
  border-top: 1px solid var(--line);
  color: var(--text-soft);
  font-family: var(--font-serif);
  font-size: 13px;
  line-height: 1.8;
}

.card-tools {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 13px;
}

.card-tools button,
.card-tools a {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 0;
  border-radius: 9px;
  color: var(--text-faint);
  background: transparent;
  font-size: 11px;
}

.card-tools button:hover,
.card-tools a:hover {
  color: var(--text);
  background: var(--bg-soft);
}

.flip-hint {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-top: 24px;
}

.flip-hint span {
  color: var(--text-faint);
  font-size: 10px;
}

.rating-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
  margin-top: 20px;
}

.rating-grid button {
  display: grid;
  min-height: 84px;
  grid-template-columns: 24px 1fr;
  align-content: center;
  gap: 2px 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: var(--surface);
  text-align: left;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.rating-grid button:hover {
  border-color: var(--accent);
  background: var(--surface-raised);
  transform: translateY(-2px);
}

.rating-grid button > span {
  grid-row: span 2;
  color: var(--text-faint);
  font-size: 11px;
}

.rating-grid strong {
  font-size: 12px;
}

.rating-grid small {
  color: var(--text-faint);
  font-size: 9px;
}

.rating-grid button[data-rating="1"] strong {
  color: var(--danger);
}

.rating-grid button[data-rating="4"] strong {
  color: var(--accent);
}

.review-complete {
  width: min(760px, 100%);
  margin: 12vh auto 0;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface);
}

.complete-check {
  color: var(--accent);
}

.complete-actions {
  display: flex;
  gap: 9px;
}

@media (max-width: 700px) {
  .review-page {
    padding: 10px 12px 20px;
  }

  .review-topbar {
    grid-template-columns: 38px 1fr auto 38px;
  }

  .review-topbar select {
    display: none;
  }

  .review-stage {
    margin-top: 18px;
  }

  .memory-card {
    min-height: 57dvh;
  }

  .memory-face {
    padding: 28px 24px;
    border-radius: 20px;
  }

  .memory-front h1 {
    font-size: 25px;
  }

  .rating-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
