import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Star, MapPin, Filter, Save, Loader2 } from 'lucide-react';
import useAdvancedSearch from '../../hooks/useAdvancedSearch';

/**
 * Barra de búsqueda avanzada con autocompletado
 * Incluye sugerencias, búsquedas recientes y filtros rápidos
 */
const AdvancedSearchBar = ({ 
  onFiltersChange, 
  onSearch, 
  placeholder = "Buscar trabajadores por oficio, ubicación...",
  showFilters = true,
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  const {
    filters,
    suggestions,
    suggestionsLoading,
    recentSearches,
    getSuggestions,
    updateFilters,
    searchWorkers
  } = useAdvancedSearch();

  // Manejar cambio de input
  const handleInputChange = useCallback((value) => {
    setInputValue(value);
    setSelectedSuggestionIndex(-1);
    
    // Actualizar filtro de búsqueda
    updateFilters({ search_text: value });
    
    // Obtener sugerencias con debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (value.length >= 2) {
        getSuggestions(value);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, [updateFilters, getSuggestions]);

  // Manejar búsqueda
  const handleSearch = useCallback((searchText = inputValue) => {
    if (searchText.trim()) {
      updateFilters({ search_text: searchText.trim() });
      searchWorkers({ ...filters, search_text: searchText.trim() }, 1, true);
      setShowSuggestions(false);
      onSearch?.(searchText.trim());
    }
  }, [inputValue, updateFilters, searchWorkers, filters, onSearch]);

  // Manejar teclas
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          const suggestion = suggestions[selectedSuggestionIndex];
          setInputValue(suggestion.suggestion);
          handleSearch(suggestion.suggestion);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, selectedSuggestionIndex, suggestions, handleSearch]);

  // Manejar click en sugerencia
  const handleSuggestionClick = useCallback((suggestion) => {
    setInputValue(suggestion.suggestion);
    handleSearch(suggestion.suggestion);
  }, [handleSearch]);

  // Manejar click en búsqueda reciente
  const handleRecentSearchClick = useCallback((recentSearch) => {
    setInputValue(recentSearch.text);
    handleSearch(recentSearch.text);
  }, [handleSearch]);

  // Manejar click fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar input
  const clearInput = useCallback(() => {
    setInputValue('');
    updateFilters({ search_text: '' });
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [updateFilters]);

  // Animaciones
  const suggestionsVariants = {
    hidden: { 
      opacity: 0, 
      y: -10, 
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
      y: -10, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  };

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white shadow-sm"
          />
          
          {inputValue && (
            <button
              onClick={clearInput}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Botón de filtros */}
        {showFilters && (
          <button
            onClick={() => onFiltersChange?.()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Panel de sugerencias */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto"
            variants={suggestionsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Sugerencias de autocompletado */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                  Sugerencias
                </div>
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={`${suggestion.suggestion}-${index}`}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                      index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-shrink-0">
                      {suggestion.type === 'oficio' ? (
                        <Star className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <MapPin className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {suggestion.suggestion}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {suggestion.type === 'oficio' ? 'Oficio' : 'Ubicación'}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Búsquedas recientes */}
            {recentSearches.length > 0 && suggestions.length === 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                  Búsquedas Recientes
                </div>
                {recentSearches.map((recent, index) => (
                  <motion.button
                    key={`recent-${index}`}
                    className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 hover:bg-gray-100 transition-colors text-gray-700"
                    onClick={() => handleRecentSearchClick(recent)}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {recent.text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(recent.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {suggestionsLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                <div className="text-sm text-gray-500 mt-2">Buscando sugerencias...</div>
              </div>
            )}

            {/* Sin resultados */}
            {!suggestionsLoading && suggestions.length === 0 && recentSearches.length === 0 && inputValue.length >= 2 && (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No se encontraron sugerencias</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchBar;
