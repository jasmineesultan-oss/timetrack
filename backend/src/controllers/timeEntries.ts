import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getTimeEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, projectId, startDate, endDate, page = '1', limit = '50' } = req.query;
    const workspaceId = req.user!.workspaceId!;
    const isAdmin = req.user!.role === 'ADMIN';

    const where: any = {
      workspaceId,
      ...(isAdmin && userId ? { userId: userId as string } : !isAdmin ? { userId: req.user!.userId } : {}),
      ...(projectId ? { projectId: projectId as string } : {}),
      ...(startDate || endDate ? {
        startTime: {
          ...(startDate ? { gte: new Date(startDate as string) } : {}),
          ...(endDate ? { lte: new Date(endDate as string) } : {}),
        },
      } : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          project: { select: { id: true, name: true, color: true } },
          task: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.timeEntry.count({ where }),
    ]);

    res.json({ entries, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

export const getRunningEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.userId, status: 'RUNNING' },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, name: true } },
      },
    });

    res.json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to fetch running entry' });
  }
};

export const startTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, projectId, taskId, isBillable } = req.body;
    const workspaceId = req.user!.workspaceId!;

    // Stop any running timer first
    await prisma.timeEntry.updateMany({
      where: { userId: req.user!.userId, status: 'RUNNING' },
      data: {
        status: 'STOPPED',
        endTime: new Date(),
      },
    });

    // Compute duration for stopped entries
    const stoppedEntries = await prisma.timeEntry.findMany({
      where: { userId: req.user!.userId, status: 'STOPPED', duration: null, endTime: { not: null } },
    });

    for (const entry of stoppedEntries) {
      if (entry.endTime && entry.startTime) {
        const duration = Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000);
        await prisma.timeEntry.update({ where: { id: entry.id }, data: { duration } });
      }
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user!.userId,
        workspaceId,
        description,
        projectId: projectId || null,
        taskId: taskId || null,
        isBillable: isBillable ?? true,
        startTime: new Date(),
        status: 'RUNNING',
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start timer' });
  }
};

export const stopTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const endTime = new Date();

    const entry = await prisma.timeEntry.findFirst({
      where: { id, userId: req.user!.userId, status: 'RUNNING' },
    });

    if (!entry) {
      res.status(404).json({ error: 'Running timer not found' });
      return;
    }

    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: { status: 'STOPPED', endTime, duration },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to stop timer' });
  }
};

export const createManualEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, projectId, taskId, isBillable, startTime, endTime } = req.body;
    const workspaceId = req.user!.workspaceId!;

    if (!startTime || !endTime) {
      res.status(400).json({ error: 'Start and end time required' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user!.userId,
        workspaceId,
        description,
        projectId: projectId || null,
        taskId: taskId || null,
        isBillable: isBillable ?? true,
        startTime: start,
        endTime: end,
        duration,
        status: 'STOPPED',
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to create entry' });
  }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, projectId, taskId, isBillable, startTime, endTime } = req.body;

    const existing = await prisma.timeEntry.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const start = startTime ? new Date(startTime) : existing.startTime;
    const end = endTime ? new Date(endTime) : existing.endTime;
    const duration = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : existing.duration;

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        description,
        projectId: projectId ?? existing.projectId,
        taskId: taskId ?? existing.taskId,
        isBillable: isBillable ?? existing.isBillable,
        startTime: start,
        endTime: end,
        duration,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, name: true } },
      },
    });

    res.json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'ADMIN';

    const where = isAdmin ? { id } : { id, userId: req.user!.userId };
    const existing = await prisma.timeEntry.findFirst({ where });

    if (!existing) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    await prisma.timeEntry.delete({ where: { id } });
    res.json({ message: 'Entry deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
};
