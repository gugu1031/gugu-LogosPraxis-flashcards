<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import {
  PhBooks as Books,
  PhCardsThree as CardsThree,
  PhChartLineUp as ChartLineUp,
  PhGearSix as GearSix,
  PhHouse as House,
  PhMagnifyingGlass as MagnifyingGlass,
  PhSidebarSimple as SidebarSimple,
  PhTreeStructure as TreeStructure
} from "@phosphor-icons/vue";
import { useAppStore } from "@/stores/app";
import { useStudyStore } from "@/stores/study";
import { initializeNativeShell } from "@/services/native";
import ToastStack from "@/components/ToastStack.vue";
import CommandPalette from "@/components/CommandPalette.vue";

const app = useAppStore();
const study = useStudyStore();
const route = useRoute();
const router = useRouter();
let disposeNativeShell: (() => Promise<void>) | undefined;

const navItems = [
  { to: "/", label: "今日", icon: House },
  { to: "/review", label: "背诵", icon: CardsThree },
  { to: "/library", label: "文献", icon: Books },
  { to: "/knowledge", label: "知识库", icon: TreeStructure },
  { to: "/stats", label: "统计", icon: ChartLineUp },
  { to: "/settings", label: "设置", icon: GearSix }
];

const immersive = computed(() => Boolean(route.meta.immersive));

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    app.commandOpen = true;
  }
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) {
    event.preventDefault();
    void router.push("/search");
  }
};

const handleUpdate = () => app.notify("新版本已准备好", "重新打开应用即可完成更新。", "info");

onMounted(async () => {
  await Promise.all([app.initialize(), study.hydrate()]);
  disposeNativeShell = await initializeNativeShell(router);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("app-update-ready", handleUpdate);
});

onBeforeUnmount(() => {
  void disposeNativeShell?.();
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("app-update-ready", handleUpdate);
});
</script>

<template>
  <div class="app-shell" :class="{ 'is-immersive': immersive, 'sidebar-collapsed': app.sidebarCollapsed }">
    <aside v-if="!immersive" class="sidebar" aria-label="主导航">
      <div class="brand-lockup">
        <img src="/icons/icon-192.png" alt="" class="brand-icon" />
        <div class="brand-type">
          <strong>LogosPraxis</strong>
          <span>思想的练习场</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :aria-label="item.label"
          class="nav-link"
        >
          <component :is="item.icon" :size="20" :weight="route.path === item.to ? 'fill' : 'regular'" />
          <span>{{ item.label }}</span>
          <b v-if="item.to === '/review' && study.dueCards.length">{{ study.dueCards.length }}</b>
        </RouterLink>
      </nav>

      <button class="sidebar-search" type="button" @click="app.commandOpen = true">
        <MagnifyingGlass :size="18" />
        <span>全局检索</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div class="sidebar-foot">
        <div class="privacy-note">
          <span>仅储存在此设备</span>
          <small>{{ study.localBooks.length }} 份本地文献</small>
        </div>
        <button
          class="icon-button"
          type="button"
          :aria-label="app.sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
          @click="app.sidebarCollapsed = !app.sidebarCollapsed"
        >
          <SidebarSimple :size="20" />
        </button>
      </div>
    </aside>

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <nav v-if="!immersive" class="mobile-nav" aria-label="移动端主导航">
      <RouterLink v-for="item in navItems.slice(0, 5)" :key="item.to" :to="item.to">
        <component :is="item.icon" :size="21" :weight="route.path === item.to ? 'fill' : 'regular'" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <CommandPalette v-if="app.commandOpen" @close="app.commandOpen = false" />
    <ToastStack />
  </div>
</template>
