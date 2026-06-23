import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getTasksByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.task.findMany({
      where: { projectId, isArchived: false },
      orderBy: { createdAt: 'asc' },
    });
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    const task = await prisma.task.create({
      data: { name, projectId },
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, isArchived } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: { ...(name && { name }), ...(isArchived !== undefined && { isArchived }) },
    });
    res.json(task);
  } catch {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.task.update({ where: { id }, data: { isArchived: true } });
    res.json({ message: 'Task archived' });
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
