import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Save, 
  Bookmark, 
  Clock, 
  X,
  Loader2
} from 'lucide-react';

import AdvancedSearchBar from './AdvancedSearchBar';
import AdvancedFilters from './AdvancedFilters';
import AdvancedSearchResults from './AdvancedSearchResults';
import useAdvancedSearch from '../../hooks/useAdvancedSearch';

/**
 * Sistema completo de búsqueda avanzada
 * Integra barra de búsqueda, filtros y resultados
 */
const AdvancedSearchSystem = ({ 
  initialFilters = {},
  onWorkerSelect,
  className = ""
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  const {
    // Estado
    filters,
    searchResults,
    loading,
    error,
    hasMore,
    totalCount,
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
    hasActiveFilters,
    isEmpty,
    isSearching,
    hasError
  } = useAdvancedSearch(initialFilters);

  // Manejar selección de trabajador
  const handleWorkerSelect = (worker) => {
    onWorkerSelect?.(worker);
  };

  // Manejar contacto
  const handleContact = (worker) => {
    console.log('Contactar trabajador:', worker);
    // Implementar lógica de contacto
  };

  // Manejar ver perfil
  const handleViewProfile = (worker) => {
    console.log('Ver perfil:', worker);
    // Implementar navegación al perfil
  };

  // Manejar ordenamiento
  const handleSort = (sortBy, sortOrder) => {
    console.log('Ordenar por:', sortBy, sortOrder);
    // Implementar lógica de ordenamiento
  };

  // Manejar búsqueda
  const handleSearch = (searchText) => {
    console.log('Búsqueda realizada:', searchText);
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={sectionVariants} className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Encuentra el Profesional Perfecto
        </h1>
        <p className="text-gray-600">
          Busca por oficio, ubicación, precio y más
        </p>
      </motion.div>

      {/* Barra de búsqueda */}
      <motion.div variants={sectionVariants}>
        <AdvancedSearchBar
          onFiltersChange={() => setShowFilters(true)}
          onSearch={handleSearch}
          placeholder="Buscar trabajadores por oficio, ubicación..."
          showFilters={true}
        />
      </motion.div>

      {/* Controles adicionales */}
      <motion.div variants={sectionVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filtros activos:</span>
              <div className="flex items-center space-x-2">
                {filters.oficio && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {filters.oficio}
                  </span>
                )}
                {filters.location && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {filters.location}
                  </span>
                )}
                {filters.min_rating > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {filters.min_rating}★+
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón búsquedas guardadas */}
          <button
            onClick={() => setShowSavedSearches(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-sm">Guardadas</span>
          </button>

          {/* Botón búsquedas recientes */}
          {recentSearches.length > 0 && (
            <button
              onClick={() => setShowSavedSearches(true)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">Recientes</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Resultados de búsqueda */}
      <motion.div variants={sectionVariants}>
        <AdvancedSearchResults
          results={searchResults}
          loading={loading}
          error={error}
          hasMore={hasMore}
          totalCount={totalCount}
          searchTime={searchTime}
          cached={cached}
          onLoadMore={loadMore}
          onSort={handleSort}
          onContact={handleContact}
          onViewProfile={handleViewProfile}
        />
      </motion.div>

      {/* Panel de filtros */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={updateFilters}
        onSaveSearch={saveSearch}
        onClearFilters={clearFilters}
      />

      {/* Panel de búsquedas guardadas */}
      <motion.div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 ${
          showSavedSearches ? 'block' : 'hidden'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: showSavedSearches ? 1 : 0 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: showSavedSearches ? 1 : 0.9, opacity: showSavedSearches ? 1 : 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Búsquedas Guardadas
            </h3>
            <button
              onClick={() => setShowSavedSearches(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {savedSearchesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : savedSearches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes búsquedas guardadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedSearches.map((savedSearch) => (
                <div
                  key={savedSearch.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {savedSearch.search_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {savedSearch.filters.oficio && `Oficio: ${savedSearch.filters.oficio}`}
                      {savedSearch.filters.location && ` • Ubicación: ${savedSearch.filters.location}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        applySavedSearch(savedSearch);
                        setShowSavedSearches(false);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(savedSearch.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedSearchSystem;
