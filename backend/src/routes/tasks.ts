import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getTasksByProject, createTask, updateTask, deleteTask } from '../controllers/tasks';

const router = Router();
router.use(authenticate);

router.get('/project/:projectId', getTasksByProject);
router.post('/project/:projectId', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
