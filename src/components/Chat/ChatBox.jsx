import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Users, Clock, Check, CheckCheck } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useSupabase';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Componente de chat en tiempo real
 * @param {Object} props - Propiedades del componente
 * @param {string} props.requestId - ID de la solicitud de trabajo
 * @param {string} props.receiverId - ID del usuario que recibe los mensajes
 * @param {string} props.receiverName - Nombre del usuario que recibe los mensajes
 * @param {boolean} props.isOpen - Si el chat está abierto
 * @param {Function} props.onClose - Función para cerrar el chat
 * @param {string} props.className - Clases CSS adicionales
 */
const ChatBox = ({ 
  requestId, 
  receiverId, 
  receiverName = 'Usuario',
  isOpen = false,
  onClose,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { user } = useAuth();
  const {
    messages,
    loading,
    error,
    sending,
    unreadCount,
    isTyping,
    sendMessage,
    markAsRead,
    handleTyping,
    clearError,
    canSendMessage
  } = useChat(requestId);

  // Scroll automático al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enfocar input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      markAsRead();
    }
  }, [isOpen, messages.length, markAsRead]);

  // Manejar envío de mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !canSendMessage || !receiverId) return;
    
    await sendMessage(message, receiverId);
    setMessage('');
    setShowEmojiPicker(false);
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    } else {
      handleTyping();
    }
  };

  // Manejar clic en emoji
  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Emojis comunes
  const commonEmojis = ['😊', '👍', '👎', '❤️', '😂', '😢', '😮', '😡', '🎉', '👏'];

  // Formatear fecha del mensaje
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Renderizar mensaje
  const renderMessage = (msg, index) => {
    const isOwn = msg.sender_id === user?.id;
    const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id;
    
    return (
      <div
        key={msg.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {showAvatar && !isOwn && (
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2">
              {msg.sender_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          
          {/* Mensaje */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            {showAvatar && !isOwn && (
              <span className="text-xs text-gray-500 mb-1">
                {msg.sender_name || 'Usuario'}
              </span>
            )}
            
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwn
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
            
            <div className={`flex items-center mt-1 text-xs text-gray-500 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <span>{formatMessageTime(msg.created_at)}</span>
              {isOwn && (
                <span className={`ml-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                  {msg.read ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Chat</h3>
              <p className="text-sm text-gray-500">con {receiverName}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner size="md" text="Cargando mensajes..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-red-500 mb-2">
                <MessageCircle className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={clearError}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-gray-400 mb-4">
                <MessageCircle className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600 mb-2">No hay mensajes aún</p>
              <p className="text-sm text-gray-500">Envía el primer mensaje para comenzar la conversación</p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input de mensaje */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {error && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            {/* Botón de emojis */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-lg">😊</span>
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="grid grid-cols-5 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="p-1 hover:bg-gray-100 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input de texto */}
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                maxLength={2000}
                disabled={!canSendMessage}
              />
            </div>

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={!message.trim() || !canSendMessage || sending}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          
          {/* Contador de caracteres */}
          <div className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/2000
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
