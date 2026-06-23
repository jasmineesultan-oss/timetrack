import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId;
    const { includeArchived } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: workspaceId!,
        ...(includeArchived !== 'true' ? { isArchived: false } : {}),
      },
      include: {
        tasks: { where: { isArchived: false } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: { select: { timeEntries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color, isBillable, memberIds } = req.body;
    const workspaceId = req.user!.workspaceId!;

    const project = await prisma.project.create({
      data: {
        name,
        color: color || '#6366f1',
        isBillable: isBillable ?? true,
        workspaceId,
        members: {
          create: memberIds?.map((userId: string) => ({ userId })) || [],
        },
      },
      include: {
        tasks: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color, isBillable, isArchived, memberIds } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(isBillable !== undefined && { isBillable }),
        ...(isArchived !== undefined && { isArchived }),
        ...(memberIds !== undefined && {
          members: {
            deleteMany: {},
            create: memberIds.map((userId: string) => ({ userId })),
          },
        }),
      },
      include: {
        tasks: { where: { isArchived: false } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json(project);
  } catch {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.project.update({ where: { id }, data: { isArchived: true } });
    res.json({ message: 'Project archived' });
  } catch {
    res.status(500).json({ error: 'Failed to archive project' });
  }
};
