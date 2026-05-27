const router = require('express').Router();
const c = require('../controllers/leaveTypeController');
router.get('/', c.getLeaveTypes);
router.get('/all', c.getAllLeaveTypes);
router.post('/', c.createLeaveType);
router.put('/:id', c.updateLeaveType);
router.delete('/:id', c.deleteLeaveType);
module.exports = router;
