const router = require('express').Router();
const c = require('../controllers/departmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', c.getDepartments);                                  // Public — needed for registration form
router.post('/', verifyToken, requireAdmin, c.createDepartment);    // Admin only
router.put('/:id', verifyToken, requireAdmin, c.updateDepartment);  // Admin only
router.delete('/:id', verifyToken, requireAdmin, c.deleteDepartment); // Admin only

module.exports = router;
