import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem, { NotificationCard } from './NotificationItem';

/**
 * Componente para mostrar una lista completa de notificaciones
 */
const NotificationList = ({ 
  userId,
  showPagination = true,
  itemsPerPage = 10,
  showMarkAllRead = true,
  className = '',
  onNotificationClick = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications(userId);

  // Cargar notificaciones cuando cambian los parámetros
  useEffect(() => {
    loadNotifications(currentPage, itemsPerPage, showUnreadOnly);
  }, [currentPage, itemsPerPage, showUnreadOnly, loadNotifications]);

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
  };

  // Manejar marcar todas como leídas
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Manejar toggle de filtro
  const handleToggleUnreadOnly = () => {
    setShowUnreadOnly(!showUnreadOnly);
    setCurrentPage(1); // Reset a la primera página
  };

  if (loading && notifications.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">⚠️</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          onClick={() => loadNotifications(currentPage, itemsPerPage, showUnreadOnly)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 text-4xl mb-2">🔔</div>
        <div className="text-gray-600 mb-1">
          {showUnreadOnly ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
        </div>
        <div className="text-sm text-gray-500">
          {showUnreadOnly 
            ? 'Todas tus notificaciones han sido leídas' 
            : 'Las notificaciones aparecerán aquí cuando las recibas'
          }
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Notificaciones
          </h2>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {unreadCount} sin leer
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filtro de no leídas */}
          <button
            onClick={handleToggleUnreadOnly}
            className={`
              px-3 py-1 text-sm rounded-md transition-colors
              ${showUnreadOnly 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            Solo no leídas
          </button>
          
          {/* Marcar todas como leídas */}
          {showMarkAllRead && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>

      {/* Paginación */}
      {showPagination && notifications.length >= itemsPerPage && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          
          <span className="px-3 py-1 text-sm text-gray-600">
            Página {currentPage}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={notifications.length < itemsPerPage}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Componente compacto para mostrar notificaciones recientes
 */
export const RecentNotifications = ({ 
  userId,
  limit = 5,
  className = '',
  onNotificationClick = null
}) => {
  const { 
    notifications, 
    loading, 
    error, 
    loadNotifications, 
    markAsRead 
  } = useNotifications(userId);

  // Cargar notificaciones recientes
  useEffect(() => {
    loadNotifications(1, limit);
  }, [userId, limit, loadNotifications]);

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
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-red-500 mb-2">⚠️</div>
        <div className="text-sm text-gray-600">Error al cargar notificaciones</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-gray-400 text-2xl mb-1">🔔</div>
        <div className="text-sm text-gray-500">No hay notificaciones recientes</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Notificaciones Recientes
      </h3>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
            className="hover:bg-gray-50 transition-colors cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationList;

