<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>System overview and pending actions.</p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="text-sm text-muted">{{ todayStr }}</span>
      </div>
    </div>

    <!-- Stat Cards -->
    <div v-if="loadingStats" class="loading-spinner"><div class="spinner"></div> Loading stats...</div>
    <div v-else class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">Total Employees</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon yellow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L21 8l-9 9z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingApprovals }}</div>
          <div class="stat-label">Pending User Approvals</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon indigo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingLeaves }}</div>
          <div class="stat-label">Pending Leaves</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon red">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.highPriority }}</div>
          <div class="stat-label">High Priority Pending</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.approvedLeaves }}</div>
          <div class="stat-label">Approved Leaves</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalLeaves }}</div>
          <div class="stat-label">Total Leave Requests</div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;" class="dash-grid">
      <!-- Pending leaves -->
      <div class="card">
        <div class="card-header">
          <h3>Pending Leave Requests</h3>
          <router-link to="/admin/leaves" class="btn btn-ghost btn-sm">View All</router-link>
        </div>
        <div v-if="loadingLeaves" class="loading-spinner" style="padding: 24px;"><div class="spinner"></div></div>
        <div v-else-if="pendingLeaves.length === 0" class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          <h3>All caught up!</h3>
          <p>No pending leave requests.</p>
        </div>
        <div v-else class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="leave in pendingLeaves.slice(0, 8)" :key="leave._id">
                <td>
                  <div style="font-weight: 500;">{{ leave.user_id?.name }}</div>
                  <div class="text-muted text-xs">{{ leave.user_id?.email }}</div>
                </td>
                <td>{{ leave.leave_type_name }}</td>
                <td class="text-sm">{{ formatDate(leave.start_date) }} – {{ formatDate(leave.end_date) }}</td>
                <td>{{ leave.total_days }}</td>
                <td><span class="badge" :class="'badge-' + leave.priority">{{ leave.priority }}</span></td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-success btn-sm" @click="quickApprove(leave)">✓</button>
                    <button class="btn btn-danger btn-sm" @click="quickReject(leave)">✗</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pending User Approvals -->
      <div class="card">
        <div class="card-header">
          <h3>New User Requests</h3>
          <router-link to="/admin/users" class="btn btn-ghost btn-sm">View All</router-link>
        </div>
        <div v-if="loadingPendingUsers" class="loading-spinner" style="padding: 24px;"><div class="spinner"></div></div>
        <div v-else-if="pendingUsers.length === 0" class="empty-state" style="padding: 24px;">
          <h3 style="font-size: 14px;">No pending users</h3>
        </div>
        <div v-else style="padding: 8px;">
          <div v-for="u in pendingUsers" :key="u._id" class="pending-user-item">
            <div class="user-avatar" style="width: 34px; height: 34px; font-size: 12px;" :style="{ background: '#4F46E5' }">
              {{ u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 500; font-size: 13px;">{{ u.name }}</div>
              <div class="text-xs text-muted">{{ u.dept_id?.dept_name || 'No dept' }}</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-success btn-sm" @click="approveUser(u)">✓</button>
              <button class="btn btn-danger btn-sm" @click="rejectUser(u)">✗</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const stats = ref({ totalUsers: 0, pendingApprovals: 0, totalLeaves: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0, highPriority: 0 });
const pendingLeaves = ref([]);
const pendingUsers = ref([]);
const loadingStats = ref(true);
const loadingLeaves = ref(true);
const loadingPendingUsers = ref(true);

const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

async function loadAll() {
  try {
    const res = await api.get('/reports/dashboard');
    stats.value = res.data.data;
  } catch {} finally { loadingStats.value = false; }

  try {
    const res = await api.get('/leave-requests/all?status=pending');
    pendingLeaves.value = res.data.data;
  } catch {} finally { loadingLeaves.value = false; }

  try {
    const res = await api.get('/users/pending');
    pendingUsers.value = res.data.data;
  } catch {} finally { loadingPendingUsers.value = false; }
}

async function quickApprove(leave) {
  try {
    await api.put(`/leave-requests/${leave._id}/status`, { status: 'approved', admin_comment: 'Approved' });
    await loadAll();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function quickReject(leave) {
  try {
    await api.put(`/leave-requests/${leave._id}/status`, { status: 'rejected', admin_comment: 'Rejected' });
    await loadAll();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function approveUser(u) {
  try {
    await api.put(`/users/${u._id}/approve`);
    await loadAll();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function rejectUser(u) {
  try {
    await api.put(`/users/${u._id}/reject`);
    await loadAll();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

onMounted(loadAll);
</script>

<style scoped>
.pending-user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  transition: background 0.15s;
}
.pending-user-item:hover {
  background: var(--bg);
}

@media (max-width: 900px) {
  .dash-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
