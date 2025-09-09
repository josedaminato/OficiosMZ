import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Hook personalizado para manejar geolocalización
 * @returns {Object} - Objeto con estado y funciones de geolocalización
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  // Verificar si el navegador soporta geolocalización
  const isSupported = 'geolocation' in navigator;

  // Obtener ubicación actual
  const getCurrentLocation = useCallback(() => {
    if (!isSupported) {
      setError('Geolocalización no soportada por este navegador');
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutos
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setLocation(newLocation);
        setPermission('granted');
        setLoading(false);
        
        console.log('Ubicación obtenida:', newLocation);
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            setPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
          default:
            errorMessage = 'Error desconocido';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
        
        toast.error(errorMessage);
        console.error('Error de geolocalización:', error);
      },
      options
    );
  }, [isSupported]);

  // Solicitar permisos de ubicación
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Geolocalización no soportada');
      return false;
    }

    try {
      // Verificar si ya tenemos permisos
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(permissionStatus.state);
      
      if (permissionStatus.state === 'granted') {
        getCurrentLocation();
        return true;
      } else if (permissionStatus.state === 'prompt') {
        getCurrentLocation();
        return true;
      } else {
        setError('Permisos de ubicación denegados');
        return false;
      }
    } catch (err) {
      console.error('Error verificando permisos:', err);
      // Fallback: intentar obtener ubicación directamente
      getCurrentLocation();
      return true;
    }
  }, [isSupported, getCurrentLocation]);

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }, []);

  // Calcular distancia desde ubicación actual
  const getDistanceFromCurrent = useCallback((lat, lng) => {
    if (!location) return null;
    return calculateDistance(location.lat, location.lng, lat, lng);
  }, [location, calculateDistance]);

  // Formatear distancia
  const formatDistance = useCallback((distance) => {
    if (distance === null || distance === undefined) return 'N/A';
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)} km`;
    } else {
      return `${Math.round(distance)} km`;
    }
  }, []);

  // Obtener dirección desde coordenadas (usando Google Geocoding API)
  const getAddressFromCoords = useCallback(async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key no configurada');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`
      );
      
      if (!response.ok) {
        throw new Error('Error en la API de geocoding');
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('No se pudo obtener dirección:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      return null;
    }
  }, []);

  // Obtener coordenadas desde dirección (usando Google Geocoding API)
  const getCoordsFromAddress = useCallback(async (address) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key no configurada');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=es`
      );
      
      if (!response.ok) {
        throw new Error('Error en la API de geocoding');
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      } else {
        console.warn('No se pudo obtener coordenadas:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo coordenadas:', error);
      return null;
    }
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Resetear ubicación
  const resetLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setLoading(false);
  }, []);

  // Verificar permisos al montar
  useEffect(() => {
    if (isSupported) {
      navigator.permissions?.query({ name: 'geolocation' })
        .then((permissionStatus) => {
          setPermission(permissionStatus.state);
        })
        .catch(() => {
          // Fallback si no soporta permissions API
          setPermission('prompt');
        });
    }
  }, [isSupported]);

  return {
    // Estado
    location,
    loading,
    error,
    permission,
    isSupported,
    
    // Funciones
    getCurrentLocation,
    requestPermission,
    calculateDistance,
    getDistanceFromCurrent,
    formatDistance,
    getAddressFromCoords,
    getCoordsFromAddress,
    clearError,
    resetLocation
  };
};

export default useGeolocation;
