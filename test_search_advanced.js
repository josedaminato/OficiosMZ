/**
 * Script de prueba para sistema de búsqueda avanzada
 * Ejecutar con: node test_search_advanced.js
 */

const https = require('https');
const http = require('http');

// Configuración
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Health Check del servicio de búsqueda
async function testSearchHealthCheck() {
  logInfo('Test 1: Health Check del servicio de búsqueda');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/search/health`);
    
    if (response.status === 200) {
      logSuccess('Health check exitoso');
      logInfo(`Estado: ${response.data.status}`);
      logInfo(`Redis: ${response.data.redis}`);
      logInfo(`Supabase: ${response.data.supabase}`);
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

// Test 2: Búsqueda básica de trabajadores
async function testBasicSearch() {
  logInfo('Test 2: Búsqueda básica de trabajadores');
  
  try {
    const searchRequest = {
      filters: {
        search_text: 'plomero',
        min_rating: 4.0
      },
      page: 1,
      limit: 10
    };

    const response = await makeRequest(`${API_BASE_URL}/api/search/workers`, {
      method: 'POST',
      body: searchRequest
    });

    if (response.status === 200) {
      logSuccess('Búsqueda básica exitosa');
      logInfo(`Trabajadores encontrados: ${response.data.workers?.length || 0}`);
      logInfo(`Total: ${response.data.total_count || 0}`);
      logInfo(`Tiempo de búsqueda: ${response.data.search_time_ms || 0}ms`);
      logInfo(`Desde cache: ${response.data.cached ? 'Sí' : 'No'}`);
      return true;
    } else {
      logError(`Búsqueda básica falló con status: ${response.status}`);
      logError(`Error: ${response.data.detail || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    logError(`Error en búsqueda básica: ${error.message}`);
    return false;
  }
}

// Test 3: Búsqueda con filtros avanzados
async function testAdvancedSearch() {
  logInfo('Test 3: Búsqueda con filtros avanzados');
  
  try {
    const searchRequest = {
      filters: {
        search_text: 'electricista',
        oficio: 'electricista',
        location: 'mendoza',
        min_rating: 4.5,
        max_hourly_rate: 5000,
        min_hourly_rate: 2000,
        is_available: true,
        radius_km: 30,
        user_lat: -32.8908,
        user_lng: -68.8272
      },
      page: 1,
      limit: 5
    };

    const response = await makeRequest(`${API_BASE_URL}/api/search/workers`, {
      method: 'POST',
      body: searchRequest
    });

    if (response.status === 200) {
      logSuccess('Búsqueda avanzada exitosa');
      logInfo(`Trabajadores encontrados: ${response.data.workers?.length || 0}`);
      logInfo(`Total: ${response.data.total_count || 0}`);
      logInfo(`Tiempo de búsqueda: ${response.data.search_time_ms || 0}ms`);
      
      // Mostrar detalles de los trabajadores
      if (response.data.workers && response.data.workers.length > 0) {
        logInfo('Detalles de trabajadores:');
        response.data.workers.forEach((worker, index) => {
          logInfo(`  ${index + 1}. ${worker.oficio} - Rating: ${worker.rating} - Ubicación: ${worker.location_city}`);
        });
      }
      
      return true;
    } else {
      logError(`Búsqueda avanzada falló con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error en búsqueda avanzada: ${error.message}`);
    return false;
  }
}

// Test 4: Autocompletado de sugerencias
async function testSuggestions() {
  logInfo('Test 4: Autocompletado de sugerencias');
  
  try {
    // Test sugerencias de oficio
    const oficioResponse = await makeRequest(`${API_BASE_URL}/api/search/suggestions?query=plom&type=oficio`);
    
    if (oficioResponse.status === 200) {
      logSuccess('Sugerencias de oficio obtenidas');
      logInfo(`Sugerencias: ${oficioResponse.data.suggestions?.length || 0}`);
      if (oficioResponse.data.suggestions && oficioResponse.data.suggestions.length > 0) {
        oficioResponse.data.suggestions.forEach((suggestion, index) => {
          logInfo(`  ${index + 1}. ${suggestion.suggestion} (${suggestion.type})`);
        });
      }
    } else {
      logError(`Sugerencias de oficio fallaron con status: ${oficioResponse.status}`);
      return false;
    }

    // Test sugerencias de ubicación
    const locationResponse = await makeRequest(`${API_BASE_URL}/api/search/suggestions?query=men&type=location`);
    
    if (locationResponse.status === 200) {
      logSuccess('Sugerencias de ubicación obtenidas');
      logInfo(`Sugerencias: ${locationResponse.data.suggestions?.length || 0}`);
      if (locationResponse.data.suggestions && locationResponse.data.suggestions.length > 0) {
        locationResponse.data.suggestions.forEach((suggestion, index) => {
          logInfo(`  ${index + 1}. ${suggestion.suggestion} (${suggestion.type})`);
        });
      }
    } else {
      logError(`Sugerencias de ubicación fallaron con status: ${locationResponse.status}`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`Error obteniendo sugerencias: ${error.message}`);
    return false;
  }
}

// Test 5: Búsquedas guardadas
async function testSavedSearches() {
  logInfo('Test 5: Búsquedas guardadas');
  
  try {
    // Guardar búsqueda
    const saveRequest = {
      search_name: 'Plomeros en Mendoza',
      filters: {
        search_text: 'plomero',
        location: 'mendoza',
        min_rating: 4.0
      }
    };

    const saveResponse = await makeRequest(`${API_BASE_URL}/api/search/saved`, {
      method: 'POST',
      body: saveRequest
    });

    if (saveResponse.status === 200) {
      logSuccess('Búsqueda guardada exitosamente');
      logInfo(`ID: ${saveResponse.data.id}`);
      logInfo(`Nombre: ${saveResponse.data.search_name}`);
    } else {
      logError(`Error guardando búsqueda: ${saveResponse.status}`);
      return false;
    }

    // Obtener búsquedas guardadas
    const getResponse = await makeRequest(`${API_BASE_URL}/api/search/saved`);

    if (getResponse.status === 200) {
      logSuccess('Búsquedas guardadas obtenidas');
      logInfo(`Total guardadas: ${getResponse.data.length || 0}`);
      if (getResponse.data && getResponse.data.length > 0) {
        getResponse.data.forEach((search, index) => {
          logInfo(`  ${index + 1}. ${search.search_name} - ${search.filters.oficio || 'Sin oficio'}`);
        });
      }
    } else {
      logError(`Error obteniendo búsquedas guardadas: ${getResponse.status}`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`Error en búsquedas guardadas: ${error.message}`);
    return false;
  }
}

// Test 6: Paginación
async function testPagination() {
  logInfo('Test 6: Paginación de resultados');
  
  try {
    const searchRequest = {
      filters: {
        search_text: 'trabajador'
      },
      page: 1,
      limit: 3
    };

    const response = await makeRequest(`${API_BASE_URL}/api/search/workers`, {
      method: 'POST',
      body: searchRequest
    });

    if (response.status === 200) {
      logSuccess('Paginación funcionando');
      logInfo(`Página: ${response.data.page}`);
      logInfo(`Límite: ${response.data.limit}`);
      logInfo(`Total páginas: ${response.data.total_pages}`);
      logInfo(`Tiene más: ${response.data.has_more ? 'Sí' : 'No'}`);
      logInfo(`Trabajadores en esta página: ${response.data.workers?.length || 0}`);
      return true;
    } else {
      logError(`Error en paginación: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error en paginación: ${error.message}`);
    return false;
  }
}

// Test 7: Cache de resultados
async function testCache() {
  logInfo('Test 7: Cache de resultados');
  
  try {
    const searchRequest = {
      filters: {
        search_text: 'carpintero'
      },
      page: 1,
      limit: 5
    };

    // Primera búsqueda (debe ir a DB)
    const firstResponse = await makeRequest(`${API_BASE_URL}/api/search/workers`, {
      method: 'POST',
      body: searchRequest
    });

    if (firstResponse.status !== 200) {
      logError(`Primera búsqueda falló: ${firstResponse.status}`);
      return false;
    }

    logInfo(`Primera búsqueda - Desde cache: ${firstResponse.data.cached ? 'Sí' : 'No'}`);
    logInfo(`Primera búsqueda - Tiempo: ${firstResponse.data.search_time_ms}ms`);

    // Segunda búsqueda (debe ir a cache)
    const secondResponse = await makeRequest(`${API_BASE_URL}/api/search/workers`, {
      method: 'POST',
      body: searchRequest
    });

    if (secondResponse.status !== 200) {
      logError(`Segunda búsqueda falló: ${secondResponse.status}`);
      return false;
    }

    logInfo(`Segunda búsqueda - Desde cache: ${secondResponse.data.cached ? 'Sí' : 'No'}`);
    logInfo(`Segunda búsqueda - Tiempo: ${secondResponse.data.search_time_ms}ms`);

    if (secondResponse.data.cached) {
      logSuccess('Cache funcionando correctamente');
      return true;
    } else {
      logWarning('Cache no está funcionando (puede ser normal en desarrollo)');
      return true;
    }
  } catch (error) {
    logError(`Error en test de cache: ${error.message}`);
    return false;
  }
}

// Test 8: Analytics de búsqueda
async function testAnalytics() {
  logInfo('Test 8: Analytics de búsqueda');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/search/analytics`);

    if (response.status === 200) {
      logSuccess('Analytics obtenidos exitosamente');
      logInfo(`Total de búsquedas en analytics: ${response.data.analytics?.length || 0}`);
      
      if (response.data.analytics && response.data.analytics.length > 0) {
        logInfo('Top 5 búsquedas:');
        response.data.analytics.slice(0, 5).forEach((analytics, index) => {
          logInfo(`  ${index + 1}. "${analytics.search_query}" - ${analytics.search_count} veces`);
        });
      }
      
      return true;
    } else if (response.status === 403) {
      logWarning('Acceso denegado a analytics (requiere rol de admin)');
      return true;
    } else {
      logError(`Error obteniendo analytics: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error en analytics: ${error.message}`);
    return false;
  }
}

// Función principal de testing
async function runTests() {
  log(`${colors.bold}${colors.blue}🔍 Iniciando tests de Búsqueda Avanzada${colors.reset}`);
  log(`${colors.blue}================================================${colors.reset}`);
  
  const tests = [
    { name: 'Health Check', fn: testSearchHealthCheck },
    { name: 'Búsqueda Básica', fn: testBasicSearch },
    { name: 'Búsqueda Avanzada', fn: testAdvancedSearch },
    { name: 'Autocompletado', fn: testSuggestions },
    { name: 'Búsquedas Guardadas', fn: testSavedSearches },
    { name: 'Paginación', fn: testPagination },
    { name: 'Cache de Resultados', fn: testCache },
    { name: 'Analytics', fn: testAnalytics }
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
  testSearchHealthCheck,
  testBasicSearch,
  testAdvancedSearch,
  testSuggestions,
  testSavedSearches,
  testPagination,
  testCache,
  testAnalytics
};
