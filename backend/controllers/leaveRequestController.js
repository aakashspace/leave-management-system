const LeaveRequest = require('../models/LeaveRequest');
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
        return res.status(400).json({ success: false, message: `Insufficient balance. Available: ${balance ? balance.remaining_days : 0} days` });
      }
    }

    const request = await LeaveRequest.create({
      user_id, type_id,
      leave_type_name: leaveType.name,
      start_date: start, end_date: end,
      total_days, is_paid: is_paid !== false,
      reason, priority
    });
    res.status(201).json({ success: true, data: request, message: 'Leave applied successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ user_id: req.params.user_id })
      .populate('type_id', 'name color_code')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.user_id) filter.user_id = req.query.user_id;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const leaves = await LeaveRequest.find(filter)
      .populate('user_id', 'name email dept_id')
      .populate('type_id', 'name color_code')
      .sort({ createdAt: -1 });
    leaves.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));
    res.json({ success: true, data: leaves });
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
        {
          $inc: {
            'leave_balances.$.used_days': leave.total_days,
            'leave_balances.$.remaining_days': -leave.total_days
          }
        }
      );
    }

    leave.status = status;
    leave.admin_comment = admin_comment || '';
    await leave.save();
    res.json({ success: true, data: leave, message: `Leave ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Not found' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
    leave.status = 'rejected';
    leave.admin_comment = 'Cancelled by employee';
    await leave.save();
    res.json({ success: true, message: 'Leave cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
