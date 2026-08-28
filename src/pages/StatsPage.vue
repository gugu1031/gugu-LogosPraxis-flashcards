<script setup lang="ts">
import { computed } from "vue";
import {
  PhCalendarCheck as CalendarCheck,
  PhCardsThree as CardsThree,
  PhClock as Clock,
  PhTrendUp as TrendUp
} from "@phosphor-icons/vue";
import type { EChartsCoreOption } from "echarts/core";
import PageHeader from "@/components/PageHeader.vue";
import ChartPanel from "@/components/ChartPanel.vue";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";

const study = useStudyStore();
const app = useAppStore();
const dayMs = 86_400_000;

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const lastDays = computed(() =>
  Array.from({ length: 14 }, (_, index) => {
    const date = new Date(Date.now() - (13 - index) * dayMs);
    return {
      key: dateKey(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`
    };
  })
);

const reviewTrend = computed(() =>
  lastDays.value.map((day) => ({
    date: day.label,
    value: study.reviewLogs.filter((log) => dateKey(new Date(log.reviewedAt)) === day.key).length
  }))
);
const subjectCounts = computed(() => {
  const map = new Map<string, number>();
  for (const card of study.cards) {
    const subject = card.tags.subjects[0] ?? "未分类";
    map.set(subject, (map.get(subject) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
});

const totalMinutes = computed(() => Math.round(study.sessions.reduce((sum, item) => sum + item.minutes, 0)));
const matureCards = computed(() => study.cards.filter((card) => card.fsrs.stability >= 7).length);
const mastery = computed(() =>
  study.cards.length ? Math.round((matureCards.value / study.cards.length) * 100) : 0
);
const streak = computed(() => {
  const studied = new Set(study.sessions.filter((item) => item.reviewCount || item.minutes).map((item) => item.date));
  let total = 0;
  const cursor = new Date();
  while (studied.has(dateKey(cursor))) {
    total += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
});

const chartColors = computed(() => {
  app.theme;
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--text-soft").trim(),
    faint: styles.getPropertyValue("--text-faint").trim(),
    line: styles.getPropertyValue("--line").trim(),
    accent: styles.getPropertyValue("--accent").trim(),
    surface: styles.getPropertyValue("--surface").trim()
  };
});

const lineOption = computed<EChartsCoreOption>(() => ({
  animationDuration: 500,
  grid: { top: 24, right: 18, bottom: 30, left: 36 },
  tooltip: {
    trigger: "axis",
    backgroundColor: chartColors.value.surface,
    borderColor: chartColors.value.line,
    textStyle: { color: chartColors.value.text, fontSize: 11 }
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: reviewTrend.value.map((item) => item.date),
    axisLine: { lineStyle: { color: chartColors.value.line } },
    axisTick: { show: false },
    axisLabel: { color: chartColors.value.faint, fontSize: 9 }
  },
  yAxis: {
    type: "value",
    minInterval: 1,
    splitLine: { lineStyle: { color: chartColors.value.line, type: "dashed" } },
    axisLabel: { color: chartColors.value.faint, fontSize: 9 }
  },
  series: [
    {
      type: "line",
      data: reviewTrend.value.map((item) => item.value),
      smooth: 0.28,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { color: chartColors.value.accent, width: 2 },
      itemStyle: { color: chartColors.value.accent },
      areaStyle: { color: chartColors.value.accent, opacity: 0.08 }
    }
  ]
}));

const pieOption = computed<EChartsCoreOption>(() => ({
  animationDuration: 500,
  tooltip: {
    trigger: "item",
    backgroundColor: chartColors.value.surface,
    borderColor: chartColors.value.line,
    textStyle: { color: chartColors.value.text, fontSize: 11 }
  },
  legend: {
    orient: "vertical",
    right: 8,
    top: "center",
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: chartColors.value.text, fontSize: 9 }
  },
  series: [
    {
      type: "pie",
      radius: ["48%", "72%"],
      center: ["34%", "50%"],
      avoidLabelOverlap: true,
      label: { show: false },
      itemStyle: {
        borderColor: chartColors.value.surface,
        borderWidth: 3
      },
      color: ["#456c55", "#647481", "#78605a", "#778568", "#4f5368", "#9a8e72"],
      data: subjectCounts.value
    }
  ]
}));

const heatmapDays = computed(() =>
  Array.from({ length: 84 }, (_, index) => {
    const date = new Date(Date.now() - (83 - index) * dayMs);
    const key = dateKey(date);
    const session = study.sessions.find((item) => item.date === key);
    const value = (session?.reviewCount ?? 0) + Math.round(session?.minutes ?? 0);
    return { key, value, label: `${key}：${value ? `${value} 点学习活动` : "未学习"}` };
  })
);

const bookProgress = computed(() =>
  study.books
    .map((book) => {
      const cards = study.cards.filter((card) => card.sources.some((source) => source.bookId === book.id));
      const mature = cards.filter((card) => card.fsrs.stability >= 7).length;
      return {
        id: book.id,
        title: book.title,
        category: book.category,
        cards: cards.length,
        percent: cards.length ? Math.round((mature / cards.length) * 100) : 0
      };
    })
    .filter((item) => item.cards > 0)
    .sort((a, b) => b.cards - a.cards)
    .slice(0, 8)
);
</script>

<template>
  <div class="page stats-page">
    <PageHeader title="学习统计" description="用复习行为与稳定性观察长期掌握，不用单日数字制造压力。" />

    <section class="stats-metrics">
      <article>
        <CardsThree :size="21" />
        <span>累计复习</span>
        <strong>{{ study.reviewLogs.length }}</strong>
        <small>次提取练习</small>
      </article>
      <article>
        <TrendUp :size="21" />
        <span>稳定掌握</span>
        <strong>{{ mastery }}%</strong>
        <small>{{ matureCards }} 张卡片超过 7 天稳定性</small>
      </article>
      <article>
        <CalendarCheck :size="21" />
        <span>连续学习</span>
        <strong>{{ streak }}</strong>
        <small>天</small>
      </article>
      <article>
        <Clock :size="21" />
        <span>累计时长</span>
        <strong>{{ totalMinutes }}</strong>
        <small>分钟</small>
      </article>
    </section>

    <section class="chart-grid">
      <article class="panel-flat chart-card chart-wide">
        <div class="section-title">
          <div>
            <h2>近 14 日复习量</h2>
            <p>按完成评分的卡片次数统计</p>
          </div>
        </div>
        <ChartPanel :option="lineOption" label="近 14 日复习量折线图" />
      </article>
      <article class="panel-flat chart-card">
        <div class="section-title">
          <div>
            <h2>学科卡片分布</h2>
            <p>按卡片首个学科标签统计</p>
          </div>
        </div>
        <ChartPanel :option="pieOption" label="各学科学习占比环形图" />
      </article>
    </section>

    <section class="stats-bottom">
      <article class="panel-flat activity-card">
        <div class="section-title">
          <div>
            <h2>学习打卡</h2>
            <p>最近 12 周</p>
          </div>
        </div>
        <div class="activity-grid">
          <i
            v-for="day in heatmapDays"
            :key="day.key"
            :title="day.label"
            :data-level="Math.min(4, Math.ceil(day.value / 8))"
          />
        </div>
        <div class="activity-legend">
          <span>少</span>
          <i v-for="level in 5" :key="level" :data-level="level - 1" />
          <span>多</span>
        </div>
      </article>

      <article class="panel-flat book-progress-card">
        <div class="section-title">
          <div>
            <h2>分书目掌握</h2>
            <p>稳定性超过 7 天计为掌握</p>
          </div>
        </div>
        <div v-if="bookProgress.length" class="book-progress-list">
          <div v-for="item in bookProgress" :key="item.id">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.cards }} 张卡片</span>
            </div>
            <b>{{ item.percent }}%</b>
            <div class="dot-scale" :aria-label="`${item.title} 掌握率 ${item.percent}%`">
              <i v-for="index in 12" :key="index" :class="{ active: index <= Math.round(item.percent / 8.34) }" />
            </div>
          </div>
        </div>
        <p v-else class="no-progress">为闪卡绑定书目后，这里会显示独立掌握进度。</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.stats-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.stats-metrics article {
  display: grid;
  min-height: 150px;
  grid-template-columns: 28px 1fr;
  align-content: center;
  gap: 5px 8px;
  padding: 22px;
  border-right: 1px solid var(--line);
}

.stats-metrics article:last-child {
  border-right: 0;
}

.stats-metrics svg {
  color: var(--accent);
}

.stats-metrics span {
  color: var(--text-soft);
  font-size: 11px;
}

.stats-metrics strong {
  grid-column: 1 / -1;
  margin-top: 7px;
  font-size: 33px;
  letter-spacing: -0.05em;
}

.stats-metrics small {
  grid-column: 1 / -1;
  color: var(--text-faint);
  font-size: 9px;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 14px;
  margin-top: 14px;
}

.chart-card {
  min-width: 0;
  padding: 20px;
}

.chart-card .section-title {
  margin-bottom: 0;
}

.section-title p {
  margin: 5px 0 0;
  color: var(--text-faint);
  font-size: 9px;
}

.stats-bottom {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 14px;
  margin-top: 14px;
}

.activity-card,
.book-progress-card {
  min-width: 0;
  padding: 20px;
}

.activity-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 11px);
  grid-auto-columns: 11px;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.activity-grid i,
.activity-legend i {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  background: var(--bg-soft);
}

.activity-grid i[data-level="1"],
.activity-legend i[data-level="1"] {
  background: color-mix(in srgb, var(--accent) 30%, var(--bg-soft));
}

.activity-grid i[data-level="2"],
.activity-legend i[data-level="2"] {
  background: color-mix(in srgb, var(--accent) 50%, var(--bg-soft));
}

.activity-grid i[data-level="3"],
.activity-legend i[data-level="3"] {
  background: color-mix(in srgb, var(--accent) 72%, var(--bg-soft));
}

.activity-grid i[data-level="4"],
.activity-legend i[data-level="4"] {
  background: var(--accent);
}

.activity-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
  color: var(--text-faint);
  font-size: 8px;
}

.book-progress-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 24px;
}

.book-progress-list > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 9px;
}

.book-progress-list > div > div:first-child {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.book-progress-list strong,
.book-progress-list span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-progress-list strong {
  font-size: 10px;
}

.book-progress-list span {
  color: var(--text-faint);
  font-size: 8px;
}

.book-progress-list b {
  font-size: 13px;
}

.dot-scale {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
}

.dot-scale i {
  height: 3px;
  border-radius: 3px;
  background: var(--bg-soft);
}

.dot-scale i.active {
  background: var(--accent);
}

.no-progress {
  color: var(--text-faint);
  font-size: 10px;
  line-height: 1.6;
}

@media (max-width: 1080px) {
  .stats-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-metrics article:nth-child(2) {
    border-right: 0;
  }

  .stats-metrics article:nth-child(-n + 2) {
    border-bottom: 1px solid var(--line);
  }

  .chart-grid,
  .stats-bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .stats-metrics article {
    min-height: 125px;
    padding: 15px;
  }

  .stats-metrics strong {
    font-size: 28px;
  }

  .book-progress-list {
    grid-template-columns: 1fr;
  }
}
</style>
