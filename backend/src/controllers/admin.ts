import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAdminAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId!;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalProjects, monthEntries, allTimeEntries, topUsers] = await Promise.all([
      prisma.userWorkspace.count({ where: { workspaceId } }),
      prisma.project.count({ where: { workspaceId, isArchived: false } }),
      prisma.timeEntry.findMany({
        where: { workspaceId, status: 'STOPPED', startTime: { gte: startOfMonth } },
        select: { duration: true, userId: true },
      }),
      prisma.timeEntry.aggregate({
        where: { workspaceId, status: 'STOPPED' },
        _sum: { duration: true },
        _count: true,
      }),
      prisma.timeEntry.groupBy({
        by: ['userId'],
        where: { workspaceId, status: 'STOPPED', startTime: { gte: startOfMonth } },
        _sum: { duration: true },
        orderBy: { _sum: { duration: 'desc' } },
        take: 5,
      }),
    ]);

    const topUserIds = topUsers.map(u => u.userId);
    const topUserDetails = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    const topUsersWithDetails = topUsers.map(u => ({
      ...u,
      user: topUserDetails.find(d => d.id === u.userId),
      hours: Math.round(((u._sum.duration || 0) / 3600) * 100) / 100,
    }));

    const monthSeconds = monthEntries.reduce((s, e) => s + (e.duration || 0), 0);

    res.json({
      totalUsers,
      totalProjects,
      monthHours: Math.round((monthSeconds / 3600) * 100) / 100,
      allTimeHours: Math.round(((allTimeEntries._sum.duration || 0) / 3600) * 100) / 100,
      totalEntries: allTimeEntries._count,
      topUsers: topUsersWithDetails,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

export const toggleUserActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};
