import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Star, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

/**
 * Componente para mostrar una notificación individual
 */
const NotificationItem = ({ 
  notification, 
  onClick = null,
  className = '',
  showTimestamp = true,
  showTypeIcon = true
}) => {
  // Función para obtener el ícono según el tipo
  const getTypeIcon = (type) => {
    const iconClass = "w-4 h-4";
    
    switch (type) {
      case 'rating':
        return <Star className={`${iconClass} text-yellow-500`} />;
      case 'payment':
        return <CreditCard className={`${iconClass} text-green-500`} />;
      case 'chat':
        return <MessageSquare className={`${iconClass} text-blue-500`} />;
      case 'system':
        return <Settings className={`${iconClass} text-gray-500`} />;
      case 'job_request':
        return <Briefcase className={`${iconClass} text-purple-500`} />;
      case 'job_accepted':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'job_completed':
        return <CheckCircle className={`${iconClass} text-blue-500`} />;
      case 'job_cancelled':
        return <XCircle className={`${iconClass} text-red-500`} />;
      default:
        return <AlertCircle className={`${iconClass} text-gray-500`} />;
    }
  };

  // Función para obtener el color de fondo según el estado
  const getBackgroundColor = (isRead) => {
    return isRead 
      ? 'bg-white' 
      : 'bg-blue-50 border-l-4 border-l-blue-500';
  };

  // Función para obtener el color del texto según el estado
  const getTextColor = (isRead) => {
    return isRead 
      ? 'text-gray-700' 
      : 'text-gray-900';
  };

  // Función para obtener el peso de la fuente según el estado
  const getFontWeight = (isRead) => {
    return isRead 
      ? 'font-normal' 
      : 'font-semibold';
  };

  // Función para formatear el timestamp
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: es 
      });
    } catch (error) {
      return 'Hace un momento';
    }
  };

  // Función para obtener información adicional del metadata
  const getMetadataInfo = (metadata, type) => {
    if (!metadata || typeof metadata !== 'object') return null;

    switch (type) {
      case 'rating':
        return metadata.score ? `⭐ ${metadata.score}/5` : null;
      case 'payment':
        return metadata.amount ? `$${metadata.amount}` : null;
      case 'job_request':
        return metadata.client_name ? `de ${metadata.client_name}` : null;
      default:
        return null;
    }
  };

  const metadataInfo = getMetadataInfo(notification.metadata, notification.type);

  return (
    <div 
      className={`
        p-4 transition-colors duration-200
        ${getBackgroundColor(notification.is_read)}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Ícono del tipo */}
        {showTypeIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon(notification.type)}
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Título */}
          <div className={`
            text-sm leading-5
            ${getTextColor(notification.is_read)}
            ${getFontWeight(notification.is_read)}
          `}>
            {notification.title}
          </div>

          {/* Mensaje */}
          <div className={`
            text-sm mt-1 leading-5
            ${notification.is_read ? 'text-gray-600' : 'text-gray-700'}
          `}>
            {notification.message}
          </div>

          {/* Información adicional del metadata */}
          {metadataInfo && (
            <div className="text-xs text-gray-500 mt-1">
              {metadataInfo}
            </div>
          )}

          {/* Timestamp */}
          {showTimestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {formatTime(notification.created_at)}
            </div>
          )}
        </div>

        {/* Indicador de no leída */}
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Componente compacto para notificaciones en listas
 */
export const NotificationItemCompact = ({ 
  notification, 
  onClick = null,
  className = ''
}) => {
  return (
    <NotificationItem
      notification={notification}
      onClick={onClick}
      className={`p-3 ${className}`}
      showTimestamp={false}
      showTypeIcon={false}
    />
  );
};

/**
 * Componente para notificaciones en cards
 */
export const NotificationCard = ({ 
  notification, 
  onClick = null,
  className = ''
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 p-4 shadow-sm
        hover:shadow-md transition-shadow duration-200 cursor-pointer
        ${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <NotificationItem
        notification={notification}
        showTimestamp={true}
        showTypeIcon={true}
        className="p-0"
      />
    </div>
  );
};

export default NotificationItem;

