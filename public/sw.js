/**
 * Service Worker para Oficios MZ PWA
 * Implementa cache strategies, push notifications y funcionalidades offline
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Configuración de Workbox
const CACHE_NAME = 'oficios-mz-v1';
const OFFLINE_URL = '/offline.html';

// Precache y cleanup
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Configuración de cache para diferentes tipos de recursos
const cacheStrategies = {
  // API calls - Network First con fallback a cache
  api: new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 horas
      }),
    ],
  }),

  // Imágenes - Cache First con validación
  images: new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
      }),
    ],
  }),

  // Assets estáticos - Stale While Revalidate
  static: new StaleWhileRevalidate({
    cacheName: 'static-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),

  // HTML pages - Network First
  pages: new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 horas
      }),
    ],
  }),
};

// Rutas de cache para API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  cacheStrategies.api
);

// Rutas de cache para imágenes
registerRoute(
  ({ request }) => request.destination === 'image',
  cacheStrategies.images
);

// Rutas de cache para assets estáticos
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  cacheStrategies.static
);

// Rutas de cache para páginas HTML
registerRoute(
  ({ request }) => request.mode === 'navigate',
  cacheStrategies.pages
);

// Background Sync para requests fallidos
const bgSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60, // 24 horas
});

// Registrar background sync para API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// Manejo de instalación
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  self.skipWaiting();
});

// Manejo de activación
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanupOutdatedCaches(),
    ])
  );
});

// Manejo de fetch con fallback offline
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET para navegación
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then(cache => cache.match(OFFLINE_URL));
        })
    );
  }
});

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recibido');
  
  if (!event.data) {
    console.log('Push sin datos');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nueva notificación de Oficios MZ',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.image || null,
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || 'oficios-mz-notification',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      timestamp: Date.now(),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Oficios MZ', options)
    );
  } catch (error) {
    console.error('Error procesando push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Oficios MZ', {
        body: 'Tienes una nueva notificación',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      })
    );
  }
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Click en notificación');
  
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (urlToOpen !== '/') {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejo de cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notificación cerrada');
  
  // Opcional: enviar analytics de notificación cerrada
  if (event.notification.data && event.notification.data.analytics) {
    // Enviar evento de analytics
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: event.notification.data.id,
        timestamp: Date.now(),
      }),
    }).catch(err => console.log('Error enviando analytics:', err));
  }
});

// Manejo de background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync');
  
  if (event.tag === 'api-queue') {
    event.waitUntil(processBackgroundSync());
  }
});

// Procesar cola de background sync
async function processBackgroundSync() {
  try {
    const cache = await caches.open('api-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log('Request sincronizado exitosamente');
        }
      } catch (error) {
        console.log('Error sincronizando request:', error);
      }
    }
  } catch (error) {
    console.error('Error en background sync:', error);
  }
}

// Manejo de errores globales
self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker Unhandled Rejection:', event.reason);
});

// Utilidades de cache
const cacheUtils = {
  // Limpiar cache expirado
  async cleanExpiredCache() {
    const cacheNames = await caches.keys();
    const validCaches = ['api-cache', 'images-cache', 'static-cache', 'pages-cache'];
    
    for (const cacheName of cacheNames) {
      if (!validCaches.includes(cacheName)) {
        await caches.delete(cacheName);
        console.log(`Cache eliminado: ${cacheName}`);
      }
    }
  },

  // Obtener estadísticas de cache
  async getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = keys.length;
    }
    
    return stats;
  },

  // Limpiar todo el cache
  async clearAllCache() {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Todo el cache ha sido limpiado');
  }
};

// Exponer utilidades globalmente
self.cacheUtils = cacheUtils;

console.log('Service Worker: Cargado y listo');
