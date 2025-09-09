import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  DollarSign, 
  MapPin, 
  Clock, 
  Filter, 
  RotateCcw,
  Save,
  Loader2
} from 'lucide-react';

/**
 * Panel de filtros avanzados desplegable
 * Incluye filtros por oficio, ubicación, rating, precio, disponibilidad
 */
const AdvancedFilters = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onSaveSearch,
  onClearFilters,
  className = ""
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Sincronizar filtros locales con props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  // Aplicar filtros
  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    const clearedFilters = {
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
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  // Guardar búsqueda
  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    
    setIsSaving(true);
    try {
      const success = await onSaveSearch(saveName.trim());
      if (success) {
        setShowSaveDialog(false);
        setSaveName('');
      }
    } catch (error) {
      console.error('Error guardando búsqueda:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Contar filtros activos
  const activeFiltersCount = Object.values(localFilters).filter(value => 
    value !== null && value !== '' && value !== 0
  ).length;

  // Animaciones
  const panelVariants = {
    hidden: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel de filtros */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto ${className}`}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Filter className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Filtros Avanzados
                  </h2>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Filtro por oficio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-2" />
                  Oficio
                </label>
                <input
                  type="text"
                  value={localFilters.oficio || ''}
                  onChange={(e) => handleFilterChange('oficio', e.target.value)}
                  placeholder="Ej: Plomero, Electricista..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtro por ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Ubicación
                </label>
                <input
                  type="text"
                  value={localFilters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Ej: Mendoza, Godoy Cruz..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtro por rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-2" />
                  Rating Mínimo
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={localFilters.min_rating || 0}
                    onChange={(e) => handleFilterChange('min_rating', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                    {localFilters.min_rating || 0}★
                  </span>
                </div>
              </div>

              {/* Filtros de precio por hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Precio por Hora
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                    <input
                      type="number"
                      value={localFilters.min_hourly_rate || ''}
                      onChange={(e) => handleFilterChange('min_hourly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                    <input
                      type="number"
                      value={localFilters.max_hourly_rate || ''}
                      onChange={(e) => handleFilterChange('max_hourly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="∞"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros de precio por servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Precio por Servicio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                    <input
                      type="number"
                      value={localFilters.min_service_rate || ''}
                      onChange={(e) => handleFilterChange('min_service_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                    <input
                      type="number"
                      value={localFilters.max_service_rate || ''}
                      onChange={(e) => handleFilterChange('max_service_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="∞"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Filtro por disponibilidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Disponibilidad
                </label>
                <select
                  value={localFilters.is_available === null ? '' : localFilters.is_available.toString()}
                  onChange={(e) => handleFilterChange('is_available', e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Disponible ahora</option>
                  <option value="false">No disponible</option>
                </select>
              </div>

              {/* Filtro por radio de búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Radio de Búsqueda
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={localFilters.radius_km || 50}
                    onChange={(e) => handleFilterChange('radius_km', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[4rem]">
                    {localFilters.radius_km || 50} km
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex space-x-3">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Limpiar
                </button>
                
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </button>
                
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog para guardar búsqueda */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Guardar Búsqueda
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la búsqueda
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ej: Plomeros en Mendoza"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSearch}
                  disabled={!saveName.trim() || isSaving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdvancedFilters;
