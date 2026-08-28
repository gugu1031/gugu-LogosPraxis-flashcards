import {
  Capacitor,
  type PluginListenerHandle,
  SystemBars,
  SystemBarsStyle
} from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { Directory, Filesystem } from "@capacitor/filesystem";
import {
  Haptics,
  ImpactStyle,
  NotificationType
} from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import type { Router } from "vue-router";
import type { AppTheme, ReviewRating } from "@/types";

const native = Capacitor.isNativePlatform();
const allowedDeepLinkRoots = new Set([
  "/",
  "/review",
  "/library",
  "/reader",
  "/knowledge",
  "/stats",
  "/settings",
  "/search",
  "/future"
]);

export const isNativeRuntime = (): boolean => native;

export const nativePlatformLabel = (): string => {
  if (!native) return "Web / PWA";
  return Capacitor.getPlatform() === "ios" ? "iOS 原生应用" : "Android 原生应用";
};

function normalizeDeepLink(rawUrl: string): string | undefined {
  try {
    const url = new URL(rawUrl);
    const combined = `/${url.host}${url.pathname}`.replace(/\/+/g, "/");
    const path = combined === "/" ? "/" : combined.replace(/\/$/, "");
    const root = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
    if (!allowedDeepLinkRoots.has(root)) return undefined;
    return `${path}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

export async function syncNativeSystemBars(theme: AppTheme): Promise<void> {
  if (!native) return;
  await SystemBars.setStyle({
    style: theme === "night" ? SystemBarsStyle.Dark : SystemBarsStyle.Light
  });
}

export async function initializeNativeShell(
  router: Router
): Promise<() => Promise<void>> {
  if (!native) return async () => undefined;

  document.documentElement.classList.add("native-platform");
  document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();

  await Promise.allSettled([
    SystemBars.show(),
    SplashScreen.hide({ fadeOutDuration: 240 })
  ]);

  const handles: PluginListenerHandle[] = [];

  if (Capacitor.getPlatform() === "android") {
    handles.push(
      await NativeApp.addListener("backButton", async () => {
        if (router.currentRoute.value.path !== "/") {
          router.back();
        } else {
          await NativeApp.exitApp();
        }
      })
    );
  }

  handles.push(
    await NativeApp.addListener("appUrlOpen", ({ url }) => {
      const target = normalizeDeepLink(url);
      if (target) void router.push(target);
    })
  );

  handles.push(
    await NativeApp.addListener("resume", () => {
      window.dispatchEvent(new CustomEvent("native-app-resume"));
    })
  );

  return async () => {
    await Promise.all(handles.map((handle) => handle.remove()));
  };
}

export async function hapticReview(rating: ReviewRating): Promise<void> {
  if (!native) return;
  if (rating === 1) {
    await Haptics.notification({ type: NotificationType.Warning });
    return;
  }
  if (rating === 4) {
    await Haptics.notification({ type: NotificationType.Success });
    return;
  }
  await Haptics.impact({
    style: rating === 2 ? ImpactStyle.Medium : ImpactStyle.Light
  });
}

export async function hapticSelection(): Promise<void> {
  if (!native) return;
  await Haptics.selectionChanged();
}

function downloadInBrowser(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("无法读取导出文件"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("导出文件编码失败"));
        return;
      }
      const separator = reader.result.indexOf(",");
      resolve(separator >= 0 ? reader.result.slice(separator + 1) : reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

function safeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
}

export async function exportBlob(
  blob: Blob,
  filename: string,
  title: string
): Promise<"downloaded" | "shared"> {
  if (!native) {
    downloadInBrowser(blob, filename);
    return "downloaded";
  }

  const targetName = safeFilename(filename);
  await Filesystem.mkdir({
    path: "exports",
    directory: Directory.Cache,
    recursive: true
  }).catch(() => undefined);
  const result = await Filesystem.writeFile({
    path: `exports/${targetName}`,
    directory: Directory.Cache,
    data: await blobToBase64(blob),
    recursive: true
  });
  const canShare = await Share.canShare();
  if (!canShare.value) {
    throw new Error(`文件已生成，但系统分享不可用：${result.uri}`);
  }
  await Share.share({
    title,
    files: [result.uri],
    dialogTitle: title
  });
  return "shared";
}
