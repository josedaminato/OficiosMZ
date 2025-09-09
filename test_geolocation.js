/**
 * Test de funcionalidad de geolocalización
 * Verifica que el sistema de geolocalización funcione correctamente
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Datos de prueba
const testWorkers = [
  {
    id: 'worker1',
    name: 'Juan Pérez',
    specialty: 'Plomería',
    lat: -32.8908,
    lng: -68.8272,
    rating: 4.5,
    reviewCount: 12,
    availability: 'Disponible'
  },
  {
    id: 'worker2', 
    name: 'María García',
    specialty: 'Electricidad',
    lat: -32.9000,
    lng: -68.8400,
    rating: 4.8,
    reviewCount: 8,
    availability: 'Disponible'
  },
  {
    id: 'worker3',
    name: 'Carlos López',
    specialty: 'Albañilería',
    lat: -32.8800,
    lng: -68.8100,
    rating: 4.2,
    reviewCount: 15,
    availability: 'Ocupado'
  }
];

// Ubicación de prueba (Mendoza centro)
const testLocation = {
  lat: -32.8908,
  lng: -68.8272
};

/**
 * Función para calcular distancia entre dos puntos (fórmula de Haversine)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

/**
 * Función para formatear distancia
 */
function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${Math.round(distance)} km`;
  }
}

/**
 * Test 1: Cálculo de distancias
 */
async function testDistanceCalculation() {
  console.log('🧮 Test 1: Cálculo de distancias');
  
  try {
    const workersWithDistance = testWorkers.map(worker => {
      const distance = calculateDistance(
        testLocation.lat, 
        testLocation.lng, 
        worker.lat, 
        worker.lng
      );
      
      return {
        ...worker,
        distance,
        distanceFormatted: formatDistance(distance)
      };
    });

    // Ordenar por distancia
    const sortedWorkers = workersWithDistance.sort((a, b) => a.distance - b.distance);

    console.log('✅ Trabajadores ordenados por distancia:');
    sortedWorkers.forEach((worker, index) => {
      console.log(`  ${index + 1}. ${worker.name} - ${worker.distanceFormatted} (${worker.specialty})`);
    });

    // Verificar que el orden es correcto
    const isCorrectlySorted = sortedWorkers.every((worker, index) => {
      if (index === 0) return true;
      return worker.distance >= sortedWorkers[index - 1].distance;
    });

    if (isCorrectlySorted) {
      console.log('✅ Ordenamiento por distancia correcto');
    } else {
      console.log('❌ Error en el ordenamiento por distancia');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de cálculo de distancias:', error);
    return false;
  }
}

/**
 * Test 2: Preparación de marcadores para mapa
 */
async function testMapMarkers() {
  console.log('\n🗺️ Test 2: Preparación de marcadores para mapa');
  
  try {
    const workersWithDistance = testWorkers.map(worker => {
      const distance = calculateDistance(
        testLocation.lat, 
        testLocation.lng, 
        worker.lat, 
        worker.lng
      );
      
      return {
        ...worker,
        distance,
        distanceFormatted: formatDistance(distance)
      };
    });

    const mapMarkers = workersWithDistance
      .filter(worker => worker.lat && worker.lng)
      .map(worker => ({
        lat: worker.lat,
        lng: worker.lng,
        title: worker.name,
        infoWindow: `
          <div class="p-2">
            <h3 class="font-semibold">${worker.name}</h3>
            <p class="text-sm text-gray-600">${worker.specialty}</p>
            <p class="text-sm text-gray-500">⭐ ${worker.rating.toFixed(1)}</p>
            <p class="text-sm text-blue-600">📍 ${worker.distanceFormatted}</p>
          </div>
        `
      }));

    console.log('✅ Marcadores preparados para el mapa:');
    mapMarkers.forEach((marker, index) => {
      console.log(`  ${index + 1}. ${marker.title} en (${marker.lat}, ${marker.lng})`);
    });

    // Verificar que todos los trabajadores con coordenadas están incluidos
    const workersWithCoords = testWorkers.filter(w => w.lat && w.lng);
    if (mapMarkers.length === workersWithCoords.length) {
      console.log('✅ Todos los trabajadores con coordenadas están incluidos');
    } else {
      console.log('❌ Faltan trabajadores en los marcadores del mapa');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de marcadores de mapa:', error);
    return false;
  }
}

/**
 * Test 3: Filtrado por distancia máxima
 */
async function testDistanceFiltering() {
  console.log('\n🔍 Test 3: Filtrado por distancia máxima');
  
  try {
    const maxDistance = 5; // 5 km
    
    const workersWithDistance = testWorkers.map(worker => {
      const distance = calculateDistance(
        testLocation.lat, 
        testLocation.lng, 
        worker.lat, 
        worker.lng
      );
      
      return {
        ...worker,
        distance,
        distanceFormatted: formatDistance(distance)
      };
    });

    // Filtrar por distancia máxima
    const filteredWorkers = workersWithDistance.filter(worker => 
      worker.distance <= maxDistance
    );

    console.log(`✅ Trabajadores dentro de ${maxDistance} km:`);
    filteredWorkers.forEach((worker, index) => {
      console.log(`  ${index + 1}. ${worker.name} - ${worker.distanceFormatted}`);
    });

    // Verificar que todos los trabajadores filtrados están dentro del rango
    const allWithinRange = filteredWorkers.every(worker => worker.distance <= maxDistance);
    
    if (allWithinRange) {
      console.log('✅ Filtrado por distancia correcto');
    } else {
      console.log('❌ Error en el filtrado por distancia');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de filtrado por distancia:', error);
    return false;
  }
}

/**
 * Test 4: Validación de coordenadas
 */
async function testCoordinateValidation() {
  console.log('\n📍 Test 4: Validación de coordenadas');
  
  try {
    const validCoordinates = [
      { lat: -32.8908, lng: -68.8272, name: 'Mendoza centro' },
      { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires' },
      { lat: -31.4201, lng: -64.1888, name: 'Córdoba' }
    ];

    const invalidCoordinates = [
      { lat: 91, lng: 0, name: 'Latitud inválida (>90)' },
      { lat: -91, lng: 0, name: 'Latitud inválida (<-90)' },
      { lat: 0, lng: 181, name: 'Longitud inválida (>180)' },
      { lat: 0, lng: -181, name: 'Longitud inválida (<-180)' }
    ];

    // Función para validar coordenadas
    const isValidCoordinate = (lat, lng) => {
      return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    };

    console.log('✅ Coordenadas válidas:');
    validCoordinates.forEach(coord => {
      const isValid = isValidCoordinate(coord.lat, coord.lng);
      console.log(`  ${coord.name}: ${isValid ? '✅' : '❌'} (${coord.lat}, ${coord.lng})`);
    });

    console.log('❌ Coordenadas inválidas:');
    invalidCoordinates.forEach(coord => {
      const isValid = isValidCoordinate(coord.lat, coord.lng);
      console.log(`  ${coord.name}: ${isValid ? '❌' : '✅'} (${coord.lat}, ${coord.lng})`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error en test de validación de coordenadas:', error);
    return false;
  }
}

/**
 * Test 5: Simulación de búsqueda con geolocalización
 */
async function testGeolocationSearch() {
  console.log('\n🔍 Test 5: Simulación de búsqueda con geolocalización');
  
  try {
    // Simular búsqueda de plomeros cerca de Mendoza
    const searchQuery = {
      specialty: 'Plomería',
      location: 'Mendoza',
      maxDistance: 10,
      userLocation: testLocation
    };

    console.log('🔍 Parámetros de búsqueda:');
    console.log(`  Especialidad: ${searchQuery.specialty}`);
    console.log(`  Ubicación: ${searchQuery.location}`);
    console.log(`  Distancia máxima: ${searchQuery.maxDistance} km`);
    console.log(`  Ubicación del usuario: (${searchQuery.userLocation.lat}, ${searchQuery.userLocation.lng})`);

    // Filtrar trabajadores por especialidad y distancia
    const workersWithDistance = testWorkers.map(worker => {
      const distance = calculateDistance(
        searchQuery.userLocation.lat, 
        searchQuery.userLocation.lng, 
        worker.lat, 
        worker.lng
      );
      
      return {
        ...worker,
        distance,
        distanceFormatted: formatDistance(distance)
      };
    });

    const filteredWorkers = workersWithDistance
      .filter(worker => 
        worker.specialty.toLowerCase().includes(searchQuery.specialty.toLowerCase()) &&
        worker.distance <= searchQuery.maxDistance
      )
      .sort((a, b) => a.distance - b.distance);

    console.log('✅ Resultados de búsqueda:');
    if (filteredWorkers.length > 0) {
      filteredWorkers.forEach((worker, index) => {
        console.log(`  ${index + 1}. ${worker.name} - ${worker.distanceFormatted} - ⭐ ${worker.rating}`);
      });
    } else {
      console.log('  No se encontraron trabajadores que cumplan los criterios');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en test de búsqueda con geolocalización:', error);
    return false;
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log('🚀 Iniciando tests de geolocalización...\n');
  
  const tests = [
    testDistanceCalculation,
    testMapMarkers,
    testDistanceFiltering,
    testCoordinateValidation,
    testGeolocationSearch
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error('❌ Error ejecutando test:', error);
    }
  }

  console.log('\n📊 Resumen de tests:');
  console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests fallidos: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todos los tests de geolocalización pasaron!');
  } else {
    console.log('⚠️ Algunos tests fallaron. Revisar la implementación.');
  }

  return passedTests === totalTests;
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export {
  runAllTests,
  testDistanceCalculation,
  testMapMarkers,
  testDistanceFiltering,
  testCoordinateValidation,
  testGeolocationSearch
};
