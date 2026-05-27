require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
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

  await User.insertMany([
    { name: 'System Admin', email: 'admin@lms.com', role: 'admin', status: 'approved', dept_id: depts[2]._id, leave_balances: balances },
    { name: 'Alice Johnson', email: 'alice@lms.com', role: 'employee', status: 'approved', dept_id: depts[0]._id, leave_balances: balances },
    { name: 'Bob Smith', email: 'bob@lms.com', role: 'employee', status: 'approved', dept_id: depts[1]._id, leave_balances: balances },
    { name: 'Carol White', email: 'carol@lms.com', role: 'employee', status: 'approved', dept_id: depts[2]._id, leave_balances: balances },
    { name: 'David Lee', email: 'david@lms.com', role: 'employee', status: 'pending', dept_id: depts[3]._id, leave_balances: [] }
  ]);

  console.log('Seed data inserted successfully!');
  console.log('Admin: admin@lms.com');
  console.log('Employees: alice, bob, carol, david');
  await mongoose.disconnect();
}

seed().catch(console.error);
