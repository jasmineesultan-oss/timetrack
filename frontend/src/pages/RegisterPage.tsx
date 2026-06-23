import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Mail, Lock, User, Hash } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', joinCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try { await register(form); navigate('/dashboard'); }
    catch (err: any) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-500 shadow-lg mb-4"><Clock className="h-7 w-7 text-white" /></div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">You'll need a workspace code from your admin</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" icon={<User className="h-4 w-4" />} required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" icon={<Mail className="h-4 w-4" />} required />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" icon={<Lock className="h-4 w-4" />} required />
            <div>
              <Input label="Workspace join code" type="text" value={form.joinCode} onChange={e => setForm(f => ({ ...f, joinCode: e.target.value.toUpperCase() }))} placeholder="e.g. DEMO1234" icon={<Hash className="h-4 w-4" />} required />
              <p className="text-xs text-slate-400 mt-1">Get this from your workspace admin</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Create account</Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-indigo-500 font-medium hover:text-indigo-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
