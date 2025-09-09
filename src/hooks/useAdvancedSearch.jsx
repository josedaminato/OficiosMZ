import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from './useApi';

/**
 * Hook para búsqueda avanzada de trabajadores
 * Maneja filtros, cache, autocompletado y búsquedas guardadas
 */

// Tipos de filtros
export const SearchFilters = {
  search_text: '',
  oficio: '',
  location: '',
  min_rating: 0,
  max_hourly_rate: null,
  min_hourly_rate: null,
  max_service_rate: null,
  min_service_rate: null,
  is_available: null,
  radius_km: 50,
  user_lat: null,
  user_lng: null
};

// Tipos de ordenamiento
export const SortOptions = {
  RELEVANCE: 'relevance',
  RATING: 'rating',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
  DISTANCE: 'distance',
  NEWEST: 'newest'
};

/**
 * Hook principal de búsqueda avanzada
 * @param {Object} initialFilters - Filtros iniciales
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y funciones de búsqueda
 */
export const useAdvancedSearch = (initialFilters = {}, options = {}) => {
  const {
    debounceMs = 300,
    enableCache = true,
    enableAnalytics = true,
    pageSize = 20
  } = options;

  // Estado de filtros
  const [filters, setFilters] = useState({
    ...SearchFilters,
    ...initialFilters
  });

  // Estado de búsqueda
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTime, setSearchTime] = useState(0);
  const [cached, setCached] = useState(false);

  // Estado de autocompletado
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Estado de búsquedas guardadas
  const [savedSearches, setSavedSearches] = useState([]);
  const [savedSearchesLoading, setSavedSearchesLoading] = useState(false);

  // Estado de búsquedas recientes
  const [recentSearches, setRecentSearches] = useState([]);

  // Hook de API
  const { execute: executeApi } = useApi('/api/search');

  // Cargar búsquedas recientes desde localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recent_searches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (error) {
        console.error('Error cargando búsquedas recientes:', error);
      }
    }
  }, []);

  // Guardar búsqueda reciente
  const saveRecentSearch = useCallback((searchText) => {
    if (!searchText || searchText.trim().length < 2) return;

    const recent = [...recentSearches];
    const existingIndex = recent.findIndex(item => item.text === searchText);
    
    if (existingIndex >= 0) {
      recent.splice(existingIndex, 1);
    }
    
    recent.unshift({
      text: searchText,
      timestamp: new Date().toISOString()
    });
    
    // Mantener solo las últimas 10
    const limitedRecent = recent.slice(0, 10);
    setRecentSearches(limitedRecent);
    localStorage.setItem('recent_searches', JSON.stringify(limitedRecent));
  }, [recentSearches]);

  // Búsqueda principal con debounce
  const searchWorkers = useCallback(async (searchFilters = filters, page = 1, reset = true) => {
    try {
      setLoading(true);
      setError(null);

      const searchRequest = {
        filters: searchFilters,
        page,
        limit: pageSize,
        sort_by: 'relevance'
      };

      const startTime = Date.now();
      const response = await executeApi(searchRequest, { method: 'POST', endpoint: '/workers' });
      const searchTime = Date.now() - startTime;

      if (response.success) {
        const { workers, total_count, has_more, search_time_ms, cached: isCached } = response.data;

        if (reset) {
          setSearchResults(workers);
          setCurrentPage(1);
        } else {
          setSearchResults(prev => [...prev, ...workers]);
        }

        setTotalCount(total_count);
        setHasMore(has_more);
        setSearchTime(search_time_ms || searchTime);
        setCached(isCached || false);

        // Guardar búsqueda reciente si hay texto
        if (searchFilters.search_text) {
          saveRecentSearch(searchFilters.search_text);
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Error en la búsqueda');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setError(error.message || 'Error en la búsqueda');
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, executeApi, saveRecentSearch]);

  // Búsqueda con debounce
  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (searchFilters = filters, page = 1, reset = true) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        searchWorkers(searchFilters, page, reset);
      }, debounceMs);
    };
  }, [searchWorkers, debounceMs, filters]);

  // Actualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    debouncedSearch({ ...filters, ...newFilters }, 1, true);
  }, [filters, debouncedSearch]);

  // Cargar más resultados
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      searchWorkers(filters, nextPage, false);
    }
  }, [loading, hasMore, currentPage, searchWorkers, filters]);

  // Obtener sugerencias de autocompletado
  const getSuggestions = useCallback(async (query, type = 'all') => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSuggestionsLoading(true);
      const response = await executeApi(
        { query, type },
        { method: 'GET', endpoint: '/suggestions' }
      );

      if (response.success) {
        setSuggestions(response.data.suggestions || []);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [executeApi]);

  // Cargar búsquedas guardadas
  const loadSavedSearches = useCallback(async () => {
    try {
      setSavedSearchesLoading(true);
      const response = await executeApi({}, { method: 'GET', endpoint: '/saved' });

      if (response.success) {
        setSavedSearches(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando búsquedas guardadas:', error);
    } finally {
      setSavedSearchesLoading(false);
    }
  }, [executeApi]);

  // Guardar búsqueda
  const saveSearch = useCallback(async (searchName) => {
    try {
      const response = await executeApi(
        { search_name: searchName, filters },
        { method: 'POST', endpoint: '/saved' }
      );

      if (response.success) {
        // Recargar búsquedas guardadas
        await loadSavedSearches();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error guardando búsqueda:', error);
      return false;
    }
  }, [executeApi, filters, loadSavedSearches]);

  // Eliminar búsqueda guardada
  const deleteSavedSearch = useCallback(async (searchId) => {
    try {
      const response = await executeApi(
        {},
        { method: 'DELETE', endpoint: `/saved/${searchId}` }
      );

      if (response.success) {
        // Recargar búsquedas guardadas
        await loadSavedSearches();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error eliminando búsqueda:', error);
      return false;
    }
  }, [executeApi, loadSavedSearches]);

  // Aplicar búsqueda guardada
  const applySavedSearch = useCallback((savedSearch) => {
    setFilters(savedSearch.filters);
    setCurrentPage(1);
    searchWorkers(savedSearch.filters, 1, true);
  }, [searchWorkers]);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters(SearchFilters);
    setSearchResults([]);
    setCurrentPage(1);
    setTotalCount(0);
    setHasMore(false);
    setError(null);
  }, []);

  // Resetear búsqueda
  const resetSearch = useCallback(() => {
    clearFilters();
    setSuggestions([]);
  }, [clearFilters]);

  // Cargar búsquedas guardadas al montar
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  // Búsqueda inicial si hay filtros
  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(value => 
      value !== null && value !== '' && value !== 0
    );
    
    if (hasActiveFilters) {
      debouncedSearch(filters, 1, true);
    }
  }, []);

  return {
    // Estado
    filters,
    searchResults,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    searchTime,
    cached,
    suggestions,
    suggestionsLoading,
    savedSearches,
    savedSearchesLoading,
    recentSearches,

    // Funciones de búsqueda
    searchWorkers,
    updateFilters,
    loadMore,
    clearFilters,
    resetSearch,

    // Funciones de autocompletado
    getSuggestions,

    // Funciones de búsquedas guardadas
    loadSavedSearches,
    saveSearch,
    deleteSavedSearch,
    applySavedSearch,

    // Helpers
    hasActiveFilters: Object.values(filters).some(value => 
      value !== null && value !== '' && value !== 0
    ),
    isEmpty: searchResults.length === 0 && !loading,
    isSearching: loading,
    hasError: !!error
  };
};

export default useAdvancedSearch;
