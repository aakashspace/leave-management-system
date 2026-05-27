<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Reports & Analytics</h1>
        <p>Insights into leave patterns across the organisation.</p>
      </div>
      <button class="btn btn-ghost" @click="loadAll">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        Refresh
      </button>
    </div>

    <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading reports...</div>

    <template v-else>
      <!-- Status Overview -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card" v-for="s in statusStats" :key="s.label">
          <div class="stat-icon" :class="s.color">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ s.count }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;" class="rep-grid">
        <!-- Leaves by Type -->
        <div class="card">
          <div class="card-header"><h3>Leaves by Type</h3></div>
          <div class="card-body">
            <div v-if="leavesByType.length === 0" class="text-muted text-sm">No data yet.</div>
            <div v-else class="bar-chart">
              <div v-for="item in leavesByType" :key="item._id" class="bar-item">
                <div class="bar-label">{{ item._id || 'Unknown' }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      width: maxTypeCount > 0 ? (item.count / maxTypeCount * 100) + '%' : '0%',
                      background: leaveTypeColor(item._id)
                    }"
                  ></div>
                </div>
                <div class="bar-value">{{ item.count }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Leaves by Status -->
        <div class="card">
          <div class="card-header"><h3>Leaves by Status</h3></div>
          <div class="card-body">
            <div v-if="leavesByStatus.length === 0" class="text-muted text-sm">No data yet.</div>
            <div v-else>
              <div class="status-blocks">
                <div v-for="item in leavesByStatus" :key="item._id" class="status-block" :class="'status-' + item._id">
                  <div class="sb-count">{{ item.count }}</div>
                  <div class="sb-label">{{ item._id }}</div>
                  <div class="sb-bar">
                    <div
                      class="sb-fill"
                      :style="{
                        width: totalLeaves > 0 ? (item.count / totalLeaves * 100) + '%' : '0%'
                      }"
                    ></div>
                  </div>
                  <div class="sb-pct">{{ totalLeaves > 0 ? Math.round(item.count / totalLeaves * 100) : 0 }}%</div>
                </div>
              </div>

              <!-- Mini doughnut-style display -->
              <div class="status-legend">
                <div v-for="item in leavesByStatus" :key="item._id + '-leg'" class="stat-legend-item">
                  <span class="leg-dot" :class="'dot-' + item._id"></span>
                  <span>{{ item._id }}: <strong>{{ item.count }}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Leaves by Department -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header"><h3>Leaves by Department</h3></div>
        <div class="card-body">
          <div v-if="deptStats.length === 0" class="text-muted text-sm">No department data yet.</div>
          <div v-else class="bar-chart">
            <div v-for="item in deptStats" :key="item._id" class="bar-item">
              <div class="bar-label">{{ item._id }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: maxDeptCount > 0 ? (item.totalRequests / maxDeptCount * 100) + '%' : '0%',
                    background: '#4F46E5'
                  }"
                ></div>
              </div>
              <div class="bar-value">{{ item.totalRequests }} requests · {{ item.totalDays }} days</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Stats Table -->
      <div class="card">
        <div class="card-header"><h3>Employee Leave Summary</h3></div>
        <div v-if="employeeStats.length === 0" class="empty-state">
          <h3>No data yet</h3>
          <p>Submit some leave requests to see stats here.</p>
        </div>
        <div v-else class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Total Requests</th>
                <th>Total Days</th>
                <th>Approved</th>
                <th>Approval Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(emp, idx) in employeeStats" :key="emp._id">
                <td class="text-muted">{{ idx + 1 }}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar" style="width: 30px; height: 30px; font-size: 11px; background: #4F46E5;">
                      {{ emp.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }}
                    </div>
                    <span style="font-weight: 500;">{{ emp.name }}</span>
                  </div>
                </td>
                <td>{{ emp.totalRequests }}</td>
                <td>{{ emp.totalDays }}</td>
                <td>{{ emp.approved }}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="progress-bar" style="width: 80px;">
                      <div
                        class="progress-fill"
                        :style="{
                          width: emp.totalRequests > 0 ? (emp.approved / emp.totalRequests * 100) + '%' : '0%',
                          background: '#10B981'
                        }"
                      ></div>
                    </div>
                    <span class="text-sm">{{ emp.totalRequests > 0 ? Math.round(emp.approved / emp.totalRequests * 100) : 0 }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../api/axios';

const loading = ref(true);
const leavesByType = ref([]);
const leavesByStatus = ref([]);
const employeeStats = ref([]);
const deptStats = ref([]);
const leaveTypeColors = ref({});

const maxDeptCount = computed(() => Math.max(...deptStats.value.map(i => i.totalRequests), 1));

const totalLeaves = computed(() => leavesByStatus.value.reduce((s, i) => s + i.count, 0));
const maxTypeCount = computed(() => Math.max(...leavesByType.value.map(i => i.count), 1));

const statusStats = computed(() => {
  const statusMap = { pending: 0, approved: 0, rejected: 0 };
  leavesByStatus.value.forEach(s => { statusMap[s._id] = s.count; });
  return [
    { label: 'Pending', count: statusMap.pending, color: 'yellow' },
    { label: 'Approved', count: statusMap.approved, color: 'green' },
    { label: 'Rejected', count: statusMap.rejected, color: 'red' },
    { label: 'Total', count: totalLeaves.value, color: 'blue' },
  ];
});

function leaveTypeColor(name) {
  return leaveTypeColors.value[name] || '#4F46E5';
}

async function loadAll() {
  loading.value = true;
  try {
    const [ltRes, statsRes, empRes, deptRes] = await Promise.all([
      api.get('/leave-types'),
      api.get('/reports/leave-stats'),
      api.get('/reports/employee-stats'),
      api.get('/reports/dept-stats')
    ]);
    ltRes.data.data.forEach(lt => { leaveTypeColors.value[lt.name] = lt.color_code; });
    leavesByType.value = statsRes.data.data.byType || [];
    leavesByStatus.value = statsRes.data.data.byStatus || [];
    employeeStats.value = empRes.data.data || [];
    deptStats.value = deptRes.data.data || [];
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

onMounted(loadAll);
</script>

<style scoped>
.status-blocks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.status-block {
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  text-align: center;
}

.status-pending { border-color: #FDE68A; background: #FFFBEB; }
.status-approved { border-color: #A7F3D0; background: #F0FDF4; }
.status-rejected { border-color: #FECACA; background: #FFF5F5; }

.sb-count {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.sb-label {
  font-size: 12px;
  text-transform: capitalize;
  color: var(--text-muted);
  margin: 4px 0 8px;
}

.sb-bar {
  height: 4px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 4px;
}

.sb-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--primary);
  transition: width 0.5s ease;
}

.status-pending .sb-fill { background: var(--warning); }
.status-approved .sb-fill { background: var(--success); }
.status-rejected .sb-fill { background: var(--danger); }

.sb-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.status-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.stat-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.leg-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-pending { background: var(--warning); }
.dot-approved { background: var(--success); }
.dot-rejected { background: var(--danger); }

@media (max-width: 768px) {
  .rep-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
