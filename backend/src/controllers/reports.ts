import { Response } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatHours = (seconds: number): number => {
  return Math.round((seconds / 3600) * 100) / 100;
};

export const getSummaryReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, userId, projectId } = req.query;
    const workspaceId = req.user!.workspaceId!;
    const isAdmin = req.user!.role === 'ADMIN';

    const where: any = {
      workspaceId,
      status: 'STOPPED',
      ...(isAdmin && userId ? { userId: userId as string } : !isAdmin ? { userId: req.user!.userId } : {}),
      ...(projectId ? { projectId: projectId as string } : {}),
      ...(startDate || endDate ? {
        startTime: {
          ...(startDate ? { gte: new Date(startDate as string) } : {}),
          ...(endDate ? { lte: new Date(endDate as string) } : {}),
        },
      } : {}),
    };

    const [entries, totalEntries] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, color: true } },
          task: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableSeconds = entries.filter(e => e.isBillable).reduce((sum, e) => sum + (e.duration || 0), 0);

    // Group by project
    const byProject: Record<string, { name: string; color: string; seconds: number; entries: number }> = {};
    for (const entry of entries) {
      const key = entry.projectId || 'no-project';
      if (!byProject[key]) {
        byProject[key] = {
          name: entry.project?.name || 'No Project',
          color: entry.project?.color || '#94a3b8',
          seconds: 0,
          entries: 0,
        };
      }
      byProject[key].seconds += entry.duration || 0;
      byProject[key].entries += 1;
    }

    // Group by user (admin only)
    const byUser: Record<string, { name: string; email: string; seconds: number; entries: number }> = {};
    if (isAdmin) {
      for (const entry of entries) {
        const key = entry.userId;
        if (!byUser[key]) {
          byUser[key] = {
            name: entry.user.name,
            email: entry.user.email,
            seconds: 0,
            entries: 0,
          };
        }
        byUser[key].seconds += entry.duration || 0;
        byUser[key].entries += 1;
      }
    }

    res.json({
      totalSeconds,
      totalHours: formatHours(totalSeconds),
      billableSeconds,
      billableHours: formatHours(billableSeconds),
      totalEntries,
      byProject: Object.values(byProject).sort((a, b) => b.seconds - a.seconds),
      byUser: Object.values(byUser).sort((a, b) => b.seconds - a.seconds),
      entries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId!;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseWhere: any = {
      workspaceId,
      status: 'STOPPED',
      ...(isAdmin ? {} : { userId }),
    };

    const [todaySeconds, weekSeconds, monthSeconds, recentEntries] = await Promise.all([
      prisma.timeEntry.aggregate({
        where: { ...baseWhere, startTime: { gte: startOfDay } },
        _sum: { duration: true },
      }),
      prisma.timeEntry.aggregate({
        where: { ...baseWhere, startTime: { gte: startOfWeek } },
        _sum: { duration: true },
      }),
      prisma.timeEntry.aggregate({
        where: { ...baseWhere, startTime: { gte: startOfMonth } },
        _sum: { duration: true },
      }),
      prisma.timeEntry.findMany({
        where: { ...baseWhere },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, name: true, color: true } },
          task: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      today: { seconds: todaySeconds._sum.duration || 0, hours: formatHours(todaySeconds._sum.duration || 0) },
      week: { seconds: weekSeconds._sum.duration || 0, hours: formatHours(weekSeconds._sum.duration || 0) },
      month: { seconds: monthSeconds._sum.duration || 0, hours: formatHours(monthSeconds._sum.duration || 0) },
      recentEntries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getPayrollReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const workspaceId = req.user!.workspaceId!;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Start and end date required for payroll report' });
      return;
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        workspaceId,
        status: 'STOPPED',
        startTime: { gte: new Date(startDate as string), lte: new Date(endDate as string) },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const byUser: Record<string, {
      userId: string;
      name: string;
      email: string;
      totalSeconds: number;
      billableSeconds: number;
      projects: Record<string, { name: string; seconds: number }>;
    }> = {};

    for (const entry of entries) {
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = {
          userId: entry.userId,
          name: entry.user.name,
          email: entry.user.email,
          totalSeconds: 0,
          billableSeconds: 0,
          projects: {},
        };
      }
      byUser[entry.userId].totalSeconds += entry.duration || 0;
      if (entry.isBillable) byUser[entry.userId].billableSeconds += entry.duration || 0;

      const pKey = entry.projectId || 'no-project';
      if (!byUser[entry.userId].projects[pKey]) {
        byUser[entry.userId].projects[pKey] = { name: entry.project?.name || 'No Project', seconds: 0 };
      }
      byUser[entry.userId].projects[pKey].seconds += entry.duration || 0;
    }

    const payroll = Object.values(byUser).map(u => ({
      ...u,
      totalHours: formatHours(u.totalSeconds),
      billableHours: formatHours(u.billableSeconds),
      totalFormatted: formatDuration(u.totalSeconds),
      projects: Object.values(u.projects).map(p => ({
        ...p,
        hours: formatHours(p.seconds),
        formatted: formatDuration(p.seconds),
      })).sort((a, b) => b.seconds - a.seconds),
    })).sort((a, b) => b.totalSeconds - a.totalSeconds);

    res.json({
      period: { start: startDate, end: endDate },
      employees: payroll,
      totalHours: formatHours(entries.reduce((s, e) => s + (e.duration || 0), 0)),
    });
  } catch {
    res.status(500).json({ error: 'Failed to generate payroll report' });
  }
};

export const exportCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, userId, projectId } = req.query;
    const workspaceId = req.user!.workspaceId!;
    const isAdmin = req.user!.role === 'ADMIN';

    const entries = await prisma.timeEntry.findMany({
      where: {
        workspaceId,
        status: 'STOPPED',
        ...(isAdmin && userId ? { userId: userId as string } : !isAdmin ? { userId: req.user!.userId } : {}),
        ...(projectId ? { projectId: projectId as string } : {}),
        ...(startDate || endDate ? {
          startTime: {
            ...(startDate ? { gte: new Date(startDate as string) } : {}),
            ...(endDate ? { lte: new Date(endDate as string) } : {}),
          },
        } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true } },
        task: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const rows = entries.map(e => ({
      User: e.user.name,
      Email: e.user.email,
      Date: e.startTime.toISOString().split('T')[0],
      'Start Time': e.startTime.toISOString(),
      'End Time': e.endTime?.toISOString() || '',
      Duration: formatDuration(e.duration || 0),
      'Hours': formatHours(e.duration || 0),
      Project: e.project?.name || '',
      Task: e.task?.name || '',
      Description: e.description || '',
      Billable: e.isBillable ? 'Yes' : 'No',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Time Entries');
    const csvOutput = XLSX.utils.sheet_to_csv(ws);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="timetrack-export.csv"');
    res.send(csvOutput);
  } catch {
    res.status(500).json({ error: 'Export failed' });
  }
};

export const exportExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, userId, projectId } = req.query;
    const workspaceId = req.user!.workspaceId!;
    const isAdmin = req.user!.role === 'ADMIN';

    const entries = await prisma.timeEntry.findMany({
      where: {
        workspaceId,
        status: 'STOPPED',
        ...(isAdmin && userId ? { userId: userId as string } : !isAdmin ? { userId: req.user!.userId } : {}),
        ...(projectId ? { projectId: projectId as string } : {}),
        ...(startDate || endDate ? {
          startTime: {
            ...(startDate ? { gte: new Date(startDate as string) } : {}),
            ...(endDate ? { lte: new Date(endDate as string) } : {}),
          },
        } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true } },
        task: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const rows = entries.map(e => ({
      User: e.user.name,
      Email: e.user.email,
      Date: e.startTime.toISOString().split('T')[0],
      'Start Time': e.startTime.toLocaleTimeString(),
      'End Time': e.endTime?.toLocaleTimeString() || '',
      'Duration (h:m:s)': formatDuration(e.duration || 0),
      'Hours (decimal)': formatHours(e.duration || 0),
      Project: e.project?.name || '',
      Task: e.task?.name || '',
      Description: e.description || '',
      Billable: e.isBillable ? 'Yes' : 'No',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Time Entries');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="timetrack-export.xlsx"');
    res.send(buf);
  } catch {
    res.status(500).json({ error: 'Export failed' });
  }
};
