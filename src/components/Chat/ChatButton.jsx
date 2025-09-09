import React, { useState, useEffect } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useSupabase';

/**
 * Botón de chat que muestra el estado de la conversación
 * @param {Object} props - Propiedades del componente
 * @param {string} props.requestId - ID de la solicitud de trabajo
 * @param {string} props.receiverId - ID del usuario que recibe los mensajes
 * @param {string} props.receiverName - Nombre del usuario que recibe los mensajes
 * @param {Function} props.onOpenChat - Función para abrir el chat
 * @param {string} props.className - Clases CSS adicionales
 */
const ChatButton = ({ 
  requestId, 
  receiverId, 
  receiverName = 'Usuario',
  onOpenChat,
  className = ''
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  
  const { user } = useAuth();
  const { getUnreadCount } = useChat(requestId);

  // Obtener mensajes no leídos
  useEffect(() => {
    if (requestId && user) {
      const fetchUnreadCount = async () => {
        try {
          const count = await getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('Error obteniendo mensajes no leídos:', error);
        }
      };

      fetchUnreadCount();
      
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [requestId, user, getUnreadCount]);

  // Simular estado online (en una implementación real, esto vendría del backend)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.3); // 70% probabilidad de estar online
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (onOpenChat) {
      onOpenChat();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg
        text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-all duration-200 transform hover:scale-105 active:scale-95
        ${className}
      `}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      <span>Chat con {receiverName}</span>
      
      {/* Indicador de mensajes no leídos */}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {/* Indicador de estado online */}
      {isOnline && (
        <span className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full h-3 w-3"></span>
      )}
    </button>
  );
};

export default ChatButton;
