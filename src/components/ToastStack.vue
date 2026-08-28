<script setup lang="ts">
import {
  PhCheckCircle as CheckCircle,
  PhInfo as Info,
  PhWarningCircle as WarningCircle,
  PhX as X
} from "@phosphor-icons/vue";
import { useAppStore } from "@/stores/app";

const app = useAppStore();
const icons = {
  success: CheckCircle,
  error: WarningCircle,
  info: Info
};
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <article v-for="toast in app.toasts" :key="toast.id" class="toast" :data-tone="toast.tone">
        <component :is="icons[toast.tone]" :size="21" weight="fill" />
        <div>
          <strong>{{ toast.title }}</strong>
          <p v-if="toast.detail">{{ toast.detail }}</p>
        </div>
        <button type="button" aria-label="关闭提示" @click="app.dismiss(toast.id)">
          <X :size="16" />
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>
