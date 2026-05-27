<template>
  <div>
    <div class="page-header">
      <div>
        <h1>My Leave Requests</h1>
        <p>Track all your leave applications and their status.</p>
      </div>
      <router-link to="/employee/apply" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Apply Leave
      </router-link>
    </div>

    <!-- Filters -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
      <div class="filter-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="filter-tab"
          :class="{ active: activeStatus === tab.value }"
          @click="activeStatus = tab.value"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" style="margin-left: 4px; opacity: 0.7;">({{ tab.count }})</span>
        </button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-spinner" style="padding: 32px;">
        <div class="spinner"></div> Loading your leave history...
      </div>

      <div v-else-if="filteredLeaves.length === 0" class="empty-state">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        <h3>No {{ activeStatus !== 'all' ? activeStatus : '' }} leave requests</h3>
        <p>{{ activeStatus === 'all' ? 'You haven\'t applied for any leaves yet.' : `No ${activeStatus} requests found.` }}</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Admin Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="leave in filteredLeaves" :key="leave._id">
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span
                    style="width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0;"
                    :style="{ background: leave.type_id?.color_code || '#4F46E5' }"
                  ></span>
                  <span style="font-weight: 500;">{{ leave.leave_type_name }}</span>
                </div>
              </td>
              <td>{{ formatDate(leave.start_date) }}</td>
              <td>{{ formatDate(leave.end_date) }}</td>
              <td><strong>{{ leave.total_days }}</strong></td>
              <td>
                <span class="badge" :class="leave.is_paid ? 'badge-green' : 'badge-gray'">
                  {{ leave.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="'badge-' + leave.priority">{{ leave.priority }}</span>
              </td>
              <td>
                <span class="badge" :class="'badge-' + leave.status">{{ leave.status }}</span>
              </td>
              <td class="text-sm text-muted" style="max-width: 160px;">
                {{ leave.admin_comment || '—' }}
              </td>
              <td>
                <button
                  v-if="leave.status === 'pending'"
                  class="btn btn-danger btn-sm"
                  @click="cancelLeave(leave)"
                  :disabled="cancellingId === leave._id"
                >
                  {{ cancellingId === leave._id ? '...' : 'Cancel' }}
                </button>
                <span v-else class="text-muted text-sm">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cancel Confirm Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Cancel Leave Request</h3>
          <button class="modal-close" @click="showCancelModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to cancel this <strong>{{ pendingCancel?.leave_type_name }}</strong> leave request ({{ formatDate(pendingCancel?.start_date) }} – {{ formatDate(pendingCancel?.end_date) }})?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showCancelModal = false">No, keep it</button>
          <button class="btn btn-danger" @click="confirmCancel" :disabled="cancellingId">Yes, cancel</button>
        </div>
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

const leaves = ref([]);
const loading = ref(true);
const activeStatus = ref('all');
const cancellingId = ref(null);
const showCancelModal = ref(false);
const pendingCancel = ref(null);

const statusTabs = computed(() => [
  { label: 'All', value: 'all', count: leaves.value.length },
  { label: 'Pending', value: 'pending', count: leaves.value.filter(l => l.status === 'pending').length },
  { label: 'Approved', value: 'approved', count: leaves.value.filter(l => l.status === 'approved').length },
  { label: 'Rejected', value: 'rejected', count: leaves.value.filter(l => l.status === 'rejected').length },
]);

const filteredLeaves = computed(() => {
  if (activeStatus.value === 'all') return leaves.value;
  return leaves.value.filter(l => l.status === activeStatus.value);
});

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadLeaves() {
  try {
    const res = await api.get(`/leave-requests/my/${user.value._id}`);
    leaves.value = res.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function cancelLeave(leave) {
  pendingCancel.value = leave;
  showCancelModal.value = true;
}

async function confirmCancel() {
  if (!pendingCancel.value) return;
  cancellingId.value = pendingCancel.value._id;
  try {
    await api.put(`/leave-requests/${pendingCancel.value._id}/cancel`);
    showCancelModal.value = false;
    await loadLeaves();
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to cancel leave.');
  } finally {
    cancellingId.value = null;
    pendingCancel.value = null;
  }
}

onMounted(() => {
  if (user.value) loadLeaves();
});
</script>
