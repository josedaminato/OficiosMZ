"""
Servicio de Notificaciones Automáticas - Oficios MZ
Maneja la creación automática de notificaciones para eventos del sistema.
"""

import logging
import httpx
import os
from typing import Dict, Any, Optional
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

class NotificationService:
    """Servicio para crear notificaciones automáticas"""
    
    @staticmethod
    async def create_notification(
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Crear una notificación automática
        
        Args:
            user_id: ID del usuario destinatario
            title: Título de la notificación
            message: Mensaje de la notificación
            notification_type: Tipo de notificación
            metadata: Datos adicionales
            
        Returns:
            ID de la notificación creada o None si hay error
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/create_notification",
                    headers=SUPABASE_HEADERS,
                    json={
                        "p_user_id": user_id,
                        "p_title": title,
                        "p_message": message,
                        "p_type": notification_type,
                        "p_metadata": metadata or {}
                    }
                )
                
                if response.status_code == 200:
                    notification_id = response.json()
                    logger.info(f"Notificación creada: {notification_id} para usuario {user_id}")
                    return notification_id
                else:
                    logger.error(f"Error creando notificación: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error inesperado creando notificación: {e}")
            return None

    @staticmethod
    async def notify_rating_received(
        rated_user_id: str,
        rater_name: str,
        score: int,
        job_title: str,
        rating_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Crear notificación cuando se recibe una calificación
        
        Args:
            rated_user_id: ID del usuario que recibió la calificación
            rater_name: Nombre del usuario que calificó
            score: Puntuación recibida (1-5)
            job_title: Título del trabajo
            rating_id: ID de la calificación
            job_id: ID del trabajo
            
        Returns:
            ID de la notificación creada
        """
        # Determinar el mensaje según la puntuación
        if score >= 4:
            message = f"¡Excelente! {rater_name} te calificó con {score} estrellas por tu trabajo '{job_title}'. ¡Sigue así!"
        elif score >= 3:
            message = f"{rater_name} te calificó con {score} estrellas por tu trabajo '{job_title}'. ¡Buen trabajo!"
        else:
            message = f"{rater_name} te calificó con {score} estrellas por tu trabajo '{job_title}'. Hay oportunidades de mejora."
        
        title = f"Nueva Calificación: {score} ⭐"
        
        metadata = {
            "rating_id": rating_id,
            "job_id": job_id,
            "score": score,
            "rater_name": rater_name,
            "job_title": job_title
        }
        
        return await NotificationService.create_notification(
            user_id=rated_user_id,
            title=title,
            message=message,
            notification_type="rating",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_received(
        worker_id: str,
        client_name: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Crear notificación cuando se recibe un pago
        
        Args:
            worker_id: ID del trabajador que recibió el pago
            client_name: Nombre del cliente
            amount: Monto del pago
            job_title: Título del trabajo
            payment_id: ID del pago
            job_id: ID del trabajo
            
        Returns:
            ID de la notificación creada
        """
        title = "Pago Recibido 💰"
        message = f"{client_name} ha liberado tu pago de ${amount:,.2f} por el trabajo '{job_title}'. ¡El dinero ya está en tu cuenta!"
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "client_name": client_name,
            "job_title": job_title
        }
        
        return await NotificationService.create_notification(
            user_id=worker_id,
            title=title,
            message=message,
            notification_type="payment",
            metadata=metadata
        )

    @staticmethod
    async def notify_job_request(
        worker_id: str,
        client_name: str,
        job_title: str,
        job_id: str,
        location: str = None
    ) -> Optional[str]:
        """
        Crear notificación cuando se recibe una solicitud de trabajo
        
        Args:
            worker_id: ID del trabajador
            client_name: Nombre del cliente
            job_title: Título del trabajo
            job_id: ID del trabajo
            location: Ubicación del trabajo
            
        Returns:
            ID de la notificación creada
        """
        title = "Nueva Solicitud de Trabajo 🔨"
        location_text = f" en {location}" if location else ""
        message = f"{client_name} te ha enviado una solicitud para '{job_title}'{location_text}. ¡Revisa los detalles y responde!"
        
        metadata = {
            "job_id": job_id,
            "client_name": client_name,
            "job_title": job_title,
            "location": location
        }
        
        return await NotificationService.create_notification(
            user_id=worker_id,
            title=title,
            message=message,
            notification_type="job_request",
            metadata=metadata
        )

    @staticmethod
    async def notify_job_accepted(
        client_id: str,
        worker_name: str,
        job_title: str,
        job_id: str
    ) -> Optional[str]:
        """
        Crear notificación cuando un trabajador acepta un trabajo
        
        Args:
            client_id: ID del cliente
            worker_name: Nombre del trabajador
            job_title: Título del trabajo
            job_id: ID del trabajo
            
        Returns:
            ID de la notificación creada
        """
        title = "Trabajo Aceptado ✅"
        message = f"¡Excelente! {worker_name} ha aceptado tu solicitud para '{job_title}'. Pronto se pondrá en contacto contigo."
        
        metadata = {
            "job_id": job_id,
            "worker_name": worker_name,
            "job_title": job_title
        }
        
        return await NotificationService.create_notification(
            user_id=client_id,
            title=title,
            message=message,
            notification_type="job_accepted",
            metadata=metadata
        )

    @staticmethod
    async def notify_job_completed(
        client_id: str,
        worker_name: str,
        job_title: str,
        job_id: str
    ) -> Optional[str]:
        """
        Crear notificación cuando se completa un trabajo
        
        Args:
            client_id: ID del cliente
            worker_name: Nombre del trabajador
            job_title: Título del trabajo
            job_id: ID del trabajo
            
        Returns:
            ID de la notificación creada
        """
        title = "Trabajo Completado 🎉"
        message = f"{worker_name} ha marcado como completado el trabajo '{job_title}'. ¡Revisa el resultado y libera el pago!"
        
        metadata = {
            "job_id": job_id,
            "worker_name": worker_name,
            "job_title": job_title
        }
        
        return await NotificationService.create_notification(
            user_id=client_id,
            title=title,
            message=message,
            notification_type="job_completed",
            metadata=metadata
        )

    @staticmethod
    async def notify_job_cancelled(
        user_id: str,
        other_user_name: str,
        job_title: str,
        job_id: str,
        reason: str = None
    ) -> Optional[str]:
        """
        Crear notificación cuando se cancela un trabajo
        
        Args:
            user_id: ID del usuario a notificar
            other_user_name: Nombre del otro usuario
            job_title: Título del trabajo
            job_id: ID del trabajo
            reason: Razón de la cancelación
            
        Returns:
            ID de la notificación creada
        """
        title = "Trabajo Cancelado ❌"
        reason_text = f" Razón: {reason}" if reason else ""
        message = f"{other_user_name} ha cancelado el trabajo '{job_title}'.{reason_text}"
        
        metadata = {
            "job_id": job_id,
            "other_user_name": other_user_name,
            "job_title": job_title,
            "reason": reason
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="job_cancelled",
            metadata=metadata
        )

    @staticmethod
    async def notify_system_message(
        user_id: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Crear notificación del sistema
        
        Args:
            user_id: ID del usuario
            title: Título de la notificación
            message: Mensaje de la notificación
            metadata: Datos adicionales
            
        Returns:
            ID de la notificación creada
        """
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="system",
            metadata=metadata
        )

    @staticmethod
    async def notify_chat_message(
        user_id: str,
        sender_name: str,
        message_preview: str,
        chat_id: str
    ) -> Optional[str]:
        """
        Crear notificación de mensaje de chat
        
        Args:
            user_id: ID del usuario destinatario
            sender_name: Nombre del remitente
            message_preview: Vista previa del mensaje
            chat_id: ID del chat
            
        Returns:
            ID de la notificación creada
        """
        title = f"Nuevo mensaje de {sender_name}"
        message = f"{sender_name}: {message_preview[:50]}{'...' if len(message_preview) > 50 else ''}"
        
        metadata = {
            "chat_id": chat_id,
            "sender_name": sender_name,
            "message_preview": message_preview
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="chat",
            metadata=metadata
        )

    # =====================================================
    # NOTIFICACIONES DE PAGOS EXTENDIDAS
    # =====================================================
    
    @staticmethod
    async def notify_payment_held(
        worker_id: str, 
        employer_name: str, 
        amount: float, 
        job_title: str, 
        payment_id: str, 
        job_id: str
    ) -> Optional[str]:
        """
        Crear notificación cuando se retiene un pago
        """
        title = f"💰 Pago retenido por tu trabajo: {job_title}"
        message = (
            f"{employer_name} ha confirmado el trabajo y retenido el pago de ${amount:,.2f} "
            f"por '{job_title}'. El pago será liberado una vez que confirmes la finalización."
        )
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "employer_name": employer_name,
            "job_title": job_title
        }
        
        return await NotificationService.create_notification(
            user_id=worker_id,
            title=title,
            message=message,
            notification_type="payment",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_released_employer(
        employer_id: str, 
        worker_name: str, 
        amount: float, 
        job_title: str, 
        payment_id: str, 
        job_id: str
    ) -> Optional[str]:
        """
        Crear notificación para el empleador cuando libera un pago
        """
        title = f"✅ Pago liberado para {worker_name}"
        message = (
            f"Has liberado el pago de ${amount:,.2f} a {worker_name} "
            f"por el trabajo '{job_title}'. El trabajador recibirá los fondos pronto."
        )
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "worker_name": worker_name,
            "job_title": job_title
        }
        
        return await NotificationService.create_notification(
            user_id=employer_id,
            title=title,
            message=message,
            notification_type="payment",
            metadata=metadata
        )

    # =====================================================
    # NOTIFICACIONES DE DISPUTAS
    # =====================================================
    
    @staticmethod
    async def notify_dispute_opened(
        user_id: str, 
        initiator_name: str, 
        reason: str, 
        payment_amount: float, 
        dispute_id: str, 
        payment_id: str
    ) -> Optional[str]:
        """
        Crear notificación cuando se abre una disputa
        """
        title = f"⚠️ Disputa abierta por pago de ${payment_amount:,.2f}"
        message = (
            f"{initiator_name} ha abierto una disputa por el pago de ${payment_amount:,.2f}. "
            f"Razón: {reason}. Nuestro equipo revisará el caso."
        )
        
        metadata = {
            "dispute_id": dispute_id,
            "payment_id": payment_id,
            "payment_amount": payment_amount,
            "initiator_name": initiator_name,
            "reason": reason
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="system",
            metadata=metadata
        )

    @staticmethod
    async def notify_dispute_created(
        initiator_id: str, 
        reason: str, 
        payment_amount: float, 
        dispute_id: str, 
        payment_id: str
    ) -> Optional[str]:
        """
        Crear notificación para el iniciador de la disputa
        """
        title = f"📋 Disputa creada exitosamente"
        message = (
            f"Has abierto una disputa por el pago de ${payment_amount:,.2f}. "
            f"Razón: {reason}. Nuestro equipo revisará tu caso y te contactará pronto."
        )
        
        metadata = {
            "dispute_id": dispute_id,
            "payment_id": payment_id,
            "payment_amount": payment_amount,
            "reason": reason
        }
        
        return await NotificationService.create_notification(
            user_id=initiator_id,
            title=title,
            message=message,
            notification_type="system",
            metadata=metadata
        )

    @staticmethod
    async def notify_dispute_resolved(
        user_id: str, 
        dispute_id: str, 
        resolution: str, 
        admin_notes: str = None
    ) -> Optional[str]:
        """
        Crear notificación cuando se resuelve una disputa
        """
        title = f"✅ Disputa resuelta"
        message = f"Tu disputa ha sido resuelta. Resolución: {resolution}"
        if admin_notes:
            message += f" Notas del administrador: {admin_notes}"
        
        metadata = {
            "dispute_id": dispute_id,
            "resolution": resolution,
            "admin_notes": admin_notes
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="system",
            metadata=metadata
        )

    # =====================================================
    # NOTIFICACIONES DE PAGOS
    # =====================================================

    @staticmethod
    async def notify_payment_approved(
        user_id: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago fue aprobado
        """
        title = "Pago Aprobado"
        message = f"Tu pago de ${amount:,.2f} por '{job_title}' ha sido aprobado y está retenido hasta completar el trabajo."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "status": "approved"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_approved",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_pending(
        user_id: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago está pendiente
        """
        title = "Pago Pendiente"
        message = f"Tu pago de ${amount:,.2f} por '{job_title}' está pendiente de acreditación."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "status": "pending"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_pending",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_failed(
        user_id: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago falló
        """
        title = "Pago Fallido"
        message = f"Tu pago de ${amount:,.2f} por '{job_title}' no pudo ser procesado. Por favor, intenta nuevamente."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "status": "failed"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_failed",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_disputed(
        user_id: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago está en disputa
        """
        title = "Pago en Disputa"
        message = f"Tu pago de ${amount:,.2f} por '{job_title}' está siendo revisado por una disputa."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "status": "disputed"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_disputed",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_released(
        user_id: str,
        employer_name: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago fue liberado (para trabajador)
        """
        title = "Pago Liberado"
        message = f"¡{employer_name} liberó tu pago de ${amount:,.2f} por '{job_title}'! Ya está disponible en tu cuenta."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "employer_name": employer_name,
            "status": "released"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_released",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_released_employer(
        employer_id: str,
        worker_name: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago fue liberado (para empleador)
        """
        title = "Pago Liberado"
        message = f"Liberaste el pago de ${amount:,.2f} a {worker_name} por '{job_title}'. El trabajador ya puede acceder al dinero."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "worker_name": worker_name,
            "status": "released"
        }
        
        return await NotificationService.create_notification(
            user_id=employer_id,
            title=title,
            message=message,
            notification_type="payment_released_employer",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_held(
        user_id: str,
        employer_name: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago fue retenido
        """
        title = "Pago Retenido"
        message = f"{employer_name} retuvo tu pago de ${amount:,.2f} por '{job_title}' hasta completar el trabajo."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "employer_name": employer_name,
            "status": "held"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_held",
            metadata=metadata
        )

    @staticmethod
    async def notify_payment_refunded(
        user_id: str,
        amount: float,
        job_title: str,
        payment_id: str,
        job_id: str
    ) -> Optional[str]:
        """
        Notificar que un pago fue reembolsado
        """
        title = "Pago Reembolsado"
        message = f"Tu pago de ${amount:,.2f} por '{job_title}' fue reembolsado a tu cuenta."
        
        metadata = {
            "payment_id": payment_id,
            "job_id": job_id,
            "amount": amount,
            "job_title": job_title,
            "status": "refunded"
        }
        
        return await NotificationService.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="payment_refunded",
            metadata=metadata
        )

# Instancia global del servicio
notification_service = NotificationService()
