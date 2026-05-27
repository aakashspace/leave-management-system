import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const currentUser = ref(JSON.parse(localStorage.getItem('lms_user') || 'null'));

  function setUser(user) {
    currentUser.value = user;
    localStorage.setItem('lms_user', JSON.stringify(user));
  }

  function clearUser() {
    currentUser.value = null;
    localStorage.removeItem('lms_user');
  }

  return { currentUser, setUser, clearUser };
});
