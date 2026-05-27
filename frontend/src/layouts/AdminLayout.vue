<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <div class="brand-icon" style="background: #7C3AED;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
        <div class="brand-text">
          <h2>LMS Admin</h2>
          <p>Management Panel</p>
        </div>
      </div>

      <div class="sidebar-user" v-if="user">
        <div class="user-info">
          <div class="user-avatar" style="background: #7C3AED;">
            {{ initials }}
          </div>
          <div>
            <div class="user-name">{{ user.name }}</div>
            <div class="user-role" style="color: #C4B5FD;">Administrator</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Overview</div>
        <router-link to="/admin/dashboard" class="nav-item" :class="{ active: isActive('/admin/dashboard') }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          Dashboard
        </router-link>

        <div class="nav-section-label">Leave Management</div>
        <router-link to="/admin/leaves" class="nav-item" :class="{ active: isActive('/admin/leaves') }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
          Manage Leaves
        </router-link>
        <router-link to="/admin/leave-types" class="nav-item" :class="{ active: isActive('/admin/leave-types') }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5S15.01 22 17.5 22s4.5-2.01 4.5-4.5S19.99 13 17.5 13zm0 7c-1.38 0-2.5-1.12-2.5-2.5S16.12 15 17.5 15s2.5 1.12 2.5 2.5S18.88 20 17.5 20zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/></svg>
          Leave Types
        </router-link>

        <div class="nav-section-label">Administration</div>
        <router-link to="/admin/users" class="nav-item" :class="{ active: isActive('/admin/users') }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          Manage Users
        </router-link>
        <router-link to="/admin/departments" class="nav-item" :class="{ active: isActive('/admin/departments') }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
          Departments
        </router-link>
        <router-link to="/admin/reports" class="nav-item" :class="{ active: isActive('/admin/reports') }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
          Reports
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-ghost btn-full" @click="switchUser" style="color: #C7D2FE; border-color: rgba(255,255,255,0.15);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
          </svg>
          Switch User
        </button>
      </div>
    </aside>

    <div class="mobile-header">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
      <span class="mobile-title">LMS Admin</span>
    </div>

    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../store/useAppStore';

const router = useRouter();
const route = useRoute();
const store = useAppStore();
const sidebarOpen = ref(false);

const user = computed(() => store.currentUser);

const initials = computed(() => {
  if (!user.value) return 'A';
  return user.value.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/');
}

function switchUser() {
  store.clearUser();
  router.push('/');
}
</script>

<style scoped>
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--sidebar-bg);
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 99;
}

.mobile-title {
  font-weight: 700;
  color: #fff;
  font-size: 15px;
}

.hamburger {
  background: none;
  border: none;
  color: #fff;
  padding: 4px;
  display: flex;
  align-items: center;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
}

@media (max-width: 768px) {
  .mobile-header { display: flex; }
  .sidebar-overlay { display: block; }
  .main-content { margin-left: 0 !important; padding-top: 72px; }
}
</style>
