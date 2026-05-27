<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ greeting }}, {{ firstName }}!</h1>
        <p>Here's your leave overview for today, {{ todayStr }}.</p>
      </div>
      <router-link to="/employee/apply" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Apply for Leave
      </router-link>
    </div>

    <!-- Leave Balance Cards -->
    <div v-if="loadingUser" class="loading-spinner">
      <div class="spinner"></div> Loading balances...
    </div>

    <div v-else>
      <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 14px; color: var(--text);">Leave Balances</h3>
      <div class="balance-grid">
        <div
          v-for="bal in balances"
          :key="bal.leave_type_id"
          class="balance-card"
          :style="{ borderLeftColor: bal.color || '#4F46E5' }"
        >
          <div class="leave-name">{{ bal.leave_type_name }}</div>
          <div class="balance-nums">
            <span class="balance-remaining" :style="{ color: bal.color || '#4F46E5' }">{{ bal.remaining_days }}</span>
            <span class="balance-total">/ {{ bal.total_days }} days</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{
                width: bal.total_days > 0 ? ((bal.remaining_days / bal.total_days) * 100) + '%' : '0%',
                background: bal.color || '#4F46E5'
              }"
            ></div>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
            {{ bal.used_days }} used · {{ bal.remaining_days }} remaining
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Leave Requests -->
    <div class="card mt-24">
      <div class="card-header">
        <h3>Recent Leave Requests</h3>
        <router-link to="/employee/history" class="btn btn-ghost btn-sm">View All</router-link>
      </div>
      <div v-if="loadingLeaves" class="loading-spinner" style="padding: 24px;">
        <div class="spinner"></div> Loading...
      </div>
      <div v-else-if="recentLeaves.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
        <h3>No leave requests yet</h3>
        <p>Apply for leave to see your history here.</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="leave in recentLeaves" :key="leave._id">
              <td>
                <span class="leave-type-dot" :style="{ background: leave.type_id?.color_code || '#4F46E5' }"></span>
                {{ leave.leave_type_name }}
              </td>
              <td>{{ formatDate(leave.start_date) }}</td>
              <td>{{ formatDate(leave.end_date) }}</td>
              <td>{{ leave.total_days }}</td>
              <td>
                <span class="badge" :class="'badge-' + leave.status">{{ leave.status }}</span>
              </td>
              <td class="text-muted text-sm" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ leave.reason }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axios';

const store = useAppStore();
const user = computed(() => store.currentUser);
const firstName = computed(() => user.value?.name?.split(' ')[0] || 'User');

const loadingUser = ref(true);
const loadingLeaves = ref(true);
const balances = ref([]);
const recentLeaves = ref([]);

// Colour lookup from leave types
const leaveTypeColors = ref({});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
});

const todayStr = computed(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

onMounted(async () => {
  if (!user.value) return;

  // Load leave types for colors
  try {
    const ltRes = await api.get('/leave-types');
    ltRes.data.data.forEach(lt => { leaveTypeColors.value[lt.name] = lt.color_code; });
  } catch {}

  // Load user data for balances
  try {
    const res = await api.get(`/users/${user.value._id}`);
    const userData = res.data.data;
    balances.value = userData.leave_balances.map(b => ({
      ...b,
      color: leaveTypeColors.value[b.leave_type_name] || '#4F46E5'
    }));
  } catch (e) {
    console.error(e);
  } finally {
    loadingUser.value = false;
  }

  // Load leave history
  try {
    const res = await api.get(`/leave-requests/my/${user.value._id}`);
    recentLeaves.value = res.data.data.slice(0, 5);
  } catch (e) {
    console.error(e);
  } finally {
    loadingLeaves.value = false;
  }
});
</script>

<style scoped>
.leave-type-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
</style>
