import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, Loader } from 'lucide-react';

/**
 * Componente de búsqueda de ubicaciones con autocompletado
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onLocationSelect - Callback cuando se selecciona una ubicación
 * @param {string} props.placeholder - Texto placeholder
 * @param {string} props.className - Clases CSS adicionales
 */
const LocationSearch = ({ 
  onLocationSelect, 
  placeholder = "Buscar ubicación...",
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);

  // Autocompletado con Google Places API
  const searchPlaces = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key no configurada');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${apiKey}&language=es&region=ar&components=country:ar`
      );

      if (!response.ok) {
        throw new Error('Error en la API de Places');
      }

      const data = await response.json();

      if (data.status === 'OK') {
        const places = data.predictions.map((prediction) => ({
          id: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || '',
          types: prediction.types || []
        }));

        setSuggestions(places);
      } else {
        console.warn('Error en autocompletado:', data.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error buscando lugares:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener detalles de un lugar
  const getPlaceDetails = async (placeId) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=geometry,formatted_address,name`
      );

      if (!response.ok) {
        throw new Error('Error obteniendo detalles del lugar');
      }

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        return {
          id: placeId,
          name: place.name || place.formatted_address,
          address: place.formatted_address,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng
        };
      }
    } catch (error) {
      console.error('Error obteniendo detalles:', error);
    }

    return null;
  };

  // Manejar cambio en el input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Debounce para evitar muchas llamadas a la API
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  // Manejar selección de sugerencia
  const handleSuggestionSelect = async (suggestion) => {
    setQuery(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Obtener detalles del lugar
    const placeDetails = await getPlaceDetails(suggestion.id);
    
    if (placeDetails && onLocationSelect) {
      onLocationSelect(placeDetails);
    }
  };

  // Manejar teclas de navegación
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'
              }`}
            >
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.mainText}
                  </p>
                  {suggestion.secondaryText && (
                    <p className="text-sm text-gray-500 truncate">
                      {suggestion.secondaryText}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay sugerencias */}
      {showSuggestions && !loading && query && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No se encontraron ubicaciones para "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
