/**
 * Servicio de Notificaciones Push para PWA
 * Maneja suscripciones, permisos y notificaciones en background
 */

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!this.vapidPublicKey) {
      console.warn('VAPID_PUBLIC_KEY no configurada');
    }
  }

  /**
   * Inicializar el servicio de notificaciones push
   */
  async initialize() {
    if (!this.isSupported) {
      console.log('Push notifications no soportadas en este navegador');
      return false;
    }

    try {
      // Registrar service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', this.registration);

      // Esperar a que el service worker esté listo
      await navigator.serviceWorker.ready;
      console.log('Service Worker listo');

      // Verificar si ya hay una suscripción
      this.subscription = await this.registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Error inicializando Push Notification Service:', error);
      return false;
    }
  }

  /**
   * Solicitar permisos de notificación
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications no soportadas');
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Permisos de notificación concedidos');
        return true;
      } else if (permission === 'denied') {
        console.log('Permisos de notificación denegados');
        return false;
      } else {
        console.log('Permisos de notificación ignorados');
        return false;
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      throw error;
    }
  }

  /**
   * Verificar si los permisos están concedidos
   */
  isPermissionGranted() {
    return Notification.permission === 'granted';
  }

  /**
   * Suscribirse a notificaciones push
   */
  async subscribe() {
    if (!this.registration) {
      throw new Error('Service Worker no registrado');
    }

    if (!this.isPermissionGranted()) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Permisos de notificación requeridos');
      }
    }

    try {
      // Crear suscripción
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Suscripción push creada:', this.subscription);

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Error creando suscripción push:', error);
      throw error;
    }
  }

  /**
   * Desuscribirse de notificaciones push
   */
  async unsubscribe() {
    if (!this.subscription) {
      console.log('No hay suscripción activa');
      return false;
    }

    try {
      const result = await this.subscription.unsubscribe();
      
      if (result) {
        // Notificar al servidor sobre la desuscripción
        await this.removeSubscriptionFromServer(this.subscription);
        
        this.subscription = null;
        console.log('Desuscrito exitosamente');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error desuscribiéndose:', error);
      throw error;
    }
  }

  /**
   * Verificar si está suscrito
   */
  isSubscribed() {
    return this.subscription !== null;
  }

  /**
   * Obtener suscripción actual
   */
  getSubscription() {
    return this.subscription;
  }

  /**
   * Enviar suscripción al servidor
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Error enviando suscripción: ${response.status}`);
      }

      const result = await response.json();
      console.log('Suscripción enviada al servidor:', result);
      return result;
    } catch (error) {
      console.error('Error enviando suscripción al servidor:', error);
      throw error;
    }
  }

  /**
   * Remover suscripción del servidor
   */
  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        throw new Error(`Error removiendo suscripción: ${response.status}`);
      }

      console.log('Suscripción removida del servidor');
      return true;
    } catch (error) {
      console.error('Error removiendo suscripción del servidor:', error);
      throw error;
    }
  }

  /**
   * Mostrar notificación local
   */
  async showLocalNotification(title, options = {}) {
    if (!this.isPermissionGranted()) {
      console.log('Permisos de notificación no concedidos');
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });

      // Manejar click en notificación
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        if (options.onClick) {
          options.onClick(event);
        }
      };

      return notification;
    } catch (error) {
      console.error('Error mostrando notificación local:', error);
      return false;
    }
  }

  /**
   * Configurar notificaciones por tipo de evento
   */
  async configureNotificationPreferences(preferences) {
    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Error configurando preferencias: ${response.status}`);
      }

      console.log('Preferencias de notificación configuradas');
      return true;
    } catch (error) {
      console.error('Error configurando preferencias:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats() {
    try {
      const response = await fetch('/api/push/stats', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo estadísticas: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Convertir VAPID key de base64 a Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Obtener token de autenticación
   */
  getAuthToken() {
    // Obtener token del localStorage o del contexto de autenticación
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Manejar actualización del service worker
   */
  handleServiceWorkerUpdate() {
    if (this.registration) {
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión disponible
            this.showUpdateNotification();
          }
        });
      });
    }
  }

  /**
   * Mostrar notificación de actualización
   */
  showUpdateNotification() {
    this.showLocalNotification('Nueva versión disponible', {
      body: 'Hay una nueva versión de Oficios MZ disponible. ¿Quieres actualizar?',
      actions: [
        { action: 'update', title: 'Actualizar' },
        { action: 'dismiss', title: 'Más tarde' }
      ],
      onClick: () => {
        window.location.reload();
      }
    });
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.registration = null;
    this.subscription = null;
  }
}

// Instancia singleton
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
