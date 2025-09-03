import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook personalizado para manejar notificaciones en tiempo real
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar notificaciones iniciales
  const loadNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');

      // Construir query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (unreadOnly) {
        params.append('unread_only', 'true');
      }

      // Llamar al endpoint del backend
      const response = await fetch(`/api/notifications/user/${userId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar notificaciones');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);

      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Obtener token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al marcar notificación como leída');
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      // Obtener token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');

      const response = await fetch(`/api/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al marcar todas las notificaciones como leídas');
      }

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [userId]);

  // Crear nueva notificación (para testing o uso interno)
  const createNotification = useCallback(async (notificationData) => {
    try {
      // Obtener token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');

      const response = await fetch('/api/notifications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear notificación');
      }

      const newNotification = await response.json();
      
      // Agregar a la lista local
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      return newNotification;

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

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

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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

      const response = await fetch(`/api/notifications/user/${userId}/stats`, {
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

