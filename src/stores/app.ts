import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { db } from "@/db";
import { syncNativeSystemBars } from "@/services/native";
import type { AppTheme } from "@/types";

export interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  tone: "success" | "error" | "info";
}

export const useAppStore = defineStore("app", () => {
  const theme = ref<AppTheme>("paper");
  const sidebarCollapsed = ref(false);
  const toasts = ref<ToastMessage[]>([]);
  const commandOpen = ref(false);
  const initialized = ref(false);

  const themeLabel = computed(() => {
    const labels: Record<AppTheme, string> = {
      paper: "柔和纸质",
      night: "深夜低蓝光",
      classic: "复古书卷"
    };
    return labels[theme.value];
  });

  function applyTheme(value: AppTheme): void {
    theme.value = value;
    document.documentElement.dataset.theme = value;
    const color = value === "night" ? "#171d19" : value === "classic" ? "#e7dfcf" : "#f2f3ef";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
    void syncNativeSystemBars(value);
  }

  async function initialize(): Promise<void> {
    if (initialized.value) return;
    const saved = await db.settings.get("theme");
    applyTheme((saved?.value as AppTheme | undefined) ?? "paper");
    initialized.value = true;
  }

  async function setTheme(value: AppTheme): Promise<void> {
    applyTheme(value);
    await db.settings.put({ key: "theme", value });
  }

  function notify(title: string, detail?: string, tone: ToastMessage["tone"] = "info"): void {
    const message: ToastMessage = {
      id: crypto.randomUUID(),
      title,
      detail,
      tone
    };
    toasts.value.push(message);
    window.setTimeout(() => dismiss(message.id), 3600);
  }

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((item) => item.id !== id);
  }

  return {
    theme,
    themeLabel,
    sidebarCollapsed,
    toasts,
    commandOpen,
    initialized,
    initialize,
    setTheme,
    notify,
    dismiss
  };
});
