const router = require('express').Router();
const c = require('../controllers/departmentController');
router.get('/', c.getDepartments);
router.post('/', c.createDepartment);
router.put('/:id', c.updateDepartment);
router.delete('/:id', c.deleteDepartment);
module.exports = router;
