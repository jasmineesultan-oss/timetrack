import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-500 shadow-lg mb-4">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-muted-foreground mt-1 text-sm">We'll send a reset link to your email</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full mt-2">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                icon={<Mail className="h-4 w-4" />}
                required
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send reset link
              </Button>

              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
