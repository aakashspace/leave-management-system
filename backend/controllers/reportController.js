const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Department = require('../models/Department');

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

exports.getLeaveStats = async (req, res) => {
  try {
    const byType = await LeaveRequest.aggregate([
      { $group: { _id: '$leave_type_name', count: { $sum: 1 }, totalDays: { $sum: '$total_days' } } }
    ]);
    const byStatus = await LeaveRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { byType, byStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const stats = await LeaveRequest.aggregate([
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: { _id: '$user_id', name: { $first: '$user.name' }, totalRequests: { $sum: 1 }, totalDays: { $sum: '$total_days' }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } } } },
      { $sort: { totalRequests: -1 } }
    ]);
    res.json({ success: true, data: stats });
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
      {
        $group: {
          _id: { $ifNull: ['$dept.dept_name', 'No Department'] },
          totalRequests: { $sum: 1 },
          totalDays: { $sum: '$total_days' },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      },
      { $sort: { totalRequests: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
