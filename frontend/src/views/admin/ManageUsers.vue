<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Manage Users</h1>
        <p>View, approve, and manage employee accounts.</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add New User
      </button>
    </div>

    <!-- Filters -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
      <div class="filter-tabs">
        <button v-for="tab in statusTabs" :key="tab.value" class="filter-tab" :class="{ active: activeStatus === tab.value }" @click="activeStatus = tab.value">
          {{ tab.label }}
        </button>
      </div>
      <select v-model="filterDept" class="form-control" style="width: 180px;">
        <option value="">All Departments</option>
        <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.dept_name }}</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-spinner" style="padding: 32px;"><div class="spinner"></div> Loading users...</div>
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        <h3>No users found</h3>
        <p>Try changing the filters.</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u._id">
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="user-avatar" style="width: 32px; height: 32px; font-size: 12px;" :style="{ background: u.role === 'admin' ? '#7C3AED' : '#4F46E5' }">
                    {{ u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }}
                  </div>
                  <span style="font-weight: 500;">{{ u.name }}</span>
                </div>
              </td>
              <td class="text-muted text-sm">{{ u.email }}</td>
              <td>{{ u.dept_id?.dept_name || '—' }}</td>
              <td>
                <span class="badge" :class="u.role === 'admin' ? 'badge-purple' : 'badge-blue'">{{ u.role }}</span>
              </td>
              <td>
                <span class="badge" :class="'badge-' + u.status">{{ u.status }}</span>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button v-if="u.status === 'pending'" class="btn btn-success btn-sm" @click="approveUser(u)">Approve</button>
                  <button v-if="u.status === 'pending'" class="btn btn-danger btn-sm" @click="rejectUser(u)">Reject</button>
                  <button class="btn btn-ghost btn-sm" @click="editUser(u)">Edit</button>
                  <button class="btn btn-danger btn-sm" @click="confirmDelete(u)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Add New User</h3>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="addError" class="alert alert-danger">{{ addError }}</div>
          <div class="form-group">
            <label>Full Name *</label>
            <input v-model="addForm.name" class="form-control" placeholder="John Doe" />
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input v-model="addForm.email" class="form-control" type="email" placeholder="john@lms.com" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="addForm.role" class="form-control">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model="addForm.dept_id" class="form-control">
              <option value="">Select department</option>
              <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.dept_name }}</option>
            </select>
          </div>
          <div v-if="addForm.role === 'employee'" class="form-hint" style="margin-bottom: 8px;">
            Employee will be <strong>pending approval</strong> until approved by admin.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showAddModal = false">Cancel</button>
          <button class="btn btn-primary" @click="addUser" :disabled="addingUser">
            {{ addingUser ? 'Adding...' : 'Add User' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Edit User</h3>
          <button class="modal-close" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="editForm.name" class="form-control" />
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model="editForm.dept_id" class="form-control">
              <option value="">No department</option>
              <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.dept_name }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showEditModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveEdit">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Delete User</h3>
          <button class="modal-close" @click="showDeleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ pendingDelete?.name }}</strong>? This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">Cancel</button>
          <button class="btn btn-danger" @click="deleteUser">Delete User</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../api/axios';

const users = ref([]);
const departments = ref([]);
const loading = ref(true);
const activeStatus = ref('all');
const filterDept = ref('');

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const addError = ref('');
const addingUser = ref(false);
const pendingDelete = ref(null);
const editingUser = ref(null);

const addForm = ref({ name: '', email: '', role: 'employee', dept_id: '' });
const editForm = ref({ name: '', dept_id: '' });

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const filteredUsers = computed(() => {
  let list = users.value;
  if (activeStatus.value !== 'all') list = list.filter(u => u.status === activeStatus.value);
  if (filterDept.value) list = list.filter(u => u.dept_id?._id === filterDept.value || u.dept_id === filterDept.value);
  return list;
});

async function loadData() {
  loading.value = true;
  try {
    const [uRes, dRes] = await Promise.all([api.get('/users'), api.get('/departments')]);
    users.value = uRes.data.data;
    departments.value = dRes.data.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function approveUser(u) {
  try { await api.put(`/users/${u._id}/approve`); await loadData(); }
  catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function rejectUser(u) {
  try { await api.put(`/users/${u._id}/reject`); await loadData(); }
  catch (e) { alert(e.response?.data?.message || 'Error'); }
}

function editUser(u) {
  editingUser.value = u;
  editForm.value = { name: u.name, dept_id: u.dept_id?._id || '' };
  showEditModal.value = true;
}

async function saveEdit() {
  try {
    await api.put(`/users/${editingUser.value._id}`, editForm.value);
    showEditModal.value = false;
    await loadData();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

function confirmDelete(u) {
  pendingDelete.value = u;
  showDeleteModal.value = true;
}

async function deleteUser() {
  try {
    await api.delete(`/users/${pendingDelete.value._id}`);
    showDeleteModal.value = false;
    await loadData();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function addUser() {
  addError.value = '';
  if (!addForm.value.name || !addForm.value.email) { addError.value = 'Name and email are required.'; return; }
  addingUser.value = true;
  try {
    await api.post('/users', addForm.value);
    showAddModal.value = false;
    addForm.value = { name: '', email: '', role: 'employee', dept_id: '' };
    await loadData();
  } catch (e) {
    addError.value = e.response?.data?.message || 'Failed to add user.';
  } finally { addingUser.value = false; }
}

onMounted(loadData);
</script>
