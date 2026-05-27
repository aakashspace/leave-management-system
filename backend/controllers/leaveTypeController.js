const LeaveType = require('../models/LeaveType');

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
};
