import React from 'react';
import { MapPin, Sliders } from 'lucide-react';

/**
 * Filtro de distancia para búsqueda de trabajadores
 * @param {Object} props - Propiedades del componente
 * @param {number} props.maxDistance - Distancia máxima en km
 * @param {Function} props.onDistanceChange - Callback cuando cambia la distancia
 * @param {boolean} props.hasLocation - Si el usuario tiene ubicación
 * @param {string} props.className - Clases CSS adicionales
 */
const DistanceFilter = ({ 
  maxDistance = 10, 
  onDistanceChange, 
  hasLocation = false,
  className = '' 
}) => {
  const distanceOptions = [
    { value: 1, label: '1 km', icon: '📍' },
    { value: 5, label: '5 km', icon: '🏃' },
    { value: 10, label: '10 km', icon: '🚗' },
    { value: 25, label: '25 km', icon: '🚌' },
    { value: 50, label: '50 km', icon: '🚛' },
    { value: 0, label: 'Sin límite', icon: '🌍' }
  ];

  const handleDistanceChange = (distance) => {
    if (onDistanceChange) {
      onDistanceChange(distance);
    }
  };

  if (!hasLocation) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center ${className}`}>
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Activa tu ubicación para filtrar por distancia
        </p>
        <p className="text-xs text-gray-500">
          Los trabajadores se mostrarán ordenados por proximidad
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <Sliders className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="font-semibold text-gray-900">Filtrar por distancia</h3>
      </div>
      
      <div className="space-y-2">
        {distanceOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleDistanceChange(option.value)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              maxDistance === option.value
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <span className="text-lg mr-3">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </div>
            
            {maxDistance === option.value && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {maxDistance === 0 
            ? 'Mostrando todos los trabajadores' 
            : `Trabajadores dentro de ${maxDistance} km`
          }
        </p>
      </div>
    </div>
  );
};

export default DistanceFilter;
