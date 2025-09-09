import React from 'react';
import { MapPin, Star, Clock, Phone, MessageCircle } from 'lucide-react';

/**
 * Tarjeta de trabajador para mostrar en el mapa
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.worker - Datos del trabajador
 * @param {Function} props.onContact - Callback para contactar
 * @param {Function} props.onViewProfile - Callback para ver perfil
 * @param {string} props.className - Clases CSS adicionales
 */
const WorkerMapCard = ({ 
  worker, 
  onContact, 
  onViewProfile, 
  className = '' 
}) => {
  const {
    id,
    name = 'Trabajador',
    rating = 0,
    reviewCount = 0,
    distance = null,
    specialty = 'Especialidad',
    availability = 'Disponible',
    avatar = null,
    phone = null,
    lastActive = null
  } = worker;

  // Formatear distancia
  const formatDistance = (dist) => {
    if (dist === null || dist === undefined) return 'N/A';
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    if (dist < 10) return `${dist.toFixed(1)} km`;
    return `${Math.round(dist)} km`;
  };

  // Formatear última actividad
  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const now = new Date();
    const lastActiveDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Hace ${days}d`;
    }
  };

  // Determinar color de disponibilidad
  const getAvailabilityColor = (avail) => {
    switch (avail.toLowerCase()) {
      case 'disponible':
        return 'text-green-600 bg-green-100';
      case 'ocupado':
        return 'text-yellow-600 bg-yellow-100';
      case 'no disponible':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 max-w-sm ${className}`}>
      {/* Header con avatar y info básica */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {specialty}
          </p>
          
          {/* Rating y distancia */}
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
            
            {distance !== null && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {formatDistance(distance)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estado de disponibilidad */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(availability)}`}>
          {availability}
        </span>
        
        {lastActive && (
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatLastActive(lastActive)}
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex space-x-2">
        <button
          onClick={() => onViewProfile && onViewProfile(worker)}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          Ver Perfil
        </button>
        
        <button
          onClick={() => onContact && onContact(worker)}
          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          title="Contactar"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        
        {phone && (
          <a
            href={`tel:${phone}`}
            className="px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
            title="Llamar"
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};

export default WorkerMapCard;
