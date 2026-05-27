const router = require('express').Router();
const c = require('../controllers/leaveRequestController');
router.post('/', c.applyLeave);
router.get('/my/:user_id', c.getMyLeaves);
router.get('/all', c.getAllLeaves);
router.put('/:id/status', c.updateLeaveStatus);
router.put('/:id/cancel', c.cancelLeave);
module.exports = router;
