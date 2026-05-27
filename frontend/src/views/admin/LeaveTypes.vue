<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Leave Types</h1>
        <p>Manage leave categories and their entitlements.</p>
      </div>
      <button class="btn btn-primary" @click="openAdd">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add Leave Type
      </button>
    </div>

    <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading...</div>

    <div v-else class="lt-grid">
      <div v-for="lt in leaveTypes" :key="lt._id" class="lt-card">
        <div class="lt-color-bar" :style="{ background: lt.color_code }"></div>
        <div class="lt-body">
          <div class="lt-header">
            <div class="lt-dot-name">
              <span class="lt-dot" :style="{ background: lt.color_code }"></span>
              <h3>{{ lt.name }}</h3>
            </div>
            <span class="badge" :class="lt.is_active ? 'badge-green' : 'badge-gray'">
              {{ lt.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="lt-days">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" :style="{ color: lt.color_code }">
              <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
            </svg>
            <span><strong>{{ lt.max_paid_days }}</strong> max paid days per year</span>
          </div>
          <div class="lt-color-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: var(--text-muted)">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            {{ lt.color_code }}
          </div>
          <div class="lt-actions">
            <button class="btn btn-outline btn-sm" @click="openEdit(lt)">Edit</button>
            <button v-if="lt.is_active" class="btn btn-danger btn-sm" @click="deactivate(lt)">Deactivate</button>
          </div>
        </div>
      </div>

      <div v-if="leaveTypes.length === 0" class="empty-state" style="grid-column: 1/-1;">
        <h3>No leave types found</h3>
        <p>Create your first leave type to get started.</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingLt ? 'Edit Leave Type' : 'Add Leave Type' }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>
          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.name" class="form-control" placeholder="e.g. Annual Leave" />
          </div>
          <div class="form-group">
            <label>Max Paid Days *</label>
            <input v-model.number="form.max_paid_days" class="form-control" type="number" min="1" placeholder="e.g. 15" />
          </div>
          <div class="form-group">
            <label>Color Code</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input v-model="form.color_code" class="form-control" placeholder="#3B82F6" />
              <input type="color" v-model="form.color_code" style="width: 44px; height: 38px; border: 1px solid var(--border); border-radius: var(--radius); padding: 2px; cursor: pointer;" />
            </div>
          </div>
          <div class="color-preview" :style="{ background: form.color_code + '22', borderColor: form.color_code }">
            <span :style="{ color: form.color_code, fontWeight: 600 }">Preview: {{ form.name || 'Leave Type' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveLeaveType" :disabled="saving">
            {{ saving ? 'Saving...' : (editingLt ? 'Save Changes' : 'Add Leave Type') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const leaveTypes = ref([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const modalError = ref('');
const editingLt = ref(null);

const form = ref({ name: '', max_paid_days: '', color_code: '#3B82F6' });

async function loadLeaveTypes() {
  loading.value = true;
  try {
    const res = await api.get('/leave-types/all');
    leaveTypes.value = res.data.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function openAdd() {
  editingLt.value = null;
  form.value = { name: '', max_paid_days: '', color_code: '#3B82F6' };
  modalError.value = '';
  showModal.value = true;
}

function openEdit(lt) {
  editingLt.value = lt;
  form.value = { name: lt.name, max_paid_days: lt.max_paid_days, color_code: lt.color_code };
  modalError.value = '';
  showModal.value = true;
}

async function saveLeaveType() {
  modalError.value = '';
  if (!form.value.name || !form.value.max_paid_days) {
    modalError.value = 'Name and max days are required.';
    return;
  }
  saving.value = true;
  try {
    if (editingLt.value) {
      await api.put(`/leave-types/${editingLt.value._id}`, form.value);
    } else {
      await api.post('/leave-types', form.value);
    }
    showModal.value = false;
    await loadLeaveTypes();
  } catch (e) {
    modalError.value = e.response?.data?.message || 'Failed to save.';
  } finally { saving.value = false; }
}

async function deactivate(lt) {
  if (!confirm(`Deactivate "${lt.name}"? Employees won't be able to apply for this leave.`)) return;
  try {
    await api.delete(`/leave-types/${lt._id}`);
    await loadLeaveTypes();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

onMounted(loadLeaveTypes);
</script>

<style scoped>
.lt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lt-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: var(--transition);
}

.lt-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.lt-color-bar {
  height: 5px;
}

.lt-body {
  padding: 20px;
}

.lt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.lt-dot-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lt-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lt-dot-name h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.lt-days {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 8px;
}

.lt-color-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 16px;
  font-family: monospace;
}

.lt-actions {
  display: flex;
  gap: 8px;
}

.color-preview {
  border: 1px solid;
  border-radius: var(--radius);
  padding: 10px 14px;
  margin-top: 4px;
  font-size: 14px;
}
</style>
