import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => (
  <div className="flex h-screen bg-background overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-auto">
      <Outlet />
    </main>
  </div>
);
