const Department = require('../models/Department');

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
    const dept = await Department.findByIdAndUpdate(req.params.id, { dept_name: req.body.dept_name }, { new: true });
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
};
