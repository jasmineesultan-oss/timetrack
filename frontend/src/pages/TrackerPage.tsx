import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TimerBar } from '@/components/timer/TimerBar';
import { TimeEntryItem } from '@/components/timer/TimeEntryItem';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/utils';
import { useTimerStore } from '@/stores/timerStore';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface TimeEntry {
  id: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isBillable: boolean;
  project?: { id: string; name: string; color: string };
  task?: { id: string; name: string };
  user?: { id: string; name: string };
}

export const TrackerPage: React.FC = () => {
  const { fetchRunning } = useTimerStore();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterProject, setFilterProject] = useState('');
  const limit = 20;

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset));
  const weekEnd = endOfWeek(addWeeks(new Date(), weekOffset));

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        page: String(page),
        limit: String(limit),
        ...(filterProject && { projectId: filterProject }),
      });
      const { data } = await api.get(`/time-entries?${params}`);
      setEntries(data.entries);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [weekOffset, page, filterProject]);

  useEffect(() => {
    fetchRunning();
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = format(new Date(entry.startTime), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const totalSeconds = entries.reduce((s, e) => s + (e.duration || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <TimerBar />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Time Tracker</h1>
            <p className="text-muted-foreground text-sm">All your tracked time in one place</p>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
            <button onClick={() => { setWeekOffset(w => w - 1); setPage(1); }}
              className="p-1 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <button onClick={() => { setWeekOffset(w => w + 1); setPage(1); }} disabled={weekOffset >= 0}
              className="p-1 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => { setWeekOffset(0); setPage(1); }}
                className="text-xs text-brand-500 hover:text-brand-600 ml-1">Today</button>
            )}
          </div>
        </div>

        {/* Filters & summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterProject}
            onChange={e => { setFilterProject(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <span className="text-sm text-muted-foreground">Week total:</span>
            <span className="font-mono font-bold text-foreground">{formatDuration(totalSeconds)}</span>
          </div>
        </div>

        {/* Grouped entries */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground">No time entries for this period.</p>
              <p className="text-sm text-muted-foreground mt-1">Start the timer above to track time.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayEntries]) => {
              const dayTotal = dayEntries.reduce((s, e) => s + (e.duration || 0), 0);
              return (
                <Card key={date}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {format(new Date(date), 'EEEE, MMMM d')}
                      </CardTitle>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatDuration(dayTotal)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 py-0 pb-2">
                    <div className="space-y-0.5">
                      {dayEntries.map(entry => (
                        <TimeEntryItem
                          key={entry.id}
                          entry={entry}
                          projects={projects}
                          onDeleted={loadEntries}
                          onUpdated={loadEntries}
                          showUser={user?.role === 'ADMIN'}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
