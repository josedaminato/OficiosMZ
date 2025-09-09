"""
ChatService - Servicio de chat en tiempo real para Oficios MZ
Maneja mensajes entre clientes y trabajadores vinculados a solicitudes de trabajo
"""

import logging
import httpx
import os
from typing import List, Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Headers para requests a Supabase
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

class ChatService:
    """Servicio para manejo de mensajes de chat"""
    
    @staticmethod
    async def send_message(
        request_id: str,
        sender_id: str,
        receiver_id: str,
        content: str
    ) -> Optional[Dict[str, Any]]:
        """
        Enviar un mensaje de chat
        
        Args:
            request_id: ID de la solicitud de trabajo
            sender_id: ID del usuario que envía el mensaje
            receiver_id: ID del usuario que recibe el mensaje
            content: Contenido del mensaje
            
        Returns:
            Diccionario con el mensaje creado o None si hay error
        """
        try:
            # Validar contenido del mensaje
            if not content or len(content.strip()) == 0:
                logger.error("Contenido del mensaje vacío")
                return None
            
            if len(content) > 2000:
                logger.error("Mensaje demasiado largo")
                return None
            
            # Crear el mensaje
            message_data = {
                "request_id": request_id,
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "content": content.strip(),
                "read": False
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/messages",
                    headers=SUPABASE_HEADERS,
                    json=message_data
                )
                
                if response.status_code == 201:
                    message = response.json()
                    logger.info(f"Mensaje enviado: {message['id']} de {sender_id} a {receiver_id}")
                    return message
                else:
                    logger.error(f"Error enviando mensaje: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error inesperado enviando mensaje: {e}")
            return None

    @staticmethod
    async def get_messages_by_request(request_id: str) -> List[Dict[str, Any]]:
        """
        Obtener todos los mensajes de una solicitud
        
        Args:
            request_id: ID de la solicitud
            
        Returns:
            Lista de mensajes con información de usuarios
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/get_messages_by_request",
                    headers=SUPABASE_HEADERS,
                    json={"p_request_id": request_id}
                )
                
                if response.status_code == 200:
                    messages = response.json()
                    logger.info(f"Obtenidos {len(messages)} mensajes para solicitud {request_id}")
                    return messages
                else:
                    logger.error(f"Error obteniendo mensajes: {response.status_code} - {response.text}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error inesperado obteniendo mensajes: {e}")
            return []

    @staticmethod
    async def mark_messages_as_read(request_id: str, user_id: str) -> int:
        """
        Marcar mensajes como leídos
        
        Args:
            request_id: ID de la solicitud
            user_id: ID del usuario que marca como leído
            
        Returns:
            Número de mensajes marcados como leídos
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/mark_messages_as_read",
                    headers=SUPABASE_HEADERS,
                    json={
                        "p_request_id": request_id,
                        "p_user_id": user_id
                    }
                )
                
                if response.status_code == 200:
                    updated_count = response.json()
                    logger.info(f"Marcados {updated_count} mensajes como leídos para usuario {user_id}")
                    return updated_count
                else:
                    logger.error(f"Error marcando mensajes como leídos: {response.status_code} - {response.text}")
                    return 0
                    
        except Exception as e:
            logger.error(f"Error inesperado marcando mensajes como leídos: {e}")
            return 0

    @staticmethod
    async def get_chat_stats(user_id: str) -> Dict[str, Any]:
        """
        Obtener estadísticas de chat para un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con estadísticas de chat
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/get_chat_stats",
                    headers=SUPABASE_HEADERS,
                    json={"p_user_id": user_id}
                )
                
                if response.status_code == 200:
                    stats = response.json()
                    logger.info(f"Estadísticas de chat obtenidas para usuario {user_id}")
                    return stats
                else:
                    logger.error(f"Error obteniendo estadísticas: {response.status_code} - {response.text}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error inesperado obteniendo estadísticas: {e}")
            return {}

    @staticmethod
    async def get_unread_count(user_id: str) -> int:
        """
        Obtener número de mensajes no leídos para un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Número de mensajes no leídos
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/messages?receiver_id=eq.{user_id}&read=eq.false&select=count",
                    headers=SUPABASE_HEADERS
                )
                
                if response.status_code == 200:
                    # Supabase devuelve el count en el header Content-Range
                    content_range = response.headers.get('Content-Range', '0-0/0')
                    count = int(content_range.split('/')[-1])
                    logger.info(f"Usuario {user_id} tiene {count} mensajes no leídos")
                    return count
                else:
                    logger.error(f"Error obteniendo mensajes no leídos: {response.status_code} - {response.text}")
                    return 0
                    
        except Exception as e:
            logger.error(f"Error inesperado obteniendo mensajes no leídos: {e}")
            return 0

    @staticmethod
    async def validate_chat_access(request_id: str, user_id: str) -> bool:
        """
        Validar que un usuario puede acceder al chat de una solicitud
        
        Args:
            request_id: ID de la solicitud
            user_id: ID del usuario
            
        Returns:
            True si el usuario puede acceder, False en caso contrario
        """
        try:
            async with httpx.AsyncClient() as client:
                # Obtener información de la solicitud
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/requests?id=eq.{request_id}&select=client_id,worker_id",
                    headers=SUPABASE_HEADERS
                )
                
                if response.status_code == 200:
                    requests = response.json()
                    if not requests:
                        logger.warning(f"Solicitud {request_id} no encontrada")
                        return False
                    
                    request_data = requests[0]
                    client_id = request_data.get('client_id')
                    worker_id = request_data.get('worker_id')
                    
                    # Verificar que el usuario es el cliente o trabajador de la solicitud
                    if user_id == client_id or user_id == worker_id:
                        logger.info(f"Usuario {user_id} tiene acceso al chat de solicitud {request_id}")
                        return True
                    else:
                        logger.warning(f"Usuario {user_id} no tiene acceso al chat de solicitud {request_id}")
                        return False
                else:
                    logger.error(f"Error validando acceso al chat: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error inesperado validando acceso al chat: {e}")
            return False

# Instancia global del servicio
chat_service = ChatService()
