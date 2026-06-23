import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate);

router.get('/workspace', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId!;
    const members = await prisma.userWorkspace.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, isActive: true, createdAt: true } },
      },
    });
    res.json(members.map(m => ({ ...m.user, workspaceRole: m.role, joinedAt: m.joinedAt })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const updateData: any = {};
    if (name) updateData.name = name;

    if (newPassword) {
      if (!currentPassword) { res.status(400).json({ error: 'Current password required' }); return; }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
