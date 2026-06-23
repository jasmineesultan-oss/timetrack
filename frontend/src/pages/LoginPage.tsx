import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@timetrack.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-200 mb-4">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Sign in to your TimeTrack account</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" icon={<Mail className="h-4 w-4" />} required autoComplete="email" />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="h-4 w-4" /></span>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-10 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">Forgot password?</Link>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}

            <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-500 font-medium hover:text-indigo-600">Sign up</Link>
          </p>
        </div>

        <div className="mt-4 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5">✨ Demo credentials (pre-filled)</p>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 space-y-0.5">
            <p>Email: <span className="font-mono">admin@timetrack.com</span></p>
            <p>Password: <span className="font-mono">Admin@123</span></p>
            <p>Join code for new users: <span className="font-mono font-bold">DEMO1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
