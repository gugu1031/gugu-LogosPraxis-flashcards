<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  PhBooks as Books,
  PhCardsThree as CardsThree,
  PhChartLineUp as ChartLineUp,
  PhGearSix as GearSix,
  PhHouse as House,
  PhMagnifyingGlass as MagnifyingGlass,
  PhTreeStructure as TreeStructure,
  PhX as X
} from "@phosphor-icons/vue";
import { useStudyStore } from "@/stores/study";

const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const study = useStudyStore();
const query = ref("");
const input = ref<HTMLInputElement>();

const destinations = [
  { title: "今日学习", path: "/", icon: House },
  { title: "背诵复习", path: "/review", icon: CardsThree },
  { title: "文献图书馆", path: "/library", icon: Books },
  { title: "知识库", path: "/knowledge", icon: TreeStructure },
  { title: "学习统计", path: "/stats", icon: ChartLineUp },
  { title: "设置", path: "/settings", icon: GearSix }
];

const matchingDestinations = computed(() =>
  destinations.filter((item) => item.title.includes(query.value.trim()))
);
const matchingBooks = computed(() => {
  const value = query.value.trim().toLocaleLowerCase("zh-CN");
  if (!value) return study.localBooks.slice(0, 4);
  return study.books
    .filter((book) => `${book.title}${book.authors.join("")}`.toLocaleLowerCase("zh-CN").includes(value))
    .slice(0, 5);
});

const go = async (path: string) => {
  emit("close");
  await router.push(path);
};

const search = async () => {
  if (!query.value.trim()) return;
  emit("close");
  await router.push({ path: "/search", query: { q: query.value.trim() } });
};

const handleKey = (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
};

onMounted(async () => {
  window.addEventListener("keydown", handleKey);
  await nextTick();
  input.value?.focus();
});
onBeforeUnmount(() => window.removeEventListener("keydown", handleKey));
</script>

<template>
  <div class="modal-backdrop command-backdrop" role="presentation" @mousedown.self="emit('close')">
    <section class="command-palette" role="dialog" aria-modal="true" aria-label="快速导航与检索">
      <form class="command-input" @submit.prevent="search">
        <MagnifyingGlass :size="21" />
        <input ref="input" v-model="query" type="search" placeholder="检索文献、卡片或前往页面" />
        <button type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </form>
      <div class="command-results">
        <div>
          <span class="command-group-title">页面</span>
          <button
            v-for="item in matchingDestinations"
            :key="item.path"
            type="button"
            @click="go(item.path)"
          >
            <component :is="item.icon" :size="19" />
            <span>{{ item.title }}</span>
          </button>
        </div>
        <div v-if="matchingBooks.length">
          <span class="command-group-title">文献</span>
          <button
            v-for="book in matchingBooks"
            :key="book.id"
            type="button"
            @click="go(book.status === 'local' ? `/reader/${book.id}` : '/library')"
          >
            <Books :size="19" />
            <span>{{ book.title }}</span>
            <small>{{ book.status === "local" ? "已导入" : "书目" }}</small>
          </button>
        </div>
      </div>
      <button v-if="query.trim()" class="command-search-all" type="button" @click="search">
        全局检索“{{ query.trim() }}”
      </button>
    </section>
  </div>
</template>
