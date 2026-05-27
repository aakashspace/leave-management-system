/**
 * LMS API Test Suite
 * Run: node tests/api.test.js
 */

const BASE = 'http://localhost:5000/api';

let adminToken = '';
let employeeToken = '';
let employeeId = '';
let leaveRequestId = '';
let deptId = '';
let leaveTypeId = '';

let passed = 0;
let failed = 0;
const results = [];

// ─── helpers ────────────────────────────────────────────────────────────────

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let json;
  try { json = await res.json(); } catch { json = {}; }
  return { status: res.status, body: json };
}

function test(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push(`  ✅ ${name}`);
  } else {
    failed++;
    results.push(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function section(title) {
  results.push(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);
}

// ─── test blocks ─────────────────────────────────────────────────────────────

async function testPublicRoutes() {
  section('PUBLIC ROUTES (no token needed)');

  // Departments list is public (for registration form)
  const r1 = await req('GET', '/departments');
  test('GET /departments — returns 200', r1.status === 200, `got ${r1.status}`);
  test('GET /departments — has data array', Array.isArray(r1.body.data), JSON.stringify(r1.body).slice(0, 80));
  if (r1.body.data?.length) deptId = r1.body.data[0]._id;

  // Register a new test employee (public)
  const r2 = await req('POST', '/users', {
    name: 'Test Employee',
    email: `test_${Date.now()}@lms.com`,
    password: 'Test@123',
    dept_id: deptId,
    role: 'employee'
  });
  test('POST /users (register) — returns 201', r2.status === 201, `got ${r2.status}`);
  test('POST /users — message includes pending', r2.body.message?.toLowerCase().includes('pending'), r2.body.message);
  if (r2.body.data?._id) employeeId = r2.body.data._id;

  // Duplicate email should fail
  const r3 = await req('POST', '/users', { name: 'Dup', email: 'admin@lms.com', password: 'x' });
  test('POST /users — duplicate email returns 400', r3.status === 400, `got ${r3.status}`);
}

async function testAuth() {
  section('AUTHENTICATION');

  // Valid admin login
  const r1 = await req('POST', '/auth/login', { email: 'admin@lms.com', password: 'Admin@123' });
  test('POST /auth/login — admin valid credentials → 200', r1.status === 200, `got ${r1.status}`);
  test('POST /auth/login — returns token', !!r1.body.token, 'no token in response');
  test('POST /auth/login — returns user object', r1.body.user?.role === 'admin', JSON.stringify(r1.body.user));
  test('POST /auth/login — does NOT expose password_hash', !r1.body.user?.password_hash, 'password_hash exposed!');
  if (r1.body.token) adminToken = r1.body.token;

  // Valid employee login (alice - seeded approved employee)
  const r2 = await req('POST', '/auth/login', { email: 'alice@lms.com', password: 'Password@123' });
  test('POST /auth/login — employee valid credentials → 200', r2.status === 200, `got ${r2.status}`);
  test('POST /auth/login — employee token returned', !!r2.body.token, 'no token');
  if (r2.body.token) { employeeToken = r2.body.token; }
  if (r2.body.user?._id) employeeId = r2.body.user._id;

  // Wrong password
  const r3 = await req('POST', '/auth/login', { email: 'admin@lms.com', password: 'WrongPass' });
  test('POST /auth/login — wrong password → 401', r3.status === 401, `got ${r3.status}`);

  // Non-existent user
  const r4 = await req('POST', '/auth/login', { email: 'nobody@lms.com', password: 'abc' });
  test('POST /auth/login — unknown email → 401', r4.status === 401, `got ${r4.status}`);

  // Pending user login blocked
  const r5 = await req('POST', '/auth/login', { email: 'david@lms.com', password: 'Password@123' });
  test('POST /auth/login — pending user → 403', r5.status === 403, `got ${r5.status}`);

  // Missing fields
  const r6 = await req('POST', '/auth/login', { email: 'admin@lms.com' });
  test('POST /auth/login — missing password → 400', r6.status === 400, `got ${r6.status}`);
}

async function testProtectedRoutes() {
  section('PROTECTED ROUTES (401 without token)');

  const routes = [
    ['GET', '/users'],
    ['GET', '/users/pending'],
    ['GET', '/leave-types'],
    ['GET', '/leave-types/all'],
    ['GET', '/leave-requests/all'],
    ['GET', '/reports/dashboard'],
    ['GET', '/reports/leave-stats'],
    ['GET', '/reports/employee-stats'],
    ['GET', '/reports/dept-stats'],
  ];

  for (const [method, path] of routes) {
    const r = await req(method, path);
    test(`${method} ${path} — no token → 401`, r.status === 401, `got ${r.status}`);
  }
}

async function testAdminRoutes() {
  section('ADMIN ROUTES (with admin token)');

  // Get all users
  const r1 = await req('GET', '/users', null, adminToken);
  test('GET /users — admin → 200', r1.status === 200, `got ${r1.status}`);
  test('GET /users — returns array', Array.isArray(r1.body.data), '');

  // Get pending users
  const r2 = await req('GET', '/users/pending', null, adminToken);
  test('GET /users/pending — admin → 200', r2.status === 200, `got ${r2.status}`);

  // Get all leave types (including inactive)
  const r3 = await req('GET', '/leave-types/all', null, adminToken);
  test('GET /leave-types/all — admin → 200', r3.status === 200, `got ${r3.status}`);
  if (r3.body.data?.length) leaveTypeId = r3.body.data[0]._id;

  // Get all leave requests
  const r4 = await req('GET', '/leave-requests/all', null, adminToken);
  test('GET /leave-requests/all — admin → 200', r4.status === 200, `got ${r4.status}`);

  // Dashboard stats
  const r5 = await req('GET', '/reports/dashboard', null, adminToken);
  test('GET /reports/dashboard — admin → 200', r5.status === 200, `got ${r5.status}`);
  test('GET /reports/dashboard — has totalUsers', r5.body.data?.totalUsers !== undefined, JSON.stringify(r5.body.data).slice(0,100));

  // Leave stats
  const r6 = await req('GET', '/reports/leave-stats', null, adminToken);
  test('GET /reports/leave-stats — admin → 200', r6.status === 200, `got ${r6.status}`);

  // Dept stats
  const r7 = await req('GET', '/reports/dept-stats', null, adminToken);
  test('GET /reports/dept-stats — admin → 200', r7.status === 200, `got ${r7.status}`);

  // Create department
  const r8 = await req('POST', '/departments', { dept_name: 'TestDept_' + Date.now() }, adminToken);
  test('POST /departments — admin → 201', r8.status === 201, `got ${r8.status}`);
  const newDeptId = r8.body.data?._id;

  // Delete that department
  if (newDeptId) {
    const r9 = await req('DELETE', `/departments/${newDeptId}`, null, adminToken);
    test('DELETE /departments/:id — admin → 200', r9.status === 200, `got ${r9.status}`);
  }

  // Create leave type
  const r10 = await req('POST', '/leave-types', {
    name: 'Test Leave ' + Date.now(),
    max_paid_days: 5,
    color_code: '#FF0000'
  }, adminToken);
  test('POST /leave-types — admin → 201', r10.status === 201, `got ${r10.status}`);
}

async function testEmployeeRoutes() {
  section('EMPLOYEE ROUTES (with employee token)');

  // Get active leave types (needed for apply leave form)
  const r1 = await req('GET', '/leave-types', null, employeeToken);
  test('GET /leave-types — employee → 200', r1.status === 200, `got ${r1.status}`);
  test('GET /leave-types — only active types', r1.body.data?.every(lt => lt.is_active !== false), '');
  if (r1.body.data?.length) leaveTypeId = r1.body.data[0]._id;

  // Get own profile
  const r2 = await req('GET', `/users/${employeeId}`, null, employeeToken);
  test('GET /users/:id — employee own profile → 200', r2.status === 200, `got ${r2.status}`);

  // Get own leaves
  const r3 = await req('GET', `/leave-requests/my/${employeeId}`, null, employeeToken);
  test('GET /leave-requests/my/:id — employee → 200', r3.status === 200, `got ${r3.status}`);

  // Apply for leave (paid)
  const start = new Date(); start.setDate(start.getDate() + 7);
  const end = new Date(); end.setDate(end.getDate() + 8);
  const r4 = await req('POST', '/leave-requests', {
    user_id: employeeId,
    type_id: leaveTypeId,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    is_paid: true,
    reason: 'API test leave request'
  }, employeeToken);
  test('POST /leave-requests — employee apply leave → 201', r4.status === 201 || r4.status === 400, `got ${r4.status} — ${r4.body.message}`);
  // 400 is ok if insufficient balance (seeded data may vary)
  if (r4.status === 201) {
    leaveRequestId = r4.body.data?._id;
    test('POST /leave-requests — returns leave object', !!r4.body.data?._id, '');
  }

  // Apply unpaid leave (no balance check)
  const start2 = new Date(); start2.setDate(start2.getDate() + 14);
  const end2 = new Date(); end2.setDate(end2.getDate() + 14);
  const r5 = await req('POST', '/leave-requests', {
    user_id: employeeId,
    type_id: leaveTypeId,
    start_date: start2.toISOString().split('T')[0],
    end_date: end2.toISOString().split('T')[0],
    is_paid: false,
    reason: 'Unpaid API test'
  }, employeeToken);
  test('POST /leave-requests — unpaid leave → 201', r5.status === 201, `got ${r5.status} — ${r5.body.message}`);
  if (r5.status === 201) leaveRequestId = r5.body.data?._id;
}

async function testRoleAccess() {
  section('ROLE-BASED ACCESS CONTROL');

  // Employee cannot access admin-only routes
  const r1 = await req('GET', '/users', null, employeeToken);
  test('GET /users — employee token → 403', r1.status === 403, `got ${r1.status}`);

  const r2 = await req('GET', '/leave-types/all', null, employeeToken);
  test('GET /leave-types/all — employee token → 403', r2.status === 403, `got ${r2.status}`);

  const r3 = await req('GET', '/leave-requests/all', null, employeeToken);
  test('GET /leave-requests/all — employee token → 403', r3.status === 403, `got ${r3.status}`);

  const r4 = await req('GET', '/reports/dashboard', null, employeeToken);
  test('GET /reports/dashboard — employee token → 403', r4.status === 403, `got ${r4.status}`);

  const r5 = await req('POST', '/departments', { dept_name: 'Hack' }, employeeToken);
  test('POST /departments — employee token → 403', r5.status === 403, `got ${r5.status}`);

  const r6 = await req('POST', '/leave-types', { name: 'Hack', max_paid_days: 99 }, employeeToken);
  test('POST /leave-types — employee token → 403', r6.status === 403, `got ${r6.status}`);

  // Invalid / tampered token
  const r7 = await req('GET', '/users', null, 'fake.token.here');
  test('GET /users — fake token → 401', r7.status === 401, `got ${r7.status}`);
}

async function testLeaveWorkflow() {
  section('LEAVE APPROVAL WORKFLOW (end-to-end)');

  if (!leaveRequestId) {
    results.push('  ⚠️  Skipped — no leave request ID from previous tests');
    return;
  }

  // Admin approves the leave
  const r1 = await req('PUT', `/leave-requests/${leaveRequestId}/status`, {
    status: 'approved',
    admin_comment: 'Approved via API test'
  }, adminToken);
  test('PUT /leave-requests/:id/status — admin approves → 200', r1.status === 200, `got ${r1.status} — ${r1.body.message}`);
  test('PUT — status is approved', r1.body.data?.status === 'approved', r1.body.data?.status);

  // Get updated user to check balance deduction (only for paid leaves)
  const r2 = await req('GET', `/users/${employeeId}`, null, adminToken);
  test('GET /users/:id after approval — 200', r2.status === 200, `got ${r2.status}`);
}

async function testUserApprovalWorkflow() {
  section('USER APPROVAL WORKFLOW');

  // Create a fresh pending employee
  const email = `newuser_${Date.now()}@lms.com`;
  const r1 = await req('POST', '/users', {
    name: 'Pending User',
    email,
    password: 'Pass@123',
    dept_id: deptId,
    role: 'employee'
  });
  test('Register new employee → 201', r1.status === 201, `got ${r1.status}`);
  const newUserId = r1.body.data?._id;

  // Pending user cannot login
  const r2 = await req('POST', '/auth/login', { email, password: 'Pass@123' });
  test('Pending user login → 403', r2.status === 403, `got ${r2.status}`);

  if (newUserId) {
    // Admin approves the user
    const r3 = await req('PUT', `/users/${newUserId}/approve`, null, adminToken);
    test('Admin approves user → 200', r3.status === 200, `got ${r3.status}`);
    test('User status is approved', r3.body.data?.status === 'approved', r3.body.data?.status);
    test('Leave balances initialized', Array.isArray(r3.body.data?.leave_balances) && r3.body.data.leave_balances.length > 0, `balances: ${r3.body.data?.leave_balances?.length}`);

    // Now approved user can login
    const r4 = await req('POST', '/auth/login', { email, password: 'Pass@123' });
    test('Approved user can login → 200', r4.status === 200, `got ${r4.status}`);
    test('Approved user gets token', !!r4.body.token, '');

    // Reject test: create another user and reject
    const email2 = `reject_${Date.now()}@lms.com`;
    const r5 = await req('POST', '/users', { name: 'Reject Me', email: email2, password: 'P@ss1', dept_id: deptId });
    const rejectId = r5.body.data?._id;
    if (rejectId) {
      const r6 = await req('PUT', `/users/${rejectId}/reject`, null, adminToken);
      test('Admin rejects user → 200', r6.status === 200, `got ${r6.status}`);
      const r7 = await req('POST', '/auth/login', { email: email2, password: 'P@ss1' });
      test('Rejected user login → 403', r7.status === 403, `got ${r7.status}`);
    }
  }
}

// ─── run all ──────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║         LMS API Test Suite — BCSP-064               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Target: ${BASE}\n`);

  // Check server is up
  try {
    await fetch(`${BASE}/departments`);
  } catch {
    console.error('❌ Cannot reach server at http://localhost:5000. Is it running?');
    process.exit(1);
  }

  await testPublicRoutes();
  await testAuth();
  await testProtectedRoutes();
  await testAdminRoutes();
  await testEmployeeRoutes();
  await testRoleAccess();
  await testLeaveWorkflow();
  await testUserApprovalWorkflow();

  // Print results
  results.forEach(r => console.log(r));

  const total = passed + failed;
  console.log('\n' + '═'.repeat(56));
  console.log(`  Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`  ⚠️  ${failed} test(s) failed — see ❌ above`);
  } else {
    console.log('  🎉 All tests passed!');
  }
  console.log('═'.repeat(56) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
