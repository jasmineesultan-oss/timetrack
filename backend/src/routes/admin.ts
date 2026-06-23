import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getAdminAnalytics, toggleUserActive } from '../controllers/admin';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/analytics', getAdminAnalytics);
router.post('/users/:userId/toggle-active', toggleUserActive);

export default router;
