const router = require('express').Router();
const c = require('../controllers/reportController');
router.get('/dashboard', c.getDashboardStats);
router.get('/leave-stats', c.getLeaveStats);
router.get('/employee-stats', c.getEmployeeStats);
router.get('/dept-stats', c.getDeptStats);
module.exports = router;
