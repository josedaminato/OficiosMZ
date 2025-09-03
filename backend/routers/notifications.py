"""
Módulo de Notificaciones - Oficios MZ
Endpoints para gestionar notificaciones del sistema en tiempo real.
"""

import logging
import httpx
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, Field, validator
from datetime import datetime
import os

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
router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# Modelos Pydantic
class NotificationCreate(BaseModel):
    user_id: str = Field(..., description="ID del usuario destinatario")
    title: str = Field(..., min_length=1, max_length=200, description="Título de la notificación")
    message: str = Field(..., min_length=1, max_length=1000, description="Mensaje de la notificación")
    type: str = Field(..., description="Tipo de notificación")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Datos adicionales")

    @validator('type')
    def validate_type(cls, v):
        valid_types = ['rating', 'payment', 'system', 'chat', 'job_request', 'job_accepted', 'job_completed', 'job_cancelled']
        if v not in valid_types:
            raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
        return v

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class NotificationUpdate(BaseModel):
    is_read: bool = Field(..., description="Estado de lectura de la notificación")

class NotificationStats(BaseModel):
    total_notifications: int
    unread_notifications: int
    last_notification_date: Optional[datetime]

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    limit: int

# Dependencia para obtener el usuario actual
async def get_current_user(authorization: str = Header(...)):
    """Obtener usuario actual desde JWT token"""
    try:
        # En un entorno real, aquí se decodificaría y validaría el JWT
        # Por ahora, simulamos un usuario autenticado
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        token = authorization.split(" ")[1]
        # TODO: Validar token JWT real con Supabase
        return {"id": "123e4567-e89b-12d3-a456-426614174000", "role": "user"}
        
    except Exception as e:
        logger.error(f"Error validating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# Endpoints
@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification: NotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear una nueva notificación
    """
    try:
        logger.info(f"Creating notification for user {notification.user_id}")
        
        # Validar que el usuario existe
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users?id=eq.{notification.user_id}&select=id",
                headers=SUPABASE_HEADERS
            )
            
            if user_response.status_code != 200 or not user_response.json():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
        
        # Crear notificación usando la función de Supabase
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/create_notification",
                headers=SUPABASE_HEADERS,
                json={
                    "p_user_id": notification.user_id,
                    "p_title": notification.title,
                    "p_message": notification.message,
                    "p_type": notification.type,
                    "p_metadata": notification.metadata
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error creating notification: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create notification"
                )
            
            notification_id = response.json()
        
        # Obtener la notificación creada
        async with httpx.AsyncClient() as client:
            get_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/notifications?id=eq.{notification_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if get_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve created notification"
                )
            
            notifications = get_response.json()
            if not notifications:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Created notification not found"
                )
            
            return NotificationResponse(**notifications[0])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/user/{user_id}", response_model=NotificationListResponse)
async def get_user_notifications(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener notificaciones de un usuario
    """
    try:
        # Validar que el usuario solo puede ver sus propias notificaciones
        if current_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own notifications"
            )
        
        # Construir query
        query_params = {
            "user_id": f"eq.{user_id}",
            "order": "created_at.desc",
            "limit": str(limit),
            "offset": str((page - 1) * limit)
        }
        
        if unread_only:
            query_params["is_read"] = "eq.false"
        
        # Construir URL
        query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
        url = f"{SUPABASE_URL}/rest/v1/notifications?{query_string}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=SUPABASE_HEADERS)
            
            if response.status_code != 200:
                logger.error(f"Error fetching notifications: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to fetch notifications"
                )
            
            notifications = response.json()
        
        # Obtener estadísticas
        async with httpx.AsyncClient() as client:
            stats_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/rpc/get_user_notification_stats",
                headers=SUPABASE_HEADERS,
                json={"user_uuid": user_id}
            )
            
            if stats_response.status_code == 200:
                stats = stats_response.json()
                unread_count = stats[0]["unread_notifications"] if stats else 0
            else:
                unread_count = 0
        
        # Convertir a modelos Pydantic
        notification_responses = [NotificationResponse(**n) for n in notifications]
        
        return NotificationListResponse(
            notifications=notification_responses,
            total=len(notification_responses),
            unread_count=unread_count,
            page=page,
            limit=limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.patch("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marcar una notificación como leída
    """
    try:
        # Verificar que la notificación pertenece al usuario
        async with httpx.AsyncClient() as client:
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/notifications?id=eq.{notification_id}&user_id=eq.{current_user['id']}&select=id",
                headers=SUPABASE_HEADERS
            )
            
            if check_response.status_code != 200 or not check_response.json():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found or access denied"
                )
        
        # Marcar como leída usando la función de Supabase
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/mark_notification_read",
                headers=SUPABASE_HEADERS,
                json={
                    "notification_uuid": notification_id,
                    "user_uuid": current_user["id"]
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error marking notification as read: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to mark notification as read"
                )
            
            success = response.json()
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notification not found or already read"
                )
            
            return {"success": True, "message": "Notification marked as read"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.patch("/user/{user_id}/read-all", response_model=dict)
async def mark_all_notifications_read(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marcar todas las notificaciones de un usuario como leídas
    """
    try:
        # Validar que el usuario solo puede marcar sus propias notificaciones
        if current_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only mark your own notifications as read"
            )
        
        # Marcar todas como leídas usando la función de Supabase
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/mark_all_notifications_read",
                headers=SUPABASE_HEADERS,
                json={"user_uuid": user_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Error marking all notifications as read: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to mark notifications as read"
                )
            
            updated_count = response.json()
            
            return {
                "success": True, 
                "message": f"Marked {updated_count} notifications as read",
                "updated_count": updated_count
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/user/{user_id}/stats", response_model=NotificationStats)
async def get_notification_stats(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estadísticas de notificaciones de un usuario
    """
    try:
        # Validar que el usuario solo puede ver sus propias estadísticas
        if current_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own notification stats"
            )
        
        # Obtener estadísticas usando la función de Supabase
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/rpc/get_user_notification_stats",
                headers=SUPABASE_HEADERS,
                json={"user_uuid": user_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Error fetching notification stats: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to fetch notification stats"
                )
            
            stats = response.json()
            if not stats:
                return NotificationStats(
                    total_notifications=0,
                    unread_notifications=0,
                    last_notification_date=None
                )
            
            stat = stats[0]
            return NotificationStats(
                total_notifications=stat["total_notifications"],
                unread_notifications=stat["unread_notifications"],
                last_notification_date=stat["last_notification_date"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching notification stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/health")
async def health_check():
    """
    Health check para el módulo de notificaciones
    """
    return {
        "status": "healthy",
        "module": "notifications",
        "timestamp": datetime.now().isoformat()
    }

