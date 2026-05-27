<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Departments</h1>
        <p>Manage organisational departments.</p>
      </div>
      <button class="btn btn-primary" @click="openAdd">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add Department
      </button>
    </div>

    <!-- Inline Add Form -->
    <div v-if="showAddForm" class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <h3>{{ editingDept ? 'Edit Department' : 'New Department' }}</h3>
        <button class="modal-close" @click="closeForm">×</button>
      </div>
      <div class="card-body">
        <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
        <div style="display: flex; gap: 12px; align-items: flex-end;">
          <div class="form-group" style="margin-bottom: 0; flex: 1;">
            <label>Department Name *</label>
            <input v-model="formName" class="form-control" placeholder="e.g. Engineering" @keyup.enter="saveDept" />
          </div>
          <button class="btn btn-primary" @click="saveDept" :disabled="saving">
            {{ saving ? 'Saving...' : (editingDept ? 'Update' : 'Create') }}
          </button>
          <button class="btn btn-ghost" @click="closeForm">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading departments...</div>

    <div v-else class="dept-grid">
      <div v-for="dept in departments" :key="dept._id" class="dept-card card">
        <div class="dept-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </div>
        <div class="dept-info">
          <div class="dept-name">{{ dept.dept_name }}</div>
          <div class="dept-meta text-muted text-sm">Created {{ formatDate(dept.createdAt) }}</div>
        </div>
        <div class="dept-actions">
          <button class="btn btn-ghost btn-sm" @click="openEdit(dept)">Edit</button>
          <button class="btn btn-danger btn-sm" @click="confirmDelete(dept)">Delete</button>
        </div>
      </div>

      <div v-if="departments.length === 0" class="empty-state" style="grid-column: 1 / -1;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12z"/></svg>
        <h3>No departments yet</h3>
        <p>Add your first department to get started.</p>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Delete Department</h3>
          <button class="modal-close" @click="showDeleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ pendingDelete?.dept_name }}</strong>?</p>
          <p class="text-sm text-muted" style="margin-top: 6px;">Users assigned to this department will lose their department association.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">Cancel</button>
          <button class="btn btn-danger" @click="deleteDept">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const departments = ref([]);
const loading = ref(true);
const showAddForm = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const formError = ref('');
const formName = ref('');
const editingDept = ref(null);
const pendingDelete = ref(null);

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadDepts() {
  loading.value = true;
  try {
    const res = await api.get('/departments');
    departments.value = res.data.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function openAdd() {
  editingDept.value = null;
  formName.value = '';
  formError.value = '';
  showAddForm.value = true;
}

function openEdit(dept) {
  editingDept.value = dept;
  formName.value = dept.dept_name;
  formError.value = '';
  showAddForm.value = true;
}

function closeForm() {
  showAddForm.value = false;
  editingDept.value = null;
  formName.value = '';
  formError.value = '';
}

async function saveDept() {
  formError.value = '';
  if (!formName.value.trim()) { formError.value = 'Department name is required.'; return; }
  saving.value = true;
  try {
    if (editingDept.value) {
      await api.put(`/departments/${editingDept.value._id}`, { dept_name: formName.value.trim() });
    } else {
      await api.post('/departments', { dept_name: formName.value.trim() });
    }
    closeForm();
    await loadDepts();
  } catch (e) {
    formError.value = e.response?.data?.message || 'Failed to save department.';
  } finally { saving.value = false; }
}

function confirmDelete(dept) {
  pendingDelete.value = dept;
  showDeleteModal.value = true;
}

async function deleteDept() {
  try {
    await api.delete(`/departments/${pendingDelete.value._id}`);
    showDeleteModal.value = false;
    await loadDepts();
  } catch (e) { alert(e.response?.data?.message || 'Error deleting.'); }
}

onMounted(loadDepts);
</script>

<style scoped>
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.dept-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  transition: var(--transition);
}

.dept-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.dept-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dept-info {
  flex: 1;
  min-width: 0;
}

.dept-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.dept-meta {
  margin-top: 2px;
}

.dept-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
</style>
