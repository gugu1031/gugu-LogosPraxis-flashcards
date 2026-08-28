<script setup lang="ts">
import { computed } from "vue";
import type { Book } from "@/types";

const props = withDefaults(
  defineProps<{
    book: Book;
    size?: "small" | "medium" | "large";
  }>(),
  { size: "medium" }
);

const initials = computed(() => {
  const clean = props.book.title.replace(/[《》（）()：:\s]/g, "");
  return [...clean].slice(0, 4).join("");
});

const variant = computed(() => {
  const variants: Record<Book["category"], string> = {
    马理论: "forest",
    马工程教材: "graphite",
    西方哲学: "slate",
    西方马克思主义: "russet",
    拓展阅读: "indigo"
  };
  return variants[props.book.category];
});
</script>

<template>
  <div class="book-cover" :class="[`book-cover-${size}`, `book-cover-${variant}`]" aria-hidden="true">
    <span>{{ book.subCategory }}</span>
    <strong>{{ initials }}</strong>
    <small>{{ book.authors[0] || "本地文献" }}</small>
  </div>
</template>
