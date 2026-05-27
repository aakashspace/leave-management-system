const router = require('express').Router();
const c = require('../controllers/leaveRequestController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/', verifyToken, c.applyLeave);                        // Any authenticated user
router.get('/my/:user_id', verifyToken, c.getMyLeaves);             // Any authenticated user
router.get('/all', verifyToken, requireAdmin, c.getAllLeaves);       // Admin only
router.put('/:id/status', verifyToken, requireAdmin, c.updateLeaveStatus); // Admin only
router.put('/:id/cancel', verifyToken, c.cancelLeave);              // Any authenticated user

module.exports = router;
