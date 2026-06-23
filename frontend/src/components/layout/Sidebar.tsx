import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Clock, LayoutDashboard, Timer, FolderOpen, FileText, Settings, LogOut, Users, BarChart3, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tracker', icon: Timer, label: 'Time Tracker' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/team', icon: Users, label: 'Team', adminOnly: true },
  { to: '/admin', icon: BarChart3, label: 'Analytics', adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const items = navItems.filter(i => !i.adminOnly || user?.role === 'ADMIN');

  return (
    <aside className={`flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 relative flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock className="h-4 w-4 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-slate-800 dark:text-slate-100 text-base">TimeTrack</span>}
      </div>

      {/* Workspace */}
      {!collapsed && user?.workspaceName && (
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 mb-0.5">Workspace</p>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">{user.workspaceName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`
            }>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-2 py-2 space-y-0.5">
        <button onClick={toggle} title={collapsed ? (isDark ? 'Light' : 'Dark') : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 w-full transition-all ${collapsed ? 'justify-center' : ''}`}>
          {isDark ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <NavLink to="/settings"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button onClick={() => { logout(); navigate('/login'); }} title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 w-full transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-3 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full p-1 text-slate-400 hover:text-slate-600 shadow-sm z-10">
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
};
