<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Leave Calendar</h1>
        <p>Visual overview of your approved leaves.</p>
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
              :title="day.leaves.map(l => l.leave_type_name).join(', ')"
            >
              <div class="day-num">{{ day.date }}</div>
              <div style="display: flex; flex-wrap: wrap; gap: 2px; justify-content: center;">
                <div
                  v-for="leave in day.leaves.slice(0, 3)"
                  :key="leave._id"
                  class="day-dot"
                  :style="{ background: leave.color || '#4F46E5' }"
                  :title="leave.leave_type_name"
                ></div>
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

          <!-- Upcoming leaves list -->
          <div v-if="upcomingLeaves.length" class="upcoming">
            <div class="upcoming-title">Approved Leaves This Month</div>
            <div v-for="leave in upcomingLeaves" :key="leave._id" class="upcoming-item">
              <span class="upcoming-dot" :style="{ background: leave.color || '#4F46E5' }"></span>
              <div>
                <div style="font-weight: 500; font-size: 14px;">{{ leave.leave_type_name }}</div>
                <div class="text-muted text-sm">{{ formatDate(leave.start_date) }} – {{ formatDate(leave.end_date) }} · {{ leave.total_days }} day{{ leave.total_days !== 1 ? 's' : '' }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axios';

const store = useAppStore();
const user = computed(() => store.currentUser);

const loading = ref(true);
const leaves = ref([]);
const leaveTypeColors = ref({});

const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const monthName = computed(() => monthNames[currentMonth.value]);
const year = computed(() => currentYear.value);
const month = computed(() => currentMonth.value);

const approvedLeaves = computed(() => leaves.value.filter(l => l.status === 'approved'));

const upcomingLeaves = computed(() => {
  return approvedLeaves.value.filter(l => {
    const s = new Date(l.start_date);
    const e = new Date(l.end_date);
    return s.getMonth() === month.value && s.getFullYear() === year.value
      || e.getMonth() === month.value && e.getFullYear() === year.value;
  });
});

const activeLeaveTypes = computed(() => {
  const map = {};
  approvedLeaves.value.forEach(l => {
    if (!map[l.leave_type_name]) {
      map[l.leave_type_name] = { name: l.leave_type_name, color: l.color || '#4F46E5' };
    }
  });
  return Object.values(map);
});

const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(year.value, month.value, 1);
  // Monday = 0 offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  // Previous month fill
  const prevMonthEnd = new Date(year.value, month.value, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({
      date: prevMonthEnd - i,
      currentMonth: false,
      isToday: false,
      leaves: [],
      fullDate: null
    });
  }

  // Current month days
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = new Date(year.value, month.value, d);
    const isToday = fullDate.toDateString() === today.toDateString();
    const dayLeaves = approvedLeaves.value.filter(l => {
      const s = new Date(l.start_date);
      const e = new Date(l.end_date);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return fullDate >= s && fullDate <= e;
    }).map(l => ({ ...l, color: leaveTypeColors.value[l.leave_type_name] || '#4F46E5' }));

    days.push({ date: d, currentMonth: true, isToday, leaves: dayLeaves, fullDate });
  }

  // Fill to 42
  let nextD = 1;
  while (days.length < 42) {
    days.push({ date: nextD++, currentMonth: false, isToday: false, leaves: [] });
  }

  return days;
});

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

onMounted(async () => {
  try {
    const [ltRes, lRes] = await Promise.all([
      api.get('/leave-types'),
      api.get(`/leave-requests/my/${user.value._id}`)
    ]);
    ltRes.data.data.forEach(lt => { leaveTypeColors.value[lt.name] = lt.color_code; });
    leaves.value = lRes.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.calendar-day {
  min-height: 52px;
  padding: 6px 4px;
  border-radius: 6px;
  transition: background 0.15s;
}

.calendar-day.has-leave {
  background: rgba(79, 70, 229, 0.04);
}

.calendar-day:hover {
  background: var(--bg);
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
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.upcoming-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.upcoming-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.upcoming-item:last-child {
  border-bottom: none;
}

.upcoming-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
</style>
