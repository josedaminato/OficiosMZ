import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Phone, 
  MessageCircle,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

/**
 * Componente de resultados de búsqueda avanzada
 * Incluye paginación infinita, ordenamiento y acciones
 */
const AdvancedSearchResults = ({
  results = [],
  loading = false,
  error = null,
  hasMore = false,
  totalCount = 0,
  searchTime = 0,
  cached = false,
  onLoadMore,
  onSort,
  onContact,
  onViewProfile,
  className = ""
}) => {
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Opciones de ordenamiento
  const sortOptions = [
    { value: 'relevance', label: 'Relevancia', icon: Search },
    { value: 'rating', label: 'Mejor calificado', icon: Star },
    { value: 'price_low', label: 'Precio menor', icon: DollarSign },
    { value: 'price_high', label: 'Precio mayor', icon: DollarSign },
    { value: 'distance', label: 'Más cercano', icon: MapPin },
    { value: 'newest', label: 'Más reciente', icon: Clock }
  ];

  // Manejar cambio de ordenamiento
  const handleSortChange = (option) => {
    setSortBy(option.value);
    setShowSortMenu(false);
    onSort?.(option.value, sortOrder);
  };

  // Alternar orden
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    onSort?.(sortBy, newOrder);
  };

  // Obtener icono de ordenamiento actual
  const currentSortOption = sortOptions.find(option => option.value === sortBy);
  const SortIcon = currentSortOption?.icon || Search;

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

  const itemVariants = {
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

  const loadingVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  // Componente de tarjeta de trabajador
  const WorkerCard = ({ worker, index }) => (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="p-6">
        {/* Header de la tarjeta */}
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {worker.profile_picture_url ? (
                <img
                  src={worker.profile_picture_url}
                  alt={worker.full_name || 'Trabajador'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Información principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {worker.full_name || 'Trabajador'}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {worker.oficio}
                </p>
                {worker.custom_oficio && (
                  <p className="text-xs text-gray-500">
                    {worker.custom_oficio}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">
                  {worker.rating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-gray-500">
                  ({worker.total_ratings || 0})
                </span>
              </div>
            </div>

            {/* Descripción */}
            {worker.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {worker.description}
              </p>
            )}

            {/* Ubicación */}
            <div className="flex items-center space-x-1 mt-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {worker.location_city}
                {worker.location_province && `, ${worker.location_province}`}
              </span>
              {worker.distance_km && (
                <span className="text-xs text-gray-500">
                  • {worker.distance_km.toFixed(1)} km
                </span>
              )}
            </div>

            {/* Precios */}
            <div className="flex items-center space-x-4 mt-3">
              {worker.hourly_rate && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    ${worker.hourly_rate.toLocaleString()}/h
                  </span>
                </div>
              )}
              {worker.service_rate && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    ${worker.service_rate.toLocaleString()}/servicio
                  </span>
                </div>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="flex items-center space-x-1 mt-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={`text-sm font-medium ${
                worker.is_available ? 'text-green-600' : 'text-red-600'
              }`}>
                {worker.is_available ? 'Disponible ahora' : 'No disponible'}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onContact?.(worker)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Phone className="w-4 h-4" />
            <span>Contactar</span>
          </button>
          
          <button
            onClick={() => onViewProfile?.(worker)}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Ver Perfil</span>
          </button>
          
          <button
            onClick={() => onContact?.(worker)}
            className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            title="Enviar mensaje"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Componente de loading
  const LoadingCard = () => (
    <motion.div
      variants={loadingVariants}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header de resultados */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {totalCount > 0 ? `${totalCount} trabajadores encontrados` : 'Sin resultados'}
            </h2>
            {searchTime > 0 && (
              <p className="text-sm text-gray-500">
                Búsqueda completada en {searchTime.toFixed(0)}ms
                {cached && ' (desde cache)'}
              </p>
            )}
          </div>
        </div>

        {/* Controles de ordenamiento */}
        {totalCount > 0 && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SortIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {currentSortOption?.label || 'Ordenar'}
                </span>
                <Filter className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                          sortBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleSortOrder}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Resultados */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {loading && results.length === 0 ? (
          // Loading inicial
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </div>
        ) : error ? (
          // Error
          <motion.div
            className="text-center py-12"
            variants={itemVariants}
          >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error en la búsqueda
            </h3>
            <p className="text-gray-500">{error}</p>
          </motion.div>
        ) : results.length === 0 ? (
          // Sin resultados
          <motion.div
            className="text-center py-12"
            variants={itemVariants}
          >
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron trabajadores
            </h3>
            <p className="text-gray-500">
              Intenta ajustar los filtros de búsqueda
            </p>
          </motion.div>
        ) : (
          // Resultados
          results.map((worker, index) => (
            <WorkerCard key={worker.id || index} worker={worker} index={index} />
          ))
        )}

        {/* Loading más resultados */}
        {loading && results.length > 0 && (
          <motion.div
            className="flex justify-center py-4"
            variants={loadingVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Cargando más resultados...</span>
            </div>
          </motion.div>
        )}

        {/* Botón cargar más */}
        {hasMore && !loading && (
          <motion.div
            className="flex justify-center pt-4"
            variants={itemVariants}
          >
            <button
              onClick={onLoadMore}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>Cargar más trabajadores</span>
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AdvancedSearchResults;
