<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  PhArrowRight as ArrowRight,
  PhBookOpenText as BookOpenText,
  PhCalendarCheck as CalendarCheck,
  PhCardsThree as CardsThree,
  PhClock as Clock,
  PhPlus as Plus
} from "@phosphor-icons/vue";
import PageHeader from "@/components/PageHeader.vue";
import BookCover from "@/components/BookCover.vue";
import { useStudyStore } from "@/stores/study";

const study = useStudyStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了，留一点余力";
  if (hour < 12) return "早上好，先完成最重要的一轮";
  if (hour < 18) return "下午好，回到今天的学习节奏";
  return "晚上好，做一次安静的回顾";
});

const streak = computed(() => {
  const studied = new Set(
    study.sessions.filter((item) => item.reviewCount > 0 || item.minutes > 0).map((item) => item.date)
  );
  let days = 0;
  const cursor = new Date();
  while (studied.has(cursor.toISOString().slice(0, 10))) {
    days += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
});

const reviewedToday = computed(() => study.todaySession?.reviewCount ?? 0);
const minutesToday = computed(() => Math.round(study.todaySession?.minutes ?? 0));
const recentBooks = computed(() =>
  [...study.localBooks]
    .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""))
    .slice(0, 4)
);

const subjectMastery = computed(() => {
  const groups = new Map<string, { total: number; mature: number }>();
  for (const card of study.cards) {
    const subject = card.tags.subjects[0] ?? "未分类";
    const current = groups.get(subject) ?? { total: 0, mature: 0 };
    current.total += 1;
    if (card.fsrs.stability >= 7) current.mature += 1;
    groups.set(subject, current);
  }
  return [...groups.entries()]
    .map(([name, value]) => ({
      name,
      percent: value.total ? Math.round((value.mature / value.total) * 100) : 0,
      total: value.total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
});
</script>

<template>
  <div class="page home-page">
    <PageHeader :title="greeting" description="今天的任务已经按记忆状态排好。完成到期卡片，再回到正在读的原著。">
      <template #actions>
        <RouterLink to="/review" class="button button-primary">
          <CardsThree :size="18" weight="fill" />
          开始复习
        </RouterLink>
      </template>
    </PageHeader>

    <section class="today-grid">
      <article class="review-hero panel">
        <div class="review-copy">
          <span class="review-label">今日复习</span>
          <strong>{{ study.dueCards.length }}</strong>
          <p>张卡片等待提取。建议先闭卷作答，再对照原文修正表达。</p>
          <RouterLink to="/review" class="review-action">
            进入背诵
            <ArrowRight :size="17" />
          </RouterLink>
        </div>
        <div class="progress-orbit" :style="{ '--progress': `${Math.min(reviewedToday * 8, 100) * 3.6}deg` }">
          <div>
            <b>{{ reviewedToday }}</b>
            <span>今日完成</span>
          </div>
        </div>
      </article>

      <div class="metric-stack">
        <article class="metric-line panel-flat">
          <CalendarCheck :size="22" />
          <div>
            <strong>{{ streak }}</strong>
            <span>连续学习天数</span>
          </div>
          <small>保持节奏比单日冲量更重要</small>
        </article>
        <article class="metric-line panel-flat">
          <Clock :size="22" />
          <div>
            <strong>{{ minutesToday }}</strong>
            <span>今日专注分钟</span>
          </div>
          <small>复习操作自动计入学习时长</small>
        </article>
      </div>
    </section>

    <section class="home-columns">
      <div>
        <div class="section-title">
          <h2>继续阅读</h2>
          <RouterLink to="/library">查看图书馆</RouterLink>
        </div>
        <div v-if="recentBooks.length" class="recent-list panel-flat">
          <RouterLink v-for="book in recentBooks" :key="book.id" :to="`/reader/${book.id}`" class="recent-book">
            <BookCover :book="book" size="small" />
            <div>
              <strong>{{ book.title }}</strong>
              <span>{{ book.authors.join("、") || book.subCategory }}</span>
              <small>上次读到第 {{ book.lastOpenedPage }} 页</small>
            </div>
            <ArrowRight :size="17" />
          </RouterLink>
        </div>
        <div v-else class="library-empty panel-flat">
          <BookOpenText :size="25" />
          <div>
            <strong>还没有本地文献</strong>
            <p>导入 PDF 后，最近阅读会出现在这里。</p>
          </div>
          <RouterLink to="/library" class="button">
            <Plus :size="16" />
            导入文献
          </RouterLink>
        </div>
      </div>

      <div>
        <div class="section-title">
          <h2>知识掌握</h2>
          <RouterLink to="/stats">完整统计</RouterLink>
        </div>
        <div class="mastery-list panel-flat">
          <article v-for="item in subjectMastery" :key="item.name">
            <div class="mastery-number">{{ item.percent }}%</div>
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.total }} 个考点</span>
            </div>
            <div class="mastery-dots" :aria-label="`${item.name} 掌握率 ${item.percent}%`">
              <i
                v-for="index in 10"
                :key="index"
                :class="{ active: index <= Math.round(item.percent / 10) }"
              />
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="daily-note panel-flat">
      <div class="quote-mark">知</div>
      <div>
        <h2>今日学习提示</h2>
        <p>先尝试从记忆中组织答案，再打开材料核对。检索练习本身就是记忆形成的一部分。</p>
      </div>
      <RouterLink to="/knowledge" class="text-link">浏览知识脉络</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.today-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.75fr);
  gap: 18px;
}

.review-hero {
  display: grid;
  min-height: 280px;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 30px;
  padding: clamp(28px, 4vw, 48px);
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 34%),
    var(--surface);
}

.review-copy {
  position: relative;
  z-index: 1;
}

.review-label {
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.review-copy > strong {
  display: block;
  margin: 6px 0 2px;
  font-size: clamp(64px, 9vw, 108px);
  font-weight: 660;
  letter-spacing: -0.07em;
  line-height: 1;
}

.review-copy p {
  max-width: 450px;
  margin: 14px 0 22px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.7;
}

.review-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--accent-strong);
  font-size: 14px;
  font-weight: 700;
}

.progress-orbit {
  display: grid;
  width: 154px;
  height: 154px;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(var(--accent) var(--progress), var(--bg-soft) 0);
}

.progress-orbit::before {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: var(--surface);
  content: "";
}

.progress-orbit > div {
  position: absolute;
  display: grid;
  text-align: center;
}

.progress-orbit b {
  font-size: 30px;
  letter-spacing: -0.05em;
}

.progress-orbit span {
  color: var(--text-faint);
  font-size: 10px;
}

.metric-stack {
  display: grid;
  gap: 18px;
}

.metric-line {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-content: center;
  gap: 10px 14px;
  padding: 23px;
}

.metric-line > svg {
  grid-row: span 2;
  padding: 9px;
  border-radius: 12px;
  color: var(--accent);
  background: var(--accent-soft);
  box-sizing: content-box;
}

.metric-line div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.metric-line strong {
  font-size: 28px;
  letter-spacing: -0.04em;
}

.metric-line span {
  color: var(--text-soft);
  font-size: 12px;
}

.metric-line small {
  grid-column: 2;
  color: var(--text-faint);
  font-size: 10px;
}

.home-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 34px;
  margin-top: 38px;
}

.recent-list,
.mastery-list {
  overflow: hidden;
}

.recent-book {
  display: grid;
  grid-template-columns: 54px 1fr 22px;
  align-items: center;
  gap: 14px;
  min-height: 96px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}

.recent-book:last-child {
  border-bottom: 0;
}

.recent-book > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.recent-book strong,
.recent-book span,
.recent-book small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-book strong {
  font-size: 13px;
}

.recent-book span {
  color: var(--text-soft);
  font-size: 11px;
}

.recent-book small {
  color: var(--text-faint);
  font-size: 10px;
}

.recent-book > svg {
  color: var(--text-faint);
}

.library-empty {
  display: grid;
  min-height: 130px;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.library-empty > svg {
  padding: 10px;
  border-radius: 13px;
  color: var(--accent);
  background: var(--accent-soft);
  box-sizing: content-box;
}

.library-empty strong {
  font-size: 13px;
}

.library-empty p {
  margin: 5px 0 0;
  color: var(--text-soft);
  font-size: 11px;
}

.mastery-list article {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 12px 16px;
}

.mastery-number {
  font-size: 17px;
  font-weight: 720;
  letter-spacing: -0.03em;
}

.mastery-list article > div:nth-child(2) {
  display: grid;
  gap: 4px;
}

.mastery-list strong {
  font-size: 12px;
}

.mastery-list span {
  color: var(--text-faint);
  font-size: 10px;
}

.mastery-dots {
  display: flex;
  gap: 3px;
}

.mastery-dots i {
  width: 3px;
  height: 18px;
  border-radius: 3px;
  background: var(--bg-soft);
}

.mastery-dots i.active {
  background: var(--accent);
}

.daily-note {
  display: grid;
  grid-template-columns: 58px 1fr auto;
  align-items: center;
  gap: 18px;
  margin-top: 38px;
  padding: 22px 24px;
}

.quote-mark {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border-radius: 15px;
  color: var(--accent);
  background: var(--accent-soft);
  font-family: var(--font-serif);
  font-size: 22px;
}

.daily-note h2 {
  margin: 0 0 6px;
  font-size: 14px;
}

.daily-note p {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-serif);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .today-grid,
  .home-columns {
    grid-template-columns: 1fr;
  }

  .metric-stack {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .review-hero {
    min-height: 250px;
    grid-template-columns: 1fr;
    padding: 26px;
  }

  .progress-orbit {
    position: absolute;
    right: 24px;
    width: 105px;
    height: 105px;
    opacity: 0.9;
  }

  .progress-orbit::before {
    width: 91px;
    height: 91px;
  }

  .progress-orbit b {
    font-size: 23px;
  }

  .review-copy {
    max-width: calc(100% - 95px);
  }

  .review-copy > strong {
    font-size: 64px;
  }

  .review-copy p {
    font-size: 12px;
  }

  .metric-stack {
    grid-template-columns: 1fr;
  }

  .library-empty,
  .daily-note {
    grid-template-columns: 44px 1fr;
  }

  .library-empty .button,
  .daily-note .text-link {
    grid-column: 2;
    justify-self: start;
  }

  .mastery-dots {
    display: none;
  }
}
</style>
