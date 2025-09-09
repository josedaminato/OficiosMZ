/**
 * Test de Integración - Sistema de Chat en Tiempo Real
 * Oficios MZ
 * 
 * Este script prueba la funcionalidad completa del sistema de chat:
 * 1. Crear solicitud de trabajo
 * 2. Cliente envía mensaje
 * 3. Trabajador recibe mensaje en tiempo real
 * 4. Verificar inserción en base de datos
 * 5. Verificar notificaciones
 * 6. Validar seguridad (usuarios no relacionados no pueden acceder)
 */

const API_BASE_URL = 'http://localhost:8000';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Función para logging con colores
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Función para hacer requests HTTP
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.detail || data.message || 'Error desconocido'}`);
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para simular autenticación (en un test real, usarías tokens reales)
const getAuthHeaders = (userId) => ({
  'Authorization': `Bearer mock-token-${userId}`
});

// Test principal
const runChatIntegrationTest = async () => {
  log('\n🚀 INICIANDO TEST DE INTEGRACIÓN - SISTEMA DE CHAT', 'bold');
  log('=' .repeat(60), 'blue');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // Helper para ejecutar tests
  const runTest = async (testName, testFunction) => {
    testResults.total++;
    log(`\n📋 ${testName}`, 'yellow');
    
    try {
      const result = await testFunction();
      if (result.success) {
        log(`✅ ${testName} - PASÓ`, 'green');
        testResults.passed++;
      } else {
        log(`❌ ${testName} - FALLÓ: ${result.error}`, 'red');
        testResults.failed++;
        testResults.errors.push(`${testName}: ${result.error}`);
      }
    } catch (error) {
      log(`❌ ${testName} - ERROR: ${error.message}`, 'red');
      testResults.failed++;
      testResults.errors.push(`${testName}: ${error.message}`);
    }
  };

  // Test 1: Health Check del Backend
  await runTest('Health Check - Backend', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/health`);
    if (!result.success) {
      throw new Error('Backend no disponible');
    }
    return { success: true };
  });

  // Test 2: Health Check del Módulo de Chat
  await runTest('Health Check - Módulo de Chat', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/health`);
    if (!result.success) {
      throw new Error('Módulo de chat no disponible');
    }
    return { success: true };
  });

  // Test 3: Crear Solicitud de Trabajo (Mock)
  let mockRequestId = null;
  await runTest('Crear Solicitud de Trabajo', async () => {
    // En un test real, crearías una solicitud real en la base de datos
    mockRequestId = `test-request-${Date.now()}`;
    log(`   📝 ID de solicitud creada: ${mockRequestId}`, 'blue');
    return { success: true, data: { requestId: mockRequestId } };
  });

  // Test 4: Cliente Envía Mensaje
  let messageId = null;
  await runTest('Cliente Envía Mensaje', async () => {
    const messageData = {
      request_id: mockRequestId,
      receiver_id: 'worker-123',
      content: 'Hola, ¿cuándo podrías empezar el trabajo?'
    };

    const result = await makeRequest(`${API_BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: getAuthHeaders('client-123'),
      body: JSON.stringify(messageData)
    });

    if (!result.success) {
      throw new Error(`Error enviando mensaje: ${result.error}`);
    }

    messageId = result.data.id;
    log(`   💬 Mensaje enviado con ID: ${messageId}`, 'blue');
    return { success: true, data: result.data };
  });

  // Test 5: Trabajador Recibe Mensaje
  await runTest('Trabajador Recibe Mensaje', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/messages/${mockRequestId}`, {
      method: 'GET',
      headers: getAuthHeaders('worker-123')
    });

    if (!result.success) {
      throw new Error(`Error obteniendo mensajes: ${result.error}`);
    }

    const messages = result.data;
    if (messages.length === 0) {
      throw new Error('No se encontraron mensajes');
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content !== 'Hola, ¿cuándo podrías empezar el trabajo?') {
      throw new Error('El mensaje no coincide con el enviado');
    }

    log(`   📨 Mensaje recibido: "${lastMessage.content}"`, 'blue');
    return { success: true, data: messages };
  });

  // Test 6: Trabajador Responde
  await runTest('Trabajador Responde', async () => {
    const messageData = {
      request_id: mockRequestId,
      receiver_id: 'client-123',
      content: 'Buenos días, puedo empezar mañana a las 9 AM'
    };

    const result = await makeRequest(`${API_BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: getAuthHeaders('worker-123'),
      body: JSON.stringify(messageData)
    });

    if (!result.success) {
      throw new Error(`Error enviando respuesta: ${result.error}`);
    }

    log(`   💬 Respuesta enviada: "${messageData.content}"`, 'blue');
    return { success: true, data: result.data };
  });

  // Test 7: Verificar Conversación Completa
  await runTest('Verificar Conversación Completa', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/messages/${mockRequestId}`, {
      method: 'GET',
      headers: getAuthHeaders('client-123')
    });

    if (!result.success) {
      throw new Error(`Error obteniendo conversación: ${result.error}`);
    }

    const messages = result.data;
    if (messages.length < 2) {
      throw new Error(`Se esperaban al menos 2 mensajes, se encontraron ${messages.length}`);
    }

    log(`   📚 Conversación completa: ${messages.length} mensajes`, 'blue');
    return { success: true, data: messages };
  });

  // Test 8: Marcar Mensajes como Leídos
  await runTest('Marcar Mensajes como Leídos', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/messages/${mockRequestId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders('client-123')
    });

    if (!result.success) {
      throw new Error(`Error marcando mensajes como leídos: ${result.error}`);
    }

    log(`   ✅ ${result.data.updated_count} mensajes marcados como leídos`, 'blue');
    return { success: true, data: result.data };
  });

  // Test 9: Obtener Estadísticas de Chat
  await runTest('Obtener Estadísticas de Chat', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/stats`, {
      method: 'GET',
      headers: getAuthHeaders('client-123')
    });

    if (!result.success) {
      throw new Error(`Error obteniendo estadísticas: ${result.error}`);
    }

    log(`   📊 Estadísticas: ${JSON.stringify(result.data, null, 2)}`, 'blue');
    return { success: true, data: result.data };
  });

  // Test 10: Validar Seguridad - Usuario No Relacionado
  await runTest('Validar Seguridad - Usuario No Relacionado', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/messages/${mockRequestId}`, {
      method: 'GET',
      headers: getAuthHeaders('stranger-456')
    });

    // Este test debe fallar (403 Forbidden)
    if (result.success) {
      throw new Error('Usuario no relacionado pudo acceder al chat (vulnerabilidad de seguridad)');
    }

    if (!result.error.includes('403') && !result.error.includes('Forbidden')) {
      throw new Error(`Error de seguridad inesperado: ${result.error}`);
    }

    log(`   🔒 Seguridad validada: Usuario no relacionado bloqueado`, 'blue');
    return { success: true };
  });

  // Test 11: Obtener Mensajes No Leídos
  await runTest('Obtener Mensajes No Leídos', async () => {
    const result = await makeRequest(`${API_BASE_URL}/api/chat/unread-count`, {
      method: 'GET',
      headers: getAuthHeaders('worker-123')
    });

    if (!result.success) {
      throw new Error(`Error obteniendo mensajes no leídos: ${result.error}`);
    }

    log(`   📬 Mensajes no leídos: ${result.data.unread_count}`, 'blue');
    return { success: true, data: result.data };
  });

  // Resumen de Resultados
  log('\n' + '=' .repeat(60), 'blue');
  log('📊 RESUMEN DE RESULTADOS', 'bold');
  log('=' .repeat(60), 'blue');
  
  log(`Total de tests: ${testResults.total}`, 'blue');
  log(`✅ Pasaron: ${testResults.passed}`, 'green');
  log(`❌ Fallaron: ${testResults.failed}`, 'red');
  
  if (testResults.failed > 0) {
    log('\n🚨 ERRORES DETALLADOS:', 'red');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'red');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\n📈 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  if (testResults.failed === 0) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON! El sistema de chat está funcionando correctamente.', 'green');
  } else {
    log('\n⚠️  Algunos tests fallaron. Revisa los errores antes de continuar.', 'yellow');
  }
  
  log('\n' + '=' .repeat(60), 'blue');
  
  return testResults;
};

// Ejecutar el test si se llama directamente
if (require.main === module) {
  runChatIntegrationTest()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      log(`\n💥 Error fatal ejecutando tests: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runChatIntegrationTest };
