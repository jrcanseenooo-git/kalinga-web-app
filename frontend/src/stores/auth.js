import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { decodeCredential } from "vue3-google-login";
import { api, apiPost } from "@/services/api";
import { clearAll as clearOfflineQueue } from "@/services/offlineQueue";

export const useAuthStore = defineStore("auth", () => {
  const savedUser = localStorage.getItem("cefmu_user");
  const user = ref(savedUser ? JSON.parse(savedUser) : null);
  const token = ref(localStorage.getItem("cefmu_token") || null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!user.value);
  const role = computed(() => user.value?.role || null);
  const isAdmin = computed(() => role.value === "admin");
  const isCaseWorker = computed(() => role.value === "case_worker");
  const isCpuMonitor = computed(() => role.value === "cpu_monitor");
  const canEdit = computed(() =>
    ["admin", "case_worker", "fo_user", "lgu_supervisor"].includes(role.value),
  );

  // Google OAuth — raw JWT sent to backend for server-side verification
  async function loginWithGoogle(credential) {
    loading.value = true;
    try {
      const profile = decodeCredential(credential);
      token.value = credential;
      localStorage.setItem("cefmu_token", credential);

      const me = await api("getMe");

      // If backend returned a long-lived ses_ token, use that instead
      // of the Google JWT which expires in 1 hour
      if (me.session_token) {
        token.value = me.session_token;
        localStorage.setItem("cefmu_token", me.session_token);
      }

      user.value = {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        role: me.role,
        lgu_code: me.lgu_code,
      };
      localStorage.setItem("cefmu_user", JSON.stringify(user.value));
    } finally {
      loading.value = false;
    }
  }

  // Email/password — receives a 'ses_'-prefixed session token from backend
  function loginWithSession(sessionToken, userData) {
    token.value = sessionToken;
    user.value = {
      email: userData.email,
      name: userData.name || userData.display_name || userData.email,
      picture: userData.picture || null,
      role: userData.role,
      lgu_code: userData.lgu_code,
    };
    localStorage.setItem("cefmu_token", sessionToken);
    localStorage.setItem("cefmu_user", JSON.stringify(user.value));
  }

  function logout() {
    apiPost('logout').catch(() => {})
    clearOfflineQueue().catch(() => {})
    user.value = null;
    token.value = null;
    localStorage.removeItem("cefmu_token");
    localStorage.removeItem("cefmu_user");
  }

  function handleSessionExpired() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("cefmu_token");
    localStorage.removeItem("cefmu_user");
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    role,
    isAdmin,
    isCaseWorker,
    isCpuMonitor,
    canEdit,
    loginWithGoogle,
    loginWithSession,
    logout,
    handleSessionExpired,
  };
});