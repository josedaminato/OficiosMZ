"""
Módulo de Chat - Oficios MZ
Endpoints para gestión de mensajes de chat en tiempo real entre clientes y trabajadores.
"""

import logging
import httpx
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from pydantic import BaseModel, Field, validator
from datetime import datetime
import os

# Importar AuthService centralizado
from services.auth_service import AuthService
from services.chat_service import chat_service

# Configurar logging
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

# Crear router
router = APIRouter(prefix="/api/chat", tags=["chat"])

# =====================================================
# MODELOS PYDANTIC
# =====================================================

class MessageCreate(BaseModel):
    """Modelo para crear un nuevo mensaje"""
    request_id: str = Field(..., description="ID de la solicitud de trabajo")
    receiver_id: str = Field(..., description="ID del usuario que recibe el mensaje")
    content: str = Field(..., min_length=1, max_length=2000, description="Contenido del mensaje")
    
    @validator('content')
    def validate_content(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El contenido del mensaje no puede estar vacío')
        return v.strip()

class MessageResponse(BaseModel):
    """Modelo de respuesta para un mensaje"""
    id: str
    request_id: str
    sender_id: str
    receiver_id: str
    content: str
    read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

class ChatStatsResponse(BaseModel):
    """Modelo de respuesta para estadísticas de chat"""
    total_messages_sent: int
    total_messages_received: int
    unread_messages: int
    active_conversations: int
    last_message_date: Optional[datetime] = None

# =====================================================
# FUNCIONES DE DEPENDENCIA
# =====================================================

async def get_current_user(authorization: str = Header(...)) -> dict:
    """Obtener usuario actual desde JWT token"""
    try:
        return await AuthService.get_current_user(authorization)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Enviar un mensaje de chat
    """
    try:
        sender_id = current_user["user_id"]
        
        # Validar acceso al chat de la solicitud
        has_access = await chat_service.validate_chat_access(
            message_data.request_id, 
            sender_id
        )
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso al chat de esta solicitud"
            )
        
        # Enviar el mensaje
        message = await chat_service.send_message(
            request_id=message_data.request_id,
            sender_id=sender_id,
            receiver_id=message_data.receiver_id,
            content=message_data.content
        )
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al enviar el mensaje"
            )
        
        # Crear notificación automática
        try:
            from services.notification_service import notification_service
            
            # Obtener información del trabajo
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/requests?id=eq.{message_data.request_id}&select=title",
                    headers=SUPABASE_HEADERS
                )
                
                if response.status_code == 200:
                    requests = response.json()
                    job_title = requests[0].get('title', 'Trabajo') if requests else 'Trabajo'
                else:
                    job_title = 'Trabajo'
            
            # Obtener nombre del remitente
            sender_name = current_user.get('email', 'Usuario')
            
            await notification_service.notify_chat_message(
                user_id=message_data.receiver_id,
                sender_name=sender_name,
                message_preview=message_data.content[:50],
                chat_id=message_data.request_id
            )
            
        except Exception as e:
            # No fallar el envío del mensaje si falla la notificación
            logger.error(f"Error enviando notificación de chat: {e}")
        
        logger.info(f"Mensaje enviado por {sender_id} en solicitud {message_data.request_id}")
        return MessageResponse(**message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado enviando mensaje: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/messages/{request_id}", response_model=List[MessageResponse])
async def get_messages(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener todos los mensajes de una solicitud
    """
    try:
        user_id = current_user["user_id"]
        
        # Validar acceso al chat de la solicitud
        has_access = await chat_service.validate_chat_access(request_id, user_id)
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso al chat de esta solicitud"
            )
        
        # Obtener mensajes
        messages = await chat_service.get_messages_by_request(request_id)
        
        logger.info(f"Obtenidos {len(messages)} mensajes para solicitud {request_id}")
        return [MessageResponse(**msg) for msg in messages]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado obteniendo mensajes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.patch("/messages/{request_id}/read")
async def mark_messages_as_read(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marcar mensajes como leídos
    """
    try:
        user_id = current_user["user_id"]
        
        # Validar acceso al chat de la solicitud
        has_access = await chat_service.validate_chat_access(request_id, user_id)
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso al chat de esta solicitud"
            )
        
        # Marcar mensajes como leídos
        updated_count = await chat_service.mark_messages_as_read(request_id, user_id)
        
        logger.info(f"Marcados {updated_count} mensajes como leídos para usuario {user_id}")
        return {"updated_count": updated_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado marcando mensajes como leídos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/stats", response_model=ChatStatsResponse)
async def get_chat_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estadísticas de chat del usuario
    """
    try:
        user_id = current_user["user_id"]
        
        stats = await chat_service.get_chat_stats(user_id)
        
        logger.info(f"Estadísticas de chat obtenidas para usuario {user_id}")
        return ChatStatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Error inesperado obteniendo estadísticas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener número de mensajes no leídos
    """
    try:
        user_id = current_user["user_id"]
        
        unread_count = await chat_service.get_unread_count(user_id)
        
        logger.info(f"Usuario {user_id} tiene {unread_count} mensajes no leídos")
        return {"unread_count": unread_count}
        
    except Exception as e:
        logger.error(f"Error inesperado obteniendo mensajes no leídos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/health")
async def health_check():
    """
    Health check del módulo de chat
    """
    logger.info("Health check del módulo de chat solicitado")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Chat Service"
    }
