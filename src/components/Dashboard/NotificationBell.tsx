import React, { useState } from 'react';

const NotificationBell: React.FC = () => {
  // Simular notificaciones
  const [hasNotifications] = useState(true);
  return (
    <div className="relative">
      <span className="material-icons text-3xl">notifications</span>
      {hasNotifications && (
        <span className="absolute top-0 right-0 block w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
      )}
    </div>
  );
};

export default NotificationBell; 