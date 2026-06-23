import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TimerBar } from '@/components/timer/TimerBar';
import { TimeEntryItem } from '@/components/timer/TimeEntryItem';
import { useAuthStore } from '@/stores/authStore';
import { useTimerStore } from '@/stores/timerStore';
import { formatDuration, formatHours } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { runningEntry, elapsed, fetchRunning } = useTimerStore();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchRunning(); loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([api.get('/reports/dashboard'), api.get('/projects')]);
      setStats(s.data); setProjects(p.data);
    } finally { setLoading(false); }
  };

  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const weekData = weekDays.map(day => ({ day, hours: 0 }));
  stats?.recentEntries?.forEach((e: any) => {
    if (e.duration) weekData[new Date(e.startTime).getDay()].hours += Math.round(e.duration/3600*100)/100;
  });

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

  return (
    <div className="flex flex-col h-full">
      <TimerBar />
      <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Good {greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Here's your time tracking overview</p>
        </div>

        {runningEntry && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs font-medium mb-1">⏱ Timer running</p>
                <p className="text-lg font-bold">{runningEntry.description || 'No description'}</p>
                {runningEntry.project && <p className="text-indigo-200 text-sm mt-0.5">{runningEntry.project.name}</p>}
              </div>
              <div className="font-mono text-3xl font-bold">{formatDuration(elapsed)}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Today', icon: Clock, s: stats?.today?.seconds||0, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
            { label: 'This week', icon: TrendingUp, s: stats?.week?.seconds||0, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
            { label: 'This month', icon: Calendar, s: stats?.month?.seconds||0, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">{formatDuration(c.s)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatHours(c.s)} decimal</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Weekly activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData} barSize={28}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} unit="h" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}h`, 'Hours']} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9' }} />
                  <Bar dataKey="hours" radius={[6,6,0,0]}>
                    {weekData.map((_, i) => <Cell key={i} fill={i === new Date().getDay() ? '#6366f1' : '#e0e7ff'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400">No projects yet</p>
                  {user?.role === 'ADMIN' && <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/projects')}>Create project</Button>}
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0,5).map(p => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-sm flex-1 truncate text-slate-700 dark:text-slate-300">{p.name}</span>
                      <span className="text-xs text-slate-400">{p._count?.timeEntries||0}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent entries</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tracker')}>View all</Button>
          </CardHeader>
          <CardContent className="px-2">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />)}</div>
            ) : !stats?.recentEntries?.length ? (
              <div className="text-center py-10">
                <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No entries yet — start the timer!</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {stats.recentEntries.slice(0,8).map((e: any) => (
                  <TimeEntryItem key={e.id} entry={e} projects={projects} onDeleted={loadData} onUpdated={loadData} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
