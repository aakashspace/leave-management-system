<template>
  <div>
    <div class="page-header">
      <div>
        <h1>My Profile</h1>
        <p>View and update your personal details.</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px;" class="profile-grid">

      <!-- Profile Card -->
      <div class="card" style="height: fit-content;">
        <div class="card-body" style="text-align: center; padding: 32px 24px;">
          <div class="profile-avatar" :style="{ background: avatarColor }">
            {{ initials }}
          </div>
          <h2 style="margin: 16px 0 4px; font-size: 18px;">{{ user?.name }}</h2>
          <p class="text-muted text-sm" style="margin-bottom: 12px;">{{ user?.email }}</p>
          <span class="badge badge-blue" style="text-transform: capitalize;">{{ user?.role }}</span>

          <div class="profile-info-list">
            <div class="profile-info-item">
              <span class="text-muted text-sm">Department</span>
              <span style="font-weight: 500;">{{ user?.dept_id?.dept_name || '—' }}</span>
            </div>
            <div class="profile-info-item">
              <span class="text-muted text-sm">Status</span>
              <span class="badge badge-green">{{ user?.status }}</span>
            </div>
            <div class="profile-info-item">
              <span class="text-muted text-sm">Member Since</span>
              <span style="font-weight: 500;">{{ formatDate(user?.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="card">
        <div class="card-header">
          <h3>Edit Profile</h3>
        </div>
        <div class="card-body">
          <div v-if="successMsg" class="alert alert-success" style="margin-bottom: 20px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.58L18 8l-8 8z"/></svg>
            {{ successMsg }}
          </div>

          <div v-if="errorMsg" class="error-msg" style="margin-bottom: 16px;">{{ errorMsg }}</div>

          <div class="form-group">
            <label>Full Name <span style="color:var(--danger)">*</span></label>
            <input v-model="form.name" class="form-control" placeholder="Your full name" />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input :value="user?.email" class="form-control" disabled style="background: var(--bg); color: var(--text-muted); cursor: not-allowed;" />
            <small class="text-muted" style="font-size: 12px;">Email cannot be changed.</small>
          </div>

          <div class="form-group">
            <label>Department</label>
            <select v-model="form.dept_id" class="form-control">
              <option value="">— No Department —</option>
              <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.dept_name }}</option>
            </select>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button class="btn btn-primary" @click="handleSave" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button class="btn btn-ghost" @click="resetForm">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Leave Balance Summary -->
    <div class="card" style="margin-top: 24px;">
      <div class="card-header"><h3>Leave Balance Summary</h3></div>
      <div class="card-body">
        <div v-if="!user?.leave_balances?.length" class="text-muted text-sm">No leave balances found.</div>
        <div v-else class="balance-grid">
          <div v-for="b in user.leave_balances" :key="b.leave_type_id" class="balance-card">
            <div class="balance-name">{{ b.leave_type_name }}</div>
            <div class="balance-numbers">
              <span class="balance-remaining">{{ b.remaining_days }}</span>
              <span class="balance-total">/ {{ b.total_days }} days</span>
            </div>
            <div class="progress-bar" style="margin-top: 10px;">
              <div
                class="progress-fill"
                :style="{
                  width: b.total_days > 0 ? (b.remaining_days / b.total_days * 100) + '%' : '0%',
                  background: b.remaining_days > b.total_days * 0.5 ? 'var(--success)' : b.remaining_days > 0 ? 'var(--warning)' : 'var(--danger)'
                }"
              ></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
              <span>Used: {{ b.used_days }}</span>
              <span>Remaining: {{ b.remaining_days }}</span>
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

const departments = ref([]);
const saving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const form = ref({ name: '', dept_id: '' });

const initials = computed(() => {
  if (!user.value) return '?';
  return user.value.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

const avatarColor = computed(() => {
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  if (!user.value) return colors[0];
  return colors[user.value.name.charCodeAt(0) % colors.length];
});

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function resetForm() {
  form.value.name = user.value?.name || '';
  form.value.dept_id = user.value?.dept_id?._id || user.value?.dept_id || '';
  successMsg.value = '';
  errorMsg.value = '';
}

async function handleSave() {
  successMsg.value = '';
  errorMsg.value = '';
  if (!form.value.name.trim()) return (errorMsg.value = 'Name is required.');
  saving.value = true;
  try {
    const res = await api.put(`/users/${user.value._id}`, {
      name: form.value.name.trim(),
      dept_id: form.value.dept_id || undefined
    });
    // Update store with new data
    store.setUser({ ...user.value, name: res.data.data.name, dept_id: res.data.data.dept_id });
    successMsg.value = 'Profile updated successfully!';
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Failed to update profile.';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  resetForm();
  try {
    const res = await api.get('/departments');
    departments.value = res.data.data;
  } catch (e) { console.error(e); }
});
</script>

<style scoped>
.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto;
}

.profile-info-list {
  margin-top: 24px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.profile-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.alert-success {
  background: #F0FDF4;
  color: #065F46;
  border: 1px solid #A7F3D0;
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.balance-card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
}

.balance-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.balance-numbers {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.balance-remaining {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.balance-total {
  font-size: 13px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
