import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useApi } from './useApi';
import { useAuth } from './useSupabase';

/**
 * Hook personalizado para manejar chat en tiempo real
 * @param {string} requestId - ID de la solicitud de trabajo
 * @returns {Object} - Objeto con estado y funciones del chat
 */
export const useChat = (requestId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  const { user } = useAuth();
  const { execute: executeApi } = useApi('/api/chat/');
  const subscriptionRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Cargar mensajes iniciales
  const loadMessages = useCallback(async () => {
    if (!requestId || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await executeApi(
        {},
        { 
          method: 'GET',
          endpoint: `/api/chat/messages/${requestId}`
        }
      );
      
      setMessages(data || []);
      
      // Marcar mensajes como leídos
      if (data && data.length > 0) {
        await markAsRead();
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
      setError('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [requestId, user, executeApi]);

  // Enviar mensaje
  const sendMessage = useCallback(async (content, receiverId) => {
    if (!requestId || !user || !content.trim() || !receiverId) return;
    
    setSending(true);
    setError(null);
    
    try {
      const messageData = {
        request_id: requestId,
        receiver_id: receiverId,
        content: content.trim()
      };
      
      const newMessage = await executeApi(
        messageData,
        { method: 'POST', endpoint: '/api/chat/messages' }
      );
      
      if (newMessage) {
        // El mensaje se agregará automáticamente via suscripción en tiempo real
        console.log('Mensaje enviado:', newMessage);
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setError('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  }, [requestId, user, executeApi]);

  // Marcar mensajes como leídos
  const markAsRead = useCallback(async () => {
    if (!requestId || !user) return;
    
    try {
      await executeApi(
        {},
        { 
          method: 'PATCH',
          endpoint: `/api/chat/messages/${requestId}/read`
        }
      );
      
      // Actualizar estado local
      setMessages(prev => 
        prev.map(msg => 
          msg.receiver_id === user.id ? { ...msg, read: true } : msg
        )
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marcando mensajes como leídos:', err);
    }
  }, [requestId, user, executeApi]);

  // Obtener estadísticas de chat
  const getChatStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const stats = await executeApi(
        {},
        { method: 'GET', endpoint: '/api/chat/stats' }
      );
      
      return stats;
    } catch (err) {
      console.error('Error obteniendo estadísticas de chat:', err);
      return null;
    }
  }, [user, executeApi]);

  // Obtener número de mensajes no leídos
  const getUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await executeApi(
        {},
        { method: 'GET', endpoint: '/api/chat/unread-count' }
      );
      
      setUnreadCount(data?.unread_count || 0);
      return data?.unread_count || 0;
    } catch (err) {
      console.error('Error obteniendo mensajes no leídos:', err);
      return 0;
    }
  }, [user, executeApi]);

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!requestId || !user) return;

    // Cargar mensajes iniciales
    loadMessages();

    // Configurar suscripción a cambios en mensajes
    const setupSubscription = async () => {
      try {
        // Cancelar suscripción anterior si existe
        if (subscriptionRef.current) {
          await subscriptionRef.current.unsubscribe();
        }

        // Crear nueva suscripción
        const subscription = supabase
          .channel(`messages:request_id=eq.${requestId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `request_id=eq.${requestId}`
            },
            async (payload) => {
              console.log('Cambio en mensajes:', payload);
              
              if (payload.eventType === 'INSERT') {
                const newMessage = payload.new;
                
                // Obtener información del usuario que envió el mensaje
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', newMessage.sender_id)
                    .single();
                  
                  const messageWithUser = {
                    ...newMessage,
                    sender_name: profile?.full_name || 'Usuario',
                    receiver_name: user.id === newMessage.receiver_id ? 'Tú' : 'Usuario'
                  };
                  
                  setMessages(prev => [...prev, messageWithUser]);
                  
                  // Si es un mensaje para el usuario actual, marcar como leído
                  if (newMessage.receiver_id === user.id) {
                    setTimeout(() => markAsRead(), 1000);
                  }
                } catch (err) {
                  console.error('Error obteniendo perfil del usuario:', err);
                  setMessages(prev => [...prev, newMessage]);
                }
              } else if (payload.eventType === 'UPDATE') {
                // Actualizar mensaje existente (ej: marcar como leído)
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === payload.new.id ? payload.new : msg
                  )
                );
              }
            }
          )
          .subscribe();

        subscriptionRef.current = subscription;
      } catch (err) {
        console.error('Error configurando suscripción:', err);
        setError('Error conectando al chat en tiempo real');
      }
    };

    setupSubscription();

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [requestId, user, loadMessages, markAsRead]);

  // Obtener mensajes no leídos al montar
  useEffect(() => {
    if (user) {
      getUnreadCount();
    }
  }, [user, getUnreadCount]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Función para simular "escribiendo..."
  const handleTyping = useCallback(() => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, []);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para refrescar mensajes
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    // Estado
    messages,
    loading,
    error,
    sending,
    unreadCount,
    isTyping,
    
    // Funciones
    sendMessage,
    markAsRead,
    getChatStats,
    getUnreadCount,
    handleTyping,
    clearError,
    refreshMessages,
    
    // Utilidades
    isConnected: !!subscriptionRef.current,
    canSendMessage: !sending && !!user
  };
};

export default useChat;
