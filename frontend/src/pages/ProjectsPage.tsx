import React, { useEffect, useState } from 'react';
import { Plus, Archive, Users, Clock, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

interface Project {
  id: string;
  name: string;
  color: string;
  isBillable: boolean;
  isArchived: boolean;
  tasks: { id: string; name: string }[];
  members: { user: { id: string; name: string; email: string } }[];
  _count: { timeEntries: number };
}

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#84cc16'];

export const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', color: '#6366f1', isBillable: true });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const isAdmin = user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects?includeArchived=${showArchived}`);
      setProjects(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [showArchived]);
  useEffect(() => {
    if (isAdmin) api.get('/users/workspace').then(r => setMembers(r.data)).catch(() => {});
  }, [isAdmin]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', color: '#6366f1', isBillable: true });
    setModal('create');
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, color: p.color, isBillable: p.isBillable });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/projects', form);
        toast('Project created', 'success');
      } else if (editing) {
        await api.put(`/projects/${editing.id}`, form);
        toast('Project updated', 'success');
      }
      setModal(null);
      load();
    } catch {
      toast('Failed to save project', 'error');
    } finally { setSaving(false); }
  };

  const handleArchive = async (p: Project) => {
    try {
      await api.put(`/projects/${p.id}`, { isArchived: !p.isArchived });
      toast(p.isArchived ? 'Project restored' : 'Project archived', 'success');
      load();
    } catch { toast('Failed to update project', 'error'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm">Manage projects and track time against them</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded" />
            Show archived
          </label>
          {isAdmin && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4" /> New project
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">No projects found.</p>
            {isAdmin && (
              <Button onClick={openCreate} size="sm" className="mt-4">
                <Plus className="h-4 w-4" /> Create your first project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Card key={p.id} className={p.isArchived ? 'opacity-60' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.color + '20' }}>
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                      <div className="flex gap-1.5 mt-0.5">
                        {p.isBillable && <Badge variant="info">Billable</Badge>}
                        {p.isArchived && <Badge variant="warning">Archived</Badge>}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleArchive(p)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{p._count.timeEntries} entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{p.members.length} members</span>
                  </div>
                </div>

                {p.tasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1.5">Tasks</p>
                    <div className="flex flex-wrap gap-1">
                      {p.tasks.slice(0, 4).map(t => (
                        <span key={t.id} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          {t.name}
                        </span>
                      ))}
                      {p.tasks.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{p.tasks.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'New project' : 'Edit project'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Project name</label>
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? '#1e293b' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isBillable}
              onChange={e => setForm(f => ({ ...f, isBillable: e.target.checked }))}
              className="rounded"
            />
            <span>Billable project</span>
          </label>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {modal === 'create' ? 'Create project' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
