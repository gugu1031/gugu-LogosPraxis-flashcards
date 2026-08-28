<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  PhCardsThree as CardsThree,
  PhFunnel as Funnel,
  PhPencilSimple as PencilSimple,
  PhPlus as Plus,
  PhTrash as Trash
} from "@phosphor-icons/vue";
import PageHeader from "@/components/PageHeader.vue";
import CardEditorModal from "@/components/CardEditorModal.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";
import type { StudyCard } from "@/types";

const study = useStudyStore();
const app = useAppStore();
type KnowledgeSection = "全部" | "北航 781" | "北航 882" | "其他院校" | "哲学专题" | "马克思主义理论";

const sections: KnowledgeSection[] = [
  "全部",
  "北航 781",
  "北航 882",
  "其他院校",
  "哲学专题",
  "马克思主义理论"
];
const section = ref<KnowledgeSection>("全部");
const thinker = ref("");
const era = ref("");
const institution = ref("");
const examYear = ref("");
const examSubject = ref("");
const questionType = ref("");
const sourceKind = ref("");
const module = ref("");
const visibleLimit = ref(40);
const editing = ref<StudyCard>();
const creating = ref(false);

const isString = (value: string | undefined): value is string => Boolean(value);
const cardText = (card: StudyCard) =>
  [...card.tags.subjects, ...card.tags.schools, ...card.tags.thinkers].join(" ");
const isPhilosophyCard = (card: StudyCard) =>
  !card.exam &&
  /哲学|唯物主义|唯心主义|辩证法|认识论|历史观|现象学|存在主义|古希腊|德国古典|经验论|唯理论/.test(
    cardText(card)
  );
const isMarxismCard = (card: StudyCard) =>
  !card.exam &&
  !isPhilosophyCard(card) &&
  /马克思|社会主义|政治经济学|思想政治教育|毛泽东|中国特色|近现代史|西方马克思主义|文化领导权|法兰克福|日常生活批判/.test(
    cardText(card)
  );

const matchesSection = (card: StudyCard, target: KnowledgeSection) => {
  if (target === "全部") return true;
  if (target === "北航 781") {
    return card.exam?.institution === "北京航空航天大学" && card.exam.subjectCode === "781";
  }
  if (target === "北航 882") {
    return card.exam?.institution === "北京航空航天大学" && card.exam.subjectCode === "882";
  }
  if (target === "其他院校") {
    return Boolean(card.exam && card.exam.institution !== "北京航空航天大学");
  }
  if (target === "哲学专题") return isPhilosophyCard(card);
  return isMarxismCard(card);
};

const sectionCards = computed(() => study.cards.filter((card) => matchesSection(card, section.value)));
const examCards = computed(() => sectionCards.value.filter((card) => card.exam));
const thinkers = computed(() =>
  [...new Set(sectionCards.value.flatMap((card) => card.tags.thinkers).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  )
);
const eras = computed(() =>
  [...new Set(sectionCards.value.flatMap((card) => card.tags.eras).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  )
);
const institutions = computed(() =>
  [...new Set(examCards.value.map((card) => card.exam?.institution).filter(isString))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  )
);
const examYears = computed(() =>
  [...new Set(examCards.value.map((card) => card.exam?.year).filter((value): value is number => Boolean(value)))].sort(
    (a, b) => b - a
  )
);
const examSubjects = computed(() =>
  [
    ...new Set(
      examCards.value
        .map((card) => card.exam?.subjectCode || card.exam?.subjectName)
        .filter(isString)
    )
  ].sort((a, b) => a.localeCompare(b, "zh-CN"))
);
const questionTypes = computed(() =>
  [
    ...new Set(
      sectionCards.value.flatMap((card) =>
        card.exam?.questionType ? [card.exam.questionType] : card.tags.questionTypes
      )
    )
  ].sort((a, b) => a.localeCompare(b, "zh-CN"))
);
const modules = computed(() =>
  [
    ...new Set(
      sectionCards.value.flatMap((card) =>
        card.tags.subjects.filter(
          (item) => item !== "院校真题" && item !== "北航 2027 大纲题"
        )
      )
    )
  ].sort((a, b) => a.localeCompare(b, "zh-CN"))
);

const sectionCount = (target: KnowledgeSection) =>
  study.cards.filter((card) => matchesSection(card, target)).length;

const filtered = computed(() =>
  study.cards.filter((card) => {
    return (
      matchesSection(card, section.value) &&
      (!thinker.value || card.tags.thinkers.includes(thinker.value)) &&
      (!era.value || card.tags.eras.includes(era.value)) &&
      (!institution.value || card.exam?.institution === institution.value) &&
      (!examYear.value || card.exam?.year === Number(examYear.value)) &&
      (!examSubject.value ||
        card.exam?.subjectCode === examSubject.value ||
        card.exam?.subjectName === examSubject.value) &&
      (!questionType.value ||
        card.exam?.questionType === questionType.value ||
        card.tags.questionTypes.includes(questionType.value)) &&
      (!sourceKind.value ||
        (sourceKind.value === "past_exam"
          ? Boolean(card.exam && card.exam.sourceKind !== "syllabus_forecast")
          : card.exam?.sourceKind === sourceKind.value)) &&
      (!module.value || card.tags.subjects.includes(module.value))
    );
  })
);

const grouped = computed(() => {
  const groups = new Map<string, StudyCard[]>();
  for (const card of filtered.value) {
    let key = card.tags.eras[0] || card.tags.schools[0] || "未归档";
    if ((section.value === "北航 781" || section.value === "北航 882") && card.exam) {
      key =
        card.exam.sourceKind === "syllabus_forecast"
          ? `2027 大纲 · ${card.tags.subjects[0]}`
          : `${card.exam.year} · 北航 ${card.exam.subjectCode}`;
    } else if (section.value === "其他院校" && card.exam) {
      key = `${card.exam.year} · ${card.exam.institution}`;
    } else if (section.value === "哲学专题" || section.value === "马克思主义理论") {
      key = card.tags.subjects[0] || card.tags.schools[0] || "未归档";
    } else if (section.value === "全部") {
      if (card.exam?.institution === "北京航空航天大学") {
        key = `北航 ${card.exam.subjectCode || card.exam.subjectName}`;
      } else if (card.exam) {
        key = "其他院校真题";
      } else {
        key = isPhilosophyCard(card) ? "哲学专题" : "马克思主义理论";
      }
    }
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }
  const eraOrder = ["古希腊", "17世纪", "18世纪", "19世纪", "20世纪", "当代", "未归档年代"];
  return [...groups.entries()].sort(([a], [b]) => {
    if (section.value === "其他院校") {
      const yearDifference = Number(b.slice(0, 4)) - Number(a.slice(0, 4));
      return yearDifference || a.localeCompare(b, "zh-CN");
    }
    if (section.value === "北航 781" || section.value === "北航 882") {
      if (a.startsWith("2027 大纲")) return -1;
      if (b.startsWith("2027 大纲")) return 1;
      return Number(b.slice(0, 4)) - Number(a.slice(0, 4));
    }
    const ai = eraOrder.indexOf(a);
    const bi = eraOrder.indexOf(b);
    if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    return a.localeCompare(b, "zh-CN");
  });
});

const visibleGrouped = computed<Array<[string, StudyCard[]]>>(() => {
  let remaining = visibleLimit.value;
  const result: Array<[string, StudyCard[]]> = [];
  for (const [groupName, cards] of grouped.value) {
    if (remaining <= 0) break;
    const visibleCards = cards.slice(0, remaining);
    if (visibleCards.length) result.push([groupName, visibleCards]);
    remaining -= visibleCards.length;
  }
  return result;
});
const visibleCount = computed(() =>
  visibleGrouped.value.reduce((total, [, cards]) => total + cards.length, 0)
);
const hasMore = computed(() => visibleCount.value < filtered.value.length);

watch(
  [section, thinker, era, institution, examYear, examSubject, questionType, sourceKind, module],
  () => {
    visibleLimit.value = 40;
  }
);

const chooseSection = (target: KnowledgeSection) => {
  section.value = target;
  clearFilters();
};

const clearFilters = () => {
  thinker.value = "";
  era.value = "";
  institution.value = "";
  examYear.value = "";
  examSubject.value = "";
  questionType.value = "";
  sourceKind.value = "";
  module.value = "";
};

const hasFilters = computed(() =>
  Boolean(
    thinker.value ||
      era.value ||
      institution.value ||
      examYear.value ||
      examSubject.value ||
      questionType.value ||
      sourceKind.value ||
      module.value
  )
);

const isBuaaSection = computed(() => section.value === "北航 781" || section.value === "北航 882");
const isTopicSection = computed(() => section.value === "哲学专题" || section.value === "马克思主义理论");
const sourceKindLabel = (card: StudyCard) =>
  card.exam?.sourceKind === "syllabus_forecast" ? "2027 大纲题" : "历年真题";

const save = async (card: StudyCard) => {
  await study.saveCard(card);
  editing.value = undefined;
  creating.value = false;
  app.notify("知识卡片已保存", undefined, "success");
};

const remove = async (card: StudyCard) => {
  if (!window.confirm(`删除卡片“${card.front}”？此操作不会删除关联文献。`)) return;
  await study.deleteCard(card.id);
  app.notify("卡片已删除", undefined, "success");
};
</script>

<template>
  <div class="page knowledge-page">
    <PageHeader title="知识库目录" description="北航 781、882 与其他院校独立归档；哲学和马克思主义理论分专题学习。大纲题与历年真题严格区分。">
      <template #actions>
        <button class="button button-primary" type="button" @click="creating = true">
          <Plus :size="18" />
          新建卡片
        </button>
      </template>
    </PageHeader>

    <section class="knowledge-overview">
      <button
        v-for="item in sections"
        :key="item"
        type="button"
        :class="{ active: section === item }"
        @click="chooseSection(item)"
      >
        <CardsThree :size="20" />
        <strong>{{ item }}</strong>
        <span>
          {{ sectionCount(item) }} 张
        </span>
      </button>
    </section>

    <section class="knowledge-filters panel-flat">
      <Funnel :size="18" />
      <span>缩小范围</span>
      <template v-if="isBuaaSection">
        <select v-model="sourceKind" aria-label="题目来源类型">
          <option value="">真题与大纲题</option>
          <option value="syllabus_forecast">2027 大纲题</option>
          <option value="past_exam">历年真题</option>
        </select>
        <select v-model="module" aria-label="知识模块">
          <option value="">全部模块</option>
          <option v-for="item in modules" :key="item">{{ item }}</option>
        </select>
        <select v-model="examYear" aria-label="年份">
          <option value="">全部年份</option>
          <option v-for="item in examYears" :key="item" :value="String(item)">{{ item }} 年</option>
        </select>
        <select v-model="questionType" aria-label="题型">
          <option value="">全部题型</option>
          <option v-for="item in questionTypes" :key="item">{{ item }}</option>
        </select>
      </template>
      <template v-else-if="section === '其他院校'">
        <select v-model="institution" aria-label="院校">
          <option value="">全部院校</option>
          <option v-for="item in institutions" :key="item">{{ item }}</option>
        </select>
        <select v-model="examYear" aria-label="真题年份">
          <option value="">全部年份</option>
          <option v-for="item in examYears" :key="item" :value="String(item)">{{ item }} 年</option>
        </select>
        <select v-model="examSubject" aria-label="考试科目">
          <option value="">全部科目</option>
          <option v-for="item in examSubjects" :key="item">{{ item }}</option>
        </select>
        <select v-model="questionType" aria-label="题型">
          <option value="">全部题型</option>
          <option v-for="item in questionTypes" :key="item">{{ item }}</option>
        </select>
      </template>
      <template v-else-if="isTopicSection">
        <select v-model="module" aria-label="知识模块">
          <option value="">全部模块</option>
          <option v-for="item in modules" :key="item">{{ item }}</option>
        </select>
        <select v-model="thinker" aria-label="哲学家或理论家">
          <option value="">全部人物</option>
          <option v-for="item in thinkers" :key="item">{{ item }}</option>
        </select>
        <select v-model="era" aria-label="历史年代">
          <option value="">全部年代</option>
          <option v-for="item in eras" :key="item">{{ item }}</option>
        </select>
        <select v-model="questionType" aria-label="题型">
          <option value="">全部题型</option>
          <option v-for="item in questionTypes" :key="item">{{ item }}</option>
        </select>
      </template>
      <template v-else>
        <select v-model="module" aria-label="知识模块">
          <option value="">全部模块</option>
          <option v-for="item in modules" :key="item">{{ item }}</option>
        </select>
        <select v-model="questionType" aria-label="题型">
          <option value="">全部题型</option>
          <option v-for="item in questionTypes" :key="item">{{ item }}</option>
        </select>
      </template>
      <button v-if="hasFilters" type="button" @click="clearFilters">清除</button>
    </section>

    <section v-if="visibleGrouped.length" class="timeline">
      <article v-for="[groupName, cards] in visibleGrouped" :key="groupName" class="timeline-group">
        <header>
          <span>{{ groupName }}</span>
          <small>{{ cards.length }} 个考点</small>
        </header>
        <div class="timeline-cards">
          <div v-for="card in cards" :key="card.id" class="knowledge-card panel-flat">
            <div class="knowledge-tags">
              <span
                v-if="card.exam"
                :class="card.exam.sourceKind === 'syllabus_forecast' ? 'forecast-tag' : 'exam-tag'"
              >
                {{ sourceKindLabel(card) }}
              </span>
              <span v-if="card.exam" class="exam-tag">{{ card.exam.institution }}</span>
              <span v-if="card.exam">{{ card.exam.year }}</span>
              <span v-if="card.exam?.subjectCode">{{ card.exam.subjectCode }}</span>
              <span>{{ card.tags.subjects[0] || "未分类" }}</span>
              <span v-if="!card.exam && card.tags.thinkers[0]">{{ card.tags.thinkers[0] }}</span>
              <span>{{ card.exam?.questionType || card.tags.difficulty }}</span>
            </div>
            <h2>{{ card.front }}</h2>
            <p>{{ card.back }}</p>
            <div class="knowledge-card-foot">
              <span>
                {{
                  card.exam
                    ? `${card.exam.subjectName}${card.exam.questionNumber ? ` · 第 ${card.exam.questionNumber} 题` : ""}${
                        card.exam.sourceKind === "syllabus_forecast" ? " · 非历年真题" : ""
                      }`
                    : card.fsrs.reps
                      ? `已复习 ${card.fsrs.reps} 次`
                      : "尚未复习"
                }}
              </span>
              <div>
                <button type="button" aria-label="编辑卡片" @click="editing = card">
                  <PencilSimple :size="16" />
                </button>
                <button type="button" aria-label="删除卡片" @click="remove(card)">
                  <Trash :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
      <button v-if="hasMore" class="load-more button" type="button" @click="visibleLimit += 40">
        继续显示（已显示 {{ visibleCount }} / {{ filtered.length }}）
      </button>
    </section>
    <EmptyState v-else title="当前分类没有卡片" description="新建一张卡片，或者清除当前筛选条件。">
      <button class="button button-primary" type="button" @click="creating = true">
        <Plus :size="17" />
        新建卡片
      </button>
    </EmptyState>

    <CardEditorModal
      v-if="editing || creating"
      :card="editing"
      @close="editing = undefined; creating = false"
      @save="save"
    />
  </div>
</template>

<style scoped>
.knowledge-overview {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.knowledge-overview button {
  display: grid;
  min-height: 105px;
  grid-template-columns: 25px 1fr;
  align-content: center;
  gap: 6px 8px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  color: var(--text-soft);
  background: var(--surface);
  text-align: left;
}

.knowledge-overview button.active {
  color: var(--accent-strong);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
  background: var(--accent-soft);
}

.knowledge-overview svg {
  grid-row: span 2;
}

.knowledge-overview strong {
  font-size: 13px;
}

.knowledge-overview span {
  color: var(--text-faint);
  font-size: 10px;
}

.knowledge-filters {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 9px 14px;
  color: var(--text-faint);
}

.knowledge-filters > span {
  margin-right: auto;
  font-size: 11px;
}

.knowledge-filters select {
  min-height: 36px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--text-soft);
  background: var(--surface-raised);
  font-size: 10px;
}

.knowledge-filters button {
  border: 0;
  color: var(--accent);
  background: transparent;
  font-size: 10px;
}

.timeline {
  display: grid;
  gap: 32px;
  margin-top: 36px;
}

.load-more {
  justify-self: center;
  min-width: 220px;
}

.timeline-group {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: start;
  gap: 26px;
}

.timeline-group > header {
  position: sticky;
  top: 22px;
  display: grid;
  gap: 5px;
  padding-top: 8px;
}

.timeline-group > header span {
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 650;
}

.timeline-group > header small {
  color: var(--text-faint);
  font-size: 9px;
}

.timeline-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.knowledge-card {
  display: grid;
  min-height: 230px;
  align-content: start;
  padding: 20px;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.knowledge-tags span {
  padding: 4px 7px;
  border-radius: 6px;
  color: var(--text-faint);
  background: var(--bg-soft);
  font-size: 8px;
}

.knowledge-tags .exam-tag {
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.knowledge-tags .forecast-tag {
  color: #8a5a1f;
  background: color-mix(in srgb, #c69043 18%, var(--surface));
}

.knowledge-card h2 {
  margin: 18px 0 9px;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.55;
}

.knowledge-card > p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 11px;
  line-height: 1.7;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.knowledge-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 18px;
}

.knowledge-card-foot > span {
  color: var(--text-faint);
  font-size: 9px;
}

.knowledge-card-foot div {
  display: flex;
  gap: 4px;
}

.knowledge-card-foot button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--text-faint);
  background: transparent;
}

.knowledge-card-foot button:hover {
  color: var(--text);
  background: var(--bg-soft);
}

@media (max-width: 1080px) {
  .knowledge-overview {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 850px) {
  .timeline-group {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .timeline-group > header {
    position: static;
  }

  .timeline-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .knowledge-overview {
    grid-template-columns: 1fr 1fr;
  }

  .knowledge-overview button:first-child {
    grid-column: 1 / -1;
  }

  .knowledge-overview button {
    min-height: 90px;
    padding: 13px;
  }

  .knowledge-filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    height: auto;
    overflow: visible;
  }

  .knowledge-filters > span,
  .knowledge-filters > svg {
    display: none;
  }

  .knowledge-filters select {
    width: 100%;
    min-width: 0;
  }

  .knowledge-filters button {
    grid-column: 1 / -1;
    justify-self: end;
  }
}
</style>
