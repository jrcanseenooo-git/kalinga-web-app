import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { decodeCredential } from "vue3-google-login";
import { api } from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  const savedUser = localStorage.getItem("cefmu_user");
  const user  = ref(savedUser ? JSON.parse(savedUser) : null);
  const token = ref(localStorage.getItem("cefmu_token") || null);
  const loading = ref(false);

  const isLoggedIn    = computed(() => !!user.value);
  const role          = computed(() => user.value?.role || null);
  const isAdmin       = computed(() => role.value === "admin");
  const isCaseWorker  = computed(() => role.value === "case_worker");
  const isCpuMonitor  = computed(() => role.value === "cpu_monitor");

  // Google OAuth — raw JWT sent to backend for server-side verification
  async function loginWithGoogle(credential) {
    loading.value = true;
    try {
      // Decode locally only for display purposes (name, picture)
      // The backend verifies the JWT signature via tokeninfo API
      const profile = decodeCredential(credential);
      token.value = credential;
      localStorage.setItem("cefmu_token", credential);

      const me = await api("getMe");
      user.value = {
        email:    profile.email,
        name:     profile.name,
        picture:  profile.picture,
        role:     me.role,
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
      email:    userData.email,
      name:     userData.name || userData.display_name || userData.email,
      picture:  userData.picture || null,
      role:     userData.role,
      lgu_code: userData.lgu_code,
    };
    localStorage.setItem("cefmu_token", sessionToken);
    localStorage.setItem("cefmu_user", JSON.stringify(user.value));
  }

  function logout() {
    user.value  = null;
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
    loginWithGoogle,
    loginWithSession,
    logout,
  };
});
