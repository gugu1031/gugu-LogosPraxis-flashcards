<script setup lang="ts">
import { PhBookOpenText as BookOpenText } from "@phosphor-icons/vue";

withDefaults(
  defineProps<{
    title: string;
    description: string;
  }>(),
  {}
);
</script>

<template>
  <div class="empty-state">
    <div class="empty-symbol"><BookOpenText :size="30" /></div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>
