import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";
import App from "./App.vue";
import router from "./router";
import { captureInstallPrompt } from "@/services/install";
import "./styles/main.css";

captureInstallPrompt();

if (!Capacitor.isNativePlatform()) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent("app-update-ready"));
    }
  });
}

createApp(App).use(createPinia()).use(router).mount("#app");
