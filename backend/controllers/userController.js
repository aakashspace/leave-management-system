const bcrypt = require('bcryptjs');
const User = require('../models/User');
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
    const { name, email, password, role, dept_id } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const assignedRole = role || 'employee';
    const user = new User({
      name,
      email,
      role: assignedRole,
      ...(dept_id ? { dept_id } : {}),
      status: assignedRole === 'admin' ? 'approved' : 'pending'
    });

    // Hash password if provided
    if (password) {
      user.password_hash = await bcrypt.hash(password, 10);
    }

    if (assignedRole === 'admin') {
      const leaveTypes = await LeaveType.find({ is_active: true });
      user.leave_balances = leaveTypes.map(lt => ({
        leave_type_id: lt._id,
        leave_type_name: lt.name,
        total_days: lt.max_paid_days,
        used_days: 0,
        remaining_days: lt.max_paid_days
      }));
    }
    await user.save();
    res.status(201).json({ success: true, data: user, message: assignedRole === 'admin' ? 'Admin created' : 'Registration successful. Pending admin approval.' });
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
      leave_type_id: lt._id,
      leave_type_name: lt.name,
      total_days: lt.max_paid_days,
      used_days: 0,
      remaining_days: lt.max_paid_days
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
    const user = await User.findByIdAndUpdate(req.params.id, { name, dept_id }, { new: true }).populate('dept_id', 'dept_name');
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
};
