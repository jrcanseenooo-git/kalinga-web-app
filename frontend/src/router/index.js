import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const LoginView = () => import("@/views/LoginView.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const CasesView = () => import("@/views/CasesView.vue");
const CaseDetailView = () => import("@/views/CaseDetailView.vue");
const CaseFormView = () => import("@/views/CaseFormView.vue");
const UsersView = () => import("@/views/UsersView.vue");
const FormBuilderView = () => import("@/views/FormBuilderView.vue");
const PublicDashboardView = () => import("@/views/PublicDashboardView.vue");
const ReportsView = () => import("@/views/ReportsView.vue");
const AuditLogsView = () => import("@/views/AuditLogsView.vue");
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
    // `grant` lets an admin-granted user reach this route even when their
    // role isn't in `roles` (additive per-user module access).
    meta: { auth: true, roles: ["case_worker"], grant: "createCase" },
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
      roles: ["case_worker", "fo_user", "lgu_supervisor"],
      grant: "updateCase",
    },
  },
  {
    path: "/users",
    name: "users",
    component: UsersView,
    meta: { auth: true, roles: ["admin"] },
  },
  {
    path: "/form-builder",
    name: "form-builder",
    component: FormBuilderView,
    meta: { auth: true, roles: ["admin"] },
  },
  {
    path: "/audit-logs",
    name: "audit-logs",
    component: AuditLogsView,
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
  const auth = useAuthStore()
  if (to.meta.public) return true

  if (!auth.isLoggedIn) {
    const cachedToken = localStorage.getItem('cefmu_token')
    const cachedUser  = localStorage.getItem('cefmu_user')

    // If offline but has cached credentials — let them through
    if (cachedToken && cachedUser && !navigator.onLine) {
      if (to.meta.roles) {
        try {
          const offlineUser = JSON.parse(cachedUser)
          const granted = to.meta.grant &&
            Array.isArray(offlineUser.permissions) &&
            offlineUser.permissions.includes(to.meta.grant)
          if (!to.meta.roles.includes(offlineUser.role) && !granted) {
            return { name: 'dashboard' }
          }
        } catch (e) {
          return { name: 'login', query: { redirect: to.fullPath } }
        }
      }
      return true
    }

    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    // Honor an additive per-user grant before redirecting away.
    if (to.meta.grant && auth.hasGrant(to.meta.grant)) return true
    return { name: 'dashboard' }
  }

  return true
});

export default router;
