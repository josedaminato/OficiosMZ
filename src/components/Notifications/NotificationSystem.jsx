import React, { useState } from 'react';
import NotificationBell from './NotificationBell';
import NotificationList from './NotificationList';
import { useNotificationStats } from '../../hooks/useNotifications';

/**
 * Componente principal del sistema de notificaciones
 */
const NotificationSystem = ({ 
  userId,
  mode = 'bell', // 'bell' | 'list' | 'dashboard'
  className = '',
  onNotificationClick = null
}) => {
  const [activeView, setActiveView] = useState(mode);
  const { stats, loading: statsLoading } = useNotificationStats(userId);

  // Manejar click en notificación
  const handleNotificationClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // Renderizar según el modo
  const renderContent = () => {
    switch (activeView) {
      case 'bell':
        return (
          <NotificationBell
            userId={userId}
            onNotificationClick={handleNotificationClick}
            className={className}
          />
        );
      
      case 'list':
        return (
          <NotificationList
            userId={userId}
            onNotificationClick={handleNotificationClick}
            className={className}
          />
        );
      
      case 'dashboard':
        return (
          <div className={`space-y-6 ${className}`}>
            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Resumen de Notificaciones
              </h2>
              
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.total_notifications}
                    </div>
                    <div className="text-sm text-blue-800">Total</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.unread_notifications}
                    </div>
                    <div className="text-sm text-red-800">Sin leer</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.total_notifications - stats.unread_notifications}
                    </div>
                    <div className="text-sm text-green-800">Leídas</div>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de notificaciones */}
            <NotificationList
              userId={userId}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return renderContent();
};

/**
 * Componente para integrar en el header/navbar
 */
export const NotificationHeader = ({ 
  userId, 
  className = '',
  onNotificationClick = null
}) => {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <NotificationBell
        userId={userId}
        onNotificationClick={onNotificationClick}
      />
    </div>
  );
};

/**
 * Componente para página completa de notificaciones
 */
export const NotificationPage = ({ 
  userId,
  className = '',
  onNotificationClick = null
}) => {
  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Notificaciones
        </h1>
        <p className="text-gray-600">
          Mantente al día con todas las actividades de tu cuenta
        </p>
      </div>
      
      <NotificationSystem
        userId={userId}
        mode="dashboard"
        onNotificationClick={onNotificationClick}
      />
    </div>
  );
};

/**
 * Componente para sidebar de notificaciones
 */
export const NotificationSidebar = ({ 
  userId,
  isOpen = false,
  onClose = null,
  className = '',
  onNotificationClick = null
}) => {
  if (!isOpen) return null;

  return (
    <div className={`
      fixed inset-y-0 right-0 w-80 bg-white shadow-lg border-l border-gray-200
      z-50 transform transition-transform duration-300 ease-in-out
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          Notificaciones
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="h-full overflow-y-auto">
        <NotificationList
          userId={userId}
          onNotificationClick={onNotificationClick}
          className="p-4"
        />
      </div>
    </div>
  );
};

export default NotificationSystem;

