const mongoose = require('mongoose');
const DepartmentSchema = new mongoose.Schema({
  dept_name: { type: String, required: true, unique: true }
}, { timestamps: true });
module.exports = mongoose.model('Department', DepartmentSchema);
