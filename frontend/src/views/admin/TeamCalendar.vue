<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Team Calendar</h1>
        <p>Team-wide view of all approved leave requests.</p>
      </div>
      <!-- Department filter -->
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <select v-model="filterDept" class="form-control" style="width: 180px; font-size: 13px;">
          <option value="">All Departments</option>
          <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.dept_name }}</option>
        </select>
      </div>
    </div>

    <div class="card">
      <!-- Month navigation -->
      <div class="card-header">
        <button class="btn btn-ghost btn-sm" @click="prevMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
        </button>
        <h2 style="font-size: 18px; font-weight: 700;">{{ monthName }} {{ year }}</h2>
        <button class="btn btn-ghost btn-sm" @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </button>
      </div>

      <div class="card-body">
        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div> Loading calendar...
        </div>

        <template v-else>
          <!-- Day headers -->
          <div class="calendar-grid" style="margin-bottom: 8px;">
            <div v-for="d in dayHeaders" :key="d" class="calendar-day-header">{{ d }}</div>
          </div>

          <!-- Calendar days -->
          <div class="calendar-grid">
            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              class="calendar-day"
              :class="{
                'other-month': !day.currentMonth,
                'today': day.isToday,
                'has-leave': day.leaves.length > 0
              }"
            >
              <div class="day-num">{{ day.date }}</div>
              <div class="day-leaves">
                <div
                  v-for="leave in day.leaves.slice(0, 3)"
                  :key="leave._id"
                  class="day-tag"
                  :style="{ background: leave.color + '22', borderLeft: '3px solid ' + leave.color, color: leave.color }"
                  :title="leave.employeeName + ' — ' + leave.leave_type_name"
                >
                  <span class="day-tag-name">{{ leave.shortName }}</span>
                </div>
                <div v-if="day.leaves.length > 3" class="day-more">+{{ day.leaves.length - 3 }} more</div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div v-if="activeLeaveTypes.length" class="legend">
            <div class="legend-title">Leave Types</div>
            <div class="legend-items">
              <div v-for="lt in activeLeaveTypes" :key="lt.name" class="legend-item">
                <span class="legend-dot" :style="{ background: lt.color }"></span>
                <span>{{ lt.name }}</span>
              </div>
            </div>
          </div>

          <!-- Approved leaves this month list -->
          <div v-if="leavesThisMonth.length" class="upcoming">
            <div class="upcoming-title">
              Approved Leaves — {{ monthName }} {{ year }}
              <span class="badge-count">{{ leavesThisMonth.length }}</span>
            </div>
            <div class="leave-list-grid">
              <div v-for="leave in leavesThisMonth" :key="leave._id" class="leave-list-item">
                <div class="leave-avatar" :style="{ background: leave.color + '22', color: leave.color }">
                  {{ leave.initials }}
                </div>
                <div class="leave-info">
                  <div class="leave-emp-name">{{ leave.employeeName }}</div>
                  <div class="leave-type-label" :style="{ color: leave.color }">{{ leave.leave_type_name }}</div>
                  <div class="leave-dates text-muted text-sm">
                    {{ formatDate(leave.start_date) }} – {{ formatDate(leave.end_date) }}
                    · {{ leave.total_days }} day{{ leave.total_days !== 1 ? 's' : '' }}
                    <span v-if="!leave.is_paid" class="unpaid-tag">Unpaid</span>
                  </div>
                  <div v-if="leave.dept_name" class="leave-dept text-muted text-sm">{{ leave.dept_name }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state" style="padding: 40px 0; text-align: center; color: var(--text-muted);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 8px;">
              <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
            </svg>
            <p>No approved leaves for {{ monthName }} {{ year }}</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../api/axios';

const loading = ref(true);
const allLeaves = ref([]);
const leaveTypeColors = ref({});
const departments = ref([]);
const filterDept = ref('');

const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const monthName = computed(() => monthNames[currentMonth.value]);
const year = computed(() => currentYear.value);
const month = computed(() => currentMonth.value);

// Leaves enriched with color and employee info
const enrichedLeaves = computed(() => {
  return allLeaves.value
    .filter(l => l.status === 'approved')
    .filter(l => {
      if (!filterDept.value) return true;
      const deptId = l.user_id?.dept_id?._id || l.user_id?.dept_id;
      return String(deptId) === String(filterDept.value);
    })
    .map(l => ({
      ...l,
      color: leaveTypeColors.value[l.leave_type_name] || '#4F46E5',
      employeeName: l.user_id?.name || 'Unknown',
      dept_name: l.user_id?.dept_id?.dept_name || l.user_id?.dept_id || '',
      shortName: (l.user_id?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
      initials: (l.user_id?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
    }));
});

const leavesThisMonth = computed(() => {
  return enrichedLeaves.value.filter(l => {
    const s = new Date(l.start_date);
    const e = new Date(l.end_date);
    const monthStart = new Date(year.value, month.value, 1);
    const monthEnd = new Date(year.value, month.value + 1, 0);
    return s <= monthEnd && e >= monthStart;
  });
});

const activeLeaveTypes = computed(() => {
  const map = {};
  enrichedLeaves.value.forEach(l => {
    if (!map[l.leave_type_name]) {
      map[l.leave_type_name] = { name: l.leave_type_name, color: l.color };
    }
  });
  return Object.values(map);
});

const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(year.value, month.value, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const prevMonthEnd = new Date(year.value, month.value, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: prevMonthEnd - i, currentMonth: false, isToday: false, leaves: [] });
  }

  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = new Date(year.value, month.value, d);
    const isToday = fullDate.toDateString() === today.toDateString();
    const dayLeaves = enrichedLeaves.value.filter(l => {
      const s = new Date(l.start_date); s.setHours(0, 0, 0, 0);
      const e = new Date(l.end_date); e.setHours(23, 59, 59, 999);
      return fullDate >= s && fullDate <= e;
    });
    days.push({ date: d, currentMonth: true, isToday, leaves: dayLeaves });
  }

  let nextD = 1;
  while (days.length < 42) {
    days.push({ date: nextD++, currentMonth: false, isToday: false, leaves: [] });
  }
  return days;
});

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; }
  else currentMonth.value--;
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; }
  else currentMonth.value++;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

onMounted(async () => {
  try {
    const [ltRes, lRes, deptRes] = await Promise.all([
      api.get('/leave-types/all'),
      api.get('/leave-requests/all'),
      api.get('/departments')
    ]);
    ltRes.data.data.forEach(lt => { leaveTypeColors.value[lt.name] = lt.color_code; });
    allLeaves.value = lRes.data.data;
    departments.value = deptRes.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.calendar-day {
  min-height: 80px;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
  overflow: hidden;
}

.calendar-day.has-leave {
  background: rgba(79, 70, 229, 0.03);
}

.calendar-day:hover {
  background: var(--bg);
}

.day-leaves {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}

.day-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.day-tag-name {
  font-size: 10px;
}

.day-more {
  font-size: 10px;
  color: var(--text-muted);
  padding-left: 4px;
}

.legend {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.legend-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.upcoming {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.upcoming-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-count {
  background: #4F46E5;
  color: #fff;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.leave-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.leave-list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg, #fff);
}

.leave-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.leave-info {
  flex: 1;
  min-width: 0;
}

.leave-emp-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 2px;
}

.leave-type-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.leave-dates {
  line-height: 1.4;
}

.leave-dept {
  margin-top: 2px;
}

.unpaid-tag {
  display: inline-block;
  background: #FEF3C7;
  color: #92400E;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 4px;
}
</style>
