import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projects';

const router = Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', requireAdmin, createProject);
router.put('/:id', requireAdmin, updateProject);
router.delete('/:id', requireAdmin, deleteProject);

export default router;
