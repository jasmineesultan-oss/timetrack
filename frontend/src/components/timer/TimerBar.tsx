import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, DollarSign } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

interface Project { id: string; name: string; color: string }
interface Task { id: string; name: string }

export const TimerBar: React.FC = () => {
  const { runningEntry, elapsed, start, stop, isLoading } = useTimerStore();
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (projectId) api.get(`/tasks/project/${projectId}`).then(r => setTasks(r.data)).catch(() => {});
    else { setTasks([]); setTaskId(''); }
  }, [projectId]);
  useEffect(() => {
    if (runningEntry) { setDescription(runningEntry.description || ''); setProjectId(runningEntry.projectId || ''); setIsBillable(runningEntry.isBillable); }
  }, [runningEntry]);

  const selectedProject = projects.find(p => p.id === (runningEntry?.projectId || projectId));

  return (
    <>
      <div className={`flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm ${runningEntry ? 'border-b-indigo-200 dark:border-b-indigo-800' : ''}`}>
        {runningEntry && (
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
          </span>
        )}

        <input
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none min-w-0"
          placeholder="What are you working on?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !runningEntry) start({ description, projectId: projectId||undefined, taskId: taskId||undefined, isBillable }); }}
          readOnly={!!runningEntry}
        />

        {!runningEntry ? (
          <select value={projectId} onChange={e => setProjectId(e.target.value)}
            className="bg-white dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[140px]">
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        ) : selectedProject ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: selectedProject.color+'20', color: selectedProject.color }}>{selectedProject.name}</span>
        ) : null}

        {!runningEntry && projectId && tasks.length > 0 && (
          <select value={taskId} onChange={e => setTaskId(e.target.value)}
            className="bg-white dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none max-w-[120px]">
            <option value="">No task</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}

        <button onClick={() => !runningEntry && setIsBillable(!isBillable)}
          className={`p-1.5 rounded-lg transition-colors ${isBillable ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} title={isBillable ? 'Billable' : 'Non-billable'}>
          <DollarSign className="h-4 w-4" />
        </button>

        <div className={`font-mono text-lg font-bold tabular-nums min-w-[84px] text-center ${runningEntry ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`}>
          {formatDuration(elapsed)}
        </div>

        {runningEntry ? (
          <Button onClick={stop} loading={isLoading} variant="danger" size="sm">
            <Square className="h-3.5 w-3.5 fill-current" /> Stop
          </Button>
        ) : (
          <Button onClick={() => start({ description, projectId: projectId||undefined, taskId: taskId||undefined, isBillable })} loading={isLoading} size="sm">
            <Play className="h-3.5 w-3.5 fill-current" /> Start
          </Button>
        )}

        <button onClick={() => setShowManual(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Add manual entry">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <ManualEntryModal projects={projects} open={showManual} onClose={() => setShowManual(false)} />
    </>
  );
};

const ManualEntryModal: React.FC<{ projects: Project[]; open: boolean; onClose: () => void }> = ({ projects, open, onClose }) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const [form, setForm] = useState({ description: '', projectId: '', startTime: `${dateStr}T${timeStr}`, endTime: `${dateStr}T${timeStr}`, isBillable: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/time-entries/manual', { ...form, projectId: form.projectId || null });
      onClose();
      window.location.reload();
    } catch (e: any) { setError(e.response?.data?.error || 'Failed to create entry'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Manual Entry">
      <div className="space-y-4">
        <input className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="What did you work on?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-slate-500 block mb-1">Start</label>
            <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-xs text-slate-500 block mb-1">End</label>
            <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.isBillable} onChange={e => setForm(f => ({ ...f, isBillable: e.target.checked }))} className="rounded" />
          <span className="text-slate-700 dark:text-slate-300">Billable</span>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Save Entry</Button>
        </div>
      </div>
    </Modal>
  );
};
