import { Response } from 'express';
import { nanoid } from 'nanoid';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const joinCode = nanoid(8).toUpperCase();

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        joinCode,
        users: {
          create: {
            userId: req.user!.userId,
            role: 'ADMIN',
          },
        },
      },
    });

    res.status(201).json(workspace);
  } catch {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        users: { some: { userId: req.user!.userId } },
      },
      include: {
        _count: { select: { users: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(workspaces);
  } catch {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        users: { some: { userId: req.user!.userId } },
      },
      include: {
        users: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        _count: { select: { projects: true, timeEntries: true } },
      },
    });

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json(workspace);
  } catch {
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name, description },
    });

    res.json(workspace);
  } catch {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
};

export const archiveWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workspace = await prisma.workspace.update({
      where: { id },
      data: { isArchived: true },
    });
    res.json(workspace);
  } catch {
    res.status(500).json({ error: 'Failed to archive workspace' });
  }
};

export const regenerateJoinCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const joinCode = nanoid(8).toUpperCase();

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { joinCode },
    });

    res.json({ joinCode: workspace.joinCode });
  } catch {
    res.status(500).json({ error: 'Failed to regenerate join code' });
  }
};

export const getWorkspaceMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const members = await prisma.userWorkspace.findMany({
      where: { workspaceId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, isActive: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.json(members);
  } catch {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

export const removeWorkspaceMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;

    if (userId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot remove yourself from workspace' });
      return;
    }

    await prisma.userWorkspace.deleteMany({
      where: { workspaceId: id, userId },
    });

    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
