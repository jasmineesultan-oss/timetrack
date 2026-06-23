import React, { useState } from 'react';
import { User, Lock, Bell, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ name: user?.name || '' });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', { name: profile.name });
      updateUser({ name: data.name });
      toast('Profile updated', 'success');
    } catch {
      toast('Failed to update profile', 'error');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (password.new.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/users/profile', { currentPassword: password.current, newPassword: password.new });
      setPassword({ current: '', new: '', confirm: '' });
      toast('Password changed successfully', 'success');
    } catch (e: any) {
      toast(e.response?.data?.error || 'Failed to change password', 'error');
    } finally { setSavingPassword(false); }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-brand-500 font-medium mt-0.5">{user?.role}</p>
            </div>
          </div>

          <Input
            label="Display name"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
          />

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Email</label>
            <input
              value={user?.email}
              disabled
              className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <Button onClick={handleSaveProfile} loading={savingProfile}>Save profile</Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={password.current}
            onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
            placeholder="Enter current password"
          />
          <Input
            label="New password"
            type="password"
            value={password.new}
            onChange={e => setPassword(p => ({ ...p, new: e.target.value }))}
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={password.confirm}
            onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
            placeholder="Repeat new password"
          />
          <Button onClick={handleChangePassword} loading={savingPassword} variant="secondary">
            Change password
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-brand-500' : 'bg-secondary'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace info */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Workspace name</span>
              <span className="font-medium">{user?.workspaceName || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your role</span>
              <span className="font-medium">{user?.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
