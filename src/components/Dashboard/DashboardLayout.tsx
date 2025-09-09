import React from 'react';
// @ts-ignore
import NotificationBell from '../Notifications/NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userId?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userId }) => (
  <div className="min-h-screen bg-gray-100">
    <header className="bg-white shadow flex items-center justify-between px-6 py-4">
      <h1 className="text-2xl font-bold">Oficios MZ</h1>
      {userId && <NotificationBell userId={userId} />}
    </header>
    <main className="max-w-5xl mx-auto p-4">
      {children}
    </main>
  </div>
);

export default DashboardLayout; 