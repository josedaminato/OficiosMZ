"""
Router para manejar notificaciones push en la PWA
Incluye suscripciones, envío de notificaciones y configuración
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import logging
from datetime import datetime, timedelta
import httpx
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import load_pem_public_key
import os
from urllib.parse import urlparse

from services.auth_service import AuthService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/push", tags=["push-notifications"])

# Configuración VAPID
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "oficios-mz@example.com")

if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
    logger.warning("VAPID keys no configuradas. Las notificaciones push no funcionarán.")

# Modelos Pydantic
class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]
    userAgent: Optional[str] = None
    timestamp: Optional[str] = None

class PushMessage(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    badge: Optional[str] = None
    image: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    actions: Optional[List[Dict[str, str]]] = None
    tag: Optional[str] = None
    requireInteraction: Optional[bool] = False
    silent: Optional[bool] = False
    vibrate: Optional[List[int]] = None

class NotificationPreferences(BaseModel):
    jobRequests: bool = True
    jobUpdates: bool = True
    payments: bool = True
    ratings: bool = True
    chat: bool = True
    system: bool = True
    marketing: bool = False

class PushStats(BaseModel):
    totalSubscriptions: int
    activeSubscriptions: int
    notificationsSent: int
    notificationsDelivered: int
    lastNotificationSent: Optional[datetime]

# Almacenamiento temporal de suscripciones (en producción usar Redis o DB)
push_subscriptions: Dict[str, PushSubscription] = {}
notification_preferences: Dict[str, NotificationPreferences] = {}
push_stats = {
    "totalSubscriptions": 0,
    "activeSubscriptions": 0,
    "notificationsSent": 0,
    "notificationsDelivered": 0,
    "lastNotificationSent": None
}

@router.post("/subscribe")
async def subscribe_to_push(
    subscription_data: PushSubscription,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Suscribir usuario a notificaciones push
    """
    try:
        user_id = current_user["sub"]
        
        # Validar suscripción
        if not subscription_data.endpoint or not subscription_data.keys:
            raise HTTPException(status_code=400, detail="Datos de suscripción inválidos")
        
        # Almacenar suscripción
        push_subscriptions[user_id] = subscription_data
        push_stats["activeSubscriptions"] = len(push_subscriptions)
        push_stats["totalSubscriptions"] += 1
        
        # Log de suscripción
        logger.info(f"Usuario {user_id} suscrito a push notifications")
        
        # Enviar notificación de bienvenida
        background_tasks.add_task(
            send_push_notification,
            user_id,
            PushMessage(
                title="¡Notificaciones activadas!",
                body="Ahora recibirás notificaciones importantes de Oficios MZ",
                icon="/icons/icon-192x192.png",
                badge="/icons/badge-72x72.png",
                tag="welcome",
                data={"type": "welcome", "userId": user_id}
            )
        )
        
        return {
            "success": True,
            "message": "Suscripción exitosa",
            "subscriptionId": user_id
        }
        
    except Exception as e:
        logger.error(f"Error suscribiendo usuario a push: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/unsubscribe")
async def unsubscribe_from_push(
    endpoint_data: Dict[str, str],
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Desuscribir usuario de notificaciones push
    """
    try:
        user_id = current_user["sub"]
        endpoint = endpoint_data.get("endpoint")
        
        if not endpoint:
            raise HTTPException(status_code=400, detail="Endpoint requerido")
        
        # Remover suscripción
        if user_id in push_subscriptions:
            del push_subscriptions[user_id]
            push_stats["activeSubscriptions"] = len(push_subscriptions)
            
            logger.info(f"Usuario {user_id} desuscrito de push notifications")
            
            return {
                "success": True,
                "message": "Desuscripción exitosa"
            }
        else:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada")
            
    except Exception as e:
        logger.error(f"Error desuscribiendo usuario de push: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Actualizar preferencias de notificación del usuario
    """
    try:
        user_id = current_user["sub"]
        
        # Almacenar preferencias
        notification_preferences[user_id] = preferences
        
        logger.info(f"Preferencias de notificación actualizadas para usuario {user_id}")
        
        return {
            "success": True,
            "message": "Preferencias actualizadas",
            "preferences": preferences
        }
        
    except Exception as e:
        logger.error(f"Error actualizando preferencias: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/preferences")
async def get_notification_preferences(
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener preferencias de notificación del usuario
    """
    try:
        user_id = current_user["sub"]
        
        preferences = notification_preferences.get(user_id, NotificationPreferences())
        
        return {
            "success": True,
            "preferences": preferences
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo preferencias: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/stats")
async def get_push_stats(
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener estadísticas de notificaciones push
    """
    try:
        # Solo administradores pueden ver estadísticas globales
        if not current_user.get("role") == "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        return {
            "success": True,
            "stats": push_stats
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/send")
async def send_push_notification(
    user_id: str,
    message: PushMessage,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Enviar notificación push a un usuario específico
    """
    try:
        # Verificar permisos (solo el propio usuario o admin)
        if current_user["sub"] != user_id and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        # Enviar notificación en background
        background_tasks.add_task(
            send_push_notification,
            user_id,
            message
        )
        
        return {
            "success": True,
            "message": "Notificación enviada"
        }
        
    except Exception as e:
        logger.error(f"Error enviando notificación push: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/send-bulk")
async def send_bulk_push_notification(
    user_ids: List[str],
    message: PushMessage,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Enviar notificación push a múltiples usuarios
    """
    try:
        # Solo administradores pueden enviar notificaciones masivas
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        # Enviar notificaciones en background
        for user_id in user_ids:
            background_tasks.add_task(
                send_push_notification,
                user_id,
                message
            )
        
        return {
            "success": True,
            "message": f"Notificaciones enviadas a {len(user_ids)} usuarios"
        }
        
    except Exception as e:
        logger.error(f"Error enviando notificaciones masivas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# Funciones auxiliares
async def send_push_notification(user_id: str, message: PushMessage):
    """
    Enviar notificación push a un usuario específico
    """
    try:
        # Verificar si el usuario está suscrito
        if user_id not in push_subscriptions:
            logger.warning(f"Usuario {user_id} no está suscrito a push notifications")
            return False
        
        subscription = push_subscriptions[user_id]
        
        # Verificar preferencias del usuario
        preferences = notification_preferences.get(user_id, NotificationPreferences())
        
        # Verificar si el tipo de notificación está permitido
        notification_type = message.data.get("type", "system") if message.data else "system"
        
        if not should_send_notification(notification_type, preferences):
            logger.info(f"Notificación de tipo {notification_type} bloqueada por preferencias del usuario {user_id}")
            return False
        
        # Preparar payload de la notificación
        payload = {
            "title": message.title,
            "body": message.body,
            "icon": message.icon or "/icons/icon-192x192.png",
            "badge": message.badge or "/icons/badge-72x72.png",
            "image": message.image,
            "data": message.data or {},
            "actions": message.actions or [],
            "tag": message.tag or "oficios-mz-notification",
            "requireInteraction": message.requireInteraction or False,
            "silent": message.silent or False,
            "vibrate": message.vibrate or [200, 100, 200],
            "timestamp": datetime.now().isoformat()
        }
        
        # Enviar notificación usando Web Push Protocol
        success = await send_web_push_notification(subscription, payload)
        
        if success:
            push_stats["notificationsSent"] += 1
            push_stats["lastNotificationSent"] = datetime.now()
            logger.info(f"Notificación push enviada exitosamente a usuario {user_id}")
        else:
            logger.error(f"Error enviando notificación push a usuario {user_id}")
        
        return success
        
    except Exception as e:
        logger.error(f"Error enviando notificación push: {str(e)}")
        return False

def should_send_notification(notification_type: str, preferences: NotificationPreferences) -> bool:
    """
    Verificar si se debe enviar la notificación según las preferencias del usuario
    """
    type_mapping = {
        "job_request": preferences.jobRequests,
        "job_update": preferences.jobUpdates,
        "payment": preferences.payments,
        "rating": preferences.ratings,
        "chat": preferences.chat,
        "system": preferences.system,
        "marketing": preferences.marketing
    }
    
    return type_mapping.get(notification_type, preferences.system)

async def send_web_push_notification(subscription: PushSubscription, payload: Dict[str, Any]) -> bool:
    """
    Enviar notificación usando Web Push Protocol
    """
    try:
        if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
            logger.error("VAPID keys no configuradas")
            return False
        
        # Preparar headers JWT
        jwt_header = {
            "typ": "JWT",
            "alg": "ES256"
        }
        
        jwt_payload = {
            "aud": urlparse(subscription.endpoint).netloc,
            "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
            "sub": VAPID_EMAIL
        }
        
        # Generar JWT (simplificado - en producción usar biblioteca JWT)
        jwt_token = generate_jwt_token(jwt_header, jwt_payload)
        
        # Preparar headers de la petición
        headers = {
            "Authorization": f"vapid t={jwt_token}, k={VAPID_PUBLIC_KEY}",
            "Content-Type": "application/json",
            "TTL": "86400"  # 24 horas
        }
        
        # Enviar petición
        async with httpx.AsyncClient() as client:
            response = await client.post(
                subscription.endpoint,
                headers=headers,
                json=payload,
                timeout=10.0
            )
            
            if response.status_code == 201:
                push_stats["notificationsDelivered"] += 1
                return True
            else:
                logger.error(f"Error enviando push notification: {response.status_code} - {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Error en send_web_push_notification: {str(e)}")
        return False

def generate_jwt_token(header: Dict[str, str], payload: Dict[str, Any]) -> str:
    """
    Generar JWT token para VAPID (simplificado)
    En producción usar una biblioteca JWT adecuada
    """
    try:
        # Codificar header y payload
        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        
        # Crear mensaje para firmar
        message = f"{header_b64}.{payload_b64}"
        
        # Firmar con clave privada VAPID
        private_key = load_pem_private_key(VAPID_PRIVATE_KEY.encode(), password=None)
        signature = private_key.sign(message.encode(), ec.ECDSA(hashes.SHA256()))
        
        # Codificar firma
        signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        return f"{message}.{signature_b64}"
        
    except Exception as e:
        logger.error(f"Error generando JWT token: {str(e)}")
        return ""

def load_pem_private_key(private_key_pem: bytes, password: Optional[bytes] = None):
    """
    Cargar clave privada PEM
    """
    try:
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        return load_pem_private_key(private_key_pem, password)
    except Exception as e:
        logger.error(f"Error cargando clave privada: {str(e)}")
        raise

# Endpoint de health check
@router.get("/health")
async def health_check():
    """
    Health check para el servicio de push notifications
    """
    return {
        "status": "healthy",
        "service": "push-notifications",
        "timestamp": datetime.now().isoformat(),
        "vapid_configured": bool(VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY),
        "active_subscriptions": len(push_subscriptions)
    }
