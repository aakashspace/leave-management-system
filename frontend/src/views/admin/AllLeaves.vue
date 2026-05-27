<template>
  <div>
    <div class="page-header">
      <div>
        <h1>All Leave Requests</h1>
        <p>Review and manage all employee leave applications.</p>
      </div>
    </div>

    <!-- Filters -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
      <div class="filter-tabs">
        <button v-for="tab in statusTabs" :key="tab.value" class="filter-tab" :class="{ active: filterStatus === tab.value }" @click="filterStatus = tab.value">
          {{ tab.label }}
        </button>
      </div>
      <select v-model="filterPriority" class="form-control" style="width: 160px;">
        <option value="">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-spinner" style="padding: 32px;"><div class="spinner"></div> Loading...</div>
      <div v-else-if="filteredLeaves.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        <h3>No leave requests found</h3>
        <p>Try adjusting your filters.</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Paid</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="leave in filteredLeaves" :key="leave._id">
              <td>
                <div style="font-weight: 500; font-size: 13px;">{{ leave.user_id?.name || 'Unknown' }}</div>
                <div class="text-xs text-muted">{{ leave.user_id?.email }}</div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;"
                    :style="{ background: leave.type_id?.color_code || '#4F46E5' }"></span>
                  <span style="font-size: 13px;">{{ leave.leave_type_name }}</span>
                </div>
              </td>
              <td class="text-sm">{{ formatDate(leave.start_date) }}</td>
              <td class="text-sm">{{ formatDate(leave.end_date) }}</td>
              <td><strong>{{ leave.total_days }}</strong></td>
              <td>
                <span class="badge" :class="leave.is_paid ? 'badge-green' : 'badge-gray'">
                  {{ leave.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>
              <td><span class="badge" :class="'badge-' + leave.priority">{{ leave.priority }}</span></td>
              <td><span class="badge" :class="'badge-' + leave.status">{{ leave.status }}</span></td>
              <td>
                <div v-if="leave.status === 'pending'" style="display: flex; gap: 6px;">
                  <button class="btn btn-success btn-sm" @click="openAction(leave, 'approved')">Approve</button>
                  <button class="btn btn-danger btn-sm" @click="openAction(leave, 'rejected')">Reject</button>
                </div>
                <div v-else>
                  <span class="text-muted text-sm" style="cursor: help;" :title="leave.admin_comment">
                    {{ leave.admin_comment ? '💬 ' + leave.admin_comment.slice(0, 20) + '...' : '—' }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Modal -->
    <div v-if="showActionModal" class="modal-overlay" @click.self="showActionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ pendingAction.action === 'approved' ? 'Approve' : 'Reject' }} Leave</h3>
          <button class="modal-close" @click="showActionModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="leave-summary">
            <div class="ls-row"><span>Employee:</span> <strong>{{ pendingAction.leave?.user_id?.name }}</strong></div>
            <div class="ls-row"><span>Leave Type:</span> {{ pendingAction.leave?.leave_type_name }}</div>
            <div class="ls-row"><span>Dates:</span> {{ formatDate(pendingAction.leave?.start_date) }} – {{ formatDate(pendingAction.leave?.end_date) }}</div>
            <div class="ls-row"><span>Days:</span> {{ pendingAction.leave?.total_days }}</div>
            <div class="ls-row"><span>Reason:</span> {{ pendingAction.leave?.reason }}</div>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>Admin Comment (optional)</label>
            <textarea v-model="adminComment" class="form-control" rows="2" placeholder="Add a note for the employee..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showActionModal = false">Cancel</button>
          <button
            class="btn"
            :class="pendingAction.action === 'approved' ? 'btn-success' : 'btn-danger'"
            @click="confirmAction"
            :disabled="actioning"
          >
            {{ actioning ? 'Processing...' : (pendingAction.action === 'approved' ? 'Approve' : 'Reject') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../api/axios';

const leaves = ref([]);
const loading = ref(true);
const filterStatus = ref('all');
const filterPriority = ref('');
const showActionModal = ref(false);
const actioning = ref(false);
const adminComment = ref('');
const pendingAction = ref({ leave: null, action: '' });

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const filteredLeaves = computed(() => {
  let list = leaves.value;
  if (filterStatus.value !== 'all') list = list.filter(l => l.status === filterStatus.value);
  if (filterPriority.value) list = list.filter(l => l.priority === filterPriority.value);
  return list;
});

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadLeaves() {
  loading.value = true;
  try {
    const res = await api.get('/leave-requests/all');
    leaves.value = res.data.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function openAction(leave, action) {
  pendingAction.value = { leave, action };
  adminComment.value = '';
  showActionModal.value = true;
}

async function confirmAction() {
  actioning.value = true;
  try {
    await api.put(`/leave-requests/${pendingAction.value.leave._id}/status`, {
      status: pendingAction.value.action,
      admin_comment: adminComment.value || (pendingAction.value.action === 'approved' ? 'Approved by admin' : 'Rejected by admin')
    });
    showActionModal.value = false;
    await loadLeaves();
  } catch (e) {
    alert(e.response?.data?.message || 'Error processing request.');
  } finally { actioning.value = false; }
}

onMounted(loadLeaves);
</script>

<style scoped>
.leave-summary {
  background: var(--bg);
  border-radius: var(--radius);
  padding: 14px;
  border: 1px solid var(--border);
}

.ls-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  padding: 4px 0;
  color: var(--text);
}

.ls-row span:first-child {
  color: var(--text-muted);
  min-width: 80px;
  flex-shrink: 0;
}
</style>
