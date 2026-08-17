import { Router } from 'express';
import { getAllUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/admin/all', getAllUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
