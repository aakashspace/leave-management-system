const mongoose = require('mongoose');
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
module.exports = mongoose.model('User', UserSchema);
