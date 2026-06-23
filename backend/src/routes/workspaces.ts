import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  createWorkspace, getWorkspaces, getWorkspace, updateWorkspace,
  archiveWorkspace, regenerateJoinCode, getWorkspaceMembers, removeWorkspaceMember
} from '../controllers/workspaces';

const router = Router();
router.use(authenticate);

router.get('/', getWorkspaces);
router.post('/', requireAdmin, createWorkspace);
router.get('/:id', getWorkspace);
router.put('/:id', requireAdmin, updateWorkspace);
router.post('/:id/archive', requireAdmin, archiveWorkspace);
router.post('/:id/regenerate-code', requireAdmin, regenerateJoinCode);
router.get('/:id/members', getWorkspaceMembers);
router.delete('/:id/members/:userId', requireAdmin, removeWorkspaceMember);

export default router;
