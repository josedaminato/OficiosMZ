// Hook para lógica de búsqueda y paginación de trabajadores
// Maneja la consulta a Supabase, paginación, carga y errores.

import { useState, useEffect, useCallback, useMemo } from 'react';

// Tipos de filtros
export type WorkerFiltersType = {
  job: string;
  customJob: string;
  location: string;
  availability: string;
  minRating: number;
};

// Tipo de datos de trabajador para la tarjeta
export type WorkerCardData = {
  id: string;
  name: string;
  avatar_url: string;
  rating: number;
  reviews: number;
  contact: string;
  oficio?: string;
  specialty?: string;
  experience?: string;
};

// Simulación de datos (esto luego se reemplaza por consulta a Supabase)
const MOCK_WORKERS: WorkerCardData[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 4.9,
    reviews: 32,
    contact: '261-1234567',
    oficio: 'Carpintero',
    specialty: 'Muebles a medida',
    experience: '10',
  },
  {
    id: '2',
    name: 'María Gómez',
    avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
    rating: 4.8,
    reviews: 28,
    contact: '261-7654321',
    oficio: 'Plomera',
    specialty: 'Reparaciones rápidas',
    experience: '7',
  },
  {
    id: '3',
    name: 'Carlos López',
    avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
    rating: 4.7,
    reviews: 21,
    contact: '261-1112233',
    oficio: 'Electricista',
    specialty: 'Instalaciones seguras',
    experience: '8',
  },
  {
    id: '4',
    name: 'Ana Torres',
    avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
    rating: 4.6,
    reviews: 19,
    contact: '261-2223344',
    oficio: 'Albañil',
    specialty: 'Construcción en seco',
    experience: '12',
  },
  {
    id: '5',
    name: 'Pedro Sánchez',
    avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
    rating: 4.5,
    reviews: 15,
    contact: '261-3334455',
    oficio: 'Herrero',
    specialty: 'Estructuras metálicas',
    experience: '9',
  },
  {
    id: '6',
    name: 'Lucía Fernández',
    avatar_url: 'https://randomuser.me/api/portraits/women/6.jpg',
    rating: 4.4,
    reviews: 12,
    contact: '261-4445566',
    oficio: 'Pintora',
    specialty: 'Interiores y exteriores',
    experience: '6',
  },
  // Oficios agregados manualmente por trabajadores
  {
    id: '7',
    name: 'Roberto Díaz',
    avatar_url: 'https://randomuser.me/api/portraits/men/7.jpg',
    rating: 4.3,
    reviews: 10,
    contact: '261-5556677',
    oficio: 'Vidriero', // Nuevo oficio
    specialty: 'Colocación de vidrios',
    experience: '5',
  },
  {
    id: '8',
    name: 'Sofía Ruiz',
    avatar_url: 'https://randomuser.me/api/portraits/women/8.jpg',
    rating: 4.2,
    reviews: 8,
    contact: '261-8889999',
    oficio: 'Tapicera', // Nuevo oficio
    specialty: 'Tapizado de muebles',
    experience: '4',
  },
];

const PREDEFINED_OFICIOS = [
  'Albañil',
  'Plomero',
  'Electricista',
  'Carpintero',
  'Limpieza',
  'Herrero',
  'Pintor',
];

// Devuelve la lista de oficios únicos (predefinidos + agregados)
export function getAllOficios() {
  const oficiosFromWorkers = MOCK_WORKERS.map(w => w.oficio).filter(Boolean) as string[];
  const all = [...PREDEFINED_OFICIOS, ...oficiosFromWorkers];
  // Eliminar duplicados
  return Array.from(new Set(all));
}

const PAGE_SIZE = 5;

const useWorkerSearch = (initialFilters: WorkerFiltersType) => {
  const [filters, setFilters] = useState<WorkerFiltersType>(initialFilters);
  const [workers, setWorkers] = useState<WorkerCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Memoizar filtros para evitar recálculos innecesarios
  const memoizedFilters = useMemo(() => filters, [filters.job, filters.customJob, filters.location, filters.minRating]);

  // Simular consulta a Supabase (luego reemplazar por fetch real)
  const fetchWorkers = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((res) => setTimeout(res, 700)); // Simula carga
      // Filtrar y paginar mock data
      let filtered = MOCK_WORKERS.filter((w) =>
        (!memoizedFilters.job || (w.oficio && w.oficio.toLowerCase().includes(memoizedFilters.job.toLowerCase())) || (memoizedFilters.job === 'Otra' && memoizedFilters.customJob && w.oficio && w.oficio.toLowerCase().includes(memoizedFilters.customJob.toLowerCase()))) &&
        (!memoizedFilters.location || w.name.toLowerCase().includes(memoizedFilters.location.toLowerCase())) &&
        (!memoizedFilters.minRating || w.rating >= memoizedFilters.minRating)
      );
      filtered = filtered.filter((w) => w.avatar_url); // Solo con foto
      filtered = filtered.sort((a, b) => b.rating - a.rating); // Mejores primero
      const start = 0;
      const end = page * PAGE_SIZE;
      const paginated = filtered.slice(start, end);
      setWorkers(reset ? paginated : [...workers, ...filtered.slice(workers.length, end)]);
      setHasMore(filtered.length > paginated.length);
    } catch (e) {
      setError('Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, page, workers]);

  // Cargar al cambiar filtros o página
  useEffect(() => {
    fetchWorkers(page === 1);
    // eslint-disable-next-line
  }, [filters, page]);

  // Cambiar filtros
  const setSearchFilters = (newFilters: WorkerFiltersType) => {
    setFilters(newFilters);
    setPage(1);
    setWorkers([]);
  };

  // Cargar más
  const loadMore = () => {
    setPage((p) => p + 1);
  };

  return {
    workers,
    loading,
    error,
    hasMore,
    loadMore,
    setSearchFilters,
  };
};

export default useWorkerSearch; 