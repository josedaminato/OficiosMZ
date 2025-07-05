// Componente principal de búsqueda de trabajadores
// Orquesta filtros, lista y paginación. Maneja el estado global de la búsqueda.
import React, { useState } from 'react';
import WorkerFilters from './WorkerFilters';
import WorkerList from './WorkerList';
import Loader from './Loader';
import useWorkerSearch, { WorkerFiltersType } from '../../hooks/useWorkerSearch';

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

  // Hook de búsqueda
  const {
    workers,
    loading,
    error,
    hasMore,
    loadMore,
    setSearchFilters,
  } = useWorkerSearch(filters);

  // Callback para actualizar filtros desde WorkerFilters
  const handleFiltersChange = (newFilters: WorkerFiltersType) => {
    setFilters(newFilters);
    setSearchFilters(newFilters); // Actualiza el hook
  };

  // Mensaje de encabezado
  const headerMsg = filters.job
    ? `Mostrando los 5 mejores ${filters.job === 'Otra' && filters.customJob ? filters.customJob : filters.job} en ${filters.location || 'todas las zonas'}`
    : 'Busca un trabajador por oficio y zona';

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Buscar Trabajadores</h1>
      <WorkerFilters filters={filters} onChange={handleFiltersChange} />
      <SecurityNotice />

      <div className="mb-4 text-lg font-semibold text-center text-blue-900">
        {headerMsg}
      </div>

      {loading && workers.length === 0 && <Loader />}
      {error && (
        <div className="text-red-600 text-center my-4" role="alert">{error}</div>
      )}
      <WorkerList workers={workers} />
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
      {!loading && workers.length === 0 && !error && (
        <div className="text-center text-gray-500 mt-8" role="status">
          No se encontraron trabajadores para tu búsqueda.
        </div>
      )}
      {loading && workers.length > 0 && <Loader />}
      {hasMore && workers.length > 0 && !loading && (
        <div className="text-center text-gray-400 text-sm mt-2">
          ¿No encontraste lo que buscabas? Explora más trabajadores.
        </div>
      )}
    </div>
  );
};

export default WorkerSearch; 