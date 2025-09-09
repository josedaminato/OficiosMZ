import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useApi, useAsyncState } from './useApi';

/**
 * Hook personalizado para manejar notificaciones en tiempo real
 * Refactorizado para usar useApi base
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Usar useApi para llamadas a la API
  const { execute: executeApi, loading, error, clearError } = useApi(`/api/notifications/user/${userId}`);

  // Cargar notificaciones iniciales
  const loadNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false) => {
    const params = {
      page: page.toString(),
      limit: limit.toString()
    };
    
    if (unreadOnly) {
      params.unread_only = 'true';
    }

    const data = await executeApi(params, { method: 'GET' });
    setNotifications(data.notifications || []);
    setUnreadCount(data.unread_count || 0);
    return data;
  }, [executeApi]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    await executeApi({}, { 
      method: 'PATCH',
      endpoint: `/api/notifications/${notificationId}/read`
    });

    // Actualizar estado local
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [executeApi]);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    await executeApi({}, { 
      method: 'PATCH',
      endpoint: `/api/notifications/user/${userId}/read-all`
    });

    // Actualizar estado local
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, is_read: true }))
    );
    
    setUnreadCount(0);
  }, [executeApi, userId]);

  // Crear nueva notificación (para testing o uso interno)
  const createNotification = useCallback(async (notificationData) => {
    const newNotification = await executeApi(notificationData, { 
      method: 'POST',
      endpoint: '/api/notifications/'
    });
    
    // Agregar a la lista local
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    return newNotification;
  }, [executeApi]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!userId) return;
    loadNotifications();
  }, [userId, loadNotifications]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('Notification change:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Nueva notificación
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        } else if (payload.eventType === 'UPDATE') {
          // Notificación actualizada
          const updatedNotification = payload.new;
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === updatedNotification.id 
                ? updatedNotification 
                : notification
            )
          );
          
          // Actualizar contador de no leídas
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    clearError
  };
};

/**
 * Hook para obtener estadísticas de notificaciones
 */
export const useNotificationStats = (userId) => {
  const [stats, setStats] = useState({
    total_notifications: 0,
    unread_notifications: 0,
    last_notification_date: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');

      const response = await fetch(`${API_BASE_URL}/api/notifications/user/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar estadísticas');
      }

      const data = await response.json();
      setStats(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadStats();
  }, [userId, loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
};

export default useNotifications;


