const mongoose = require('mongoose');
const LeaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  max_paid_days: { type: Number, required: true },
  color_code: { type: String, default: '#3B82F6' },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('LeaveType', LeaveTypeSchema);
