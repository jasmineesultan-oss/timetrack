import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password, joinCode } = req.body;

    if (!email || !name || !password || !joinCode) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate workspace join code
    const workspace = await prisma.workspace.findFirst({
      where: { joinCode, isArchived: false },
    });

    if (!workspace) {
      res.status(400).json({ error: 'Invalid workspace code. Please check with your admin.' });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'USER',
        workspaces: {
          create: {
            workspaceId: workspace.id,
            role: 'USER',
          },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: workspace.id,
    });

    res.status(201).json({
      token,
      user: { ...user, workspaceId: workspace.id, workspaceName: workspace.name },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          include: { workspace: true },
          where: { workspace: { isArchived: false } },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const primaryWorkspace = user.workspaces[0];

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: primaryWorkspace?.workspaceId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: primaryWorkspace?.workspaceId,
        workspaceName: primaryWorkspace?.workspace.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const me = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        workspaces: {
          include: { workspace: { select: { id: true, name: true, joinCode: true } } },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If that email exists, a reset link has been sent.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    // In production: send email with reset link
    console.log(`Password reset token for ${email}: ${token}`);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch {
    res.status(500).json({ error: 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ message: 'Password reset successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
