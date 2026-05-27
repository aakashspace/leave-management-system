import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const token = ref(localStorage.getItem('lms_token') || null);
  const currentUser = ref(JSON.parse(localStorage.getItem('lms_user') || 'null'));

  function setAuth(user, tkn) {
    token.value = tkn;
    currentUser.value = user;
    localStorage.setItem('lms_token', tkn);
    localStorage.setItem('lms_user', JSON.stringify(user));
  }

  function clearAuth() {
    token.value = null;
    currentUser.value = null;
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
  }

  // Legacy aliases (kept for backward compatibility)
  function setUser(user) { setAuth(user, token.value); }
  function clearUser() { clearAuth(); }

  return { token, currentUser, setAuth, clearAuth, setUser, clearUser };
});
