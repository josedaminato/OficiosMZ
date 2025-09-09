import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import pushNotificationService from '../services/PushNotificationService';

/**
 * Hook para manejar notificaciones push en la PWA
 * @param {string} userId - ID del usuario actual
 * @returns {Object} - Estado y funciones de notificaciones push
 */
export const usePushNotifications = (userId) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  // Inicializar servicio
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const initialized = await pushNotificationService.initialize();
        setIsSupported(initialized);

        if (initialized) {
          // Verificar estado actual
          const currentSubscription = pushNotificationService.getSubscription();
          setSubscription(currentSubscription);
          setIsSubscribed(!!currentSubscription);
          setPermission(Notification.permission);

          // Manejar actualizaciones del service worker
          pushNotificationService.handleServiceWorkerUpdate();
        }
      } catch (err) {
        console.error('Error inicializando push notifications:', err);
        setError('Error inicializando notificaciones push');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      initializeService();
    }
  }, [userId]);

  // Suscribirse a notificaciones push
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Las notificaciones push no son compatibles con tu navegador');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newSubscription = await pushNotificationService.subscribe();
      setSubscription(newSubscription);
      setIsSubscribed(true);
      setPermission(Notification.permission);

      toast.success('¡Notificaciones push activadas! Recibirás notificaciones importantes.');
      return true;
    } catch (err) {
      console.error('Error suscribiéndose a push notifications:', err);
      
      let errorMessage = 'Error activando notificaciones push';
      
      if (err.message.includes('Permisos')) {
        errorMessage = 'Se requieren permisos de notificación para activar las notificaciones push';
      } else if (err.message.includes('VAPID')) {
        errorMessage = 'Error de configuración del servidor';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Desuscribirse de notificaciones push
  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setSubscription(null);
        setIsSubscribed(false);
        toast.success('Notificaciones push desactivadas');
        return true;
      } else {
        toast.error('Error desactivando notificaciones push');
        return false;
      }
    } catch (err) {
      console.error('Error desuscribiéndose de push notifications:', err);
      setError('Error desactivando notificaciones push');
      toast.error('Error desactivando notificaciones push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Solicitar permisos
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const granted = await pushNotificationService.requestPermission();
      setPermission(Notification.permission);

      if (granted) {
        toast.success('Permisos de notificación concedidos');
        return true;
      } else {
        toast.warning('Permisos de notificación denegados');
        return false;
      }
    } catch (err) {
      console.error('Error solicitando permisos:', err);
      setError('Error solicitando permisos de notificación');
      toast.error('Error solicitando permisos de notificación');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mostrar notificación local de prueba
  const testNotification = useCallback(async () => {
    try {
      const success = await pushNotificationService.showLocalNotification(
        'Prueba de Notificación',
        {
          body: '¡Las notificaciones push están funcionando correctamente!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'test-notification',
          requireInteraction: true,
          actions: [
            { action: 'view', title: 'Ver' },
            { action: 'dismiss', title: 'Cerrar' }
          ],
          onClick: () => {
            console.log('Notificación de prueba clickeada');
            toast.info('Notificación de prueba clickeada');
          }
        }
      );

      if (success) {
        toast.success('Notificación de prueba enviada');
      } else {
        toast.error('Error enviando notificación de prueba');
      }
    } catch (err) {
      console.error('Error enviando notificación de prueba:', err);
      toast.error('Error enviando notificación de prueba');
    }
  }, []);

  // Configurar preferencias de notificación
  const configurePreferences = useCallback(async (preferences) => {
    try {
      setIsLoading(true);
      setError(null);

      await pushNotificationService.configureNotificationPreferences(preferences);
      toast.success('Preferencias de notificación actualizadas');
      return true;
    } catch (err) {
      console.error('Error configurando preferencias:', err);
      setError('Error configurando preferencias de notificación');
      toast.error('Error configurando preferencias de notificación');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener estadísticas de notificaciones
  const getStats = useCallback(async () => {
    try {
      const stats = await pushNotificationService.getNotificationStats();
      return stats;
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      setError('Error obteniendo estadísticas de notificaciones');
      return null;
    }
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar si puede suscribirse
  const canSubscribe = isSupported && permission === 'granted' && !isSubscribed;
  
  // Verificar si puede desuscribirse
  const canUnsubscribe = isSupported && isSubscribed;

  // Verificar si puede solicitar permisos
  const canRequestPermission = isSupported && permission === 'default';

  return {
    // Estado
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscription,
    error,
    
    // Funciones
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification,
    configurePreferences,
    getStats,
    clearError,
    
    // Helpers
    canSubscribe,
    canUnsubscribe,
    canRequestPermission,
    
    // Estados de permisos
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied',
    isPermissionDefault: permission === 'default',
  };
};

export default usePushNotifications;
