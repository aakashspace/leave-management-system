require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const LeaveType = require('../models/LeaveType');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms_db');
  console.log('Connected to MongoDB');

  await Department.deleteMany({});
  await LeaveType.deleteMany({});
  await User.deleteMany({});

  const depts = await Department.insertMany([
    { dept_name: 'Engineering' },
    { dept_name: 'Marketing' },
    { dept_name: 'HR' },
    { dept_name: 'Finance' }
  ]);

  const leaveTypes = await LeaveType.insertMany([
    { name: 'Annual Leave', max_paid_days: 15, color_code: '#3B82F6' },
    { name: 'Sick Leave', max_paid_days: 10, color_code: '#EF4444' },
    { name: 'Casual Leave', max_paid_days: 7, color_code: '#F59E0B' },
    { name: 'Maternity Leave', max_paid_days: 90, color_code: '#EC4899' },
    { name: 'Emergency Leave', max_paid_days: 3, color_code: '#8B5CF6' }
  ]);

  const balances = leaveTypes.map(lt => ({
    leave_type_id: lt._id,
    leave_type_name: lt.name,
    total_days: lt.max_paid_days,
    used_days: 0,
    remaining_days: lt.max_paid_days
  }));

  // Hash default password for all seeded users
  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  await User.insertMany([
    {
      name: 'System Admin',
      email: 'admin@lms.com',
      password_hash: adminPassword,
      role: 'admin',
      status: 'approved',
      dept_id: depts[2]._id,
      leave_balances: balances
    },
    {
      name: 'Alice Johnson',
      email: 'alice@lms.com',
      password_hash: defaultPassword,
      role: 'employee',
      status: 'approved',
      dept_id: depts[0]._id,
      leave_balances: balances
    },
    {
      name: 'Bob Smith',
      email: 'bob@lms.com',
      password_hash: defaultPassword,
      role: 'employee',
      status: 'approved',
      dept_id: depts[1]._id,
      leave_balances: balances
    },
    {
      name: 'Carol White',
      email: 'carol@lms.com',
      password_hash: defaultPassword,
      role: 'employee',
      status: 'approved',
      dept_id: depts[2]._id,
      leave_balances: balances
    },
    {
      name: 'David Lee',
      email: 'david@lms.com',
      password_hash: defaultPassword,
      role: 'employee',
      status: 'pending',
      dept_id: depts[3]._id,
      leave_balances: []
    }
  ]);

  console.log('Seed data inserted successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin   → admin@lms.com  / Admin@123');
  console.log('  Alice   → alice@lms.com  / Password@123');
  console.log('  Bob     → bob@lms.com    / Password@123');
  console.log('  Carol   → carol@lms.com  / Password@123');
  console.log('  David   → david@lms.com  / Password@123 (pending - cannot login yet)');
  await mongoose.disconnect();
}

seed().catch(console.error);
