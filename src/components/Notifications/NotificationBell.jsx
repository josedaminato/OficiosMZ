import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

/**
 * Componente de campana de notificaciones con dropdown
 */
const NotificationBell = ({ 
  userId, 
  className = '',
  showUnreadCount = true,
  maxNotifications = 10,
  onNotificationClick = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications(userId);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar click en la campana
  const handleBellClick = async () => {
    if (!isOpen) {
      setIsLoading(true);
      try {
        await loadNotifications(1, maxNotifications);
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  // Manejar click en notificación
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    setIsOpen(false);
  };

  // Manejar marcar todas como leídas
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Obtener notificaciones recientes para mostrar
  const recentNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de la campana */}
      <button
        onClick={handleBellClick}
        className={`
          relative p-2 rounded-full transition-colors duration-200
          ${isOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        disabled={loading || isLoading}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge de notificaciones no leídas */}
        {showUnreadCount && unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1 bg-red-500 text-white text-xs 
            rounded-full h-5 w-5 flex items-center justify-center
            font-medium animate-pulse
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Indicador de carga */}
        {(loading || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="
          absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200
          z-50 max-h-96 overflow-hidden
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Notificaciones
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="
                    flex items-center space-x-1 px-2 py-1 text-xs text-blue-600
                    hover:bg-blue-50 rounded transition-colors
                  "
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Leer todas</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <div className="p-4 text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <div className="text-sm text-gray-600 mb-2">Error al cargar notificaciones</div>
                <button
                  onClick={() => loadNotifications()}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Reintentar
                </button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-gray-500">No hay notificaciones</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Aquí podrías navegar a una página de notificaciones completa
                  console.log('Ver todas las notificaciones');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

