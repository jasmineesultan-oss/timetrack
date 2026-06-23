import React, { useEffect, useState } from 'react';
import { Users, Copy, RefreshCw, UserX, UserCheck, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export const TeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    if (!user?.workspaceId) return;
    setLoading(true);
    try {
      const [membersRes, workspaceRes] = await Promise.all([
        api.get('/users/workspace'),
        api.get(`/workspaces/${user.workspaceId}`),
      ]);
      setMembers(membersRes.data);
      setWorkspace(workspaceRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.workspaceId]);

  const copyJoinCode = () => {
    navigator.clipboard.writeText(workspace?.joinCode || '');
    toast('Join code copied to clipboard', 'success');
  };

  const regenerateCode = async () => {
    setRegenerating(true);
    try {
      await api.post(`/workspaces/${user?.workspaceId}/regenerate-code`);
      toast('Join code regenerated', 'success');
      load();
    } catch { toast('Failed to regenerate code', 'error'); }
    finally { setRegenerating(false); }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const { data } = await api.post(`/admin/users/${userId}/toggle-active`);
      toast(`User ${data.isActive ? 'activated' : 'deactivated'}`, 'success');
      load();
    } catch { toast('Failed to update user', 'error'); }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the workspace?')) return;
    try {
      await api.delete(`/workspaces/${user?.workspaceId}/members/${userId}`);
      toast('Member removed', 'success');
      load();
    } catch { toast('Failed to remove member', 'error'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground text-sm">Manage your workspace members</p>
      </div>

      {/* Workspace info */}
      {workspace && (
        <Card>
          <CardHeader><CardTitle>Workspace: {workspace.name}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Join code</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold font-mono text-brand-500 tracking-widest">
                    {workspace.joinCode}
                  </code>
                  <button onClick={copyJoinCode} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Share this code with new team members so they can register</p>
              </div>
              <Button variant="outline" size="sm" onClick={regenerateCode} loading={regenerating}>
                <RefreshCw className="h-4 w-4" /> Regenerate code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{members.length} member{members.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-px">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse mx-4 rounded-lg mb-2" />)}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">{m.name}</p>
                      {m.id === user?.id && <Badge variant="info">You</Badge>}
                      {m.workspaceRole === 'ADMIN' && <Badge variant="success">Admin</Badge>}
                      {!m.isActive && <Badge variant="danger">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {m.email}
                    </p>
                    <p className="text-xs text-muted-foreground">Joined {formatDate(m.joinedAt || m.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  {m.id !== user?.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUserStatus(m.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          m.isActive
                            ? 'hover:bg-yellow-50 dark:hover:bg-yellow-950 text-muted-foreground hover:text-yellow-600'
                            : 'hover:bg-green-50 dark:hover:bg-green-950 text-muted-foreground hover:text-green-600'
                        }`}
                        title={m.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {m.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-500"
                        title="Remove from workspace"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
