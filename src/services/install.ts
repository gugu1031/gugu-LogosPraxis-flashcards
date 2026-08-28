import { ref } from "vue";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const installPrompt = ref<BeforeInstallPromptEvent>();

export function captureInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt.value = event as BeforeInstallPromptEvent;
  });
}

export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!installPrompt.value) return "unavailable";
  await installPrompt.value.prompt();
  const result = await installPrompt.value.userChoice;
  if (result.outcome === "accepted") installPrompt.value = undefined;
  return result.outcome;
}
