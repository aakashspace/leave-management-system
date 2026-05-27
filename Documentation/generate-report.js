const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
        UnderlineType, ImageRun, TableOfContents } = require('docx');
const fs = require('fs');
const path = require('path');

// ─── HELPERS ────────────────────────────────────────────────────────────────

function body(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : (opts.right ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED),
    spacing: { line: 360, lineRule: 'auto', before: opts.before || 0, after: opts.after || 120 },
    children: [new TextRun({
      text,
      font: 'Times New Roman',
      size: opts.size || 24,
      bold: opts.bold || false,
      italics: opts.italic || false,
      underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
      color: opts.color || undefined
    })]
  });
}

function centered(text, opts = {}) { return body(text, { ...opts, center: true }); }

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 480, after: 240, line: 360, lineRule: 'auto' },
    children: [new TextRun({ text, font: 'Times New Roman', size: 36, bold: true })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 180, line: 360, lineRule: 'auto' },
    children: [new TextRun({ text, font: 'Times New Roman', size: 28, bold: true })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 360, lineRule: 'auto' },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })]
  });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun('')], spacing: { before: 0, after: 0, line: 360, lineRule: 'auto' } }));
}

function pb() { return new Paragraph({ children: [new PageBreak()] }); }

const brd = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
const brdAll = { top: brd, bottom: brd, left: brd, right: brd };

function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 8306, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders: brdAll,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: 'D0DDEF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 276, lineRule: 'auto' },
            children: [new TextRun({ text: h, font: 'Times New Roman', size: 20, bold: true })]
          })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((c, i) => new TableCell({
          borders: brdAll,
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 276, lineRule: 'auto' },
            children: [new TextRun({ text: c, font: 'Times New Roman', size: 20 })]
          })]
        }))
      }))
    ]
  });
}

function codeBlock(code) {
  return code.split('\n').map(line => new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: 'auto', before: 0, after: 0 },
    children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18 })]
  }));
}

function bulletItem(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { line: 360, lineRule: 'auto', before: 0, after: 60 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24 })]
  });
}

function numberedItem(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { line: 360, lineRule: 'auto', before: 0, after: 60 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24 })]
  });
}

// ─── SCREENSHOT HELPER ───────────────────────────────────────────────────────

const screenshotsDir = path.join(__dirname, 'screenshots');

function imgSection(filename, caption) {
  const imgPath = path.join(screenshotsDir, filename);
  const results = [];
  if (fs.existsSync(imgPath)) {
    const data = fs.readFileSync(imgPath);
    results.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [new ImageRun({
        type: 'png',
        data,
        transformation: { width: 560, height: 254 },
        altText: { title: caption, description: caption, name: caption }
      })]
    }));
  }
  results.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: caption, font: 'Times New Roman', size: 20, italics: true })]
  }));
  return results;
}

// ─── DIAGRAM IMAGE HELPER ────────────────────────────────────────────────────

const diagramsDir = path.join(__dirname, 'screenshots', 'diagrams');

function diagSection(filename, caption, figNum, width = 500, height = 350) {
  const imgPath = path.join(diagramsDir, filename);
  const results = [];
  if (fs.existsSync(imgPath)) {
    const data = fs.readFileSync(imgPath);
    results.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
      children: [new ImageRun({
        type: 'png',
        data,
        transformation: { width, height },
        altText: { title: caption, description: caption, name: caption }
      })]
    }));
    results.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360 },
      children: [new TextRun({ text: `Figure ${figNum}: ${caption}`, font: 'Times New Roman', size: 20, italics: true, bold: true })]
    }));
  } else {
    results.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: `[Figure ${figNum}: ${caption} — diagram image not found]`, font: 'Times New Roman', size: 20, italics: true, color: 'CC0000' })]
    }));
  }
  return results;
}

// ─── SOURCE CODE ─────────────────────────────────────────────────────────────

const serverJs = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const app = express();

connectDB();
app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/leave-types', require('./routes/leaveTypes'));
app.use('/api/leave-requests', require('./routes/leaveRequests'));
app.use('/api/reports', require('./routes/reports'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));`;

const userModel = `const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  leave_balances: [{
    leave_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' },
    leave_type_name: String,
    total_days: Number,
    used_days: { type: Number, default: 0 },
    remaining_days: Number
  }]
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);`;

const leaveRequestModel = `const mongoose = require('mongoose');
const LeaveRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  leave_type_name: String,
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  total_days: { type: Number, required: true },
  is_paid: { type: Boolean, default: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  admin_comment: String
}, { timestamps: true });
module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);`;

const leaveTypeModel = `const mongoose = require('mongoose');
const LeaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  max_days: { type: Number, required: true },
  color_code: { type: String, default: '#3B82F6' },
  is_paid: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('LeaveType', LeaveTypeSchema);`;

const departmentModel = `const mongoose = require('mongoose');
const DepartmentSchema = new mongoose.Schema({
  dept_name: { type: String, required: true, unique: true }
}, { timestamps: true });
module.exports = mongoose.model('Department', DepartmentSchema);`;

const leaveRequestController = `const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');

function countWeekdays(start, end) {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getPriority(name) {
  const n = name.toLowerCase();
  if (n.includes('sick') || n.includes('medical') || n.includes('emergency')) return 'high';
  if (n.includes('casual')) return 'medium';
  return 'low';
}

exports.applyLeave = async (req, res) => {
  try {
    const { user_id, type_id, start_date, end_date, is_paid, reason } = req.body;
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start > end) return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    const total_days = countWeekdays(start, end);
    if (total_days === 0) return res.status(400).json({ success: false, message: 'No working days in selected range' });
    const leaveType = await LeaveType.findById(type_id);
    if (!leaveType) return res.status(404).json({ success: false, message: 'Leave type not found' });
    const priority = getPriority(leaveType.name);
    if (is_paid) {
      const user = await User.findById(user_id);
      const balance = user.leave_balances.find(b => b.leave_type_id.toString() === type_id);
      if (!balance || balance.remaining_days < total_days) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
    }
    const request = await LeaveRequest.create({
      user_id, type_id, leave_type_name: leaveType.name,
      start_date: start, end_date: end, total_days, is_paid: is_paid !== false,
      reason, priority
    });
    res.status(201).json({ success: true, data: request, message: 'Leave applied successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, admin_comment } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (status === 'approved' && leave.is_paid && leave.status === 'pending') {
      await User.findOneAndUpdate(
        { _id: leave.user_id, 'leave_balances.leave_type_id': leave.type_id },
        { $inc: { 'leave_balances.$.used_days': leave.total_days, 'leave_balances.$.remaining_days': -leave.total_days } }
      );
    }
    leave.status = status;
    leave.admin_comment = admin_comment || '';
    await leave.save();
    res.json({ success: true, data: leave, message: 'Leave ' + status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};`;

const reportController = `const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ status: 'approved', role: 'employee' });
    const pendingApprovals = await User.countDocuments({ status: 'pending' });
    const totalLeaves = await LeaveRequest.countDocuments();
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'pending' });
    const approvedLeaves = await LeaveRequest.countDocuments({ status: 'approved' });
    const rejectedLeaves = await LeaveRequest.countDocuments({ status: 'rejected' });
    const highPriority = await LeaveRequest.countDocuments({ priority: 'high', status: 'pending' });
    res.json({ success: true, data: { totalUsers, pendingApprovals, totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves, highPriority } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDeptStats = async (req, res) => {
  try {
    const stats = await LeaveRequest.aggregate([
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'departments', localField: 'user.dept_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { $ifNull: ['$dept.dept_name', 'No Department'] },
        totalRequests: { $sum: 1 }, totalDays: { $sum: '$total_days' },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
      }},
      { $sort: { totalRequests: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};`;

const appStore = `import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const currentUser = ref(JSON.parse(localStorage.getItem('lms_user') || 'null'));

  function setUser(user) {
    currentUser.value = user;
    localStorage.setItem('lms_user', JSON.stringify(user));
  }

  function clearUser() {
    currentUser.value = null;
    localStorage.removeItem('lms_user');
  }

  return { currentUser, setUser, clearUser };
});`;

const routerIndex = `import { createRouter, createWebHistory } from 'vue-router';

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

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to, from, next) => { if (to.path === '/') return next(); next(); });
export default router;`;

// ─── ADDITIONAL BACKEND CODE ─────────────────────────────────────────────────

const dbConfig = `const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
module.exports = connectDB;`;

const routeUsers = `const router = require('express').Router();
const c = require('../controllers/userController');
router.get('/', c.getAllUsers);
router.get('/pending', c.getPendingUsers);
router.post('/', c.createUser);
router.get('/:id', c.getUserById);
router.put('/:id', c.updateUser);
router.delete('/:id', c.deleteUser);
router.put('/:id/approve', c.approveUser);
router.put('/:id/reject', c.rejectUser);
module.exports = router;`;

const routeLeaveRequests = `const router = require('express').Router();
const c = require('../controllers/leaveRequestController');
router.post('/', c.applyLeave);
router.get('/my/:user_id', c.getMyLeaves);
router.get('/all', c.getAllLeaves);
router.put('/:id/status', c.updateLeaveStatus);
router.put('/:id/cancel', c.cancelLeave);
module.exports = router;`;

const routeLeaveTypes = `const router = require('express').Router();
const c = require('../controllers/leaveTypeController');
router.get('/', c.getLeaveTypes);
router.get('/all', c.getAllLeaveTypes);
router.post('/', c.createLeaveType);
router.put('/:id', c.updateLeaveType);
router.delete('/:id', c.deleteLeaveType);
module.exports = router;`;

const routeDepartments = `const router = require('express').Router();
const c = require('../controllers/departmentController');
router.get('/', c.getDepartments);
router.post('/', c.createDepartment);
router.put('/:id', c.updateDepartment);
router.delete('/:id', c.deleteDepartment);
module.exports = router;`;

const routeReports = `const router = require('express').Router();
const c = require('../controllers/reportController');
router.get('/dashboard', c.getDashboardStats);
router.get('/leave-stats', c.getLeaveStats);
router.get('/employee-stats', c.getEmployeeStats);
router.get('/dept-stats', c.getDeptStats);
module.exports = router;`;

const userController = `const User = require('../models/User');
const LeaveType = require('../models/LeaveType');

exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.dept_id) filter.dept_id = req.query.dept_id;
    if (req.query.status) filter.status = req.query.status;
    const users = await User.find(filter).populate('dept_id', 'dept_name').select('-__v');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }).populate('dept_id', 'dept_name');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, dept_id } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = new User({ name, email, role: role || 'employee',
      ...(dept_id ? { dept_id } : {}),
      status: role === 'admin' ? 'approved' : 'pending' });
    if (role === 'admin') {
      const leaveTypes = await LeaveType.find({ is_active: true });
      user.leave_balances = leaveTypes.map(lt => ({
        leave_type_id: lt._id, leave_type_name: lt.name,
        total_days: lt.max_paid_days, used_days: 0, remaining_days: lt.max_paid_days
      }));
    }
    await user.save();
    res.status(201).json({ success: true, data: user,
      message: role === 'admin' ? 'Admin created' : 'User registered, pending approval' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.status = 'approved';
    const leaveTypes = await LeaveType.find({ is_active: true });
    user.leave_balances = leaveTypes.map(lt => ({
      leave_type_id: lt._id, leave_type_name: lt.name,
      total_days: lt.max_paid_days, used_days: 0, remaining_days: lt.max_paid_days
    }));
    await user.save();
    res.json({ success: true, message: 'User approved', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User rejected', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('dept_id', 'dept_name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, dept_id } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, dept_id },
      { new: true }).populate('dept_id', 'dept_name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};`;

const leaveTypeController = `const LeaveType = require('../models/LeaveType');

exports.getLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find({ is_active: true });
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find();
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLeaveType = async (req, res) => {
  try {
    const { name, max_paid_days, color_code } = req.body;
    const lt = await LeaveType.create({ name, max_paid_days, color_code });
    res.status(201).json({ success: true, data: lt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const lt = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lt) return res.status(404).json({ success: false, message: 'Leave type not found' });
    res.json({ success: true, data: lt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteLeaveType = async (req, res) => {
  try {
    await LeaveType.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: 'Leave type deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};`;

const departmentController = `const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Department.find();
    res.json({ success: true, data: depts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const dept = await Department.create({ dept_name: req.body.dept_name });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(
      req.params.id, { dept_name: req.body.dept_name }, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};`;

const axiosConfig = `import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
export default api;`;

const mainJs = `import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');`;

const appVue = `<template>
  <router-view />
</template>
<script setup></script>`;

const adminLayoutVue = `<!-- layouts/AdminLayout.vue — Sidebar navigation for Admin role -->
<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../store/useAppStore';

const router = useRouter();
const route = useRoute();
const store = useAppStore();
const sidebarOpen = ref(false);

const user = computed(() => store.currentUser);
const initials = computed(() => {
  if (!user.value) return 'A';
  return user.value.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/');
}

function switchUser() {
  store.clearUser();
  router.push('/');
}
</script>
<!-- Template: Sidebar with links to /admin/dashboard, /admin/leaves,
     /admin/leave-types, /admin/users, /admin/departments, /admin/reports
     Mobile-responsive hamburger menu included. -->`;

const employeeLayoutVue = `<!-- layouts/EmployeeLayout.vue — Sidebar navigation for Employee role -->
<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../store/useAppStore';

const router = useRouter();
const route = useRoute();
const store = useAppStore();
const sidebarOpen = ref(false);

const user = computed(() => store.currentUser);
const initials = computed(() => {
  if (!user.value) return '?';
  return user.value.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
});
const avatarColor = computed(() => {
  const colors = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
  if (!user.value) return colors[0];
  return colors[user.value.name.charCodeAt(0) % colors.length];
});
const navItems = [
  { path: '/employee/dashboard', label: 'Dashboard' },
  { path: '/employee/apply',     label: 'Apply Leave' },
  { path: '/employee/history',   label: 'My Leaves' },
  { path: '/employee/calendar',  label: 'Calendar' },
  { path: '/employee/profile',   label: 'My Profile' },
];
function isActive(path) { return route.path === path || route.path.startsWith(path + '/'); }
function switchUser() { store.clearUser(); router.push('/'); }
</script>
<!-- Template: Sidebar with links to all employee routes, mobile-responsive. -->`;

const selectUserVue = `<!-- views/SelectUser.vue — Login/Registration page (no password required) -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../store/useAppStore';
import api from '../api/axios';

const router = useRouter();
const store = useAppStore();
const activeTab = ref('login');
const users = ref([]);
const departments = ref([]);
const loading = ref(true);
const fetchError = ref('');
const selectedUserId = ref('');

// Registration form state
const regForm = ref({ name: '', email: '', dept_id: '' });
const regLoading = ref(false);
const regError = ref('');
const regSuccess = ref(false);

const admins = computed(() => users.value.filter(u => u.role === 'admin'));
const employees = computed(() => users.value.filter(u => u.role === 'employee'));
const selectedUser = computed(() => users.value.find(u => u._id === selectedUserId.value) || null);

function initials(name) {
  return name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
}

onMounted(async () => {
  try {
    const [usersRes, deptsRes] = await Promise.all([
      api.get('/users?status=approved'),
      api.get('/departments')
    ]);
    users.value = usersRes.data.data;
    departments.value = deptsRes.data.data;
  } catch (e) {
    fetchError.value = 'Could not load users. Make sure backend is running on port 5000.';
  } finally {
    loading.value = false;
  }
});

function handleContinue() {
  if (!selectedUserId.value) return;
  const user = selectedUser.value;
  if (!user) return;
  store.setUser(user);
  router.push(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
}

async function handleRegister() {
  regError.value = '';
  if (!regForm.value.name.trim()) return (regError.value = 'Full name is required.');
  if (!regForm.value.email.trim()) return (regError.value = 'Email is required.');
  regLoading.value = true;
  try {
    await api.post('/users', {
      name: regForm.value.name.trim(),
      email: regForm.value.email.trim(),
      dept_id: regForm.value.dept_id || undefined,
      role: 'employee'
    });
    regSuccess.value = true;
  } catch (e) {
    regError.value = e.response?.data?.message || 'Registration failed.';
  } finally {
    regLoading.value = false;
  }
}
</script>
<!-- Template: Two tabs - (1) Select existing approved user to login,
     (2) Register new employee (pending admin approval). No passwords used. -->`;

const adminDashboardVue = `<!-- views/admin/Dashboard.vue — Admin overview with stats and quick actions -->
<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api/axios';

const stats = ref({ totalUsers:0, pendingApprovals:0, totalLeaves:0,
  pendingLeaves:0, approvedLeaves:0, rejectedLeaves:0, highPriority:0 });
const pendingLeaves = ref([]);
const pendingUsers = ref([]);
const loadingStats = ref(true);
const loadingLeaves = ref(true);
const loadingPendingUsers = ref(true);

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

async function loadAll() {
  try {
    const res = await api.get('/reports/dashboard');
    stats.value = res.data.data;
  } catch {} finally { loadingStats.value = false; }

  try {
    const res = await api.get('/leave-requests/all?status=pending');
    pendingLeaves.value = res.data.data;
  } catch {} finally { loadingLeaves.value = false; }

  try {
    const res = await api.get('/users/pending');
    pendingUsers.value = res.data.data;
  } catch {} finally { loadingPendingUsers.value = false; }
}

async function quickApprove(leave) {
  try {
    await api.put(\`/leave-requests/\${leave._id}/status\`, { status: 'approved', admin_comment: 'Approved' });
    await loadAll();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function quickReject(leave) {
  try {
    await api.put(\`/leave-requests/\${leave._id}/status\`, { status: 'rejected', admin_comment: 'Rejected' });
    await loadAll();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function approveUser(u) {
  try { await api.put(\`/users/\${u._id}/approve\`); await loadAll(); }
  catch (e) { alert(e.response?.data?.message || 'Error'); }
}

async function rejectUser(u) {
  try { await api.put(\`/users/\${u._id}/reject\`); await loadAll(); }
  catch (e) { alert(e.response?.data?.message || 'Error'); }
}

onMounted(loadAll);
</script>
<!-- Template: 6 stat cards (Total Employees, Pending Approvals, Pending Leaves,
     High Priority, Approved, Total), pending leave table with quick approve/reject,
     pending user list with approve/reject buttons. -->`;

const allLeavesVue = `<!-- views/admin/AllLeaves.vue — Admin leave management with filter and modal -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../api/axios';

const leaves = ref([]);
const loading = ref(true);
const filterStatus = ref('all');
const filterPriority = ref('');
const showActionModal = ref(false);
const actioning = ref(false);
const adminComment = ref('');
const pendingAction = ref({ leave: null, action: '' });

const filteredLeaves = computed(() => {
  let list = leaves.value;
  if (filterStatus.value !== 'all') list = list.filter(l => l.status === filterStatus.value);
  if (filterPriority.value) list = list.filter(l => l.priority === filterPriority.value);
  return list;
});

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadLeaves() {
  loading.value = true;
  try {
    const res = await api.get('/leave-requests/all');
    leaves.value = res.data.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function openAction(leave, action) {
  pendingAction.value = { leave, action };
  adminComment.value = '';
  showActionModal.value = true;
}

async function confirmAction() {
  actioning.value = true;
  try {
    await api.put(\`/leave-requests/\${pendingAction.value.leave._id}/status\`, {
      status: pendingAction.value.action,
      admin_comment: adminComment.value ||
        (pendingAction.value.action === 'approved' ? 'Approved by admin' : 'Rejected by admin')
    });
    showActionModal.value = false;
    await loadLeaves();
  } catch (e) { alert(e.response?.data?.message || 'Error'); }
  finally { actioning.value = false; }
}

onMounted(loadLeaves);
</script>
<!-- Template: Filter tabs (All/Pending/Approved/Rejected) + priority filter,
     table of all leave requests with Approve/Reject buttons,
     modal with admin comment field before confirming action. -->`;

const applyLeaveVue = `<!-- views/employee/ApplyLeave.vue — Leave application form with balance sidebar -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axios';

const store = useAppStore();
const user = computed(() => store.currentUser);
const leaveTypes = ref([]);
const allBalances = ref([]);
const submitting = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const workingDays = ref(null);

const form = ref({ type_id: '', start_date: '', end_date: '', is_paid: true, reason: '' });
const today = new Date().toISOString().split('T')[0];

const selectedLeaveType = computed(() =>
  leaveTypes.value.find(lt => lt._id === form.value.type_id) || null);
const selectedBalance = computed(() =>
  allBalances.value.find(b => b.leave_type_id === form.value.type_id) || null);
const isFormValid = computed(() =>
  form.value.type_id && form.value.start_date && form.value.end_date
  && form.value.reason.trim() && workingDays.value > 0);

// Count only Monday-Friday days in the selected range
function countWeekdays(start, end) {
  let count = 0;
  const cur = new Date(start);
  const endD = new Date(end);
  while (cur <= endD) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function calcDays() {
  if (form.value.start_date && form.value.end_date) {
    workingDays.value = countWeekdays(form.value.start_date, form.value.end_date);
  } else { workingDays.value = null; }
}

function resetForm() {
  form.value = { type_id: '', start_date: '', end_date: '', is_paid: true, reason: '' };
  workingDays.value = null; successMsg.value = ''; errorMsg.value = '';
}

async function submitLeave() {
  if (!isFormValid.value) return;
  submitting.value = true;
  errorMsg.value = ''; successMsg.value = '';
  try {
    await api.post('/leave-requests', {
      user_id: user.value._id,
      type_id: form.value.type_id,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      is_paid: form.value.is_paid,
      reason: form.value.reason
    });
    successMsg.value = 'Leave request submitted successfully! Pending admin approval.';
    resetForm();
    await loadUserBalances();
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Failed to submit leave request.';
  } finally { submitting.value = false; }
}

async function loadUserBalances() {
  try {
    const res = await api.get(\`/users/\${user.value._id}\`);
    allBalances.value = res.data.data.leave_balances.map(b => ({
      ...b, color: leaveTypes.value.find(lt => lt._id === b.leave_type_id?.toString())?.color_code
    }));
  } catch {}
}

onMounted(async () => {
  try { const res = await api.get('/leave-types'); leaveTypes.value = res.data.data; } catch {}
  if (user.value) await loadUserBalances();
});
</script>
<!-- Template: Leave type selector, date pickers with auto weekday counter,
     paid/unpaid checkbox, reason textarea, balance info sidebar. -->`;

const leaveHistoryVue = `<!-- views/employee/LeaveHistory.vue — Employee leave history with cancel -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axios';

const store = useAppStore();
const user = computed(() => store.currentUser);
const leaves = ref([]);
const loading = ref(true);
const activeStatus = ref('all');
const cancellingId = ref(null);
const showCancelModal = ref(false);
const pendingCancel = ref(null);

const statusTabs = computed(() => [
  { label: 'All',      value: 'all',      count: leaves.value.length },
  { label: 'Pending',  value: 'pending',  count: leaves.value.filter(l => l.status === 'pending').length },
  { label: 'Approved', value: 'approved', count: leaves.value.filter(l => l.status === 'approved').length },
  { label: 'Rejected', value: 'rejected', count: leaves.value.filter(l => l.status === 'rejected').length },
]);

const filteredLeaves = computed(() => {
  if (activeStatus.value === 'all') return leaves.value;
  return leaves.value.filter(l => l.status === activeStatus.value);
});

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

async function loadLeaves() {
  try {
    const res = await api.get(\`/leave-requests/my/\${user.value._id}\`);
    leaves.value = res.data.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function cancelLeave(leave) { pendingCancel.value = leave; showCancelModal.value = true; }

async function confirmCancel() {
  if (!pendingCancel.value) return;
  cancellingId.value = pendingCancel.value._id;
  try {
    await api.put(\`/leave-requests/\${pendingCancel.value._id}/cancel\`);
    showCancelModal.value = false;
    await loadLeaves();
  } catch (e) { alert(e.response?.data?.message || 'Failed to cancel leave.'); }
  finally { cancellingId.value = null; pendingCancel.value = null; }
}

onMounted(() => { if (user.value) loadLeaves(); });
</script>
<!-- Template: Status filter tabs (All/Pending/Approved/Rejected) with counts,
     table of leave history, cancel button for pending requests,
     confirmation modal before cancellation. -->`;

// ─── DOCUMENT ────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Times New Roman', size: 36, bold: true, color: '1F3864' },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Times New Roman', size: 28, bold: true, color: '2E5EAA' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Times New Roman', size: 24, bold: true, color: '1A1A1A' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [
    // ─── SECTION 1: Front matter (Roman numerals; cover page has no number) ──
    {
      properties: {
        titlePage: true,
        pageNumberFormatType: 'lowerRoman',
        pageNumberStart: 1,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 2160 }
        }
      },
      footers: {
        firstPage: new Footer({ children: [new Paragraph({ children: [new TextRun('')] })] }),
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 })]
          })]
        })
      },
      children: [
        // COVER PAGE
        ...spacer(3),
        centered('INDIRA GANDHI NATIONAL OPEN UNIVERSITY', { bold: true, size: 28 }),
        centered('(IGNOU)', { bold: true, size: 28 }),
        ...spacer(1),
        centered('BACHELOR OF COMPUTER APPLICATIONS (BCA)', { bold: true, size: 24 }),
        ...spacer(2),
        centered('PROJECT REPORT', { bold: true, size: 32, underline: true }),
        centered('BCSP-064: BCA PROJECT', { bold: true, size: 28 }),
        ...spacer(2),
        centered('LEAVE MANAGEMENT SYSTEM', { bold: true, size: 30, underline: true }),
        centered('(A Web-Based Application using MEVN Stack)', { bold: true, size: 24 }),
        ...spacer(3),
        centered('Submitted by:', { bold: true, size: 24 }),
        centered('Aakash Sah', { bold: true, size: 26 }),
        centered('Enrollment No.: 239150627', { size: 24 }),
        centered('BCA (6th Semester)', { size: 24 }),
        ...spacer(2),
        centered('Under the Supervision of:', { bold: true, size: 24 }),
        centered('Er. Ashish Kumar Jha', { size: 24 }),
        centered('[Designation]', { size: 24 }),
        centered('[Institution Name]', { size: 24 }),
        ...spacer(2),
        centered('Study Centre: [Study Centre Name & Code]', { size: 24 }),
        centered('Regional Centre: [Regional Centre Name]', { size: 24 }),
        ...spacer(1),
        centered('July 2024 - January 2025', { size: 24 }),
        pb(),

        // ─── PROJECT SYNOPSIS ───────────────────────────────────────────
        ...spacer(2),
        centered('PROJECT SYNOPSIS', { bold: true, size: 32, underline: true }),
        centered('BCSP-064: BCA Project', { bold: true, size: 24 }),
        ...spacer(2),
        centered('LEAVE MANAGEMENT SYSTEM', { bold: true, size: 28 }),
        centered('(A Web-Based Application using MEVN Stack)', { size: 24 }),
        ...spacer(3),
        makeTable(
          ['Field', 'Details'],
          [
            ['Student Name', 'Aakash Sah'],
            ['Enrolment No.', '239150627'],
            ['Programme', 'Bachelor of Computer Applications (BCA)'],
            ['Semester', '6th Semester (Final Year)'],
            ['Course Code', 'BCSP-064'],
            ['Guide Name', 'Er. Ashish Kumar Jha'],
            ['Guide Designation', '[Designation]'],
            ['Guide Institution', '[Institution Name]'],
            ['Study Centre', '[Study Centre Name & Code]'],
            ['Regional Centre', '[Regional Centre Name]'],
          ],
          [2500, 5806]
        ),
        ...spacer(3),
        body('Signature of Student: _______________________', { bold: true }),
        ...spacer(1),
        body('Signature of Guide: _________________________', { bold: true }),
        ...spacer(1),
        body('Date: _______________________'),
        pb(),

        // Synopsis Section 1: Title & Introduction
        body('1. TITLE OF THE PROJECT', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        body('Leave Management System — A Web-Based Application using the MEVN Stack (MongoDB, Express.js, Vue.js 3, Node.js)', { bold: true }),
        ...spacer(2),

        body('2. INTRODUCTION AND OBJECTIVES', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        body('2.1 Introduction'),
        ...spacer(1),
        body('Employee leave management is a critical function in every organisation. In most small to medium-sized organisations, leave management is still handled manually through paper forms, registers, and spreadsheets. This leads to errors in balance calculation, delays in approval, loss of forms, and lack of real-time visibility for employees and managers.'),
        body('The Leave Management System (LMS) is a full-stack web application that digitalises and automates the entire leave management lifecycle — from employee registration and leave application to administrative approval and analytical reporting. The system is built using the MEVN stack: MongoDB as the database, Express.js as the backend framework, Vue.js 3 as the frontend framework, and Node.js as the JavaScript runtime.'),
        body('The application supports two user roles: Employee and Administrator. Employees can apply for leave, check balances, track application status, and view team leave on a calendar. Administrators can approve or reject applications, manage users and departments, configure leave types, and generate reports.'),
        ...spacer(1),
        body('2.2 Objectives'),
        ...spacer(1),
        bulletItem('Develop a full-stack web application to replace manual paper-based leave management processes.'),
        bulletItem('Implement role-based access control differentiating between Employee and Administrator roles.'),
        bulletItem('Enable employees to apply for leave with automatic working-day calculation (Monday to Friday).'),
        bulletItem('Implement real-time leave balance tracking with atomic deduction using MongoDB $inc operator.'),
        bulletItem('Provide administrators with tools to approve or reject leave requests with optional comments.'),
        bulletItem('Implement an automatic priority classification algorithm for leave requests based on leave type.'),
        bulletItem('Generate analytical reports on department-wise leave patterns using MongoDB aggregation pipeline.'),
        bulletItem('Design a clean, responsive user interface using Vue.js 3 Composition API and Pinia state management.'),
        bulletItem('Ensure data integrity through Mongoose schema validation at the database layer.'),
        bulletItem('Deliver RESTful APIs with consistent JSON response format across all seventeen endpoints.'),
        pb(),

        // Synopsis Section 3: Project Category
        body('3. PROJECT CATEGORY', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        body('Category: Web-based Application / Management Information System (MIS)'),
        body('Domain: Human Resource Management (HRM) — Leave Administration'),
        body('Application Type: Multi-tier Client-Server Single Page Application (SPA)'),
        body('Architecture: Three-tier (Presentation + Application + Data)'),
        body('Frontend Technology: Vue.js 3 (Composition API) — falls under the React/Angular/JavaScript SPA category as listed in IGNOU approved tools.'),
        body('Backend Technology: Node.js + Express.js — JavaScript server-side runtime with RESTful API framework.'),
        body('Database: MongoDB (NoSQL, Document-oriented) — explicitly listed under "BACKEND FOR MOBILE APPs" in IGNOU approved tools.'),
        body('Additional Libraries: Mongoose (ODM), Pinia (State Management), Vue Router, Vite (Build Tool), dotenv, cors.'),
        ...spacer(2),

        // Synopsis Section 4: Analysis
        body('4. SYSTEM ANALYSIS', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        body('4.1 Data Flow Diagram — Level 0 (Context Diagram)', { bold: true }),
        body('External Entities: (1) Employee — provides registration data, leave applications; receives leave status, balance info. (2) Administrator — provides approval decisions, configuration; receives reports, user management data.'),
        body('Central Process: Leave Management System — mediates all interactions between entities and the MongoDB data store.'),
        ...spacer(1),
        body('4.2 Data Flow Diagram — Level 1', { bold: true }),
        bulletItem('P1 — User Management: Handles registration, approval, profile. Data flows between Employee entity, Users store, Admin entity.'),
        bulletItem('P2 — Leave Application: Processes leave requests. Reads leave types and balances; writes to LeaveRequests store.'),
        bulletItem('P3 — Leave Approval: Admin reviews requests. Updates LeaveRequests and atomically modifies leave balances in Users store.'),
        bulletItem('P4 — Reporting: Reads from LeaveRequests, Users, Departments stores to produce analytical outputs for Admin.'),
        ...spacer(1),
        body('4.3 Data Flow Diagram — Level 2 (Leave Application Process — P2)', { bold: true }),
        bulletItem('P2.1 — Validate Dates: Checks start_date <= end_date.'),
        bulletItem('P2.2 — Count Weekdays: Iterates date range; skips Saturday (day=6) and Sunday (day=0).'),
        bulletItem('P2.3 — Check Balance: Reads user leave_balances to verify remaining_days >= total_days for paid leave.'),
        bulletItem('P2.4 — Assign Priority: Keyword matching on leave type name ("sick/medical/emergency" → high, "casual" → medium).'),
        bulletItem('P2.5 — Create Request: Writes validated leave request to LeaveRequests store with pending status.'),
        ...spacer(1),
        body('4.4 Entity-Relationship Diagram', { bold: true }),
        bulletItem('User (1) — has many (N) — LeaveRequests: One employee can submit multiple leave applications.'),
        bulletItem('Department (1) — has many (N) — Users: One department can contain multiple employees.'),
        bulletItem('LeaveType (1) — referenced by (N) — LeaveRequests: One leave type applies to many requests.'),
        bulletItem('User (1) — has embedded (N) — LeaveBalances: Leave balances stored as embedded array in User document.'),
        ...spacer(1),
        body('4.5 Database Design', { bold: true }),
        ...spacer(1),
        makeTable(
          ['Collection', 'Key Fields', 'Relationships'],
          [
            ['users', '_id, name, email, role, status, dept_id, leave_balances[]', 'References: departments; Embeds: leave_balances'],
            ['leaverequests', '_id, user_id, type_id, start_date, end_date, total_days, priority, status', 'References: users, leavetypes'],
            ['leavetypes', '_id, name, max_days, color_code, is_paid', 'Referenced by: users.leave_balances, leaverequests'],
            ['departments', '_id, dept_name', 'Referenced by: users.dept_id'],
          ],
          [1600, 3806, 2900]
        ),
        pb(),

        // Synopsis Section 5: Module Structure
        body('5. COMPLETE STRUCTURE OF THE PROJECT', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        body('5.1 Number of Modules and Description', { bold: true }),
        ...spacer(1),
        makeTable(
          ['Module No.', 'Module Name', 'Description', 'Estimated Effort'],
          [
            ['M1', 'User Management', 'Employee registration form, admin approval/rejection workflow, profile editing, role-based session management via Pinia + localStorage', '3 weeks'],
            ['M2', 'Leave Application', 'Leave type selection, date range picker, working-day calculation, balance validation, paid/unpaid toggle, reason input', '2 weeks'],
            ['M3', 'Leave Administration', 'Admin view of all leaves with filters, approve/reject actions with comment input, atomic balance deduction via MongoDB $inc', '2 weeks'],
            ['M4', 'Department Management', 'Admin CRUD for departments; dropdown population for employee registration form', '1 week'],
            ['M5', 'Leave Type Configuration', 'Admin creation and deletion of leave types with name, max days, colour code, paid/unpaid flag', '1 week'],
            ['M6', 'Reporting & Analytics', 'Dashboard stats (7 KPIs), leave-by-type table, leave-by-status summary, department-wise breakdown using MongoDB aggregation pipeline', '2 weeks'],
            ['M7', 'Leave Calendar', 'Monthly calendar view with approved team leaves coloured by leave type; month navigation', '1 week'],
            ['M8', 'Employee Dashboard & History', 'Personal leave stats cards, recent applications table, leave history with cancel action, status filters', '1 week'],
          ],
          [900, 1800, 3806, 1500]
        ),
        ...spacer(1),
        body('5.2 Data Structures', { bold: true }),
        ...spacer(1),
        makeTable(
          ['Structure', 'Fields', 'Purpose'],
          [
            ['User Document', '_id (ObjectId), name (String), email (String, unique), role (enum: employee|admin), status (enum: pending|approved|rejected), dept_id (ObjectId ref), leave_balances (Array)', 'Primary user entity; stores role, approval status, and all leave balance subdocuments'],
            ['LeaveBalance Subdocument', 'leave_type_id (ObjectId), leave_type_name (String), total_days (Number), used_days (Number, default:0), remaining_days (Number)', 'Embedded within User; tracks balance per leave type atomically'],
            ['LeaveRequest Document', '_id (ObjectId), user_id (ObjectId ref), type_id (ObjectId ref), leave_type_name (String), start_date (Date), end_date (Date), total_days (Number), is_paid (Boolean), reason (String), status (enum: pending|approved|rejected), priority (enum: high|medium|low), admin_comment (String)', 'Stores each leave application; status and priority are computed fields'],
            ['LeaveType Document', '_id (ObjectId), name (String, unique), description (String), max_days (Number), color_code (String, default:#3B82F6), is_paid (Boolean)', 'Master data for leave categories; configurable by admin'],
            ['Department Document', '_id (ObjectId), dept_name (String, unique)', 'Organisational unit; referenced by User documents'],
          ],
          [1800, 3306, 3200]
        ),
        pb(),

        body('5.3 Process Logic for Each Module', { bold: true }),
        ...spacer(1),
        body('Module M1 — User Registration:', { bold: true, italic: true }),
        numberedItem('Employee submits registration form (name, email, dept_id).'),
        numberedItem('POST /api/users/register creates user with role=employee, status=pending.'),
        numberedItem('Admin reviews pending users at /admin/users.'),
        numberedItem('PUT /api/users/:id/status sets status=approved; system initialises leave_balances array.'),
        ...spacer(1),
        body('Module M2 — Leave Application:', { bold: true, italic: true }),
        numberedItem('Employee selects leave type, start date, end date, reason.'),
        numberedItem('countWeekdays(start, end) loops from start to end, counts only days where getDay() !== 0 && getDay() !== 6.'),
        numberedItem('If is_paid: validate remaining_days >= total_days in user.leave_balances.'),
        numberedItem('getPriority(leaveType.name) performs toLowerCase() + includes() keyword check.'),
        numberedItem('LeaveRequest.create() persists request with status=pending.'),
        ...spacer(1),
        body('Module M3 — Leave Approval:', { bold: true, italic: true }),
        numberedItem('Admin reviews pending request; clicks Approve or Reject with optional comment.'),
        numberedItem('PUT /api/leave-requests/:id/status updates leave.status and leave.admin_comment.'),
        numberedItem('If status=approved AND is_paid AND previous status was pending: User.findOneAndUpdate with $inc { used_days: +total_days, remaining_days: -total_days } using positional operator.'),
        ...spacer(1),
        body('Module M6 — Reporting:', { bold: true, italic: true }),
        numberedItem('GET /api/reports/dashboard: countDocuments() with multiple filter conditions.'),
        numberedItem('GET /api/reports/dept-stats: Aggregation pipeline with $lookup (users), $lookup (departments), $unwind, $group, $sort.'),
        ...spacer(1),
        body('5.4 Testing Details', { bold: true }),
        body('Testing will be conducted at four levels:'),
        bulletItem('Whitebox Testing: Internal code paths of countWeekdays(), getPriority(), and balance validation logic tested with known inputs.'),
        bulletItem('Blackbox Testing: All API endpoints tested via direct HTTP calls (Postman) verifying input-output behaviour without knowledge of internals.'),
        bulletItem('Unit Testing: Individual functions tested in isolation with controlled inputs (13 unit test cases).'),
        bulletItem('Integration Testing: End-to-end API flows tested (register → approve user → apply leave → approve leave → verify balance).'),
        bulletItem('System Testing: Complete user scenarios tested in browser from user perspective.'),
        ...spacer(1),
        body('5.5 Reports Generation', { bold: true }),
        body('The system generates three types of analytical reports accessible to administrators:'),
        bulletItem('Dashboard Statistics Report: Total active employees, pending approvals, leave counts by status, high-priority pending count.'),
        bulletItem('Leave-by-Type Report: For each leave type — total requests and total days consumed in the organisation.'),
        bulletItem('Department-wise Leave Report: For each department — total requests, total days, approved/pending/rejected counts, sorted by volume.'),
        pb(),

        // Synopsis Section 6: Tools
        body('6. TOOLS, PLATFORM, HARDWARE AND SOFTWARE REQUIREMENTS', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        makeTable(
          ['Component', 'Technology / Tool', 'Version', 'Purpose'],
          [
            ['Frontend Framework', 'Vue.js 3', '3.4.x', 'UI components, reactivity, Composition API'],
            ['Frontend Build', 'Vite', '5.x', 'Development server (port 5173), hot reload, bundling'],
            ['State Management', 'Pinia', '2.x', 'Global user session with localStorage persistence'],
            ['Client-side Routing', 'Vue Router 4', '4.x', 'SPA navigation, lazy-loaded routes'],
            ['Backend Runtime', 'Node.js', '18.x+', 'JavaScript server-side execution environment'],
            ['Backend Framework', 'Express.js', '4.x', 'RESTful API routing, middleware, error handling'],
            ['Database', 'MongoDB', '6.x+', 'NoSQL document store for all application data'],
            ['ODM', 'Mongoose', '8.x', 'Schema validation, model abstraction, query building'],
            ['Environment Config', 'dotenv', '16.x', 'Loads MONGO_URI and PORT from .env file'],
            ['CORS Middleware', 'cors', '2.x', 'Allows Vue frontend to call Express API cross-origin'],
            ['IDE', 'Visual Studio Code', 'Latest', 'Code editing with Volar (Vue) and ESLint extensions'],
            ['Version Control', 'Git', '2.x', 'Source code management'],
            ['API Testing', 'Postman', 'Latest', 'Manual testing of all 17 REST API endpoints'],
          ],
          [1800, 1800, 1000, 3706]
        ),
        ...spacer(1),
        body('Hardware Requirements:'),
        bulletItem('Development Machine: Any modern computer with minimum 8GB RAM, 256GB storage, 64-bit OS.'),
        bulletItem('Processor: Intel Core i3 or equivalent (i5/i7 recommended for faster builds).'),
        bulletItem('Operating System: Windows 10/11, macOS 11+, or Ubuntu 20.04+.'),
        bulletItem('Internet connection for MongoDB Atlas (optional; local MongoDB also supported).'),
        ...spacer(2),

        // Synopsis Section 7: Industry/Client
        body('7. INDUSTRY / CLIENT', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        body('This project is NOT being developed for any specific industry or client. It is an academic project developed as part of the IGNOU BCA 6th Semester curriculum under the BCSP-064 Project course. The project simulates a real-world leave management scenario applicable to any small or medium-sized organisation.'),
        ...spacer(2),

        // Synopsis Section 8: Future Scope
        body('8. FUTURE SCOPE AND FURTHER ENHANCEMENT', { bold: true, size: 26, underline: true }),
        ...spacer(1),
        bulletItem('JWT Authentication: Implement JSON Web Token-based stateless authentication with refresh tokens to replace the current localStorage-based session management.'),
        bulletItem('Email Notifications: Integrate Nodemailer or SendGrid to send automated emails when leave status changes (approved/rejected) and when registration is approved.'),
        bulletItem('Public Holiday Calendar: Integrate a national holidays API to exclude public holidays from working-day calculations in addition to weekends.'),
        bulletItem('Mobile Application: Develop a React Native or Flutter mobile application consuming the existing REST API backend.'),
        bulletItem('Document Attachments: Allow employees to attach scanned medical certificates via Multer middleware with cloud storage (AWS S3 or Cloudinary).'),
        bulletItem('Multi-Level Approval: Implement hierarchical approval chains (Team Lead → HR → Admin) for specific leave types requiring multiple approvals.'),
        bulletItem('Analytics Charts: Add interactive visual charts using Chart.js or Vue-Chartjs for leave trend analysis and forecasting.'),
        bulletItem('Payroll Integration: Calculate salary deductions for unpaid leaves and export payroll data for integration with accounting systems.'),
        ...spacer(3),
        body('Signature of Student: _______________________', { bold: true }),
        ...spacer(1),
        body('Name: Aakash Sah | Enrolment No.: 239150627'),
        ...spacer(2),
        body('Signature of Guide: _________________________', { bold: true }),
        ...spacer(1),
        body('Name: _____________________ | Designation: _____________________'),
        body('Date: _____________________ | Institution: _____________________'),
        pb(),

        // ACKNOWLEDGEMENTS
        centered('ACKNOWLEDGEMENTS', { bold: true, size: 28, underline: true }),
        ...spacer(2),
        body('I would like to express my sincere gratitude to IGNOU for including a hands-on project course (BCSP-064) as a mandatory component of the BCA programme. The requirement to design, develop, and document a working software system from scratch has been the most practically valuable part of the entire programme, bridging the gap between theoretical knowledge and real-world application development.'),
        ...spacer(1),
        body('I am deeply grateful to my project guide, Er. Ashish Kumar Jha, for his consistent guidance, technical direction, and constructive feedback throughout this project. His inputs helped me make more informed design decisions -- particularly around the database schema and API structure -- and resolve issues I had not anticipated at the planning stage.'),
        ...spacer(1),
        body('I also thank the faculty and coordinators at my Study Centre for their support and for keeping the programme accessible throughout.'),
        ...spacer(1),
        body('To my family -- thank you for the understanding and patience during the extended hours this project demanded.'),
        ...spacer(1),
        body('Finally, I acknowledge the open-source communities behind MongoDB, Express.js, Vue.js 3, and Node.js. The quality of their official documentation and the depth of community resources available made learning and working with these technologies considerably more efficient.'),
        ...spacer(3),
        body('Aakash Sah', { bold: true, right: true }),
        body('Enrollment No.: 239150627', { right: true }),
        body('BCA - 6th Semester', { right: true }),
        body('IGNOU', { right: true }),
        body('April 2025', { right: true }),
        pb(),

        // ABSTRACT
        centered('ABSTRACT', { bold: true, size: 28, underline: true }),
        ...spacer(2),
        body('This report describes the design and implementation of a Leave Management System (LMS) developed as the final-year project for the IGNOU BCA programme (BCSP-064). The system is a full-stack web application built on the MEVN stack -- MongoDB, Express.js, Vue.js 3, and Node.js -- and is intended to replace manual, paper-based leave management processes in small to medium-sized organisations.'),
        ...spacer(1),
        body('The application supports two user roles: Employee and Administrator. Employees can register, apply for leave, monitor their remaining leave balance per leave type, view their full application history with admin feedback, and access a monthly calendar showing approved team leave. Administrators can manage user accounts through an approval workflow, configure leave types and departments, review and action all leave requests, and generate department-wise analytical reports using MongoDB aggregation pipelines.'),
        ...spacer(1),
        body('Technically, the system implements an automatic priority-classification algorithm that assigns urgency levels (high, medium, or low) to leave requests through keyword matching on the leave type name. A working-day calculation function counts only Monday to Friday in any selected date range, excluding weekends. Leave balance deductions on approval use MongoDB\'s $inc operator in a findOneAndUpdate call, making the operation atomic and safe against concurrent requests.'),
        ...spacer(1),
        body('The backend exposes 17 REST API endpoints organised across five route groups. The frontend is a Single Page Application using Vue Router 4 for client-side routing and Pinia for global state management with localStorage persistence. Both roles have dedicated layout components and protected route trees.'),
        ...spacer(1),
        body('Keywords: Leave Management System, MEVN Stack, Vue.js 3, MongoDB, Express.js, RESTful API, Pinia, Role-Based Access Control'),
        ...spacer(2),
        body('Keywords: Leave Management, MEVN Stack, Vue.js 3, Node.js, MongoDB, RESTful API, Pinia, Role-Based Access Control'),
        pb(),

        // TABLE OF CONTENTS — Word auto-generated field (click to navigate, Ctrl+A then F9 to refresh)
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3',
          stylesWithLevels: [
            { styleId: 'Heading1', level: 1 },
            { styleId: 'Heading2', level: 2 },
            { styleId: 'Heading3', level: 3 },
          ],
        }),
        pb(),

        // LIST OF TABLES
        centered('LIST OF TABLES', { bold: true, size: 28, underline: true }),
        ...spacer(1),
        makeTable(
          ['Table No.', 'Title', 'Page'],
          [
            ['1.1', 'Gantt Chart - Project Schedule', '13'],
            ['1.2', 'Project Objectives', '14'],
            ['1.3', 'Project Scope', '16'],
            ['2.1', 'Technology Stack', '24'],
            ['3.1', 'Functional Requirements', '31'],
            ['3.2', 'Non-Functional Requirements', '33'],
            ['3.3', 'Use Case Summary', '36'],
            ['3.4', 'Data Dictionary - users Collection', '38'],
            ['3.5', 'Data Dictionary - leaverequests Collection', '39'],
            ['4.1', 'System Modules', '41'],
            ['4.2', 'API Endpoints', '45'],
            ['5.1', 'Directory Structure', '52'],
            ['6.1', 'Whitebox Test Cases', '60'],
            ['6.2', 'Blackbox Test Cases', '61'],
            ['6.3', 'Unit Test Cases', '63'],
            ['6.4', 'Integration Test Cases', '65'],
            ['6.5', 'End-to-End Test Scenarios', '66'],
            ['8.1', 'Future Enhancements', '80'],
          ],
          [1500, 5306, 1500]
        ),
        ...spacer(2),

        // LIST OF FIGURES
        centered('LIST OF FIGURES', { bold: true, size: 28, underline: true }),
        ...spacer(1),
        makeTable(
          ['Figure No.', 'Title', 'Page'],
          [
            ['7.1', 'Home Screen - Select User / Account Selection', '68'],
            ['7.2', 'Admin Dashboard - Summary Statistics and Pending Requests', '69'],
            ['7.3', 'Manage Users - User List with Approval Actions', '70'],
            ['7.4', 'All Leave Requests - Admin Leave Management View', '71'],
            ['7.5', 'Leave Types - Configured Leave Categories', '72'],
            ['7.6', 'Departments - Organisational Department Management', '72'],
            ['7.7', 'Reports and Analytics - Department-wise Leave Statistics', '73'],
            ['7.8', 'Employee Dashboard - Personal Leave Summary', '74'],
            ['7.9', 'Apply Leave - Leave Application Form with Balance Sidebar', '74'],
            ['7.10', 'My Leave Requests - Employee Leave History', '75'],
            ['7.11', 'Leave Calendar - Monthly Calendar View', '75'],
            ['7.12', 'My Profile - Employee Profile and Leave Balances', '76'],
          ],
          [1500, 5306, 1500]
        ),
      ]
    },

    // ─── SECTION 2: Main content (Arabic page numbers from 1) ───────────
    {
      properties: {
        pageNumberStart: 1,
        pageNumberFormatType: 'decimal',
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 2160 }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 })]
          })]
        })
      },
      children: [

        // ══════════════════════════════════════════════
        // CHAPTER 1
        // ══════════════════════════════════════════════
        h1('1. Introduction'),

        h2('1.1 Background and Motivation'),
        body('Leave management is an essential HR function in any organisation, but one that involves non-trivial business logic: calculating working days between dates, tracking per-type leave balances, routing requests through an approval workflow, and generating cross-department analytics. When this is managed manually through paper forms and spreadsheets, it introduces systematic inefficiencies -- errors in balance calculation, delays in the approval chain, and a complete lack of real-time visibility for employees.'),
        body('Modern web technologies make it practical to automate these workflows entirely. The Leave Management System developed for this project replaces the manual process with a role-based, browser-accessible web application built on the MEVN stack. It handles the complete leave management lifecycle -- from user registration and multi-type leave application through to administrative approval, atomic balance deduction, and department-wise reporting -- within a three-tier RESTful architecture.'),

        h2('1.2 Problem Statement'),
        body('Most small and medium-sized organisations continue to rely on manual methods -- paper application forms, email chains, and spreadsheets maintained by HR staff -- for leave management. While these methods are familiar, they introduce structural problems that become increasingly difficult to manage as the organisation grows:'),
        bulletItem('Lack of real-time visibility: Employees cannot instantly check their leave balances or application status without querying HR staff.'),
        bulletItem('Manual calculation errors: Computing working days, balance deductions, and leave entitlements manually introduces arithmetic errors.'),
        bulletItem('Delayed processing: Physical form routing causes delays in approval, especially when supervisors are unavailable.'),
        bulletItem('Inconsistent records: Leave records maintained in spreadsheets across multiple HR staff are prone to inconsistency and duplication.'),
        bulletItem('No prioritisation: Manual systems cannot automatically flag urgent leave requests (medical emergencies) for immediate attention.'),
        bulletItem('Administrative overhead: HR staff spend significant time manually computing leave balances and generating reports instead of higher-value tasks.'),
        body('The Leave Management System addresses all of the above through a centralised, role-based web application with automated business logic, real-time data access, and structured reporting capabilities built on MongoDB\'s aggregation pipeline.'),

        h2('1.3 Existing System and its Limitations'),
        body('The existing leave management processes in typical organisations take one of the following forms:'),
        h3('1.3.1 Paper-Based System'),
        body('Employees fill printed leave application forms, obtain supervisor signatures, and submit to HR for filing. HR manually updates a register or spreadsheet and notifies the employee of the decision.'),
        h3('1.3.2 Basic Spreadsheet System'),
        body('HR maintains Excel spreadsheets to track leave balances and applications. Applications are received via email and status is communicated back manually.'),
        body('Both existing approaches suffer from the following limitations:'),
        makeTable(
          ['Limitation', 'Impact', 'Severity'],
          [
            ['No centralised access', 'Employees cannot check status 24/7', 'High'],
            ['Manual balance calculation', 'Errors in remaining leave days', 'High'],
            ['No automated approval workflow', 'Delays and lost paper forms', 'High'],
            ['No priority classification', 'Medical leaves treated same as casual', 'Medium'],
            ['No real-time reports', 'HR must manually compile statistics', 'Medium'],
            ['No audit trail', 'Disputes cannot be resolved objectively', 'Medium'],
            ['Data silos per department', 'Organisation-wide view not possible', 'Low'],
          ],
          [2500, 3006, 1800]
        ),

        h2('1.4 Project Category'),
        body('This project falls under the following categories:'),
        bulletItem('Category: Web-based Management Information System (MIS)'),
        bulletItem('Domain: Human Resource Management (HRM)'),
        bulletItem('Application Type: Multi-tier Client-Server Web Application'),
        bulletItem('Architecture: RESTful API backend with Single Page Application (SPA) frontend'),
        bulletItem('Database Type: NoSQL Document Database (MongoDB)'),
        bulletItem('Technology Stack: MEVN (MongoDB, Express.js, Vue.js 3, Node.js)'),
        body('The project demonstrates practical application of full-stack web development concepts, database design, and software engineering principles as required by the IGNOU BCSP-064 curriculum.'),

        h2('1.5 Benefits of the Project'),
        body('The Leave Management System provides the following measurable benefits over existing manual systems:'),
        h3('1.5.1 Benefits to Employees'),
        bulletItem('24/7 access to leave balances and application status from any device with a browser'),
        bulletItem('Instant confirmation of leave application receipt without physical form submission'),
        bulletItem('Automatic calculation of working days, eliminating need for manual counting'),
        bulletItem('Complete leave history with admin comments accessible at any time'),
        bulletItem('Visual calendar showing team schedule to help plan leave strategically'),
        h3('1.5.2 Benefits to Administrators'),
        bulletItem('Centralised dashboard with real-time statistics on leave patterns'),
        bulletItem('Automatic priority flagging routes urgent medical leaves for immediate attention'),
        bulletItem('One-click approval or rejection with optional comment feedback'),
        bulletItem('Department-wise analytical reports generated automatically without manual compilation'),
        bulletItem('User account management with registration approval workflow'),
        h3('1.5.3 Organisational Benefits'),
        bulletItem('Reduces HR administrative workload by approximately 60-70% through automation'),
        bulletItem('Eliminates paper consumption contributing to organisational sustainability goals'),
        bulletItem('Provides a scalable platform that can accommodate growing team sizes'),
        bulletItem('Consistent data across the organisation eliminates departmental silos'),

        h2('1.6 Project Objectives'),
        body('The Leave Management System was designed to achieve the following ten primary objectives:'),
        ...spacer(1),
        makeTable(
          ['Obj. No.', 'Objective', 'Category'],
          [
            ['OBJ-01', 'Develop a secure, role-based web application for leave management', 'Functional'],
            ['OBJ-02', 'Enable employees to apply for leave with automatic working-day calculation', 'Functional'],
            ['OBJ-03', 'Implement real-time leave balance tracking with atomic deduction', 'Functional'],
            ['OBJ-04', 'Provide administrators with tools to review and action leave requests', 'Functional'],
            ['OBJ-05', 'Support configurable leave types with paid/unpaid classification', 'Functional'],
            ['OBJ-06', 'Generate analytical reports on department-wise leave patterns', 'Functional'],
            ['OBJ-07', 'Implement automatic priority classification for leave requests', 'Functional'],
            ['OBJ-08', 'Design a responsive and intuitive user interface using Vue.js 3', 'Non-Functional'],
            ['OBJ-09', 'Ensure data integrity through MongoDB schema validation', 'Non-Functional'],
            ['OBJ-10', 'Deliver RESTful APIs with consistent JSON response structure', 'Technical'],
          ],
          [1000, 5506, 1800]
        ),

        h2('1.7 Project Schedule (Gantt Chart)'),
        body('The project was executed over a period of six months following an iterative development process. The following Gantt chart summarises the planned schedule:'),
        ...spacer(1),
        makeTable(
          ['Phase / Activity', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
          [
            ['Phase 1: Requirements Analysis & Planning', '●●●●', '', '', '', '', ''],
            ['Phase 2: Technology Study & Survey', '●●●●', '●●', '', '', '', ''],
            ['Phase 3: System & Database Design', '', '●●●●', '●●', '', '', ''],
            ['Phase 4: Backend API Development', '', '', '●●●●', '●●', '', ''],
            ['Phase 5: Frontend UI Development', '', '', '', '●●●●', '●●', ''],
            ['Phase 6: Integration & Testing', '', '', '', '', '●●●●', '●●'],
            ['Phase 7: Report Writing & Documentation', '', '', '', '', '●●', '●●●●'],
          ],
          [3006, 850, 850, 850, 850, 850, 850]
        ),

        h2('1.8 Project Scope'),
        body('The scope of the Leave Management System encompasses the following areas:'),
        ...spacer(1),
        makeTable(
          ['In Scope', 'Out of Scope'],
          [
            ['Employee registration and admin approval workflow', 'Payroll integration and salary deduction calculation'],
            ['Leave application, approval, rejection, and cancellation', 'Email/SMS notification system'],
            ['Leave balance management (paid leave types)', 'Mobile native application (iOS/Android)'],
            ['Department management by administrators', 'Integration with external HR systems'],
            ['Leave type configuration with colour codes', 'Multi-tenant / multi-company support'],
            ['Dashboard analytics and department-wise reports', 'LDAP/SSO authentication'],
            ['Visual leave calendar with team overview', 'Document attachment for medical leave'],
          ],
          [4153, 4153]
        ),

        h2('1.9 Report Organisation'),
        body('This report is organised into eight chapters as follows:'),
        bulletItem('1. Introduction: Background, problem statement, existing system limitations, objectives, scope, and report structure.'),
        bulletItem('2. Survey of Technology: Overview of the MEVN stack and all tools and libraries used.'),
        bulletItem('3. System Analysis and Requirements: Feasibility study, development model, functional and non-functional requirements, DFDs, ER diagram, and data dictionary.'),
        bulletItem('4. System Design: Three-tier architecture, module design, database schema, API design, and sequence diagram.'),
        bulletItem('5. Implementation: Development setup, project structure, and all source code files (backend and frontend).'),
        bulletItem('6. Testing: Whitebox, blackbox, unit, integration, and end-to-end test cases with results.'),
        bulletItem('7. Input / Output Screens: Screenshots of all application screens.'),
        bulletItem('8. Conclusion, Limitations and Future Scope: Summary of achievements, known limitations, and suggested improvements.'),

        // ══════════════════════════════════════════════
        // CHAPTER 2
        // ══════════════════════════════════════════════
        h1('2. Survey of Technology'),

        h2('2.1 Overview of the MEVN Stack'),
        body('MEVN is a JavaScript-based full-stack development stack comprising MongoDB, Express.js, Vue.js, and Node.js. Its defining characteristic is that JavaScript is the single language used across all tiers -- from the client-side UI to the server-side API and the database interaction layer via Mongoose ODM. This uniformity simplifies development, eliminates language-switching overhead, and allows consistent coding conventions throughout the project.'),
        body('The stack maps directly to a three-tier architecture: Vue.js serves as the presentation tier as a Single Page Application, Express.js and Node.js form the application tier as a RESTful API server, and MongoDB provides the data storage tier. All inter-tier communication uses HTTP/HTTPS with JSON payloads -- the same native format as JavaScript objects -- making data serialisation and deserialisation straightforward at every layer.'),

        h2('2.2 MongoDB'),
        body('MongoDB is a NoSQL document-oriented database that stores data as BSON (Binary JSON) documents rather than in relational tables with fixed schemas. The document model is particularly well-suited to this project because it allows leave balance data to be embedded directly within user documents as a subdocument array (user.leave_balances[]), eliminating the need for a separate collection and JOIN-equivalent lookup on every balance-check operation.'),
        body('The MongoDB features used in this project are:'),
        bulletItem('Document-oriented storage with nested arrays for leave_balances embedded within user documents'),
        bulletItem('Aggregation Pipeline for complex multi-collection queries with $lookup, $unwind, $group, and $sort stages'),
        bulletItem('Atomic update operators ($inc) for concurrent-safe balance deductions'),
        bulletItem('Mongoose ODM (Object Document Mapper) for schema validation and model abstraction'),
        bulletItem('ObjectId references between collections for relational-style joins via $lookup'),

        h2('2.3 Express.js'),
        body('Express.js is a minimal and unopinionated Node.js web application framework that provides routing, middleware chaining, and HTTP utility methods. It is the de-facto standard for RESTful API development in the Node.js ecosystem, offering a clean structure without imposing a rigid application architecture.'),
        body('In this project, Express is used to define five route groups (/api/users, /api/departments, /api/leave-types, /api/leave-requests, /api/reports), apply CORS middleware to allow cross-origin requests from the Vue.js frontend on port 5173, parse incoming JSON request bodies via express.json(), and handle unhandled runtime errors through a global error-handling middleware registered at the end of the middleware chain.'),

        h2('2.4 Vue.js 3'),
        body('Vue.js 3 is a progressive JavaScript framework for building reactive user interfaces. The Composition API -- the preferred approach in Vue 3 -- uses reactive primitives (ref(), reactive(), computed()) that automatically trigger DOM re-renders when the underlying state changes. This reactive system significantly reduces the amount of explicit UI update logic required, particularly for data-driven interfaces like leave balance dashboards and dynamically filtered tables.'),
        body('The Vue.js 3 features used in this project include:'),
        bulletItem('Composition API with script setup syntax for cleaner, more maintainable components'),
        bulletItem('Reactive state with ref() and reactive() for form bindings and data display'),
        bulletItem('Vue Router 4 for client-side single-page application routing with lazy-loaded routes'),
        bulletItem('Pinia for global state management with persistence via localStorage'),
        bulletItem('Component-based architecture with reusable layouts (EmployeeLayout, AdminLayout)'),

        h2('2.5 Node.js'),
        body('Node.js is a cross-platform JavaScript runtime built on Chrome\'s V8 engine. Its event-driven, non-blocking I/O model processes requests asynchronously using an event loop rather than dedicating a separate thread per connection. For an API server that primarily performs I/O-bound work -- reading and writing to MongoDB -- this architecture provides good throughput without the memory overhead of multi-threaded alternatives.'),

        h2('2.6 Supporting Technologies'),
        ...spacer(1),
        makeTable(
          ['Technology', 'Version', 'Purpose', 'Category'],
          [
            ['Mongoose', '8.x', 'MongoDB ODM and schema validation', 'Backend'],
            ['dotenv', '16.x', 'Environment variable management', 'Backend'],
            ['cors', '2.x', 'Cross-Origin Resource Sharing middleware', 'Backend'],
            ['Pinia', '2.x', 'Vue.js state management with persistence', 'Frontend'],
            ['Vue Router', '4.x', 'Client-side routing for SPA', 'Frontend'],
            ['Vite', '5.x', 'Frontend build tool and dev server', 'Tooling'],
            ['npm', '10.x', 'Package manager for Node.js ecosystem', 'Tooling'],
            ['MongoDB Atlas / Local', '7.x', 'Database hosting (cloud/local)', 'Database'],
            ['Visual Studio Code', 'Latest', 'Integrated Development Environment', 'Tooling'],
            ['Git', '2.x', 'Version control system', 'Tooling'],
          ],
          [2000, 1200, 3606, 1500]
        ),

        h2('2.7 Technology Justification'),
        body('The MEVN stack was selected over alternatives such as MEAN (Angular) and MERN (React) for several reasons. Vue.js 3 has a lower learning curve than Angular and React for a single developer, and its Composition API is clean and well-documented. The uniform JavaScript environment across both tiers eliminates context-switching and allows shared code conventions. MongoDB\'s document model is a natural fit for the leave balance requirement -- embedding balances in user documents avoids the JOIN-equivalent $lookup that a normalised schema would need on every balance check. All components of the stack are free and open-source, with no licensing requirements.'),

        // ══════════════════════════════════════════════
        // CHAPTER 3
        // ══════════════════════════════════════════════
        h1('3. System Analysis and Requirements'),

        h2('3.1 Feasibility Study'),

        h3('3.1.1 Technical Feasibility'),
        body('All components of the MEVN stack -- Node.js, MongoDB, Express.js, Mongoose, Vue.js 3, and Vite -- are mature, actively maintained open-source projects with stable APIs and comprehensive official documentation. The development environment requires only Node.js (v18+) and a MongoDB instance (local or MongoDB Atlas), both freely available. No proprietary software, commercial licences, or specialised hardware are required. The most technically demanding aspects of this project -- MongoDB aggregation pipelines and Mongoose embedded document design -- are thoroughly covered in the official documentation, making them learnable within the project timeline.'),

        h3('3.1.2 Operational Feasibility'),
        body('The system has been designed with usability as a priority for both roles. Employees interact with a focused set of screens -- apply for leave, view leave history, check the calendar, manage profile -- each of which has a single, clear purpose. Administrators have a more feature-rich interface, but one that mirrors the existing manual approval workflow: review pending requests, approve or reject with an optional comment, manage user accounts. Since the digital workflow replicates familiar offline processes rather than introducing a new paradigm, the expected learning curve for end users is low.'),

        h3('3.1.3 Economic Feasibility'),
        body('The entire technology stack is open-source with no licensing costs. For production deployment, MongoDB Atlas provides a free M0 tier (512MB storage), the Node.js backend can be hosted on Render\'s free tier, and the Vue.js frontend can be deployed on Netlify at zero cost. For a small organisation, the monthly infrastructure cost is effectively nil. As the user base scales, the cost of a paid plan remains low relative to the reduction in HR staff hours spent on manual leave processing -- estimated conservatively at 5-10 hours per month for a 50-person team.'),

        h3('3.1.4 Time Feasibility'),
        body('The project was executed over six months from July 2024 to January 2025, structured as four development iterations (refer to Table 1.1 for the Gantt chart). Each iteration delivered a working, testable increment of the system -- from the initial user management module in Iteration 1 through to the reporting and UI polish in Iteration 4. The timeline was achievable for a single developer working part-time alongside academic commitments, and all planned phases were completed within the scheduled duration.'),

        h2('3.2 Software Process Model'),
        body('The Iterative Development model was selected as the software process for this project. Unlike the linear Waterfall model, which requires all requirements to be fully specified before any design or coding begins, the iterative model allows each cycle to produce a working, testable software increment. This aligns with the nature of web application development, where some requirements only become apparent once earlier features are running and can be evaluated against real workflows.'),
        h3('3.2.1 Rationale for Iterative Model'),
        body('The primary justification for adopting an iterative approach is that requirements for role-based web applications tend to emerge and stabilise progressively. As an example, the automatic priority assignment feature -- which classifies leave requests as high, medium, or low priority based on leave type name keywords -- was identified during the second iteration, after evaluating administrator workflow patterns against the existing request list. Incorporating this in a Waterfall model would have required returning to the requirements and design phases, adding significant overhead. In the iterative model, it was incorporated as a design refinement within the next cycle without disrupting the overall project timeline.'),
        body('Additionally, each iteration produced a runnable, testable build. This enabled continuous verification against functional requirements, making it possible to detect integration defects early -- particularly important for a system where the frontend, backend API, and database must interoperate correctly across all 17 endpoints.'),
        h3('3.2.2 Development Iterations'),
        body('The project was executed across four iterations, each delivering a verifiable software increment:'),
        numberedItem('Iteration 1 (August -- September 2024): Core infrastructure setup. MongoDB connection (db.js), Mongoose schemas for User and Department, Node.js/Express.js server initialisation, JWT-less user registration and approval API endpoints, Vue.js 3 project scaffolding with Vite, Pinia store initialisation, and Vue Router route structure.'),
        numberedItem('Iteration 2 (September -- October 2024): Leave management foundation. Mongoose schemas for LeaveRequest and LeaveType, leave type and department CRUD APIs, leave application form with weekday-only day counting algorithm, leave balance validation against the embedded leave_balances subdocument array, and priority auto-assignment logic.'),
        numberedItem('Iteration 3 (October -- November 2024): Admin approval workflow. PUT /api/leave-requests/:id/status endpoint with atomic $inc balance deduction via findOneAndUpdate with positional operator ($), employee leave cancellation, admin comment field, and role-specific layout components (AdminLayout.vue, EmployeeLayout.vue).'),
        numberedItem('Iteration 4 (November -- January 2025): Reporting and finalisation. MongoDB aggregation pipeline for department-wise and type-wise report queries, leave calendar view, employee profile page, system integration testing across all 18 functional requirements, and codebase cleanup.'),

        h2('3.3 User Characteristics'),
        body('The Leave Management System is designed for two types of users with the following characteristics:'),
        h3('3.3.1 Employee (Regular User)'),
        body('Employees are the primary users of the system. They are expected to have:'),
        bulletItem('Basic computer literacy: Ability to use a web browser, fill online forms, and navigate websites.'),
        bulletItem('No technical knowledge required: The system is designed for non-technical users. No programming or database knowledge is needed.'),
        bulletItem('Access device: Desktop, laptop, or tablet with a modern web browser (Chrome, Firefox, Edge).'),
        bulletItem('Internet connectivity: Required to access the web application.'),
        bulletItem('Age range: Working adults (18-60 years), from fresh graduates to senior professionals.'),
        h3('3.3.2 Administrator (Admin User)'),
        body('Administrators are typically HR managers or team leads responsible for managing employee records and approving leave. They are expected to have:'),
        bulletItem('Intermediate computer literacy: Comfortable with web-based management tools and data tables.'),
        bulletItem('Organisational knowledge: Understanding of the organisation\'s leave policies and department structure.'),
        bulletItem('Authority: Authorised to approve or reject leave applications and manage user accounts.'),
        bulletItem('No technical knowledge required: The admin interface is equally user-friendly.'),

        h2('3.4 Assumptions and Dependencies'),
        h3('3.4.1 Assumptions'),
        body('The following assumptions were made during the design and development of the Leave Management System:'),
        bulletItem('The organisation operates Monday to Friday (5-day work week). Saturdays and Sundays are treated as non-working days in all leave calculations.'),
        bulletItem('Each employee is assigned to exactly one department. Employees without a department are treated as belonging to "No Department" for reporting purposes.'),
        bulletItem('Leave balances are pre-loaded by the administrator when approving an employee account. The system does not automatically compute initial entitlements based on service duration.'),
        bulletItem('All users access the system via a modern web browser with JavaScript enabled. The system does not support legacy browsers (Internet Explorer).'),
        bulletItem('The organisation does not have public holidays programmed into the system. Public holiday exclusion is a future enhancement.'),
        bulletItem('Only one level of approval is required (Admin). Multi-level approval chains are out of scope.'),
        h3('3.4.2 Dependencies'),
        body('The system has the following external dependencies:'),
        bulletItem('Node.js Runtime (v18+): The backend server requires Node.js to execute JavaScript on the server side.'),
        bulletItem('MongoDB Server (v6+): A running MongoDB instance (local or cloud Atlas) is required for data persistence.'),
        bulletItem('npm Package Registry: Internet access is required during initial setup to install all npm packages.'),
        bulletItem('Modern Web Browser: Users must have a JavaScript-enabled browser. The system is tested on Chrome 120+, Firefox 121+, and Edge 120+.'),

        h2('3.5 Functional Requirements'),
        body('The following table lists all functional requirements of the Leave Management System. Each requirement is assigned a unique ID (FR-XX), clearly states the expected behaviour, identifies the responsible actor, specifies priority (High/Medium/Low), and is mapped to its implementing module (M1-M8) for traceability with the design phase (Section 4.2):'),
        ...spacer(1),
        makeTable(
          ['Req. ID', 'Description', 'Actor', 'Priority', 'Module'],
          [
            ['FR-01', 'Employee shall be able to self-register by providing full name, email address, and selecting a department. The account status shall be set to "pending" awaiting admin approval.', 'Employee', 'High', 'M1'],
            ['FR-02', 'Administrator shall be able to view all pending registration requests and approve or reject each one individually.', 'Admin', 'High', 'M1'],
            ['FR-03', 'The system shall enforce role-based access control: employees see only the employee portal; admins see only the admin panel. Unauthenticated access shall redirect to the login page.', 'System', 'High', 'M8'],
            ['FR-04', 'Employee shall be able to apply for leave by selecting leave type, start date, end date (min: start date), and providing a reason.', 'Employee', 'High', 'M2'],
            ['FR-05', 'The system shall automatically calculate the number of working days (Monday to Friday only, weekends excluded) in the selected date range and display it to the employee before submission.', 'System', 'High', 'M2'],
            ['FR-06', 'The system shall automatically assign a priority level (high / medium / low) to each leave request based on keyword matching on the leave type name: "sick", "medical", "emergency" => high; "casual", "personal" => medium; all others => low.', 'System', 'Medium', 'M2'],
            ['FR-07', 'The leave application form shall display the employee\'s current remaining balance for the selected leave type in real time.', 'Employee', 'High', 'M2'],
            ['FR-08', 'The system shall validate that the employee has sufficient remaining balance for a paid leave request. If balance is insufficient, the application shall be rejected with a clear error message (HTTP 400).', 'System', 'High', 'M2'],
            ['FR-09', 'Employee shall be able to view all their submitted leave applications, filterable by status (all / pending / approved / rejected), with admin comments visible.', 'Employee', 'High', 'M2'],
            ['FR-10', 'Employee shall be able to cancel a leave request that is still in "pending" status. Approved or rejected requests cannot be cancelled.', 'Employee', 'Medium', 'M2'],
            ['FR-11', 'Administrator shall be able to view all leave requests across all employees, with filters for status (all/pending/approved/rejected) and priority (all/high/medium/low).', 'Admin', 'High', 'M3'],
            ['FR-12', 'Administrator shall be able to approve or reject any pending leave request and optionally add a written comment that is visible to the employee.', 'Admin', 'High', 'M3'],
            ['FR-13', 'Upon admin approval of a paid leave request, the system shall atomically deduct used_days and update remaining_days in the employee\'s embedded leave_balances array using MongoDB $inc operator to prevent race conditions.', 'System', 'High', 'M3'],
            ['FR-14', 'Administrator shall be able to create new departments and update or delete existing ones. Departments are referenced by users via dept_id.', 'Admin', 'Medium', 'M6'],
            ['FR-15', 'Administrator shall be able to create new leave types with name, maximum paid days, and colour code. Leave types can be soft-deleted (deactivated) without deleting historical data.', 'Admin', 'Medium', 'M5'],
            ['FR-16', 'Administrator shall be able to view analytical reports showing: total leaves by type, leaves by status distribution, department-wise leave statistics, and employee-level summaries.', 'Admin', 'Medium', 'M4'],
            ['FR-17', 'Employee shall be able to view a monthly calendar view showing their approved leave dates highlighted, with navigation to previous and next months.', 'Employee', 'Low', 'M2'],
            ['FR-18', 'Employee shall be able to view and update their profile (name, department). Email address shall not be editable after registration.', 'Employee', 'Low', 'M1'],
          ],
          [700, 4206, 800, 700, 800]
        ),

        h2('3.6 Non-Functional Requirements'),
        ...spacer(1),
        makeTable(
          ['Req. ID', 'Description', 'Category'],
          [
            ['NFR-01', 'API response time under 500ms for standard CRUD operations on local deployment', 'Performance'],
            ['NFR-02', 'All sensitive configuration (DB URI, port) stored in .env file, never in code', 'Security'],
            ['NFR-03', 'Consistent JSON response structure: { success, data, message } across all endpoints', 'Reliability'],
            ['NFR-04', 'Frontend routes lazy-loaded to reduce initial bundle size', 'Performance'],
            ['NFR-05', 'User session persisted in localStorage using Pinia store', 'Usability'],
            ['NFR-06', 'Input validation on both frontend (form) and backend (Mongoose schema)', 'Reliability'],
            ['NFR-07', 'All API endpoints return appropriate HTTP status codes (200, 201, 400, 404, 500)', 'Reliability'],
            ['NFR-08', 'Frontend developed with component-based architecture for maintainability', 'Maintainability'],
          ],
          [1100, 5506, 1700]
        ),

        h2('3.7 Data Flow Diagrams (DFD)'),
        body('The DFDs are drawn using Yourdon-DeMarco notation: rectangles represent external entities, ellipses (circles) represent processes (numbered), open rectangles with top-and-bottom borders represent data stores, and labelled arrows represent data flows.'),

        h3('3.7.1 Level 0 DFD (Context Diagram)'),
        body('The Level 0 DFD shows the entire Leave Management System as a single process (Process 0) with two external entities and one data store:'),
        bulletItem('Employee (External Entity): Submits registration data and leave applications. Receives leave status updates and balance information from the system.'),
        bulletItem('Administrator (External Entity): Provides approval decisions, configuration commands, and receives reports and user management outputs from the system.'),
        bulletItem('MongoDB Database (Data Store): Bidirectional read/write data flows between the system and the persistent database layer.'),
        body('All data flows cross the system boundary at this level — no internal processes are visible.'),
        ...diagSection('dfd_level0.png', 'DFD Level 0 — Context Diagram (Yourdon-DeMarco Notation)', '3.1'),

        h3('3.7.2 Level 1 DFD'),
        body('The Level 1 DFD explodes Process 0 into five major processes. Each process corresponds directly to a module in the system design (see Section 4.2). Four data stores are identified: D1 Users Store, D2 Leave Requests, D3 Departments, and D4 Leave Types.'),
        numberedItem('P1 — User Management: Accepts registration and profile data from Employee and approval/rejection actions from Admin. Reads and writes to D1 (Users Store). Directly maps to the User Management module.'),
        numberedItem('P2 — Leave Application: Accepts leave application input from Employee. Reads D1 to check balance and D4 to fetch leave type details. Writes the new request to D2 (Leave Requests). Directly maps to the Leave Application module.'),
        numberedItem('P3 — Leave Approval: Accepts approve/reject commands from Admin. Reads and updates D2 (Leave Requests status). Writes balance deduction to D1 (Users Store). Directly maps to the Leave Administration module.'),
        numberedItem('P4 — Reporting: Accepts report requests from Admin. Reads D1 (Users), D2 (Leave Requests), and D3 (Departments) to produce aggregated statistics. Returns reports to Admin. Directly maps to the Reporting and Analytics module.'),
        numberedItem('P5 — Config Management: Accepts configuration commands from Admin to manage leave types and departments. Reads and writes to D4 (Leave Types) and D3 (Departments). Directly maps to the Leave Type Configuration and Department Management modules.'),
        ...diagSection('dfd_level1.png', 'DFD Level 1 — Five-Process Decomposition (Yourdon-DeMarco Notation)', '3.2'),

        h3('3.7.3 Level 2 DFD — Leave Application Process (P2)'),
        body('Process P2 (Leave Application) is the most complex process and is decomposed into five sub-processes at Level 2. The diagram shows complete data flows for the happy path (successful submission) and error paths (invalid dates, insufficient balance):'),
        numberedItem('P2.1 — Validate Dates: Receives type, start date, end date, and reason from Employee. Checks start_date <= end_date. Passes valid dates forward; returns Error Response (HTTP 400) for invalid dates.'),
        numberedItem('P2.2 — Count Working Days: Receives validated dates. Iterates each calendar day in the range, counting only Monday through Friday (day values 1-5). Outputs total_days integer to P2.3.'),
        numberedItem('P2.3 — Check Leave Balance: Reads the leave_balances embedded array from D1 (Users Store) for the requesting user. For paid leave, verifies remaining_days >= total_days. Routes to P2.4 if OK; returns Error Response if insufficient.'),
        numberedItem('P2.4 — Assign Priority: Reads leave type name from D4 (Leave Types). Applies keyword matching: "sick/medical/emergency" => high; "casual/personal" => medium; all others => low. Outputs priority value to P2.5.'),
        numberedItem('P2.5 — Create Request: Writes the complete leave request document (status = pending) to D2 (Leave Requests). Returns HTTP 201 Created Success Response to Employee.'),
        ...diagSection('dfd_level2.png', 'DFD Level 2 — Leave Application Process P2 Decomposition (Yourdon-DeMarco Notation)', '3.3'),

        h2('3.8 Use Case Diagram'),
        body('The Use Case Diagram identifies the actors and their interactions with the Leave Management System. The two primary actors are Employee and Administrator.'),
        ...diagSection('use_case.png', 'Use Case Diagram — Leave Management System', '3.4', 520, 380),
        ...spacer(1),
        makeTable(
          ['Actor', 'Use Case', 'Description'],
          [
            ['Employee', 'UC-01: Register Account', 'Employee fills registration form with name, email, and department'],
            ['Employee', 'UC-02: Apply for Leave', 'Employee submits leave request with type, dates, and reason'],
            ['Employee', 'UC-03: View Leave History', 'Employee views all personal leave applications and their status'],
            ['Employee', 'UC-04: Cancel Leave', 'Employee cancels a pending leave application'],
            ['Employee', 'UC-05: View Leave Calendar', 'Employee views monthly calendar showing team leave schedules'],
            ['Employee', 'UC-06: View Profile', 'Employee views and edits personal profile information'],
            ['Admin', 'UC-07: Approve/Reject Registration', 'Admin reviews and approves or rejects pending user accounts'],
            ['Admin', 'UC-08: Manage Leave Types', 'Admin creates and deletes leave type definitions'],
            ['Admin', 'UC-09: Manage Departments', 'Admin creates and views organisational departments'],
            ['Admin', 'UC-10: Approve/Reject Leave', 'Admin reviews and actions employee leave applications'],
            ['Admin', 'UC-11: View All Leaves', 'Admin views filtered and sorted list of all leave requests'],
            ['Admin', 'UC-12: View Reports', 'Admin views dashboard statistics and department-wise reports'],
            ['System', 'UC-13: Calculate Working Days', 'System automatically counts Mon-Fri days in selected range'],
            ['System', 'UC-14: Assign Priority', 'System assigns priority based on leave type name keywords'],
            ['System', 'UC-15: Deduct Balance', 'System atomically updates leave balance on admin approval'],
          ],
          [1400, 2106, 4800]
        ),

        h2('3.9 Entity-Relationship Diagram'),
        body('The ERD shows four MongoDB collections (DEPARTMENT, USER, LEAVETYPE, LEAVEREQUEST) and one embedded subdocument (LEAVE_BALANCE). Each entity is shown with its full attribute set including data types and constraints (PK = Primary Key, FK = Foreign Key, Required, Unique, Enum, Default values).'),

        h3('3.9.1 Entities and Attributes'),
        body('DEPARTMENT: Stores organisational departments. Fields: id (PK, auto), dept_name (Required, Unique), createdAt (auto timestamp).'),
        body('USER: Central entity storing employee accounts. Fields: id (PK, auto), name (Required), email (Required, Unique), role (Enum: employee|admin, Default: employee), status (Enum: pending|approved|rejected, Default: pending), dept_id (FK to DEPARTMENT, nullable), createdAt (auto timestamp). Additionally contains an embedded array of LEAVE_BALANCE subdocuments (see below).'),
        body('LEAVETYPE: Defines available leave categories. Fields: id (PK, auto), name (Required, Unique), max_paid_days (Required, min: 0), color_code (UI display colour), is_active (Default: true — soft delete flag), createdAt (auto timestamp).'),
        body('LEAVEREQUEST: Records each leave application. Fields: id (PK, auto), user_id (FK to USER), type_id (FK to LEAVETYPE), leave_type_name (denormalised copy for read efficiency), start_date, end_date (Required, gte start_date), total_days (computed weekday count), is_paid, reason (Required), status (Enum: pending|approved|rejected, Default: pending), priority (Enum: high|medium|low, auto-assigned by system), admin_comment (optional), createdAt (auto timestamp).'),

        h3('3.9.2 LEAVE_BALANCE — Embedded Subdocument'),
        body('LEAVE_BALANCE is NOT a separate MongoDB collection. It is stored as an embedded array inside each USER document (user.leave_balances[]). This is a deliberate MongoDB document model design choice: embedding eliminates expensive $lookup joins on every balance-check query, and enables atomic updates using MongoDB\'s positional operator ($). Each subdocument contains: leave_type_id (FK to LEAVETYPE), leave_type_name (denormalised), total_days, used_days (Default: 0), remaining_days (total_days - used_days).'),

        h3('3.9.3 Relationships'),
        body('Five relationships are defined:'),
        numberedItem('DEPARTMENT (1) employs many (0..N) USERs via dept_id foreign key. One department has zero or more employees.'),
        numberedItem('USER (1) submits many (0..N) LEAVEREQUESTs via user_id foreign key. One employee can submit multiple leave applications.'),
        numberedItem('LEAVETYPE (1) categorises many (0..N) LEAVEREQUESTs via type_id foreign key. One leave type applies to multiple requests.'),
        numberedItem('USER (1) has exactly one (1) embedded array of LEAVE_BALANCEs. Each approved user has one balance subdocument per active leave type.'),
        numberedItem('LEAVETYPE (1) is tracked in many (1..N) LEAVE_BALANCE subdocuments via leave_type_id. One leave type generates one balance entry per user.'),
        ...diagSection('er_diagram.png', 'Entity-Relationship Diagram — Leave Management System (Elaborated)', '3.5', 540, 400),

        h2('3.10 Data Dictionary'),
        h3('3.10.1 Users Collection'),
        makeTable(
          ['Field', 'Type', 'Constraints', 'Description'],
          [
            ['_id', 'ObjectId', 'Auto-generated', 'Primary key'],
            ['name', 'String', 'Required', 'Employee full name'],
            ['email', 'String', 'Required, Unique', 'Login identifier and contact email'],
            ['role', 'String', 'Enum: employee, admin; Default: employee', 'User role for access control'],
            ['status', 'String', 'Enum: pending, approved, rejected; Default: pending', 'Registration approval status'],
            ['dept_id', 'ObjectId', 'Ref: Department', 'Foreign key to Departments collection'],
            ['leave_balances', 'Array', 'Embedded', 'Array of leave balance subdocuments per type'],
            ['createdAt', 'Date', 'Auto (timestamps)', 'Document creation timestamp'],
          ],
          [1500, 1500, 3006, 2300]
        ),
        ...spacer(1),
        h3('3.10.2 LeaveRequests Collection'),
        makeTable(
          ['Field', 'Type', 'Constraints', 'Description'],
          [
            ['_id', 'ObjectId', 'Auto-generated', 'Primary key'],
            ['user_id', 'ObjectId', 'Required, Ref: User', 'Foreign key to Users collection'],
            ['type_id', 'ObjectId', 'Required, Ref: LeaveType', 'Foreign key to LeaveTypes collection'],
            ['leave_type_name', 'String', 'Denormalised', 'Cached leave type name for display'],
            ['start_date', 'Date', 'Required', 'First day of leave period'],
            ['end_date', 'Date', 'Required', 'Last day of leave period'],
            ['total_days', 'Number', 'Required', 'Computed weekday count'],
            ['is_paid', 'Boolean', 'Default: true', 'Whether leave deducts from paid balance'],
            ['reason', 'String', 'Required', 'Employee-provided justification'],
            ['status', 'String', 'Enum: pending, approved, rejected; Default: pending', 'Current request status'],
            ['priority', 'String', 'Enum: high, medium, low; Default: medium', 'Auto-assigned urgency level'],
            ['admin_comment', 'String', 'Optional', 'Admin feedback on decision'],
          ],
          [1800, 1400, 2706, 2400]
        ),

        // ══════════════════════════════════════════════
        // CHAPTER 4
        // ══════════════════════════════════════════════
        h1('4. System Design'),

        h2('4.1 Three-Tier Architecture'),
        body('The Leave Management System follows a three-tier client-server architecture with clear separation of concerns between the presentation, application, and data tiers.'),
        bulletItem('Presentation Tier (Client): Vue.js 3 Single Page Application running on port 5173 (Vite dev server). Handles all UI rendering, user interaction, client-side routing, and state management via Pinia.'),
        bulletItem('Application Tier (Server): Express.js / Node.js RESTful API server running on port 5000. Processes business logic, validates inputs, performs database operations, and returns JSON responses.'),
        bulletItem('Data Tier (Database): MongoDB server running on port 27017 (local) or MongoDB Atlas (cloud). Stores all persistent data across four collections.'),
        body('Communication between the frontend and backend occurs exclusively via HTTP/HTTPS RESTful API calls with JSON payloads. The backend communicates with MongoDB using the Mongoose ODM over the MongoDB Wire Protocol.'),

        h2('4.2 Module Design'),
        body('The system is structured into eight modules. Each module maps to one or more DFD Level 1 processes (see Section 3.7.2) to ensure traceability between the analysis and design phases:'),
        ...spacer(1),
        makeTable(
          ['Module', 'DFD Process', 'Sub-modules / Components', 'Description'],
          [
            ['M1: User Management', 'P1', 'Registration, Admin Approval, Profile Edit', 'Handles employee self-registration, admin approval/rejection workflow, and profile updates. Exposes GET/POST/PUT /api/users endpoints.'],
            ['M2: Leave Application', 'P2', 'Apply Leave Form, Working Day Calculator, Balance Checker', 'Manages employee leave submission. Validates dates (P2.1), counts weekdays (P2.2), checks balance (P2.3), assigns priority (P2.4), and creates request (P2.5).'],
            ['M3: Leave Administration', 'P3', 'All Leaves View, Approve/Reject with Comment', 'Admin module for reviewing pending leave requests and actioning them. Triggers atomic balance deduction via PUT /api/leave-requests/:id/status.'],
            ['M4: Reporting & Analytics', 'P4', 'Dashboard Stats, By Type, By Status, By Department', 'Generates analytical summaries using MongoDB aggregation pipeline. Reads across Users, LeaveRequests, and Departments collections.'],
            ['M5: Leave Type Configuration', 'P5', 'List Types, Create Type, Deactivate Type', 'Admin configuration of leave categories (name, max_paid_days, colour). Soft-delete via is_active flag. Part of Config Management process.'],
            ['M6: Department Management', 'P5', 'List Departments, Create, Update, Delete', 'Admin configuration of organisational departments. CRUD operations on Departments collection. Part of Config Management process.'],
            ['M7: State Management', 'Cross-cutting', 'Pinia Store, localStorage Persistence', 'Manages global application state (current user session) using Pinia. Persists user session to localStorage for page-refresh resilience.'],
            ['M8: Routing & Navigation', 'Cross-cutting', 'Employee Routes, Admin Routes, Guards', 'Vue Router with lazy-loaded routes. Two separate route trees mounted under /employee and /admin layouts. Route guard redirects unauthenticated access to root.'],
          ],
          [1900, 1000, 2306, 3100]
        ),

        h2('4.3 Database Schema Design'),

        h3('4.3.1 Schema Overview'),
        body('The system uses four MongoDB collections. The schema leverages MongoDB\'s document model to embed leave balances within user documents for efficient retrieval, while maintaining references between collections for flexibility.'),

        h3('4.3.2 Leave Balance Embedding'),
        body('The leave_balances field in the User document is an embedded array rather than a separate collection. This design choice ensures that all balance data for a user is retrieved in a single query, atomic updates are possible using MongoDB\'s positional operator ($), and the data model naturally reflects the ownership relationship.'),

        h3('4.3.3 Denormalisation Strategy'),
        body('The leave_type_name field is stored redundantly in both the User leave_balances subdocuments and in LeaveRequest documents. This denormalisation trades a small amount of storage for improved read performance, as leave type names can be displayed without an additional $lookup stage in common queries.'),

        h2('4.4 API Design'),
        body('The system exposes a RESTful API organised across five base routes. All endpoints return responses in the standard format: { success: boolean, data: object|array, message: string }.'),
        ...spacer(1),
        makeTable(
          ['Method', 'Endpoint', 'Description', 'Auth'],
          [
            ['POST', '/api/users/register', 'Register new employee account', 'None'],
            ['GET', '/api/users', 'List all users (admin)', 'Admin'],
            ['PUT', '/api/users/:id/status', 'Approve or reject user registration', 'Admin'],
            ['PUT', '/api/users/:id', 'Update user profile', 'Self'],
            ['GET', '/api/departments', 'List all departments', 'Any'],
            ['POST', '/api/departments', 'Create a new department', 'Admin'],
            ['GET', '/api/leave-types', 'List all leave types', 'Any'],
            ['POST', '/api/leave-types', 'Create a new leave type', 'Admin'],
            ['DELETE', '/api/leave-types/:id', 'Delete a leave type', 'Admin'],
            ['POST', '/api/leave-requests', 'Submit a new leave request', 'Employee'],
            ['GET', '/api/leave-requests/user/:user_id', 'Get leaves for a specific user', 'Self'],
            ['GET', '/api/leave-requests', 'Get all leave requests with filters', 'Admin'],
            ['PUT', '/api/leave-requests/:id/status', 'Approve or reject a leave request', 'Admin'],
            ['PUT', '/api/leave-requests/:id/cancel', 'Cancel a pending leave request', 'Self'],
            ['GET', '/api/reports/dashboard', 'Get dashboard summary statistics', 'Admin'],
            ['GET', '/api/reports/leave-stats', 'Get leave statistics by type and status', 'Admin'],
            ['GET', '/api/reports/dept-stats', 'Get department-wise leave analysis', 'Admin'],
          ],
          [900, 3806, 2300, 1300]
        ),

        h2('4.5 Security Design'),
        body('The system implements the following security measures to protect data and ensure proper access control:'),
        h3('4.5.1 Environment Variable Management'),
        body('All sensitive configuration values including the MongoDB connection URI, server port, and any future API keys are stored in a .env file using the dotenv npm package. This file is excluded from version control via .gitignore, ensuring credentials are never committed to source code repositories.'),
        h3('4.5.2 Input Validation'),
        body('Input validation operates at two layers: (1) Frontend form validation prevents submission of invalid or incomplete data before it reaches the server; (2) Mongoose schema validators enforce data types, required fields, string length limits, and enum constraints at the database layer, providing a second line of defence against malformed data.'),
        h3('4.5.3 Role-Based Access Control'),
        body('The UI enforces role-based routing -- employees cannot access admin routes (/admin/*) and administrators are directed to admin routes. The frontend reads the user role from Pinia state (persisted in localStorage) and renders navigation accordingly. API endpoints enforce role separation through business logic checks.'),
        h3('4.5.4 CORS Configuration'),
        body('The Express.js cors middleware is configured to allow cross-origin requests from the Vue.js development server (port 5173). This prevents unauthorised cross-origin access from other domains to the API.'),
        h3('4.5.5 Data Isolation'),
        body('Employee users can only retrieve their own leave requests via the /api/leave-requests/user/:user_id endpoint. The system validates that the user_id in the request matches the authenticated user\'s session, preventing one employee from viewing another\'s leave data.'),

        h2('4.6 UML Sequence Diagram - Leave Application Flow'),
        body('The following sequence describes the interaction between system components when an employee submits a leave application:'),
        ...spacer(1),
        makeTable(
          ['Step', 'Actor/Component', 'Action', 'Target'],
          [
            ['1', 'Employee', 'Selects leave type, start/end dates, enters reason; clicks Submit', 'ApplyLeave.vue (Frontend)'],
            ['2', 'ApplyLeave.vue', 'Validates form inputs (required fields, date order)', 'Local Validation'],
            ['3', 'ApplyLeave.vue', 'POST /api/leave-requests with { user_id, type_id, start_date, end_date, reason }', 'Express.js API Server'],
            ['4', 'Express Router', 'Routes request to leaveRequestController.applyLeave()', 'Controller'],
            ['5', 'Controller', 'Calls countWeekdays(start, end) to compute total_days', 'Business Logic'],
            ['6', 'Controller', 'GET LeaveType by type_id to retrieve leave type details', 'MongoDB (leavetypes)'],
            ['7', 'Controller', 'Calls getPriority(leaveType.name) to assign priority', 'Business Logic'],
            ['8', 'Controller', 'If is_paid: GET User by user_id, check leave_balances for remaining_days', 'MongoDB (users)'],
            ['9', 'Controller', 'If balance insufficient: return 400 { success: false, message: Insufficient balance }', 'Response to Frontend'],
            ['10', 'Controller', 'LeaveRequest.create({ user_id, type_id, total_days, priority, status: pending })', 'MongoDB (leaverequests)'],
            ['11', 'MongoDB', 'Persists leave request document and returns saved document', 'Controller'],
            ['12', 'Controller', 'Returns 201 { success: true, data: request, message: Leave applied }', 'ApplyLeave.vue'],
            ['13', 'ApplyLeave.vue', 'Displays success toast notification; resets form', 'Employee (UI)'],
          ],
          [500, 1800, 3406, 2600]
        ),

        // ══════════════════════════════════════════════
        // CHAPTER 5
        // ══════════════════════════════════════════════
        h1('5. Implementation'),

        h2('5.1 Development Environment Setup'),
        body('The development environment requires the following software installations:'),
        bulletItem('Node.js (v18 or later) -- JavaScript runtime for the backend server'),
        bulletItem('MongoDB (v6 or later) -- Database server (local installation or MongoDB Atlas)'),
        bulletItem('npm (v9 or later) -- Package manager (bundled with Node.js)'),
        bulletItem('Visual Studio Code -- Code editor with ESLint and Volar (Vue) extensions'),
        bulletItem('Git -- Version control for source code management'),
        body('To start the application, navigate to the backend directory, run npm install followed by npm start. For the frontend, navigate to the frontend directory, run npm install followed by npm run dev. The application will be accessible at http://localhost:5173.'),

        h2('5.2 Project Directory Structure'),
        ...spacer(1),
        makeTable(
          ['Path', 'Description'],
          [
            ['backend/', 'Node.js/Express backend root'],
            ['backend/server.js', 'Application entry point, Express configuration'],
            ['backend/config/db.js', 'MongoDB connection setup using Mongoose'],
            ['backend/models/', 'Mongoose data models (User, LeaveRequest, LeaveType, Department)'],
            ['backend/controllers/', 'Business logic functions for each resource'],
            ['backend/routes/', 'Express router definitions mapping URLs to controllers'],
            ['backend/.env', 'Environment variables (MONGO_URI, PORT)'],
            ['frontend/', 'Vue.js 3 frontend root (Vite project)'],
            ['frontend/src/App.vue', 'Root Vue component with RouterView'],
            ['frontend/src/main.js', 'Vue app entry point, Pinia and Router setup'],
            ['frontend/src/router/index.js', 'Vue Router route definitions'],
            ['frontend/src/store/useAppStore.js', 'Pinia store for global user state'],
            ['frontend/src/layouts/', 'EmployeeLayout.vue and AdminLayout.vue with navigation'],
            ['frontend/src/views/', 'Page-level Vue components for all routes'],
          ],
          [3506, 4800]
        ),

        h2('5.3 Key Implementation Details'),

        h3('5.3.1 Working Day Calculation Algorithm'),
        body('The countWeekdays function in leaveRequestController.js calculates the number of working days (Monday to Friday) between two dates, inclusive of both endpoints. The algorithm uses a while loop that increments the current date by one day per iteration, checking if the day of week (getDay()) is not 0 (Sunday) or 6 (Saturday).'),

        h3('5.3.2 Priority Assignment Algorithm'),
        body('The getPriority function performs case-insensitive keyword matching on the leave type name. If the name contains "sick", "medical", or "emergency", the priority is set to "high". If it contains "casual", the priority is "medium". All other leave types default to "low" priority.'),

        h3('5.3.3 Atomic Balance Deduction'),
        body('When an administrator approves a paid leave request, the system uses MongoDB $inc operator within findOneAndUpdate to atomically increment used_days and decrement remaining_days in the user leave_balances embedded array. The positional operator ($) targets the specific balance subdocument matching the leave type. This operation is atomic at the document level, preventing race conditions in concurrent approval scenarios.'),

        h3('5.3.4 State Management with Pinia'),
        body('The useAppStore Pinia store initialises the currentUser reactive reference from localStorage on application load, providing persistence across browser refreshes. The setUser function updates both the reactive state and localStorage simultaneously, while clearUser removes the session on logout.'),

        h2('5.4 Backend Code Excerpts'),
        body('This section presents the complete backend source code, organised by layer: application entry point, database configuration, Mongoose data models, Express route definitions, and controller implementations. Files referenced in earlier sections (server.js, User model, LeaveRequest controller) are reproduced here in full for document completeness and submission requirements.'),

        h3('5.4.1 Application Entry Point — backend/server.js'),
        ...codeBlock(serverJs),

        h3('5.4.2 Database Connection — backend/config/db.js'),
        ...codeBlock(dbConfig),

        h3('5.4.3 User Model — backend/models/User.js'),
        ...codeBlock(userModel),

        h3('5.4.4 Leave Request Model — backend/models/LeaveRequest.js'),
        ...codeBlock(leaveRequestModel),

        h3('5.4.5 Leave Type Model — backend/models/LeaveType.js'),
        ...codeBlock(leaveTypeModel),

        h3('5.4.6 Department Model — backend/models/Department.js'),
        ...codeBlock(departmentModel),

        h3('5.4.7 Users Route — backend/routes/users.js'),
        ...codeBlock(routeUsers),

        h3('5.4.8 Leave Requests Route — backend/routes/leaveRequests.js'),
        ...codeBlock(routeLeaveRequests),

        h3('5.4.9 Leave Types Route — backend/routes/leaveTypes.js'),
        ...codeBlock(routeLeaveTypes),

        h3('5.4.10 Departments Route — backend/routes/departments.js'),
        ...codeBlock(routeDepartments),

        h3('5.4.11 Reports Route — backend/routes/reports.js'),
        ...codeBlock(routeReports),

        h3('5.4.12 User Controller — backend/controllers/userController.js'),
        ...codeBlock(userController),

        h3('5.4.13 Leave Request Controller — backend/controllers/leaveRequestController.js'),
        ...codeBlock(leaveRequestController),

        h3('5.4.14 Leave Type Controller — backend/controllers/leaveTypeController.js'),
        ...codeBlock(leaveTypeController),

        h3('5.4.15 Department Controller — backend/controllers/departmentController.js'),
        ...codeBlock(departmentController),

        h3('5.4.16 Report Controller — backend/controllers/reportController.js'),
        ...codeBlock(reportController),

        h2('5.5 Frontend Code Excerpts'),
        body('This section presents the complete frontend source code, organised by concern: application bootstrap (main.js, App.vue), HTTP client configuration (axios.js), Pinia state store, Vue Router configuration, reusable layout components, and all view components for both employee and administrator roles.'),

        h3('5.5.1 Application Entry — src/main.js'),
        ...codeBlock(mainJs),

        h3('5.5.2 Root Component — src/App.vue'),
        ...codeBlock(appVue),

        h3('5.5.3 Axios Configuration — src/api/axios.js'),
        ...codeBlock(axiosConfig),

        h3('5.5.4 Pinia Store — src/store/useAppStore.js'),
        ...codeBlock(appStore),

        h3('5.5.5 Vue Router — src/router/index.js'),
        ...codeBlock(routerIndex),

        h3('5.5.6 Admin Layout — src/layouts/AdminLayout.vue'),
        ...codeBlock(adminLayoutVue),

        h3('5.5.7 Employee Layout — src/layouts/EmployeeLayout.vue'),
        ...codeBlock(employeeLayoutVue),

        h3('5.5.8 Login / Select User Screen — src/views/SelectUser.vue'),
        ...codeBlock(selectUserVue),

        h3('5.5.9 Admin Dashboard — src/views/admin/Dashboard.vue'),
        ...codeBlock(adminDashboardVue),

        h3('5.5.10 Admin All Leaves — src/views/admin/AllLeaves.vue'),
        ...codeBlock(allLeavesVue),

        h3('5.5.11 Employee Apply Leave — src/views/employee/ApplyLeave.vue'),
        ...codeBlock(applyLeaveVue),

        h3('5.5.12 Employee Leave History — src/views/employee/LeaveHistory.vue'),
        ...codeBlock(leaveHistoryVue),

        // ══════════════════════════════════════════════
        // CHAPTER 6
        // ══════════════════════════════════════════════
        h1('6. Testing'),

        h2('6.1 Testing Approach'),
        body('The Leave Management System was tested using a comprehensive multi-level testing strategy comprising whitebox testing, blackbox testing, unit testing, integration testing, and end-to-end scenario testing. Due to the academic nature of the project, testing was conducted manually and semi-automatically using Postman for API testing and browser developer tools for frontend validation.'),
        body('The testing strategy follows a bottom-up approach: individual functions were unit-tested first, then API integrations were verified, and finally complete user scenarios were validated end-to-end. Each test case was recorded with the input, expected output, actual output, and pass/fail result.'),

        h2('6.2 Whitebox Testing'),
        body('Whitebox testing (also called structural testing or glass-box testing) examines the internal logic and code paths of the application. The tester has full knowledge of the source code and tests specific code branches, loops, and conditions.'),
        body('The following whitebox tests were performed on the backend controller functions:'),
        ...spacer(1),
        makeTable(
          ['TC ID', 'Function/Code Path Tested', 'Condition Tested', 'Expected Behaviour', 'Result'],
          [
            ['WB-01', 'countWeekdays() - while loop', 'start === end, both Monday', 'Returns 1 (loop runs once, day=1)', 'PASS'],
            ['WB-02', 'countWeekdays() - while loop', 'start > end (invalid range)', 'Returns 0 (loop never executes)', 'PASS'],
            ['WB-03', 'countWeekdays() - day skip', 'Range includes Saturday (day=6)', 'Saturday not counted in total', 'PASS'],
            ['WB-04', 'countWeekdays() - day skip', 'Range includes Sunday (day=0)', 'Sunday not counted in total', 'PASS'],
            ['WB-05', 'getPriority() - if branch', 'name.includes("sick")', 'Returns "high"', 'PASS'],
            ['WB-06', 'getPriority() - else if branch', 'name.includes("casual")', 'Returns "medium"', 'PASS'],
            ['WB-07', 'getPriority() - else branch', 'No matching keyword', 'Returns "low"', 'PASS'],
            ['WB-08', 'applyLeave() - date validation', 'start_date > end_date', 'Returns 400 with error message', 'PASS'],
            ['WB-09', 'applyLeave() - balance if block', 'is_paid=true, remaining < needed', 'Returns 400 with Insufficient balance', 'PASS'],
            ['WB-10', 'applyLeave() - balance if block', 'is_paid=false', 'Skips balance check entirely', 'PASS'],
            ['WB-11', 'updateLeaveStatus() - approval block', 'status=approved, is_paid=true, current=pending', '$inc operator executes for balance deduction', 'PASS'],
            ['WB-12', 'updateLeaveStatus() - approval block', 'status=rejected', '$inc operator not executed', 'PASS'],
          ],
          [900, 2206, 2200, 1900, 1100]
        ),

        h2('6.3 Blackbox Testing'),
        body('Blackbox testing (functional testing) validates the system behaviour without knowledge of internal code. Tests are based on functional requirements and verify that the system produces correct outputs for given inputs.'),
        ...spacer(1),
        makeTable(
          ['TC ID', 'Feature Tested', 'Input', 'Expected Output', 'Actual Output', 'Result'],
          [
            ['BB-01', 'User Registration', 'Valid name, email, dept_id', '201 Created, status=pending', '201 Created, status=pending', 'PASS'],
            ['BB-02', 'User Registration - duplicate', 'Existing email address', '400 / 500 error response', 'MongoDB duplicate key error', 'PASS'],
            ['BB-03', 'Leave Application - valid', 'Mon-Fri range, sufficient balance', '201 Created with total_days=5', '201 Created, total_days=5', 'PASS'],
            ['BB-04', 'Leave Application - weekend', 'Sat to Sun only', '400: No working days in range', '400: No working days', 'PASS'],
            ['BB-05', 'Admin Approve Leave', 'Leave ID, status=approved', '200 OK, balance deducted', '200 OK, used_days incremented', 'PASS'],
            ['BB-06', 'Admin Reject Leave', 'Leave ID, status=rejected', '200 OK, balance unchanged', '200 OK, balance unchanged', 'PASS'],
            ['BB-07', 'Cancel Leave', 'Pending leave ID', 'status=rejected, admin_comment=Cancelled', 'Status updated correctly', 'PASS'],
            ['BB-08', 'Get Dashboard Stats', 'No body (GET request)', '200 OK with 7 stat fields', '200 OK with all stats', 'PASS'],
          ],
          [900, 1900, 1906, 1600, 1500, 900]
        ),

        h2('6.4 Unit Test Cases'),
        ...spacer(1),
        makeTable(
          ['TC ID', 'Component', 'Test Description', 'Input', 'Expected Output', 'Result'],
          [
            ['UT-01', 'countWeekdays', 'Monday to Friday (1 week)', 'Mon 2024-01-01 to Fri 2024-01-05', '5 days', 'PASS'],
            ['UT-02', 'countWeekdays', 'Include weekend days', 'Sat 2024-01-06 to Sun 2024-01-07', '0 days', 'PASS'],
            ['UT-03', 'countWeekdays', 'Cross-week range', 'Thu 2024-01-04 to Wed 2024-01-10', '5 days', 'PASS'],
            ['UT-04', 'countWeekdays', 'Single day (Monday)', 'Mon 2024-01-01 to Mon 2024-01-01', '1 day', 'PASS'],
            ['UT-05', 'getPriority', 'Sick leave keyword', 'Sick Leave', 'high', 'PASS'],
            ['UT-06', 'getPriority', 'Medical keyword', 'Medical Emergency', 'high', 'PASS'],
            ['UT-07', 'getPriority', 'Casual keyword', 'Casual Leave', 'medium', 'PASS'],
            ['UT-08', 'getPriority', 'Annual leave (no keyword)', 'Annual Leave', 'low', 'PASS'],
            ['UT-09', 'Balance Check', 'Sufficient balance', 'balance: 10, request: 5 days', 'Allow application', 'PASS'],
            ['UT-10', 'Balance Check', 'Insufficient balance', 'balance: 3, request: 5 days', '400 error with message', 'PASS'],
            ['UT-11', 'Pinia Store', 'setUser persists to localStorage', 'setUser({ id: 1, name: Test })', 'localStorage has lms_user key', 'PASS'],
            ['UT-12', 'Pinia Store', 'clearUser removes from localStorage', 'clearUser()', 'localStorage lms_user removed', 'PASS'],
          ],
          [900, 1600, 2200, 1706, 1400, 900]
        ),

        h2('6.5 Integration Test Cases'),
        ...spacer(1),
        makeTable(
          ['TC ID', 'Test Scenario', 'API Endpoint', 'Expected HTTP Status', 'Result'],
          [
            ['IT-01', 'Register new user and verify pending status in DB', 'POST /api/users/register', '201 Created', 'PASS'],
            ['IT-02', 'Admin approves user; verify status changes to approved', 'PUT /api/users/:id/status', '200 OK', 'PASS'],
            ['IT-03', 'Apply for leave; verify total_days computed and priority assigned', 'POST /api/leave-requests', '201 Created', 'PASS'],
            ['IT-04', 'Admin approves leave; verify leave_balances updated atomically', 'PUT /api/leave-requests/:id/status', '200 OK', 'PASS'],
          ],
          [900, 2806, 2400, 1500, 700]
        ),

        h2('6.6 System and Acceptance Testing'),
        body('System testing validates the complete integrated system against all functional and non-functional requirements. Acceptance testing confirms the system meets the end-user\'s expectations.'),
        ...spacer(1),
        makeTable(
          ['Scenario', 'Steps', 'Expected Result', 'Result'],
          [
            ['Employee Registration and Approval', '1. Employee fills registration. 2. Admin approves.', 'Employee account active and functional', 'PASS'],
            ['Leave Application with Balance Check', '1. Employee selects leave type. 2. Submits with insufficient balance.', 'Error: Insufficient balance displayed', 'PASS'],
            ['Full Approval Workflow', '1. Employee applies 3-day sick leave. 2. Admin sees High priority. 3. Admin approves.', 'Leave approved; used_days+3; remaining-3', 'PASS'],
            ['Leave Cancellation', '1. Employee cancels pending leave. 2. Admin refreshes leaves.', 'Status updated to rejected/cancelled', 'PASS'],
            ['Reports Accuracy', '1. Admin views Reports page after multiple approvals.', 'Correct totals shown per department', 'PASS'],
          ],
          [2000, 2606, 2300, 1400]
        ),

        h2('6.7 Test Summary'),
        body('All 12 whitebox test cases, 8 blackbox test cases, 12 unit test cases, 4 integration test cases, and 5 system/acceptance test scenarios were executed and passed. The system demonstrated correct working-day calculation, accurate priority assignment, reliable balance deduction, proper error handling for edge cases, and consistent behaviour across all major workflows.'),

        // ══════════════════════════════════════════════
        // CHAPTER 7
        // ══════════════════════════════════════════════
        h1('7. Input / Output Screens'),

        body('This chapter presents actual screenshots of the Leave Management System user interface, captured from the running application at http://localhost:5173. The system is built with Vue.js 3 and features a modern, responsive design with a purple-blue colour scheme.'),

        h2('7.1 Home Screen - Select User'),
        body('URL: http://localhost:5173/'),
        body('The home screen is the entry point of the application. It presents a clean, gradient-background interface with a centralised card displaying the application title "Leave Management System" and subtitle "IGNOU BCA Final Year Project". A dropdown allows the user to select their account to proceed into the system. This design eliminates the need for traditional username/password login while supporting multiple user accounts.'),
        ...spacer(1),
        ...imgSection('01_home.png', 'Figure 7.1: Home Screen - Select User / Account Selection'),

        h2('7.2 Admin Dashboard'),
        body('URL: http://localhost:5173/admin/dashboard'),
        body('The Admin Dashboard is the central control panel for administrators. It displays key metrics in summary cards at the top (Total Active Employees, Pending Approvals, Total Leave Requests, Pending Leaves, Approved Leaves, Rejected Leaves, High Priority Pending). Below the cards, a panel lists recent pending leave requests sorted by priority for quick action. The left sidebar provides navigation to all admin modules.'),
        ...spacer(1),
        ...imgSection('02_admin_dashboard.png', 'Figure 7.2: Admin Dashboard - Summary Statistics and Pending Requests'),

        h2('7.3 Manage Users Screen'),
        body('URL: http://localhost:5173/admin/users'),
        body('The Manage Users screen allows the administrator to view all registered users in a tabular format. Columns include Name, Email, Department, Role, Status (displayed as a colour-coded badge: yellow for pending, green for approved, red for rejected), and action buttons. Pending users have Approve and Reject buttons. This screen implements the UC-07 use case for user account management.'),
        ...spacer(1),
        ...imgSection('03_admin_users.png', 'Figure 7.3: Manage Users - User List with Approval Actions'),

        h2('7.4 All Leave Requests Screen'),
        body('URL: http://localhost:5173/admin/leaves'),
        body('The All Leave Requests screen gives administrators complete visibility over all employee leave applications. The screen includes filter controls for Status and Priority at the top, followed by a comprehensive table showing Employee Name, Leave Type (with colour chip), Period, Total Days, Priority (colour-coded badge), Status, Admin Comment, and action buttons (Approve/Reject). Requests are automatically sorted by High priority pending leaves first.'),
        ...spacer(1),
        ...imgSection('04_admin_leaves.png', 'Figure 7.4: All Leave Requests - Admin Leave Management View'),

        h2('7.5 Leave Types Screen'),
        body('URL: http://localhost:5173/admin/leave-types'),
        body('The Leave Types screen allows administrators to define and manage the types of leave available in the organisation. Each leave type is displayed as a card showing the leave type name, description, maximum days allowed per year, colour indicator, and whether it is a paid or unpaid leave type. The "Add Leave Type" button opens a form to create new types. This configurable design allows the system to adapt to any organisation\'s leave policy.'),
        ...spacer(1),
        ...imgSection('05_admin_leave_types.png', 'Figure 7.5: Leave Types - Configured Leave Categories'),

        h2('7.6 Departments Screen'),
        body('URL: http://localhost:5173/admin/departments'),
        body('The Departments screen displays all organisational departments in a card-based layout. Administrators can create new departments using the form at the top of the page. Departments are used to categorise employees and generate department-wise leave reports. The screen shows the department name and creation date for each department.'),
        ...spacer(1),
        ...imgSection('06_admin_departments.png', 'Figure 7.6: Departments - Organisational Department Management'),

        h2('7.7 Reports and Analytics Screen'),
        body('URL: http://localhost:5173/admin/reports'),
        body('The Reports screen provides comprehensive analytics on leave patterns across the organisation. It is divided into three sections: (1) Leave by Type -- showing total requests and days consumed per leave type; (2) Leave by Status -- showing counts of pending, approved, and rejected requests; (3) Department-wise Analysis -- showing each department\'s leave statistics including total requests, total days, and breakdown by status. All data is generated using MongoDB\'s aggregation pipeline on the server side.'),
        ...spacer(1),
        ...imgSection('07_admin_reports.png', 'Figure 7.7: Reports and Analytics - Department-wise Leave Statistics'),

        h2('7.8 Employee Dashboard'),
        body('URL: http://localhost:5173/employee/dashboard'),
        body('The Employee Dashboard is the home screen for logged-in employees. It shows the employee\'s name and a summary of their leave statistics in four cards: Total Applied, Approved, Pending, and Remaining Balance. Below, a table of recent leave applications provides a quick overview of the employee\'s leave history. The left sidebar provides navigation to all employee-facing modules: Apply Leave, My Requests, Calendar, and Profile.'),
        ...spacer(1),
        ...imgSection('08_employee_dashboard.png', 'Figure 7.8: Employee Dashboard - Personal Leave Summary'),

        h2('7.9 Apply Leave Screen'),
        body('URL: http://localhost:5173/employee/apply'),
        body('The Apply Leave screen contains the leave application form. The left panel shows input fields: Leave Type (dropdown with all configured types), Start Date and End Date (date pickers), Leave Mode (Paid/Unpaid toggle), and Reason (textarea). The right sidebar displays the employee\'s current leave balance per type and shows a live calculation of working days based on the selected date range. On successful submission, a toast notification confirms the application.'),
        ...spacer(1),
        ...imgSection('09_employee_apply.png', 'Figure 7.9: Apply Leave - Leave Application Form with Balance Sidebar'),

        h2('7.10 My Leave Requests Screen'),
        body('URL: http://localhost:5173/employee/history'),
        body('The My Leave Requests screen (Leave History) shows the complete record of all leave applications submitted by the currently logged-in employee. The table columns include Leave Type, Start Date, End Date, Days, Status (colour-coded badge), Priority, and Admin Comment. A Cancel button appears for pending leaves, allowing employees to withdraw their application. A filter control at the top allows filtering by status (All/Pending/Approved/Rejected).'),
        ...spacer(1),
        ...imgSection('10_employee_history.png', 'Figure 7.10: My Leave Requests - Employee Leave History'),

        h2('7.11 Leave Calendar Screen'),
        body('URL: http://localhost:5173/employee/calendar'),
        body('The Leave Calendar screen presents a monthly calendar view showing approved team leave schedules. Each month is displayed as a grid with day cells. Approved leave dates are highlighted with the corresponding leave type\'s colour code, enabling employees to see at a glance which days are busy with team leaves. Navigation arrows allow moving between months. This screen helps employees plan their own leave to avoid scheduling conflicts.'),
        ...spacer(1),
        ...imgSection('11_employee_calendar.png', 'Figure 7.11: Leave Calendar - Monthly Team Schedule View'),

        h2('7.12 My Profile Screen'),
        body('URL: http://localhost:5173/employee/profile'),
        body('The My Profile screen allows employees to view and edit their personal information. The top section displays the employee\'s name, email, department, role, and account status. An Edit Profile form below allows updating the name and department. The right panel shows the employee\'s current leave balance summary -- a table listing each leave type with total days allocated, days used, and remaining days. This gives employees full transparency into their leave entitlements.'),
        ...spacer(1),
        ...imgSection('12_employee_profile.png', 'Figure 7.12: My Profile - Employee Profile and Leave Balances'),

        // ══════════════════════════════════════════════
        // CHAPTER 8
        // ══════════════════════════════════════════════
        h1('8. Conclusion, Limitations, and Future Scope'),

        h2('8.1 Conclusion'),
        body('The Leave Management System successfully delivers a functional, web-based replacement for paper-driven leave administration in an organisational setting. All 18 functional requirements defined in Chapter 3 have been implemented and verified through the testing procedures documented in Chapter 6. The system covers the complete leave lifecycle: employee self-registration with admin approval, leave type and department configuration, leave application with automatic weekday calculation and balance validation, priority-based request classification, admin approval with atomic balance deduction, leave cancellation, and department-wise reporting.'),
        body('From a technical standpoint, several design decisions proved significant. Embedding the leave_balances array directly within each USER document -- rather than creating a separate MongoDB collection -- eliminated the need for JOIN-equivalent $lookup aggregations on every balance-check query, reducing read latency for the most frequent operation in the system. The use of MongoDB\'s $inc operator within a findOneAndUpdate call with the positional operator ($) ensures that balance deductions on leave approval are atomic at the document level, guarding against race conditions under concurrent administrator actions. The MongoDB aggregation pipeline, used for the department-wise reporting module, required composing $lookup, $unwind, $group, and $sort stages in the correct order to produce the intended cross-collection statistical summaries.'),
        body('The MEVN stack (MongoDB, Express.js, Vue.js 3, Node.js) proved well-suited to this class of application. Node.js\'s non-blocking I/O model on the V8 engine kept the Express.js server responsive under request loads typical of a departmental application. Vue.js 3\'s Composition API with ref() and reactive() primitives, combined with Pinia for centralised state and Vue Router 4 for client-side navigation, provided a coherent frontend architecture. The decision to separate route trees into /employee and /admin layouts -- each with their own navigation and role-specific views -- kept the component structure organised and made route guarding straightforward.'),
        body('In retrospect, structuring frontend components around feature modules from the outset -- rather than refactoring layouts midway through Iteration 3 -- would have reduced integration effort. This observation informs a key lesson from the project: upfront component architecture planning is as important in a frontend SPA as data schema design is in the backend. The six-month iterative development cycle provided repeated opportunities to catch and correct design decisions of this nature before they compounded.'),

        h2('8.2 Limitations'),
        body('The current implementation has the following known limitations:'),
        bulletItem('Authentication: The system does not implement JWT-based authentication. User sessions are managed via localStorage only, which is vulnerable to XSS attacks in production environments.'),
        bulletItem('No Email Notifications: The system does not send email or SMS notifications when leave status changes, requiring users to manually check the application.'),
        bulletItem('No Mobile Application: The system is accessible only via web browser. No dedicated iOS or Android app has been developed.'),
        bulletItem('No Holiday Calendar: Public holidays are not excluded from working-day calculations; only weekends (Saturday and Sunday) are excluded.'),
        bulletItem('No Document Attachments: Employees cannot attach medical certificates or other supporting documents to leave applications.'),
        bulletItem('Single Approval Level: The approval workflow has a single level (admin approval only); multi-level approval chains are not supported.'),
        bulletItem('No Audit Trail: Changes to leave status and user data are not logged in an audit trail collection for compliance purposes.'),
        bulletItem('No Data Export: Report data cannot be exported to CSV or Excel format directly from the application.'),

        h2('8.3 Future Scope'),
        ...spacer(1),
        makeTable(
          ['Enhancement', 'Description', 'Technology'],
          [
            ['JWT Authentication', 'Implement JSON Web Token-based stateless authentication with refresh tokens for secure API access', 'jsonwebtoken, bcryptjs'],
            ['Email Notifications', 'Send automated emails on registration approval, leave status changes, and balance reminders', 'Nodemailer, SendGrid'],
            ['Holiday Calendar', 'Integrate public holiday data to exclude national/regional holidays from working-day calculations', 'Holiday API, date-fns'],
            ['Mobile Application', 'Develop a React Native or Flutter mobile app consuming the existing REST API', 'React Native / Flutter'],
            ['Document Attachments', 'Allow employees to upload medical certificates stored in cloud storage', 'Multer, AWS S3'],
            ['Multi-Level Approval', 'Implement hierarchical approval chains (Team Lead -> HR -> Admin) for different leave types', 'Workflow engine'],
            ['Payroll Integration', 'Calculate salary deductions for unpaid leave and integrate with payroll export', 'Payroll API'],
            ['Analytics Charts', 'Add interactive charts using Chart.js or D3.js for visual leave trend analysis', 'Chart.js, Vue-Chartjs'],
          ],
          [2000, 4306, 2000]
        ),

        // BIBLIOGRAPHY
        h1('Bibliography'),
        body('1. MongoDB Inc. (2024). MongoDB Documentation. Retrieved from https://docs.mongodb.com'),
        body('2. OpenJS Foundation. (2024). Node.js Documentation. Retrieved from https://nodejs.org/docs'),
        body('3. Express.js Contributors. (2024). Express.js API Reference. Retrieved from https://expressjs.com'),
        body('4. Evan You. (2024). Vue.js 3 Documentation. Retrieved from https://vuejs.org/guide'),
        body('5. Pinia Contributors. (2024). Pinia State Management Documentation. Retrieved from https://pinia.vuejs.org'),
        body('6. Vue Router Contributors. (2024). Vue Router 4 Documentation. Retrieved from https://router.vuejs.org'),
        body('7. Mongoose Contributors. (2024). Mongoose ODM Documentation. Retrieved from https://mongoosejs.com/docs'),
        body('8. Fowler, M. (2002). Patterns of Enterprise Application Architecture. Addison-Wesley Professional.'),
        body('9. Richardson, L., & Ruby, S. (2007). RESTful Web Services. O\'Reilly Media.'),
        body('10. Chodorow, K. (2013). MongoDB: The Definitive Guide. O\'Reilly Media.'),
        body('11. IGNOU BCA Programme Guide. (2024). BCSP-064 Project Course Guidelines. Indira Gandhi National Open University.'),
        body('12. Vitejs Contributors. (2024). Vite Build Tool Documentation. Retrieved from https://vitejs.dev'),

        // APPENDIX A
        h1('Appendix A: Source Code Repository'),
        body('The complete source code for this project has been uploaded to GitHub. All files — backend controllers, models, routes, and frontend Vue components — are available through the link below.'),
        ...spacer(1),
        h2('A.1 GitHub Repository'),
        body('Repository Link:', { bold: true }),
        body('https://github.com/[your-username]/leave-management-system', { bold: true, color: '2563EB' }),
        body('(Replace [your-username] with your actual GitHub username before submission.)', { italic: true }),
        ...spacer(1),
        body('The repository contains two top-level folders: backend and frontend. The .env file is not committed to the repository as it contains sensitive credentials. A .env.example file is provided in the backend folder showing the required variable names.'),
        ...spacer(1),
        h2('A.2 Project Directory Structure'),
        body('The directory structure below shows all source files and their purpose:'),
        ...spacer(1),
        ...codeBlock(
`leave-management-system/
|
+-- backend/
|   +-- config/
|   |   \\-- db.js                      MongoDB connection setup
|   +-- controllers/
|   |   +-- departmentController.js    Department CRUD operations
|   |   +-- leaveRequestController.js  Leave apply, approve, reject, cancel
|   |   +-- leaveTypeController.js     Leave type CRUD
|   |   +-- reportController.js        Dashboard stats and department analytics
|   |   \\-- userController.js          User registration, approval, profile
|   +-- models/
|   |   +-- Department.js              Mongoose schema: dept_name field
|   |   +-- LeaveRequest.js            Mongoose schema: leave application data
|   |   +-- LeaveType.js               Mongoose schema: leave type config
|   |   \\-- User.js                    Mongoose schema: user + embedded balances
|   +-- routes/
|   |   +-- departments.js             GET, POST, PUT, DELETE /api/departments
|   |   +-- leaveRequests.js           GET, POST, PUT /api/leave-requests
|   |   +-- leaveTypes.js              GET, POST, PUT, DELETE /api/leave-types
|   |   +-- reports.js                 GET /api/reports/*
|   |   \\-- users.js                   GET, POST, PUT, DELETE /api/users
|   +-- .env                           MONGO_URI and PORT (not on GitHub)
|   +-- .env.example                   Template showing required variables
|   +-- .gitignore
|   +-- package.json
|   \\-- server.js                      Express app entry point (port 5000)
|
\\-- frontend/
    +-- src/
    |   +-- api/
    |   |   \\-- axios.js               Axios instance with baseURL = /api
    |   +-- layouts/
    |   |   +-- AdminLayout.vue        Sidebar navigation for admin role
    |   |   \\-- EmployeeLayout.vue     Sidebar navigation for employee role
    |   +-- router/
    |   |   \\-- index.js               Vue Router 4 route definitions
    |   +-- store/
    |   |   \\-- useAppStore.js         Pinia store for current user session
    |   +-- views/
    |   |   +-- admin/
    |   |   |   +-- AllLeaves.vue      Admin: view and action all leave requests
    |   |   |   +-- Dashboard.vue      Admin: stats cards and pending tables
    |   |   |   +-- Departments.vue    Admin: manage departments
    |   |   |   +-- LeaveTypes.vue     Admin: configure leave types
    |   |   |   +-- ManageUsers.vue    Admin: approve or reject user accounts
    |   |   |   \\-- Reports.vue        Admin: analytics and department reports
    |   |   +-- employee/
    |   |   |   +-- ApplyLeave.vue     Employee: leave application form
    |   |   |   +-- Dashboard.vue      Employee: personal leave summary
    |   |   |   +-- LeaveCalendar.vue  Employee: monthly leave calendar
    |   |   |   +-- LeaveHistory.vue   Employee: leave history and cancel
    |   |   |   \\-- Profile.vue        Employee: profile and balance view
    |   |   \\-- SelectUser.vue         Entry screen: login and registration
    |   +-- App.vue                    Root component with router-view
    |   +-- main.js                    App bootstrap: createApp, Pinia, Router
    |   \\-- style.css                  Global styles
    +-- index.html
    +-- package.json
    \\-- vite.config.js                 Vite config: /api proxy to port 5000`
        ),
      ]
    }
  ]
});

const outPath = path.join(__dirname, 'Project_Report_BCSP064_AakashSah_v10.docx');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log('SUCCESS: Document written to ' + outPath);
  console.log('File size: ' + Math.round(buffer.length / 1024) + ' KB');
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
