/**
 * Script de prueba para funcionalidades PWA y Push Notifications
 * Ejecutar con: node test_pwa_push.js
 */

const https = require('https');
const http = require('http');

// Configuración
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const TEST_USER_ID = 'test-user-123';
const TEST_AUTH_TOKEN = 'test-token-123';

// Colores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Función para hacer requests HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
        ...options.headers
      }
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Función para log con colores
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para log de éxito
function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

// Función para log de error
function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Función para log de advertencia
function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Función para log de info
function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Health Check del servicio de push notifications
async function testPushHealthCheck() {
  logInfo('Test 1: Health Check del servicio de push notifications');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/push/health`);
    
    if (response.status === 200) {
      logSuccess('Health check exitoso');
      logInfo(`Estado: ${response.data.status}`);
      logInfo(`VAPID configurado: ${response.data.vapid_configured}`);
      logInfo(`Suscripciones activas: ${response.data.active_subscriptions}`);
      return true;
    } else {
      logError(`Health check falló con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error en health check: ${error.message}`);
    return false;
  }
}

// Test 2: Suscripción a push notifications
async function testPushSubscription() {
  logInfo('Test 2: Suscripción a push notifications');
  
  try {
    const subscriptionData = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      },
      userAgent: 'Mozilla/5.0 (Test Browser)',
      timestamp: new Date().toISOString()
    };

    const response = await makeRequest(`${API_BASE_URL}/api/push/subscribe`, {
      method: 'POST',
      body: subscriptionData
    });

    if (response.status === 200) {
      logSuccess('Suscripción exitosa');
      logInfo(`ID de suscripción: ${response.data.subscriptionId}`);
      return true;
    } else {
      logError(`Suscripción falló con status: ${response.status}`);
      logError(`Error: ${response.data.detail || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    logError(`Error en suscripción: ${error.message}`);
    return false;
  }
}

// Test 3: Configuración de preferencias
async function testNotificationPreferences() {
  logInfo('Test 3: Configuración de preferencias de notificación');
  
  try {
    const preferences = {
      jobRequests: true,
      jobUpdates: true,
      payments: true,
      ratings: true,
      chat: true,
      system: true,
      marketing: false
    };

    const response = await makeRequest(`${API_BASE_URL}/api/push/preferences`, {
      method: 'PUT',
      body: preferences
    });

    if (response.status === 200) {
      logSuccess('Preferencias configuradas exitosamente');
      logInfo(`Preferencias: ${JSON.stringify(response.data.preferences, null, 2)}`);
      return true;
    } else {
      logError(`Configuración de preferencias falló con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error configurando preferencias: ${error.message}`);
    return false;
  }
}

// Test 4: Envío de notificación push
async function testSendPushNotification() {
  logInfo('Test 4: Envío de notificación push');
  
  try {
    const message = {
      title: 'Test de Notificación',
      body: 'Esta es una notificación de prueba de Oficios MZ',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'test',
        userId: TEST_USER_ID,
        timestamp: new Date().toISOString()
      },
      tag: 'test-notification',
      requireInteraction: false,
      silent: false
    };

    const response = await makeRequest(`${API_BASE_URL}/api/push/send`, {
      method: 'POST',
      body: {
        user_id: TEST_USER_ID,
        message: message
      }
    });

    if (response.status === 200) {
      logSuccess('Notificación enviada exitosamente');
      logInfo(`Mensaje: ${response.data.message}`);
      return true;
    } else {
      logError(`Envío de notificación falló con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error enviando notificación: ${error.message}`);
    return false;
  }
}

// Test 5: Obtener estadísticas
async function testGetPushStats() {
  logInfo('Test 5: Obtener estadísticas de push notifications');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/push/stats`);

    if (response.status === 200) {
      logSuccess('Estadísticas obtenidas exitosamente');
      logInfo(`Estadísticas: ${JSON.stringify(response.data.stats, null, 2)}`);
      return true;
    } else {
      logError(`Obtención de estadísticas falló con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error obteniendo estadísticas: ${error.message}`);
    return false;
  }
}

// Test 6: Desuscripción
async function testPushUnsubscription() {
  logInfo('Test 6: Desuscripción de push notifications');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/push/unsubscribe`, {
      method: 'POST',
      body: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint'
      }
    });

    if (response.status === 200) {
      logSuccess('Desuscripción exitosa');
      logInfo(`Mensaje: ${response.data.message}`);
      return true;
    } else {
      logError(`Desuscripción falló con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error en desuscripción: ${error.message}`);
    return false;
  }
}

// Test 7: Verificar manifest.json
async function testManifest() {
  logInfo('Test 7: Verificar manifest.json');
  
  try {
    const response = await makeRequest(`${API_BASE_URL.replace('8000', '3000')}/manifest.json`);
    
    if (response.status === 200) {
      const manifest = response.data;
      
      // Verificar campos requeridos
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length === 0) {
        logSuccess('Manifest.json válido');
        logInfo(`Nombre: ${manifest.name}`);
        logInfo(`Short name: ${manifest.short_name}`);
        logInfo(`Display: ${manifest.display}`);
        logInfo(`Íconos: ${manifest.icons.length} íconos configurados`);
        return true;
      } else {
        logError(`Manifest.json inválido. Campos faltantes: ${missingFields.join(', ')}`);
        return false;
      }
    } else {
      logError(`Error obteniendo manifest.json: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error verificando manifest: ${error.message}`);
    return false;
  }
}

// Test 8: Verificar service worker
async function testServiceWorker() {
  logInfo('Test 8: Verificar service worker');
  
  try {
    const response = await makeRequest(`${API_BASE_URL.replace('8000', '3000')}/sw.js`);
    
    if (response.status === 200) {
      logSuccess('Service worker accesible');
      logInfo(`Tamaño: ${response.data.length} caracteres`);
      return true;
    } else {
      logError(`Service worker no accesible: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error verificando service worker: ${error.message}`);
    return false;
  }
}

// Función principal de testing
async function runTests() {
  log(`${colors.bold}${colors.blue}🚀 Iniciando tests de PWA y Push Notifications${colors.reset}`);
  log(`${colors.blue}================================================${colors.reset}`);
  
  const tests = [
    { name: 'Health Check', fn: testPushHealthCheck },
    { name: 'Suscripción Push', fn: testPushSubscription },
    { name: 'Preferencias', fn: testNotificationPreferences },
    { name: 'Envío Notificación', fn: testSendPushNotification },
    { name: 'Estadísticas', fn: testGetPushStats },
    { name: 'Desuscripción', fn: testPushUnsubscription },
    { name: 'Manifest.json', fn: testManifest },
    { name: 'Service Worker', fn: testServiceWorker }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    log(`\n${colors.yellow}Ejecutando: ${test.name}${colors.reset}`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Error inesperado en ${test.name}: ${error.message}`);
      failed++;
    }
  }

  // Resumen final
  log(`\n${colors.blue}================================================${colors.reset}`);
  log(`${colors.bold}📊 Resumen de Tests${colors.reset}`);
  log(`${colors.green}✅ Exitosos: ${passed}${colors.reset}`);
  log(`${colors.red}❌ Fallidos: ${failed}${colors.reset}`);
  log(`${colors.blue}📈 Total: ${passed + failed}${colors.reset}`);
  
  if (failed === 0) {
    log(`\n${colors.green}${colors.bold}🎉 ¡Todos los tests pasaron exitosamente!${colors.reset}`);
  } else {
    log(`\n${colors.yellow}${colors.bold}⚠️  Algunos tests fallaron. Revisar la configuración.${colors.reset}`);
  }

  return { passed, failed, total: passed + failed };
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      logError(`Error fatal: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testPushHealthCheck,
  testPushSubscription,
  testNotificationPreferences,
  testSendPushNotification,
  testGetPushStats,
  testPushUnsubscription,
  testManifest,
  testServiceWorker
};
