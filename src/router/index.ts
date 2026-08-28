import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/pages/HomePage.vue"),
      meta: { title: "今日学习" }
    },
    {
      path: "/review",
      name: "review",
      component: () => import("@/pages/ReviewPage.vue"),
      meta: { title: "背诵复习", immersive: true }
    },
    {
      path: "/library",
      name: "library",
      component: () => import("@/pages/LibraryPage.vue"),
      meta: { title: "文献图书馆" }
    },
    {
      path: "/reader/:id",
      name: "reader",
      component: () => import("@/pages/ReaderPage.vue"),
      meta: { title: "文献阅读", immersive: true }
    },
    {
      path: "/knowledge",
      name: "knowledge",
      component: () => import("@/pages/KnowledgePage.vue"),
      meta: { title: "知识库" }
    },
    {
      path: "/search",
      name: "search",
      component: () => import("@/pages/SearchPage.vue"),
      meta: { title: "全局检索" }
    },
    {
      path: "/stats",
      name: "stats",
      component: () => import("@/pages/StatsPage.vue"),
      meta: { title: "学习统计" }
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/pages/SettingsPage.vue"),
      meta: { title: "设置" }
    },
    {
      path: "/future/:module",
      name: "future",
      component: () => import("@/pages/FuturePage.vue"),
      meta: { title: "未来模块" }
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/"
    }
  ]
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? "学习")} | LogosPraxis`;
});

export default router;
