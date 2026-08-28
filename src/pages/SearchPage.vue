<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  PhArrowRight as ArrowRight,
  PhBookOpenText as BookOpenText,
  PhBooks as Books,
  PhCardsThree as CardsThree,
  PhMagnifyingGlass as MagnifyingGlass,
  PhTextAa as TextAa
} from "@phosphor-icons/vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import { searchAll } from "@/services/search";
import { useStudyStore } from "@/stores/study";
import type { SearchDocument, SearchResult } from "@/types";

const route = useRoute();
const router = useRouter();
const study = useStudyStore();
const query = ref(String(route.query.q ?? ""));
const type = ref<"all" | SearchDocument["type"]>("all");
const bookId = ref("");
const subject = ref("");
const results = ref<SearchResult[]>([]);
const loading = ref(false);
const searched = ref(false);
let timer: number | undefined;

const subjects = computed(() => [
  ...new Set(study.cards.flatMap((card) => card.tags.subjects).filter(Boolean))
]);
const resultGroups = computed(() => ({
  cards: results.value.filter((item) => item.type === "card"),
  pdf: results.value.filter((item) => item.type === "pdf"),
  books: results.value.filter((item) => item.type === "book")
}));
const typeMeta = {
  card: { label: "闪卡", icon: CardsThree },
  pdf: { label: "文献原文", icon: TextAa },
  book: { label: "书目", icon: Books }
};

const runSearch = async () => {
  const value = query.value.trim();
  if (!value) {
    results.value = [];
    searched.value = false;
    return;
  }
  loading.value = true;
  try {
    results.value = await searchAll(value, {
      type: type.value,
      bookId: bookId.value || undefined,
      subject: subject.value || undefined
    });
    searched.value = true;
    await router.replace({ query: { q: value } });
  } finally {
    loading.value = false;
  }
};

const scheduleSearch = () => {
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => void runSearch(), 220);
};

const openResult = async (result: SearchResult) => {
  if (result.type === "pdf" && result.bookId) {
    await router.push(`/reader/${result.bookId}?page=${result.page ?? 1}`);
  } else if (result.type === "book") {
    const book = study.books.find((item) => item.id === result.refId);
    await router.push(book?.status === "local" ? `/reader/${book.id}` : "/library");
  } else {
    await router.push("/review");
  }
};

watch([query, type, bookId, subject], scheduleSearch, { immediate: true });
onBeforeUnmount(() => {
  if (timer) window.clearTimeout(timer);
});
</script>

<template>
  <div class="page search-page">
    <PageHeader title="全局全文检索" description="同时检索闪卡、书目元数据和已经导入的 PDF 逐页正文。">
      <template #actions>
        <span class="search-count">{{ searched ? `${results.length} 条结果` : "本地索引" }}</span>
      </template>
    </PageHeader>

    <section class="search-console panel">
      <form class="search-box" @submit.prevent="runSearch">
        <MagnifyingGlass :size="23" />
        <input v-model="query" type="search" autofocus placeholder="输入概念、哲学家、流派或原文片段" />
        <button class="button button-primary" type="submit">检索</button>
      </form>
      <div class="search-filters">
        <div class="segmented">
          <button type="button" :class="{ active: type === 'all' }" @click="type = 'all'">全部</button>
          <button type="button" :class="{ active: type === 'card' }" @click="type = 'card'">闪卡</button>
          <button type="button" :class="{ active: type === 'pdf' }" @click="type = 'pdf'">PDF 原文</button>
          <button type="button" :class="{ active: type === 'book' }" @click="type = 'book'">书目</button>
        </div>
        <select v-model="bookId" aria-label="限定书目">
          <option value="">全部书目</option>
          <option v-for="book in study.books" :key="book.id" :value="book.id">{{ book.title }}</option>
        </select>
        <select v-model="subject" aria-label="限定学科">
          <option value="">全部学科</option>
          <option v-for="item in subjects" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
    </section>

    <div v-if="loading" class="result-skeletons">
      <div v-for="index in 5" :key="index" class="panel-flat"><span /><span /><span /></div>
    </div>

    <section v-else-if="results.length" class="result-layout">
      <div class="result-column">
        <div v-if="resultGroups.cards.length" class="result-group">
          <div class="section-title">
            <h2>匹配闪卡</h2>
            <span>{{ resultGroups.cards.length }}</span>
          </div>
          <button
            v-for="result in resultGroups.cards"
            :key="result.id"
            class="result-item panel-flat"
            type="button"
            @click="openResult(result)"
          >
            <div class="result-icon"><CardsThree :size="20" /></div>
            <div>
              <span class="result-type">闪卡</span>
              <h3>{{ result.title }}</h3>
              <p>{{ result.excerpt }}</p>
            </div>
            <ArrowRight :size="17" />
          </button>
        </div>

        <div v-if="resultGroups.pdf.length" class="result-group">
          <div class="section-title">
            <h2>匹配原文</h2>
            <span>{{ resultGroups.pdf.length }}</span>
          </div>
          <button
            v-for="result in resultGroups.pdf"
            :key="result.id"
            class="result-item panel-flat"
            type="button"
            @click="openResult(result)"
          >
            <div class="result-icon"><TextAa :size="20" /></div>
            <div>
              <span class="result-type">第 {{ result.page }} 页</span>
              <h3>{{ result.title }}</h3>
              <p>{{ result.excerpt }}</p>
            </div>
            <BookOpenText :size="17" />
          </button>
        </div>
      </div>

      <aside v-if="resultGroups.books.length" class="book-matches panel-flat">
        <div class="section-title">
          <h2>相关书目</h2>
          <span>{{ resultGroups.books.length }}</span>
        </div>
        <button v-for="result in resultGroups.books" :key="result.id" type="button" @click="openResult(result)">
          <component :is="typeMeta[result.type].icon" :size="19" />
          <div>
            <strong>{{ result.title }}</strong>
            <span>{{ result.excerpt }}</span>
          </div>
        </button>
      </aside>
    </section>

    <EmptyState
      v-else-if="searched"
      title="没有找到匹配内容"
      description="PDF 只有在完成本地导入与全文索引后才会出现在结果中。你也可以减少筛选条件。"
    >
      <button class="button" type="button" @click="bookId = ''; subject = ''; type = 'all'">清除筛选</button>
    </EmptyState>
    <EmptyState
      v-else
      title="从全部学习材料中检索"
      description="支持中文双字索引、英文词干片段，并按书目、学科和内容类型缩小范围。"
    />
  </div>
</template>

<style scoped>
.search-count {
  color: var(--text-faint);
  font-size: 11px;
}

.search-console {
  padding: 10px;
}

.search-box {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 4px 10px;
  color: var(--text-faint);
}

.search-box input {
  min-width: 0;
  min-height: 48px;
  border: 0;
  outline: 0;
  color: var(--text);
  background: transparent;
  font-size: 16px;
}

.search-box input::placeholder {
  color: var(--text-faint);
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 4px 2px;
  border-top: 1px solid var(--line);
}

.search-filters select {
  min-height: 38px;
  max-width: 220px;
  padding: 0 30px 0 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text-soft);
  background: var(--surface-solid);
  font-size: 11px;
}

.result-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: 28px;
  margin-top: 30px;
}

.result-column,
.result-group {
  display: grid;
  gap: 10px;
}

.result-group + .result-group {
  margin-top: 22px;
}

.section-title {
  margin: 0 0 5px;
}

.section-title span {
  color: var(--text-faint);
  font-size: 10px;
}

.result-item {
  display: grid;
  width: 100%;
  grid-template-columns: 42px 1fr 20px;
  align-items: center;
  gap: 13px;
  padding: 16px;
  color: var(--text);
  text-align: left;
}

.result-item:hover {
  border-color: var(--accent);
}

.result-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  color: var(--accent);
  background: var(--accent-soft);
}

.result-type {
  color: var(--accent);
  font-size: 9px;
  font-weight: 700;
}

.result-item h3 {
  margin: 4px 0 5px;
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.45;
}

.result-item p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 11px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.result-item > svg {
  color: var(--text-faint);
}

.book-matches {
  position: sticky;
  top: 24px;
  padding: 16px;
}

.book-matches > button {
  display: grid;
  width: 100%;
  grid-template-columns: 22px 1fr;
  gap: 9px;
  padding: 11px 6px;
  border: 0;
  border-bottom: 1px solid var(--line);
  color: var(--text-soft);
  background: transparent;
  text-align: left;
}

.book-matches > button:last-child {
  border-bottom: 0;
}

.book-matches > button div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.book-matches strong,
.book-matches span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-matches strong {
  font-size: 11px;
}

.book-matches span {
  color: var(--text-faint);
  font-size: 9px;
}

.result-skeletons {
  display: grid;
  gap: 10px;
  margin-top: 30px;
}

.result-skeletons > div {
  display: grid;
  gap: 10px;
  padding: 20px;
}

.result-skeletons span {
  width: 65%;
  height: 10px;
  border-radius: 4px;
  background: var(--bg-soft);
}

.result-skeletons span:nth-child(2) {
  width: 90%;
}

.result-skeletons span:nth-child(3) {
  width: 78%;
}

@media (max-width: 1000px) {
  .result-layout {
    grid-template-columns: 1fr;
  }

  .book-matches {
    position: static;
  }
}

@media (max-width: 700px) {
  .search-box {
    grid-template-columns: 24px 1fr;
  }

  .search-box .button {
    display: none;
  }

  .search-filters {
    overflow-x: auto;
  }

  .segmented {
    flex: 0 0 auto;
  }

  .search-filters select {
    flex: 0 0 160px;
  }

  .result-item {
    grid-template-columns: 38px 1fr;
  }

  .result-item > svg {
    display: none;
  }
}
</style>
