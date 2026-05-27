const router = require('express').Router();
const c = require('../controllers/leaveTypeController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, c.getLeaveTypes);                      // Any authenticated user (for apply leave form)
router.get('/all', verifyToken, requireAdmin, c.getAllLeaveTypes);   // Admin only
router.post('/', verifyToken, requireAdmin, c.createLeaveType);     // Admin only
router.put('/:id', verifyToken, requireAdmin, c.updateLeaveType);   // Admin only
router.delete('/:id', verifyToken, requireAdmin, c.deleteLeaveType); // Admin only

module.exports = router;
