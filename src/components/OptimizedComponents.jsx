import React, { memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';

/**
 * Componente WorkerCard optimizado con React.memo
 * Evita re-renders innecesarios cuando las props no cambian
 */
export const OptimizedWorkerCard = memo(({ 
  worker, 
  onContact, 
  onViewProfile,
  showDistance = false,
  distance = null 
}) => {
  // Memoizar formateo de datos costosos
  const formattedData = useMemo(() => ({
    rating: worker.rating?.toFixed(1) || '0.0',
    reviewCount: worker.reviews || 0,
    experience: worker.experience || 'Sin experiencia',
    distance: distance ? `${distance.toFixed(1)} km` : null
  }), [worker.rating, worker.reviews, worker.experience, distance]);

  // Memoizar callbacks para evitar recreaciones
  const handleContact = useCallback(() => {
    onContact?.(worker);
  }, [onContact, worker]);

  const handleViewProfile = useCallback(() => {
    onViewProfile?.(worker);
  }, [onViewProfile, worker]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-3">
        <img
          src={worker.avatar_url}
          alt={worker.name}
          className="w-12 h-12 rounded-full object-cover"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {worker.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {worker.specialty || worker.oficio}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-yellow-500">⭐ {formattedData.rating}</span>
            <span className="text-gray-500">({formattedData.reviewCount})</span>
            {showDistance && formattedData.distance && (
              <span className="text-blue-600">📍 {formattedData.distance}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formattedData.experience}
          </p>
        </div>
      </div>
      <div className="flex space-x-2 mt-3">
        <button
          onClick={handleViewProfile}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          Ver Perfil
        </button>
        <button
          onClick={handleContact}
          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
        >
          Contactar
        </button>
      </div>
    </div>
  );
});

OptimizedWorkerCard.displayName = 'OptimizedWorkerCard';

/**
 * Componente PaymentCard optimizado
 */
export const OptimizedPaymentCard = memo(({ 
  payment, 
  onAction,
  userRole = 'cliente'
}) => {
  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(payment.amount);
  }, [payment.amount]);

  const formattedDate = useMemo(() => {
    return format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm');
  }, [payment.created_at]);

  const handleAction = useCallback((action) => {
    onAction?.(payment, action);
  }, [onAction, payment]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {payment.job_title || 'Trabajo sin título'}
        </h3>
        <span className="text-lg font-bold text-green-600">
          {formattedAmount}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <p>ID: {payment.id}</p>
        <p>Fecha: {formattedDate}</p>
        {payment.employer_name && (
          <p>Empleador: {payment.employer_name}</p>
        )}
        {payment.worker_name && (
          <p>Trabajador: {payment.worker_name}</p>
        )}
      </div>

      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => handleAction('view')}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          Ver Detalles
        </button>
        
        {userRole === 'cliente' && payment.status === 'held' && (
          <button
            onClick={() => handleAction('release')}
            className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
          >
            Liberar Pago
          </button>
        )}
      </div>
    </div>
  );
});

OptimizedPaymentCard.displayName = 'OptimizedPaymentCard';

/**
 * Componente RatingItem optimizado
 */
export const OptimizedRatingItem = memo(({ 
  rating, 
  showUser = true,
  showJob = false 
}) => {
  const formattedDate = useMemo(() => {
    return format(new Date(rating.created_at), 'dd/MM/yyyy');
  }, [rating.created_at]);

  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating.score ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  }, [rating.score]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {stars}
          <span className="text-sm text-gray-600">
            {rating.score}/5
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {formattedDate}
        </span>
      </div>
      
      {rating.comment && (
        <p className="text-gray-700 text-sm mb-2">
          {rating.comment}
        </p>
      )}
      
      <div className="text-xs text-gray-500">
        {showUser && rating.rater_name && (
          <span>Por: {rating.rater_name}</span>
        )}
        {showJob && rating.job_title && (
          <span className="ml-2">Trabajo: {rating.job_title}</span>
        )}
      </div>
    </div>
  );
});

OptimizedRatingItem.displayName = 'OptimizedRatingItem';

/**
 * Componente NotificationItem optimizado
 */
export const OptimizedNotificationItem = memo(({ 
  notification, 
  onMarkAsRead,
  onDelete 
}) => {
  const formattedDate = useMemo(() => {
    return format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm');
  }, [notification.created_at]);

  const handleMarkAsRead = useCallback(() => {
    onMarkAsRead?.(notification.id);
  }, [onMarkAsRead, notification.id]);

  const handleDelete = useCallback(() => {
    onDelete?.(notification.id);
  }, [onDelete, notification.id]);

  return (
    <div className={`p-4 border-l-4 ${
      notification.read 
        ? 'border-gray-300 bg-gray-50' 
        : 'border-blue-500 bg-white'
    } hover:bg-gray-50 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formattedDate}
          </p>
        </div>
        
        <div className="flex space-x-2 ml-4">
          {!notification.read && (
            <button
              onClick={handleMarkAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Marcar como leída
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
});

OptimizedNotificationItem.displayName = 'OptimizedNotificationItem';

/**
 * Hook para debounce optimizado
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para infinite scroll optimizado
 */
export const useInfiniteScroll = (callback, hasMore, loading) => {
  const observerRef = React.useRef();

  const lastElementRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, callback]);

  return lastElementRef;
};
