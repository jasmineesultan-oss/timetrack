import React, { useEffect, useState } from 'react';
import { Users, Clock, FolderOpen, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatHours } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import api from '@/lib/api';

export const AdminPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [payroll, setPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payrollPeriod, setPayrollPeriod] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [exportingPayroll, setExportingPayroll] = useState(false);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setAnalytics(r.data))
      .finally(() => setLoading(false));
  }, []);

  const loadPayroll = async () => {
    try {
      const { data } = await api.get(`/reports/payroll?startDate=${payrollPeriod.start}&endDate=${payrollPeriod.end}`);
      setPayroll(data);
    } catch {}
  };

  useEffect(() => { loadPayroll(); }, [payrollPeriod]);

  const exportPayrollCSV = async () => {
    setExportingPayroll(true);
    try {
      const res = await api.get(`/reports/export/csv?startDate=${new Date(payrollPeriod.start).toISOString()}&endDate=${new Date(payrollPeriod.end + 'T23:59:59').toISOString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${payrollPeriod.start}-to-${payrollPeriod.end}.csv`;
      a.click();
    } finally { setExportingPayroll(false); }
  };

  const quickMonths = [0, 1, 2].map(i => {
    const d = subMonths(new Date(), i);
    return { label: format(d, 'MMM yyyy'), start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd') };
  });

  const topUsersChart = analytics?.topUsers?.map((u: any) => ({
    name: u.user?.name?.split(' ')[0] || 'Unknown',
    hours: u.hours,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Workspace-wide insights and payroll reports</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)
        ) : [
          { label: 'Total members', value: String(analytics?.totalUsers || 0), icon: Users, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'Active projects', value: String(analytics?.totalProjects || 0), icon: FolderOpen, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Hours this month', value: `${analytics?.monthHours || 0}h`, icon: Clock, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950' },
          { label: 'All-time hours', value: `${analytics?.allTimeHours || 0}h`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top users chart */}
        <Card>
          <CardHeader><CardTitle>Most active this month</CardTitle></CardHeader>
          <CardContent>
            {topUsersChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topUsersChart} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} unit="h" className="text-xs" />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} className="text-xs" width={60} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}h`, 'Hours']} />
                  <Bar dataKey="hours" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Top users list */}
        <Card>
          <CardHeader><CardTitle>Top contributors</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topUsers?.map((u: any, i: number) => (
                <div key={u.userId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                    {u.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{u.user?.email}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold">{u.hours}h</span>
                </div>
              ))}
              {!analytics?.topUsers?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity this month</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Payroll Report</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {quickMonths.map(m => (
              <button
                key={m.label}
                onClick={() => setPayrollPeriod({ start: m.start, end: m.end })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  payrollPeriod.start === m.start
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'text-muted-foreground border-border hover:border-brand-300'
                }`}
              >
                {m.label}
              </button>
            ))}
            <div className="flex gap-1">
              <input type="date" value={payrollPeriod.start} onChange={e => setPayrollPeriod(p => ({ ...p, start: e.target.value }))}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input type="date" value={payrollPeriod.end} onChange={e => setPayrollPeriod(p => ({ ...p, end: e.target.value }))}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <Button size="sm" variant="outline" onClick={exportPayrollCSV} loading={exportingPayroll}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {payroll ? (
            <div>
              <div className="px-6 py-3 bg-accent/50 flex items-center justify-between text-sm font-medium">
                <span>Period: {payrollPeriod.start} to {payrollPeriod.end}</span>
                <span>Total: {payroll.totalHours}h</span>
              </div>
              <div className="divide-y divide-border">
                {payroll.employees?.map((emp: any) => (
                  <div key={emp.userId} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-lg">{emp.totalFormatted}</p>
                        <p className="text-xs text-muted-foreground">{emp.totalHours}h · {emp.billableHours}h billable</p>
                      </div>
                    </div>
                    {emp.projects.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {emp.projects.map((p: any) => (
                          <div key={p.name} className="bg-secondary rounded-lg px-3 py-1.5">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.formatted}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {payroll.employees?.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No entries found for this period
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
