const router = require('express').Router();
const c = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/', c.createUser);                                    // Public — employee registration
router.get('/', verifyToken, requireAdmin, c.getAllUsers);          // Admin only
router.get('/pending', verifyToken, requireAdmin, c.getPendingUsers); // Admin only
router.get('/:id', verifyToken, c.getUserById);                    // Any authenticated user
router.put('/:id', verifyToken, c.updateUser);                     // Any authenticated user
router.delete('/:id', verifyToken, requireAdmin, c.deleteUser);    // Admin only
router.put('/:id/approve', verifyToken, requireAdmin, c.approveUser); // Admin only
router.put('/:id/reject', verifyToken, requireAdmin, c.rejectUser);   // Admin only

module.exports = router;
