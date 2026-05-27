<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Apply for Leave</h1>
        <p>Fill in the details below to submit a leave request.</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;" class="apply-grid">
      <!-- Form -->
      <div class="card">
        <div class="card-header">
          <h3>Leave Request Form</h3>
        </div>
        <div class="card-body">
          <div v-if="successMsg" class="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            {{ successMsg }}
          </div>
          <div v-if="errorMsg" class="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {{ errorMsg }}
          </div>

          <div class="form-group">
            <label>Leave Type *</label>
            <select v-model="form.type_id" class="form-control" @change="onLeaveTypeChange">
              <option value="">Select leave type</option>
              <option v-for="lt in leaveTypes" :key="lt._id" :value="lt._id">{{ lt.name }}</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date *</label>
              <input type="date" v-model="form.start_date" class="form-control" :min="today" @change="calcDays" />
            </div>
            <div class="form-group">
              <label>End Date *</label>
              <input type="date" v-model="form.end_date" class="form-control" :min="form.start_date || today" @change="calcDays" />
            </div>
          </div>

          <div v-if="workingDays !== null" class="days-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <strong>{{ workingDays }} working day{{ workingDays !== 1 ? 's' : '' }}</strong> will be deducted (excludes weekends)
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" v-model="form.is_paid" style="width: 16px; height: 16px;" />
              <span>Paid Leave</span>
            </label>
            <div class="form-hint">Uncheck for unpaid leave (won't deduct from balance)</div>
          </div>

          <div class="form-group">
            <label>Reason *</label>
            <textarea
              v-model="form.reason"
              class="form-control"
              rows="4"
              placeholder="Briefly describe the reason for your leave..."
            ></textarea>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-ghost" type="button" @click="resetForm">Reset</button>
            <button class="btn btn-primary" @click="submitLeave" :disabled="submitting || !isFormValid">
              <div v-if="submitting" class="spinner" style="width:14px;height:14px;border-width:2px;"></div>
              {{ submitting ? 'Submitting...' : 'Submit Request' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar info -->
      <div class="apply-sidebar">
        <div class="card" v-if="selectedLeaveType">
          <div class="card-header">
            <h3>Balance Info</h3>
          </div>
          <div class="card-body">
            <div class="balance-info-item">
              <div class="balance-type-name" :style="{ color: selectedLeaveType.color_code }">
                {{ selectedLeaveType.name }}
              </div>
              <div class="balance-bar-wrap">
                <div class="progress-bar" style="height: 8px; margin-top: 8px;">
                  <div
                    class="progress-fill"
                    :style="{
                      width: selectedBalance && selectedBalance.total_days > 0
                        ? ((selectedBalance.remaining_days / selectedBalance.total_days) * 100) + '%'
                        : '0%',
                      background: selectedLeaveType.color_code
                    }"
                  ></div>
                </div>
              </div>
              <div class="balance-nums-row" v-if="selectedBalance">
                <span class="remaining-big" :style="{ color: selectedLeaveType.color_code }">
                  {{ selectedBalance.remaining_days }}
                </span>
                <span class="text-muted"> / {{ selectedBalance.total_days }} days remaining</span>
              </div>
              <div v-else class="text-muted text-sm" style="margin-top: 8px;">No balance data (unpaid ok)</div>
              <div v-if="selectedBalance" style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div class="mini-stat">
                  <div class="mini-val">{{ selectedBalance.used_days }}</div>
                  <div class="mini-label">Used</div>
                </div>
                <div class="mini-stat">
                  <div class="mini-val">{{ selectedBalance.remaining_days }}</div>
                  <div class="mini-label">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 16px;">
          <div class="card-header"><h3>All Balances</h3></div>
          <div class="card-body" style="padding: 12px 16px;">
            <div v-if="allBalances.length === 0" class="text-muted text-sm">No balance data.</div>
            <div v-for="b in allBalances" :key="b.leave_type_id" class="mini-balance-row">
              <span class="dot" :style="{ background: b.color || '#4F46E5' }"></span>
              <span class="bal-name">{{ b.leave_type_name }}</span>
              <span class="bal-rem" :style="{ color: b.color || '#4F46E5' }">{{ b.remaining_days }}/{{ b.total_days }}</span>
            </div>
          </div>
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

const leaveTypes = ref([]);
const allBalances = ref([]);
const submitting = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const workingDays = ref(null);

const form = ref({
  type_id: '',
  start_date: '',
  end_date: '',
  is_paid: true,
  reason: ''
});

const today = new Date().toISOString().split('T')[0];

const selectedLeaveType = computed(() => leaveTypes.value.find(lt => lt._id === form.value.type_id) || null);
const selectedBalance = computed(() => allBalances.value.find(b => b.leave_type_id === form.value.type_id) || null);

const isFormValid = computed(() => {
  return form.value.type_id && form.value.start_date && form.value.end_date && form.value.reason.trim() && workingDays.value > 0;
});

function countWeekdays(start, end) {
  let count = 0;
  const cur = new Date(start);
  const endD = new Date(end);
  while (cur <= endD) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function calcDays() {
  if (form.value.start_date && form.value.end_date) {
    workingDays.value = countWeekdays(form.value.start_date, form.value.end_date);
  } else {
    workingDays.value = null;
  }
}

function onLeaveTypeChange() {
  errorMsg.value = '';
}

function resetForm() {
  form.value = { type_id: '', start_date: '', end_date: '', is_paid: true, reason: '' };
  workingDays.value = null;
  successMsg.value = '';
  errorMsg.value = '';
}

async function submitLeave() {
  if (!isFormValid.value) return;
  submitting.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await api.post('/leave-requests', {
      user_id: user.value._id,
      type_id: form.value.type_id,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      is_paid: form.value.is_paid,
      reason: form.value.reason
    });
    successMsg.value = 'Leave request submitted successfully! It is now pending admin approval.';
    resetForm();
    // Refresh balances
    await loadUserBalances();
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Failed to submit leave request.';
  } finally {
    submitting.value = false;
  }
}

async function loadUserBalances() {
  try {
    const res = await api.get(`/users/${user.value._id}`);
    allBalances.value = res.data.data.leave_balances.map(b => ({
      ...b,
      color: leaveTypes.value.find(lt => lt._id === b.leave_type_id?.toString())?.color_code || '#4F46E5'
    }));
  } catch {}
}

onMounted(async () => {
  try {
    const res = await api.get('/leave-types');
    leaveTypes.value = res.data.data;
  } catch {}
  if (user.value) {
    await loadUserBalances();
  }
});
</script>

<style scoped>
.days-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--primary-light);
  border-radius: var(--radius);
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--primary);
  border: 1px solid rgba(79,70,229,0.2);
}

.balance-type-name {
  font-size: 16px;
  font-weight: 700;
}

.remaining-big {
  font-size: 32px;
  font-weight: 700;
}

.mini-stat {
  text-align: center;
  padding: 10px;
  background: var(--bg);
  border-radius: var(--radius);
}

.mini-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.mini-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mini-balance-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
}

.mini-balance-row:last-child {
  border-bottom: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bal-name {
  flex: 1;
  color: var(--text);
  font-weight: 500;
}

.bal-rem {
  font-weight: 600;
  font-size: 12px;
}

@media (max-width: 900px) {
  .apply-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
