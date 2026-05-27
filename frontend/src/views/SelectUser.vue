<template>
  <div class="select-user-page">
    <div class="select-card">
      <div class="card-header">
        <div class="logo">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="14" fill="white" fill-opacity="0.2"/>
            <path d="M26 10C17.163 10 10 17.163 10 26s7.163 16 16 16 16-7.163 16-16S34.837 10 26 10zm-2 22l-6-6 1.41-1.41L24 29.17l10.59-10.58L36 20l-12 12z" fill="white"/>
          </svg>
        </div>
        <h1>Leave Management System</h1>
        <p>IGNOU BCA Final Year Project</p>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: activeTab === 'login' }" @click="activeTab = 'login'">Select User</button>
        <button class="tab-btn" :class="{ active: activeTab === 'register' }" @click="activeTab = 'register'">Register</button>
      </div>

      <div class="card-body">
        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading users...</span>
        </div>

        <!-- SELECT USER TAB -->
        <template v-else-if="activeTab === 'login'">
          <div v-if="fetchError" class="alert alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {{ fetchError }}
          </div>

          <div class="form-group">
            <label>Select Your Account</label>
            <select v-model="selectedUserId" class="form-control">
              <option value="">— Select a user —</option>
              <optgroup label="👑 Admin" v-if="admins.length">
                <option v-for="u in admins" :key="u._id" :value="u._id">
                  {{ u.name }} (Admin)
                </option>
              </optgroup>
              <optgroup label="👤 Employees" v-if="employees.length">
                <option v-for="u in employees" :key="u._id" :value="u._id">
                  {{ u.name }} — {{ u.dept_id?.dept_name || 'No Department' }}
                </option>
              </optgroup>
            </select>
          </div>

          <div v-if="selectedUser" class="selected-preview">
            <div class="preview-avatar" :style="{ background: selectedUser.role === 'admin' ? '#4F46E5' : '#10B981' }">
              {{ initials(selectedUser.name) }}
            </div>
            <div>
              <div class="preview-name">{{ selectedUser.name }}</div>
              <div class="preview-meta">
                <span class="badge" :class="selectedUser.role === 'admin' ? 'badge-purple' : 'badge-blue'">
                  {{ selectedUser.role }}
                </span>
                <span v-if="selectedUser.dept_id" class="text-muted text-sm">
                  · {{ selectedUser.dept_id.dept_name }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="continueError" class="error-msg">{{ continueError }}</div>

          <button
            class="btn btn-primary btn-full btn-lg"
            @click="handleContinue"
            :disabled="!selectedUserId"
            style="margin-top: 8px;"
          >
            Continue →
          </button>

          <p class="select-hint">No login required — select any user to explore the system</p>
        </template>

        <!-- REGISTER TAB -->
        <template v-else>
          <div v-if="regSuccess" class="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.58L18 8l-8 8z"/></svg>
            Registration successful! Your account is <strong>pending admin approval</strong>. Ask the admin to approve your account.
          </div>

          <template v-else>
            <div v-if="regError" class="error-msg">{{ regError }}</div>

            <div class="form-group">
              <label>Full Name <span style="color:var(--danger)">*</span></label>
              <input v-model="regForm.name" class="form-control" placeholder="e.g. John Doe" />
            </div>

            <div class="form-group">
              <label>Email Address <span style="color:var(--danger)">*</span></label>
              <input v-model="regForm.email" type="email" class="form-control" placeholder="e.g. john@company.com" />
            </div>

            <div class="form-group">
              <label>Department</label>
              <select v-model="regForm.dept_id" class="form-control">
                <option value="">— Select department —</option>
                <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.dept_name }}</option>
              </select>
            </div>

            <button
              class="btn btn-primary btn-full btn-lg"
              @click="handleRegister"
              :disabled="regLoading"
              style="margin-top: 8px;"
            >
              {{ regLoading ? 'Registering...' : 'Register →' }}
            </button>

            <p class="select-hint">After registration, an admin must approve your account before you can log in.</p>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../store/useAppStore';
import api from '../api/axios';

const router = useRouter();
const store = useAppStore();

const activeTab = ref('login');
const users = ref([]);
const departments = ref([]);
const loading = ref(true);
const fetchError = ref('');
const continueError = ref('');
const selectedUserId = ref('');

// Registration state
const regForm = ref({ name: '', email: '', dept_id: '' });
const regLoading = ref(false);
const regError = ref('');
const regSuccess = ref(false);

const admins = computed(() => users.value.filter(u => u.role === 'admin'));
const employees = computed(() => users.value.filter(u => u.role === 'employee'));
const selectedUser = computed(() => users.value.find(u => u._id === selectedUserId.value) || null);

function initials(name) {
  return name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
}

onMounted(async () => {
  try {
    const [usersRes, deptsRes] = await Promise.all([
      api.get('/users?status=approved'),
      api.get('/departments')
    ]);
    users.value = usersRes.data.data;
    departments.value = deptsRes.data.data;
  } catch (e) {
    fetchError.value = 'Could not load users. Make sure the backend is running on port 5000.';
  } finally {
    loading.value = false;
  }
});

function handleContinue() {
  if (!selectedUserId.value) return;
  const user = selectedUser.value;
  if (!user) return;
  continueError.value = '';
  store.setUser(user);
  if (user.role === 'admin') {
    router.push('/admin/dashboard');
  } else {
    router.push('/employee/dashboard');
  }
}

async function handleRegister() {
  regError.value = '';
  if (!regForm.value.name.trim()) return (regError.value = 'Full name is required.');
  if (!regForm.value.email.trim()) return (regError.value = 'Email is required.');
  regLoading.value = true;
  try {
    await api.post('/users', {
      name: regForm.value.name.trim(),
      email: regForm.value.email.trim(),
      dept_id: regForm.value.dept_id || undefined,
      role: 'employee'
    });
    regSuccess.value = true;
  } catch (e) {
    regError.value = e.response?.data?.message || 'Registration failed. Try again.';
  } finally {
    regLoading.value = false;
  }
}
</script>

<style scoped>
.selected-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--primary-light);
  border-radius: var(--radius);
  margin-bottom: 16px;
  border: 1px solid rgba(79,70,229,0.15);
}

.preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.preview-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: #fff;
  border-bottom-color: #fff;
}

.tab-btn:hover:not(.active) {
  color: rgba(255,255,255,0.85);
}

.alert-success {
  background: #F0FDF4;
  color: #065F46;
  border: 1px solid #A7F3D0;
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.select-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 14px;
}
</style>
