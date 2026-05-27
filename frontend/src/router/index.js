import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: () => import('../views/SelectUser.vue') },
  {
    path: '/employee',
    component: () => import('../layouts/EmployeeLayout.vue'),
    children: [
      { path: '', redirect: '/employee/dashboard' },
      { path: 'dashboard', component: () => import('../views/employee/Dashboard.vue') },
      { path: 'apply', component: () => import('../views/employee/ApplyLeave.vue') },
      { path: 'history', component: () => import('../views/employee/LeaveHistory.vue') },
      { path: 'calendar', component: () => import('../views/employee/LeaveCalendar.vue') },
      { path: 'profile', component: () => import('../views/employee/Profile.vue') },
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('../views/admin/Dashboard.vue') },
      { path: 'users', component: () => import('../views/admin/ManageUsers.vue') },
      { path: 'leave-types', component: () => import('../views/admin/LeaveTypes.vue') },
      { path: 'leaves', component: () => import('../views/admin/AllLeaves.vue') },
      { path: 'departments', component: () => import('../views/admin/Departments.vue') },
      { path: 'reports', component: () => import('../views/admin/Reports.vue') },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.path === '/') return next();
  next();
});

export default router;
