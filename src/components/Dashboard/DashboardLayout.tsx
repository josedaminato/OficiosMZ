import React from 'react';
import NotificationBell from './NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <header className="bg-white shadow flex items-center justify-between px-6 py-4">
      <h1 className="text-2xl font-bold">OficiozMZ</h1>
      <NotificationBell />
    </header>
    <main className="max-w-5xl mx-auto p-4">
      {children}
    </main>
  </div>
);

export default DashboardLayout; 