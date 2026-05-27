<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo / Brand -->
      <div class="auth-header">
        <div class="auth-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
          </svg>
        </div>
        <h1>Leave Management System</h1>
        <p>IGNOU BCA — BCSP-064 Project</p>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs">
        <button :class="['tab-btn', { active: activeTab === 'login' }]" @click="switchTab('login')">Login</button>
        <button :class="['tab-btn', { active: activeTab === 'register' }]" @click="switchTab('register')">Register</button>
      </div>

      <!-- LOGIN FORM -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            v-model="loginForm.email"
            type="email"
            class="form-control"
            placeholder="Enter your email"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-with-icon">
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>

        <p class="auth-hint">
          Default admin: <strong>admin@lms.com</strong> / <strong>Admin@123</strong>
        </p>
      </form>

      <!-- REGISTER FORM -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="auth-form">
        <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input v-model="regForm.name" type="text" class="form-control" placeholder="Enter your full name" required />
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input v-model="regForm.email" type="email" class="form-control" placeholder="Enter your email" required />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="regForm.password" type="password" class="form-control" placeholder="Create a password (min 6 chars)" required minlength="6" />
        </div>

        <div class="form-group">
          <label class="form-label">Department</label>
          <select v-model="regForm.dept_id" class="form-control" required>
            <option value="" disabled>Select department</option>
            <option v-for="dept in departments" :key="dept._id" :value="dept._id">
              {{ dept.dept_name }}
            </option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading">Registering...</span>
          <span v-else>Register</span>
        </button>

        <p class="auth-hint">After registration, an admin must approve your account before you can log in.</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../store/useAppStore';
import api from '../api/axios';

const router = useRouter();
const store = useAppStore();

const activeTab = ref('login');
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const showPassword = ref(false);
const departments = ref([]);

const loginForm = ref({ email: '', password: '' });
const regForm = ref({ name: '', email: '', password: '', dept_id: '' });

onMounted(async () => {
  // If already logged in, redirect
  if (store.token && store.currentUser) {
    redirectUser(store.currentUser.role);
    return;
  }
  // Load departments for registration form
  try {
    const res = await api.get('/departments');
    departments.value = res.data.data;
  } catch {
    // departments optional for login tab
  }
});

function switchTab(tab) {
  activeTab.value = tab;
  errorMsg.value = '';
  successMsg.value = '';
}

function redirectUser(role) {
  if (role === 'admin') router.push('/admin/dashboard');
  else router.push('/employee/dashboard');
}

async function handleLogin() {
  errorMsg.value = '';
  loading.value = true;
  try {
    const res = await api.post('/auth/login', {
      email: loginForm.value.email,
      password: loginForm.value.password
    });
    store.setAuth(res.data.user, res.data.token);
    redirectUser(res.data.user.role);
  } catch (err) {
    const msg = err.response?.data?.message || 'Login failed. Please try again.';
    errorMsg.value = msg;
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  errorMsg.value = '';
  successMsg.value = '';
  loading.value = true;
  try {
    await api.post('/users', {
      name: regForm.value.name,
      email: regForm.value.email,
      password: regForm.value.password,
      dept_id: regForm.value.dept_id,
      role: 'employee'
    });
    successMsg.value = 'Registration successful! Please wait for admin approval before logging in.';
    regForm.value = { name: '', email: '', password: '', dept_id: '' };
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #7C3AED 100%);
  padding: 24px 16px;
}

.auth-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.auth-header {
  background: linear-gradient(135deg, #312E81, #4F46E5);
  padding: 32px 32px 24px;
  text-align: center;
  color: white;
}

.auth-logo {
  width: 56px;
  height: 56px;
  background: rgba(255,255,255,0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.auth-header h1 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
  line-height: 1.3;
}

.auth-header p {
  font-size: 12px;
  opacity: 0.75;
  margin: 0;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
}

.tab-btn {
  flex: 1;
  padding: 14px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #4F46E5;
  border-bottom-color: #4F46E5;
  background: #F5F3FF;
}

.auth-form {
  padding: 28px 32px 32px;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  background: #fff;
}

.form-control:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input-with-icon {
  position: relative;
}

.input-with-icon .form-control {
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  padding: 2px;
}

.toggle-password:hover {
  color: #4F46E5;
}

.btn-primary {
  background: #4F46E5;
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  width: 100%;
  margin-top: 4px;
}

.btn-primary:hover:not(:disabled) {
  background: #4338CA;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-full { display: block; width: 100%; }

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.alert-danger {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.alert-success {
  background: #F0FDF4;
  color: #166534;
  border: 1px solid #BBF7D0;
}

.auth-hint {
  text-align: center;
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 16px;
  margin-bottom: 0;
  line-height: 1.5;
}
</style>
