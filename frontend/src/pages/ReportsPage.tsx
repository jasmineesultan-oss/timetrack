import React, { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDuration, formatHours, formatDate, formatTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ReportData {
  totalSeconds: number;
  totalHours: number;
  billableSeconds: number;
  billableHours: number;
  totalEntries: number;
  byProject: { name: string; color: string; seconds: number; entries: number }[];
  byUser: { name: string; email: string; seconds: number; entries: number }[];
  entries: any[];
}

const QUICK_RANGES = [
  { label: 'Today', start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 7 days', start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
  { label: 'This month', start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Last 30 days', start: format(subDays(new Date(), 29), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
];

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);

  React.useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (isAdmin) api.get('/users/workspace').then(r => setUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const runReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
        ...(projectId && { projectId }),
        ...(userId && { userId }),
      });
      const { data: res } = await api.get(`/reports/summary?${params}`);
      setData(res);
    } finally { setLoading(false); }
  }, [startDate, endDate, projectId, userId]);

  React.useEffect(() => { runReport(); }, []);

  const downloadFile = async (type: 'csv' | 'excel') => {
    const setter = type === 'csv' ? setExportingCSV : setExportingXLSX;
    setter(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
        ...(projectId && { projectId }),
        ...(userId && { userId }),
      });
      const endpoint = type === 'csv' ? '/reports/export/csv' : '/reports/export/excel';
      const res = await api.get(`${endpoint}?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetrack-export.${type === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setter(false); }
  };

  const pieData = data?.byProject.slice(0, 8).map(p => ({
    name: p.name,
    value: Math.round(p.seconds / 3600 * 100) / 100,
    color: p.color,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm">Analyze your team's time and productivity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadFile('csv')} loading={exportingCSV}>
            <FileText className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile('excel')} loading={exportingXLSX}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Quick range buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => { setStartDate(r.start); setEndDate(r.end); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              startDate === r.start && endDate === r.end
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-background text-muted-foreground border-border hover:border-brand-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">User</label>
                <select
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <Button onClick={runReport} loading={loading} size="sm">
              <Search className="h-4 w-4" /> Run report
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total tracked', value: formatDuration(data.totalSeconds), sub: `${data.totalHours}h decimal` },
              { label: 'Billable', value: formatDuration(data.billableSeconds), sub: `${data.billableHours}h decimal` },
              { label: 'Non-billable', value: formatDuration(data.totalSeconds - data.billableSeconds), sub: 'hours' },
              { label: 'Total entries', value: String(data.totalEntries), sub: 'time records' },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold font-mono text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project breakdown */}
            <Card>
              <CardHeader><CardTitle>By project</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v.toFixed(2)}h`, 'Hours']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No project data</p>
                )}
                <div className="space-y-2 mt-2">
                  {data.byProject.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </div>
                      <span className="font-mono">{formatDuration(p.seconds)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User breakdown (admin) */}
            {isAdmin && data.byUser.length > 0 && (
              <Card>
                <CardHeader><CardTitle>By team member</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.byUser.map((u, i) => (
                      <div key={u.email}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.entries} entries</p>
                            </div>
                          </div>
                          <span className="font-mono font-semibold">{formatDuration(u.seconds)}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${(u.seconds / (data.byUser[0]?.seconds || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Entry table */}
          <Card>
            <CardHeader><CardTitle>Detailed entries ({data.totalEntries})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                      {isAdmin && <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>}
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.slice(0, 50).map(e => (
                      <tr key={e.id} className="border-b border-border hover:bg-accent/50">
                        <td className="px-4 py-2.5 text-muted-foreground">{formatDate(e.startTime)}</td>
                        {isAdmin && <td className="px-4 py-2.5">{e.user.name}</td>}
                        <td className="px-4 py-2.5 max-w-[200px] truncate">{e.description || <span className="text-muted-foreground italic">—</span>}</td>
                        <td className="px-4 py-2.5">
                          {e.project ? (
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.project.color }} />
                              {e.project.name}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {formatTime(e.startTime)} – {e.endTime ? formatTime(e.endTime) : '...'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                          {e.duration ? formatDuration(e.duration) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.totalEntries > 50 && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    Showing first 50 entries. Export CSV/Excel for full data.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
