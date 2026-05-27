<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
          </svg>
        </div>
        <div class="brand-text">
          <h2>LMS Portal</h2>
          <p>Employee View</p>
        </div>
      </div>

      <div class="sidebar-user" v-if="user">
        <div class="user-info">
          <div class="user-avatar" :style="{ background: avatarColor }">
            {{ initials }}
          </div>
          <div>
            <div class="user-name">{{ user.name }}</div>
            <div class="user-role">{{ user.dept_id?.dept_name || 'Employee' }}</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Menu</div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span v-html="item.icon"></span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-ghost btn-full" @click="logout" style="color: #C7D2FE; border-color: rgba(255,255,255,0.15);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Mobile header -->
    <div class="mobile-header">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
      <span class="mobile-title">LMS Portal</span>
      <div class="user-avatar" v-if="user" :style="{ background: avatarColor, width: '32px', height: '32px', fontSize: '12px' }">
        {{ initials }}
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- Main content -->
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
  if (!user.value) return '?';
  return user.value.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

const avatarColor = computed(() => {
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  if (!user.value) return colors[0];
  const idx = user.value.name.charCodeAt(0) % colors.length;
  return colors[idx];
});

const navItems = [
  {
    path: '/employee/dashboard',
    label: 'Dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>`
  },
  {
    path: '/employee/apply',
    label: 'Apply Leave',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>`
  },
  {
    path: '/employee/history',
    label: 'My Leaves',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`
  },
  {
    path: '/employee/calendar',
    label: 'Calendar',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>`
  },
  {
    path: '/employee/profile',
    label: 'My Profile',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`
  },
];

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/');
}

function logout() {
  store.clearAuth();
  router.push('/login');
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
  border-bottom: 1px solid rgba(255,255,255,0.1);
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
