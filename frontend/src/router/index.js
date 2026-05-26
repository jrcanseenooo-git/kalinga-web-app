import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const LoginView = () => import("@/views/LoginView.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const CasesView = () => import("@/views/CasesView.vue");
const CaseDetailView = () => import("@/views/CaseDetailView.vue");
const CaseFormView = () => import("@/views/CaseFormView.vue");
const UsersView = () => import("@/views/UsersView.vue");
const PublicDashboardView = () => import("@/views/PublicDashboardView.vue");
const ReportsView = () => import("@/views/ReportsView.vue");
const FaqView = () => import("@/views/FaqView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true },
  },
  {
    path: "/public",
    name: "public-dashboard",
    component: PublicDashboardView,
    meta: { public: true },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { auth: true },
  },
  { path: "/cases", name: "cases", component: CasesView, meta: { auth: true } },
  {
    path: "/cases/new",
    name: "case-new",
    component: CaseFormView,
    meta: { auth: true, roles: ["admin", "case_worker"] },
  },
  {
    path: "/cases/:id",
    name: "case-detail",
    component: CaseDetailView,
    meta: { auth: true },
  },
  {
    path: "/cases/:id/edit",
    name: "case-edit",
    component: CaseFormView,
    meta: {
      auth: true,
      roles: ["admin", "case_worker", "fo_user", "lgu_supervisor"],
    },
  },
  {
    path: "/users",
    name: "users",
    component: UsersView,
    meta: { auth: true, roles: ["admin"] },
  },
  {
    path: "/reports",
    name: "reports",
    component: ReportsView,
    meta: { auth: true },
  },
  { path: "/faq", name: "faq", component: FaqView, meta: { public: true } },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isLoggedIn)
    return { name: "login", query: { redirect: to.fullPath } };
  if (to.meta.roles && !to.meta.roles.includes(auth.role))
    return { name: "dashboard" };
  return true;
});

export default router;
