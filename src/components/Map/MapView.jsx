import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Componente de mapa con Google Maps
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.markers - Array de marcadores a mostrar
 * @param {Object} props.center - Centro del mapa {lat, lng}
 * @param {number} props.zoom - Nivel de zoom
 * @param {Function} props.onMarkerClick - Callback cuando se hace clic en un marcador
 * @param {Function} props.onMapClick - Callback cuando se hace clic en el mapa
 * @param {boolean} props.showUserLocation - Si mostrar ubicación del usuario
 * @param {Object} props.userLocation - Ubicación del usuario {lat, lng}
 * @param {string} props.className - Clases CSS adicionales
 * @param {number} props.height - Altura del mapa en píxeles
 */
const MapView = ({
  markers = [],
  center = { lat: -32.8908, lng: -68.8272 }, // Mendoza por defecto
  zoom = 12,
  onMarkerClick,
  onMapClick,
  showUserLocation = true,
  userLocation = null,
  className = '',
  height = 400
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Configuración de Google Maps
  const mapConfig = {
    center,
    zoom,
    mapTypeId: 'roadmap',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ],
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: true,
    fullscreenControl: true
  };

  // Inicializar mapa
  const initializeMap = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key no configurada');
      setLoading(false);
      return;
    }

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      const { Map } = await loader.importLibrary('maps');
      
      if (mapRef.current) {
        const map = new Map(mapRef.current, mapConfig);
        mapInstanceRef.current = map;
        setMapLoaded(true);
        setLoading(false);

        // Evento de clic en el mapa
        if (onMapClick) {
          map.addListener('click', (event) => {
            onMapClick({
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            });
          });
        }

        console.log('Mapa inicializado correctamente');
      }
    } catch (err) {
      console.error('Error inicializando mapa:', err);
      setError('Error cargando el mapa');
      setLoading(false);
    }
  }, [apiKey, center, zoom, onMapClick]);

  // Crear marcadores
  const createMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Crear nuevos marcadores
    markers.forEach((markerData, index) => {
      const { lat, lng, title, icon, infoWindow } = markerData;
      
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: title || `Marcador ${index + 1}`,
        icon: icon || null,
        animation: google.maps.Animation.DROP
      });

      // Info window
      if (infoWindow) {
        const infoWindowInstance = new google.maps.InfoWindow({
          content: infoWindow
        });

        marker.addListener('click', () => {
          infoWindowInstance.open(mapInstanceRef.current, marker);
          if (onMarkerClick) {
            onMarkerClick(markerData, index);
          }
        });
      } else if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData, index);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers, mapLoaded, onMarkerClick]);

  // Crear marcador de usuario
  const createUserMarker = useCallback(() => {
    if (!mapInstanceRef.current || !mapLoaded || !userLocation || !showUserLocation) return;

    // Limpiar marcador de usuario existente
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      title: 'Tu ubicación',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      animation: google.maps.Animation.BOUNCE
    });

    userMarkerRef.current = userMarker;
  }, [userLocation, mapLoaded, showUserLocation]);

  // Centrar mapa en ubicación del usuario
  const centerOnUser = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(15);
    }
  }, [userLocation]);

  // Ajustar zoom para mostrar todos los marcadores
  const fitBounds = useCallback(() => {
    if (!mapInstanceRef.current || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    
    markers.forEach(marker => {
      bounds.extend(new google.maps.LatLng(marker.lat, marker.lng));
    });

    if (userLocation && showUserLocation) {
      bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
    }

    mapInstanceRef.current.fitBounds(bounds);
  }, [markers, userLocation, showUserLocation]);

  // Inicializar mapa al montar
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Actualizar marcadores cuando cambien
  useEffect(() => {
    if (mapLoaded) {
      createMarkers();
    }
  }, [createMarkers, mapLoaded]);

  // Actualizar marcador de usuario
  useEffect(() => {
    if (mapLoaded) {
      createUserMarker();
    }
  }, [createUserMarker, mapLoaded]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
    };
  }, []);

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height: `${height}px` }}
      >
        <LoadingSpinner size="lg" text="Cargando mapa..." />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg text-center p-8 ${className}`}
        style={{ height: `${height}px` }}
      >
        <MapPin className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Error cargando el mapa</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={initializeMap}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Mapa */}
      <div
        ref={mapRef}
        className="w-full rounded-lg shadow-lg"
        style={{ height: `${height}px` }}
      />
      
      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {userLocation && showUserLocation && (
          <button
            onClick={centerOnUser}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Centrar en mi ubicación"
          >
            <Navigation className="w-4 h-4 text-blue-500" />
          </button>
        )}
        
        <button
          onClick={fitBounds}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Ajustar vista"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={() => mapInstanceRef.current?.setZoom(mapInstanceRef.current.getZoom() + 1)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Acercar"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
        
        <button
          onClick={() => mapInstanceRef.current?.setZoom(mapInstanceRef.current.getZoom() - 1)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Alejar"
        >
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      {/* Información de marcadores */}
      {markers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
          <p className="text-sm text-gray-600">
            {markers.length} trabajador{markers.length !== 1 ? 'es' : ''} encontrado{markers.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
