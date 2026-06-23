import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ToastProvider } from '@/components/ui/Toast';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TrackerPage } from '@/pages/TrackerPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { TeamPage } from '@/pages/TeamPage';
import { AdminPage } from '@/pages/AdminPage';
import { SettingsPage } from '@/pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading TimeTrack...</p>
    </div>
  </div>
);

export default function App() {
  const { loadUser, isLoading, token } = useAuthStore();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  if (isLoading) return <ToastProvider><LoadingScreen /></ToastProvider>;

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* App routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<ProtectedRoute adminOnly><TeamPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
