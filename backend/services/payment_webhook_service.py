"""
Servicio mejorado para manejo de webhooks de Mercado Pago
Incluye validación de firma, reintentos automáticos y logs detallados
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import httpx

# Configuración de logging
logger = logging.getLogger(__name__)

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# Configuración de Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN = os.getenv("MERCADO_PAGO_ACCESS_TOKEN", "")
MERCADO_PAGO_BASE_URL = "https://api.mercadopago.com"
MERCADO_PAGO_WEBHOOK_SECRET = os.getenv("MERCADO_PAGO_WEBHOOK_SECRET", "")

class PaymentWebhookService:
    """Servicio para manejo robusto de webhooks de Mercado Pago"""
    
    def __init__(self):
        self.max_retries = 3
        self.retry_delay = 5  # segundos
        self.log_file = "backend/logs/payments.log"
        self._ensure_log_directory()
    
    def _ensure_log_directory(self):
        """Asegurar que el directorio de logs existe"""
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def _log_payment_event(self, event_type: str, data: Dict[str, Any], status: str = "info"):
        """Log detallado de eventos de pago"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "status": status,
            "data": data
        }
        
        # Log a archivo
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(f"{json.dumps(log_entry)}\n")
        
        # Log a consola
        if status == "error":
            logger.error(f"[PAYMENT] {event_type}: {data}")
        elif status == "warning":
            logger.warning(f"[PAYMENT] {event_type}: {data}")
        else:
            logger.info(f"[PAYMENT] {event_type}: {data}")
    
    def _validate_webhook_signature(self, payload: str, signature: str) -> bool:
        """Validar la firma del webhook de Mercado Pago"""
        if not MERCADO_PAGO_WEBHOOK_SECRET:
            logger.warning("Webhook secret no configurado, saltando validación de firma")
            return True
        
        try:
            expected_signature = hmac.new(
                MERCADO_PAGO_WEBHOOK_SECRET.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error validando firma del webhook: {e}")
            return False
    
    async def _get_payment_from_mp(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """Obtener información del pago desde Mercado Pago"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {MERCADO_PAGO_ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                }
                
                response = await client.get(
                    f"{MERCADO_PAGO_BASE_URL}/v1/payments/{payment_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    self._log_payment_event(
                        "get_payment_from_mp_failed",
                        {
                            "payment_id": payment_id,
                            "status_code": response.status_code,
                            "response": response.text
                        },
                        "error"
                    )
                    return None
        except Exception as e:
            self._log_payment_event(
                "get_payment_from_mp_exception",
                {
                    "payment_id": payment_id,
                    "error": str(e)
                },
                "error"
            )
            return None
    
    async def _update_payment_in_db(self, job_id: str, payment_data: Dict[str, Any]) -> bool:
        """Actualizar pago en la base de datos"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/payments?job_id=eq.{job_id}",
                    json=payment_data,
                    headers=SUPABASE_HEADERS
                )
                
                if response.status_code == 200:
                    self._log_payment_event(
                        "payment_updated_successfully",
                        {
                            "job_id": job_id,
                            "payment_data": payment_data
                        },
                        "info"
                    )
                    return True
                else:
                    self._log_payment_event(
                        "payment_update_failed",
                        {
                            "job_id": job_id,
                            "status_code": response.status_code,
                            "response": response.text
                        },
                        "error"
                    )
                    return False
        except Exception as e:
            self._log_payment_event(
                "payment_update_exception",
                {
                    "job_id": job_id,
                    "error": str(e)
                },
                "error"
            )
            return False
    
    async def _send_notification(self, notification_type: str, user_id: str, data: Dict[str, Any]) -> bool:
        """Enviar notificación usando el servicio de notificaciones"""
        try:
            # Importar el servicio de notificaciones
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
            from services.notification_service import notification_service
            
            if notification_type == "payment_approved":
                await notification_service.notify_payment_approved(
                    user_id=user_id,
                    amount=data.get("amount"),
                    job_title=data.get("job_title"),
                    payment_id=data.get("payment_id"),
                    job_id=data.get("job_id")
                )
            elif notification_type == "payment_pending":
                await notification_service.notify_payment_pending(
                    user_id=user_id,
                    amount=data.get("amount"),
                    job_title=data.get("job_title"),
                    payment_id=data.get("payment_id"),
                    job_id=data.get("job_id")
                )
            elif notification_type == "payment_failed":
                await notification_service.notify_payment_failed(
                    user_id=user_id,
                    amount=data.get("amount"),
                    job_title=data.get("job_title"),
                    payment_id=data.get("payment_id"),
                    job_id=data.get("job_id")
                )
            elif notification_type == "payment_disputed":
                await notification_service.notify_payment_disputed(
                    user_id=user_id,
                    amount=data.get("amount"),
                    job_title=data.get("job_title"),
                    payment_id=data.get("payment_id"),
                    job_id=data.get("job_id")
                )
            
            self._log_payment_event(
                "notification_sent",
                {
                    "notification_type": notification_type,
                    "user_id": user_id,
                    "data": data
                },
                "info"
            )
            return True
        except Exception as e:
            self._log_payment_event(
                "notification_failed",
                {
                    "notification_type": notification_type,
                    "user_id": user_id,
                    "error": str(e)
                },
                "error"
            )
            return False
    
    async def _get_job_and_users_info(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Obtener información del trabajo y usuarios involucrados"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Obtener información del trabajo
                job_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}&select=*,employer_id,worker_id,title",
                    headers=SUPABASE_HEADERS
                )
                
                if job_response.status_code != 200 or not job_response.json():
                    return None
                
                job = job_response.json()[0]
                
                # Obtener información de usuarios
                employer_id = job.get("employer_id")
                worker_id = job.get("worker_id")
                
                users_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/users?id=in.({employer_id},{worker_id})&select=id,full_name,email",
                    headers=SUPABASE_HEADERS
                )
                
                if users_response.status_code != 200:
                    return None
                
                users = {user["id"]: user for user in users_response.json()}
                
                return {
                    "job": job,
                    "employer": users.get(employer_id),
                    "worker": users.get(worker_id)
                }
        except Exception as e:
            self._log_payment_event(
                "get_job_users_info_failed",
                {
                    "job_id": job_id,
                    "error": str(e)
                },
                "error"
            )
            return None
    
    async def _process_payment_event(self, payment_id: str, mp_payment: Dict[str, Any]) -> bool:
        """Procesar un evento de pago específico"""
        try:
            external_reference = mp_payment.get("external_reference")
            if not external_reference or not external_reference.startswith("job_"):
                self._log_payment_event(
                    "invalid_external_reference",
                    {"external_reference": external_reference},
                    "warning"
                )
                return False
            
            job_id = external_reference.replace("job_", "")
            mp_status = mp_payment.get("status")
            amount = mp_payment.get("transaction_amount", 0)
            
            # Obtener información del trabajo y usuarios
            job_info = await self._get_job_and_users_info(job_id)
            if not job_info:
                self._log_payment_event(
                    "job_info_not_found",
                    {"job_id": job_id},
                    "error"
                )
                return False
            
            # Determinar el estado interno basado en el estado de MP
            internal_status = self._map_mp_status_to_internal(mp_status)
            
            # Preparar datos de actualización
            update_data = {
                "mercado_pago_payment_id": payment_id,
                "mercado_pago_status": mp_status,
                "status": internal_status,
                "updated_at": datetime.now().isoformat()
            }
            
            # Agregar timestamps específicos según el estado
            if internal_status == "held":
                update_data["held_at"] = datetime.now().isoformat()
            elif internal_status == "released":
                update_data["released_at"] = datetime.now().isoformat()
            elif internal_status == "disputed":
                update_data["disputed_at"] = datetime.now().isoformat()
            
            # Actualizar en la base de datos
            success = await self._update_payment_in_db(job_id, update_data)
            if not success:
                return False
            
            # Enviar notificaciones
            notification_data = {
                "amount": amount,
                "job_title": job_info["job"].get("title", "Trabajo"),
                "payment_id": payment_id,
                "job_id": job_id
            }
            
            if internal_status == "held":
                # Notificar al trabajador que el pago fue aprobado
                await self._send_notification(
                    "payment_approved",
                    job_info["worker"]["id"],
                    notification_data
                )
            elif internal_status == "pending":
                # Notificar que el pago está pendiente
                await self._send_notification(
                    "payment_pending",
                    job_info["employer"]["id"],
                    notification_data
                )
            elif internal_status == "disputed":
                # Notificar a ambas partes sobre la disputa
                await self._send_notification(
                    "payment_disputed",
                    job_info["employer"]["id"],
                    notification_data
                )
                await self._send_notification(
                    "payment_disputed",
                    job_info["worker"]["id"],
                    notification_data
                )
            
            self._log_payment_event(
                "payment_event_processed",
                {
                    "payment_id": payment_id,
                    "job_id": job_id,
                    "mp_status": mp_status,
                    "internal_status": internal_status,
                    "amount": amount
                },
                "info"
            )
            
            return True
            
        except Exception as e:
            self._log_payment_event(
                "process_payment_event_failed",
                {
                    "payment_id": payment_id,
                    "error": str(e)
                },
                "error"
            )
            return False
    
    def _map_mp_status_to_internal(self, mp_status: str) -> str:
        """Mapear estado de Mercado Pago a estado interno"""
        status_mapping = {
            "approved": "held",
            "pending": "pending",
            "rejected": "disputed",
            "cancelled": "disputed",
            "refunded": "refunded",
            "charged_back": "disputed"
        }
        return status_mapping.get(mp_status, "pending")
    
    async def process_webhook(self, payload: str, signature: str) -> Dict[str, Any]:
        """Procesar webhook de Mercado Pago con reintentos automáticos"""
        try:
            # Validar firma del webhook
            if not self._validate_webhook_signature(payload, signature):
                self._log_payment_event(
                    "invalid_webhook_signature",
                    {"signature": signature},
                    "error"
                )
                return {"status": "error", "message": "Invalid signature"}
            
            # Parsear payload
            try:
                webhook_data = json.loads(payload)
            except json.JSONDecodeError as e:
                self._log_payment_event(
                    "invalid_webhook_payload",
                    {"error": str(e), "payload": payload},
                    "error"
                )
                return {"status": "error", "message": "Invalid JSON payload"}
            
            # Extraer payment_id
            payment_id = webhook_data.get("data", {}).get("id")
            if not payment_id:
                self._log_payment_event(
                    "webhook_missing_payment_id",
                    {"webhook_data": webhook_data},
                    "warning"
                )
                return {"status": "ignored", "message": "No payment ID"}
            
            self._log_payment_event(
                "webhook_received",
                {
                    "payment_id": payment_id,
                    "webhook_data": webhook_data
                },
                "info"
            )
            
            # Procesar con reintentos
            for attempt in range(self.max_retries):
                try:
                    # Obtener información del pago desde MP
                    mp_payment = await self._get_payment_from_mp(payment_id)
                    if not mp_payment:
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(self.retry_delay * (attempt + 1))
                            continue
                        else:
                            return {"status": "error", "message": "Failed to get payment from MP"}
                    
                    # Procesar el evento
                    success = await self._process_payment_event(payment_id, mp_payment)
                    if success:
                        return {"status": "success", "message": "Payment processed successfully"}
                    else:
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(self.retry_delay * (attempt + 1))
                            continue
                        else:
                            return {"status": "error", "message": "Failed to process payment after retries"}
                
                except Exception as e:
                    self._log_payment_event(
                        "webhook_processing_attempt_failed",
                        {
                            "payment_id": payment_id,
                            "attempt": attempt + 1,
                            "error": str(e)
                        },
                        "error"
                    )
                    
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.retry_delay * (attempt + 1))
                    else:
                        return {"status": "error", "message": f"Failed after {self.max_retries} attempts"}
            
            return {"status": "error", "message": "Unexpected error"}
            
        except Exception as e:
            self._log_payment_event(
                "webhook_processing_exception",
                {
                    "error": str(e),
                    "payload": payload
                },
                "error"
            )
            return {"status": "error", "message": "Internal server error"}

# Instancia global del servicio
payment_webhook_service = PaymentWebhookService()
