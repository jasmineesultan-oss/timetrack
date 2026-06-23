import React, { useState } from 'react';
import { Pencil, Trash2, DollarSign } from 'lucide-react';
import { formatDuration, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

interface TimeEntry {
  id: string; description?: string; startTime: string; endTime?: string;
  duration?: number; isBillable: boolean;
  project?: { id: string; name: string; color: string };
  task?: { id: string; name: string };
  user?: { id: string; name: string };
}

interface Props { entry: TimeEntry; showUser?: boolean; onDeleted: () => void; onUpdated: () => void; projects?: any[]; }

export const TimeEntryItem: React.FC<Props> = ({ entry, showUser, onDeleted, onUpdated, projects = [] }) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: entry.description || '',
    projectId: entry.project?.id || '',
    isBillable: entry.isBillable,
    startTime: entry.startTime ? new Date(entry.startTime).toISOString().slice(0,16) : '',
    endTime: entry.endTime ? new Date(entry.endTime).toISOString().slice(0,16) : '',
  });

  const handleDelete = async () => {
    setLoading(true);
    try { await api.delete(`/time-entries/${entry.id}`); onDeleted(); }
    finally { setLoading(false); setDeleting(false); }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try { await api.put(`/time-entries/${entry.id}`, { ...form, projectId: form.projectId || null }); onUpdated(); setEditing(false); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg group transition-colors">
        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.project?.color || '#cbd5e1' }} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${entry.description ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 italic'}`}>
            {entry.description || 'No description'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {entry.project && <span className="text-xs font-medium" style={{ color: entry.project.color }}>{entry.project.name}</span>}
            {entry.task && <span className="text-xs text-slate-400">· {entry.task.name}</span>}
            {showUser && entry.user && <span className="text-xs text-slate-400">· {entry.user.name}</span>}
          </div>
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          {formatTime(entry.startTime)} – {entry.endTime ? formatTime(entry.endTime) : '...'}
        </span>
        {entry.isBillable && <DollarSign className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
        <div className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[72px] text-right">
          {entry.duration ? formatDuration(entry.duration) : '--:--:--'}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => setDeleting(true)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Time Entry">
        <div className="space-y-4">
          <input className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
          <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
            <input type="checkbox" checked={form.isBillable} onChange={e => setForm(f => ({ ...f, isBillable: e.target.checked }))} />
            <span className="text-slate-700 dark:text-slate-300">Billable</span>
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleting} onClose={() => setDeleting(false)} title="Delete Entry" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Are you sure? This cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleting(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={loading}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
