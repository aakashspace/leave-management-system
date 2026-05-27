const mongoose = require('mongoose');
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
module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
