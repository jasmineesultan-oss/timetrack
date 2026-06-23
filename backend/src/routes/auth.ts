import { Router } from 'express';
import { register, login, me, forgotPassword, resetPassword } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
