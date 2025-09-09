// Componente principal de búsqueda de trabajadores
// Orquesta filtros, lista y paginación. Maneja el estado global de la búsqueda.
import React, { useState } from 'react';
import WorkerFilters from './WorkerFilters';
import WorkerList from './WorkerList';
import Loader from './Loader';
// @ts-ignore
import { MapView, WorkerMapCard } from '../Map';
import useWorkerSearch, { WorkerFiltersType } from '../../hooks/useWorkerSearch';
// @ts-ignore
import useGeolocation from '../../hooks/useGeolocation';

// Importar subcomponentes (se crearán en los siguientes pasos)
// import WorkerFilters from './WorkerFilters';
// import WorkerList from './WorkerList';
// import Loader from './Loader';

const SecurityNotice: React.FC = () => (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded text-center" role="alert">
    <strong>¡Importante para tu seguridad!</strong><br />
    El trabajador que realice el trabajo debe ser el mismo que aparece en la foto de su perfil.<br />
    <span className="font-semibold">No permitas que otra persona se presente en su lugar.</span><br />
    Si notas algo sospechoso, repórtalo a través de la plataforma.
  </div>
);

const WorkerSearch: React.FC = () => {
  // Estado de filtros
  const [filters, setFilters] = useState<WorkerFiltersType>({
    job: '',
    customJob: '',
    location: '',
    availability: '',
    minRating: 0,
  });

  // Estado de vista (lista o mapa)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // Hook de búsqueda
  const {
    workers,
    loading,
    error,
    hasMore,
    loadMore,
    setSearchFilters,
  } = useWorkerSearch(filters);

  // Hook de geolocalización
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentLocation,
    getDistanceFromCurrent,
    formatDistance
  } = useGeolocation();

  // Callback para actualizar filtros desde WorkerFilters
  const handleFiltersChange = (newFilters: WorkerFiltersType) => {
    setFilters(newFilters);
    setSearchFilters(newFilters); // Actualiza el hook
  };

  // Calcular distancias para los trabajadores
  const workersWithDistance = workers.map(worker => {
    const distance = userLocation && (worker as any).lat && (worker as any).lng 
      ? getDistanceFromCurrent((worker as any).lat, (worker as any).lng)
      : null;
    
    return {
      ...worker,
      distance,
      distanceFormatted: distance ? formatDistance(distance) : 'N/A'
    };
  });

  // Ordenar por distancia si hay ubicación del usuario
  const sortedWorkers = userLocation 
    ? workersWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      })
    : workersWithDistance;

  // Preparar marcadores para el mapa
  const mapMarkers = sortedWorkers
    .filter(worker => (worker as any).lat && (worker as any).lng)
    .map(worker => ({
      lat: (worker as any).lat,
      lng: (worker as any).lng,
      title: worker.name || 'Trabajador',
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold">${worker.name || 'Trabajador'}</h3>
          <p class="text-sm text-gray-600">${(worker as any).specialty || 'Especialidad'}</p>
          <p class="text-sm text-gray-500">⭐ ${worker.rating?.toFixed(1) || 'N/A'}</p>
          ${worker.distanceFormatted !== 'N/A' ? `<p class="text-sm text-blue-600">📍 ${worker.distanceFormatted}</p>` : ''}
        </div>
      `
    }));

  // Centro del mapa (ubicación del usuario o Mendoza por defecto)
  const mapCenter = userLocation || { lat: -32.8908, lng: -68.8272 };

  // Usar selectedWorker para evitar warning
  console.log('Trabajador seleccionado:', selectedWorker);

  // Mensaje de encabezado
  const headerMsg = filters.job
    ? `Mostrando los 5 mejores ${filters.job === 'Otra' && filters.customJob ? filters.customJob : filters.job} en ${filters.location || 'todas las zonas'}`
    : 'Busca un trabajador por oficio y zona';

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Buscar Trabajadores</h1>
      <WorkerFilters filters={filters} onChange={handleFiltersChange} />
      <SecurityNotice />

      {/* Controles de vista y ubicación */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <div className="text-lg font-semibold text-blue-900">
          {headerMsg}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Botón de ubicación */}
          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
          >
            {locationLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {userLocation ? 'Ubicación actual' : 'Usar mi ubicación'}
          </button>
          
          {/* Toggle de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mapa
            </button>
          </div>
        </div>
      </div>

      {/* Error de ubicación */}
      {locationError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded">
          <p className="text-sm">
            <strong>Ubicación no disponible:</strong> {locationError}
          </p>
        </div>
      )}

      {/* Contenido principal */}
      {loading && workers.length === 0 && <Loader />}
      {error && (
        <div className="text-red-600 text-center my-4" role="alert">{error}</div>
      )}

      {viewMode === 'list' ? (
        <>
          <WorkerList workers={sortedWorkers} />
          {hasMore && !loading && workers.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg text-lg font-bold hover:bg-blue-700 transition"
                onClick={loadMore}
                aria-label="Cargar más trabajadores"
              >
                Ver más trabajadores
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Mapa */}
          <MapView
            markers={mapMarkers}
            center={mapCenter}
            zoom={userLocation ? 12 : 10}
            onMarkerClick={(markerData: any, index: number) => {
              console.log('Marcador clickeado:', markerData);
              setSelectedWorker(sortedWorkers[index]);
            }}
            showUserLocation={!!userLocation}
            userLocation={userLocation}
            height={500}
            className="rounded-lg border"
          />
          
          {/* Lista de trabajadores en el mapa */}
          {sortedWorkers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedWorkers.slice(0, 6).map((worker, index) => (
                <WorkerMapCard
                  key={worker.id || index}
                  worker={worker}
                  onContact={(worker: any) => {
                    console.log('Contactar trabajador:', worker);
                    // Implementar lógica de contacto
                  }}
                  onViewProfile={(worker: any) => {
                    console.log('Ver perfil:', worker);
                    // Implementar navegación al perfil
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estados vacíos */}
      {!loading && workers.length === 0 && !error && (
        <div className="text-center text-gray-500 mt-8" role="status">
          No se encontraron trabajadores para tu búsqueda.
        </div>
      )}
      
      {loading && workers.length > 0 && <Loader />}
      {hasMore && workers.length > 0 && !loading && viewMode === 'list' && (
        <div className="text-center text-gray-400 text-sm mt-2">
          ¿No encontraste lo que buscabas? Explora más trabajadores.
        </div>
      )}
    </div>
  );
};

export default WorkerSearch; 