const router = require('express').Router();
const c = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyToken, requireAdmin, c.getDashboardStats);
router.get('/leave-stats', verifyToken, requireAdmin, c.getLeaveStats);
router.get('/employee-stats', verifyToken, requireAdmin, c.getEmployeeStats);
router.get('/dept-stats', verifyToken, requireAdmin, c.getDeptStats);

module.exports = router;
