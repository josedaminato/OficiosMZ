import logging
import httpx
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from enum import Enum
import json

# Importar AuthService centralizado
from services.auth_service import AuthService

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

router = APIRouter(prefix="/api/payments", tags=["payments"])

# =====================================================
# ENUMS Y MODELOS PYDANTIC
# =====================================================

class PaymentStatus(str, Enum):
    PENDING = "pending"
    HELD = "held"
    RELEASED = "released"
    DISPUTED = "disputed"
    REFUNDED = "refunded"

class PaymentCreate(BaseModel):
    job_id: str = Field(..., description="ID del trabajo")
    amount: float = Field(..., gt=0, description="Monto del pago")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return round(v, 2)

class PaymentResponse(BaseModel):
    id: str
    job_id: str
    employer_id: str
    worker_id: str
    amount: float
    status: PaymentStatus
    mercado_pago_preference_id: Optional[str] = None
    mercado_pago_payment_id: Optional[str] = None
    mercado_pago_status: Optional[str] = None
    held_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
    disputed_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class PaymentUpdate(BaseModel):
    status: PaymentStatus
    mercado_pago_payment_id: Optional[str] = None
    mercado_pago_status: Optional[str] = None

class PaymentStats(BaseModel):
    total_payments: int
    total_amount: float
    released_amount: float
    held_amount: float
    disputed_amount: float
    avg_payment: float
    last_payment_date: Optional[datetime]

class MercadoPagoPreference(BaseModel):
    preference_id: str
    init_point: str
    sandbox_init_point: str

# =====================================================
# DEPENDENCIAS
# =====================================================

async def get_current_user(authorization: str = Header(...)):
    """Obtener usuario actual desde JWT token usando AuthService"""
    try:
        return await AuthService.get_current_user(authorization)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

def validate_user_access(current_user_id: str, required_user_id: str):
    """Validar que el usuario tenga acceso a los datos"""
    if current_user_id != required_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a estos datos"
        )

# =====================================================
# FUNCIONES AUXILIARES
# =====================================================

async def get_job_info(job_id: str) -> Optional[Dict[str, Any]]:
    """Obtener información del trabajo"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            if response.status_code == 200:
                jobs = response.json()
                return jobs[0] if jobs else None
            return None
    except Exception as e:
        logger.error(f"Error obteniendo información del trabajo {job_id}: {e}")
        return None

async def get_user_info(user_id: str) -> Optional[Dict[str, Any]]:
    """Obtener información del usuario"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=full_name,email",
                headers=SUPABASE_HEADERS
            )
            if response.status_code == 200:
                users = response.json()
                return users[0] if users else None
            return None
    except Exception as e:
        logger.error(f"Error obteniendo información del usuario {user_id}: {e}")
        return None

async def create_mercado_pago_preference(payment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Crear preferencia de pago en Mercado Pago"""
    if not MERCADO_PAGO_ACCESS_TOKEN:
        logger.warning("Token de Mercado Pago no configurado")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {MERCADO_PAGO_ACCESS_TOKEN}",
                "Content-Type": "application/json"
            }
            
            response = await client.post(
                f"{MERCADO_PAGO_BASE_URL}/checkout/preferences",
                json=payment_data,
                headers=headers
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Error creando preferencia MP: {response.text}")
                return None
    except Exception as e:
        logger.error(f"Error creando preferencia de Mercado Pago: {e}")
        return None

# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear un nuevo pago para un trabajo.
    Solo el empleador puede crear pagos para sus trabajos.
    """
    employer_id = current_user.get("sub")
    logger.info(f"Creando pago para trabajo {payment_data.job_id} por empleador {employer_id}")
    
    # Validar que el trabajo existe y pertenece al empleador
    job = await get_job_info(payment_data.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajo no encontrado"
        )
    
    if job.get("employer_id") != employer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear pagos para este trabajo"
        )
    
    # Verificar que no existe ya un pago para este trabajo
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/payments?job_id=eq.{payment_data.job_id}",
                headers=SUPABASE_HEADERS
            )
            if response.status_code == 200:
                existing_payments = response.json()
                if existing_payments:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ya existe un pago para este trabajo"
                    )
    except httpx.HTTPStatusError as e:
        if e.response.status_code != 400:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        raise
    
    # Crear preferencia de Mercado Pago
    mp_preference_data = {
        "items": [
            {
                "title": f"Pago por trabajo: {job.get('title', 'Trabajo')}",
                "quantity": 1,
                "unit_price": payment_data.amount,
                "currency_id": "ARS"
            }
        ],
        "external_reference": f"job_{payment_data.job_id}",
        "notification_url": f"{os.getenv('API_BASE_URL', 'http://localhost:8000')}/api/payments/webhook",
        "back_urls": {
            "success": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payments/success",
            "failure": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payments/failure",
            "pending": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payments/pending"
        },
        "auto_return": "approved"
    }
    
    mp_preference = await create_mercado_pago_preference(mp_preference_data)
    
    # Crear pago en la base de datos
    payment_record = {
        "job_id": payment_data.job_id,
        "employer_id": employer_id,
        "worker_id": job.get("worker_id"),
        "amount": payment_data.amount,
        "status": "pending",
        "mercado_pago_preference_id": mp_preference.get("id") if mp_preference else None
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/payments",
                json=payment_record,
                headers=SUPABASE_HEADERS
            )
            response.raise_for_status()
            created_payment = response.json()[0]
            
            # Agregar URLs de Mercado Pago a la respuesta
            if mp_preference:
                created_payment["mercado_pago_init_point"] = mp_preference.get("init_point")
                created_payment["mercado_pago_sandbox_init_point"] = mp_preference.get("sandbox_init_point")
            
            logger.info(f"Pago creado exitosamente: {created_payment['id']}")
            return PaymentResponse(**created_payment)
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Error creando pago en Supabase: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado creando pago: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/user/{user_id}", response_model=List[PaymentResponse])
async def get_user_payments(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[PaymentStatus] = None,
    limit: int = 20,
    offset: int = 0
):
    """
    Obtener pagos de un usuario (como empleador o trabajador).
    """
    current_user_id = current_user.get("sub")
    validate_user_access(current_user_id, user_id)
    
    logger.info(f"Obteniendo pagos para usuario {user_id}")
    
    try:
        async with httpx.AsyncClient() as client:
            # Construir query
            query_params = f"employer_id=eq.{user_id}&select=*"
            if status_filter:
                query_params += f"&status=eq.{status_filter.value}"
            
            query_params += f"&order=created_at.desc&limit={limit}&offset={offset}"
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/payments?{query_params}",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                payments = response.json()
                logger.info(f"Encontrados {len(payments)} pagos para usuario {user_id}")
                return [PaymentResponse(**payment) for payment in payments]
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo pagos: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo pagos: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/user/{user_id}/stats", response_model=PaymentStats)
async def get_user_payment_stats(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estadísticas de pagos de un usuario.
    """
    current_user_id = current_user.get("sub")
    validate_user_access(current_user_id, user_id)
    
    logger.info(f"Obteniendo estadísticas de pagos para usuario {user_id}")
    
    try:
        async with httpx.AsyncClient() as client:
            # Usar la función de la base de datos
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_payment_stats",
                json={"user_id": user_id},
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                stats = response.json()
                logger.info(f"Estadísticas obtenidas para usuario {user_id}")
                return PaymentStats(**stats)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo estadísticas: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo estadísticas: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.patch("/{payment_id}/hold", response_model=PaymentResponse)
async def hold_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retener un pago (cambiar estado a 'held').
    Solo el empleador puede retener pagos.
    """
    current_user_id = current_user.get("sub")
    logger.info(f"Reteniendo pago {payment_id} por usuario {current_user_id}")
    
    try:
        # Verificar que el pago existe y pertenece al usuario
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/payments?id=eq.{payment_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                payments = response.json()
                if not payments:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Pago no encontrado"
                    )
                
                payment = payments[0]
                if payment["employer_id"] != current_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para retener este pago"
                    )
                
                if payment["status"] != "pending":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"No se puede retener un pago con estado {payment['status']}"
                    )
                
                # Actualizar estado a 'held'
                update_data = {
                    "status": "held",
                    "held_at": datetime.now().isoformat()
                }
                
                update_response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/payments?id=eq.{payment_id}",
                    json=update_data,
                    headers=SUPABASE_HEADERS
                )
                
                if update_response.status_code == 200:
                    updated_payment = update_response.json()[0]
                    
                    # Crear notificación para el trabajador
                    try:
                        import sys
                        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
                        from notification_service import notification_service
                        
                        job = await get_job_info(payment["job_id"])
                        employer = await get_user_info(current_user_id)
                        
                        if job and employer:
                            await notification_service.notify_payment_held(
                                worker_id=payment["worker_id"],
                                employer_name=employer.get("full_name", "Empleador"),
                                amount=payment["amount"],
                                job_title=job.get("title", "Trabajo"),
                                payment_id=payment_id,
                                job_id=payment["job_id"]
                            )
                            logger.info(f"Notificación de pago retenido enviada a trabajador {payment['worker_id']}")
                    except Exception as e:
                        logger.error(f"Error enviando notificación de pago retenido: {e}")
                    
                    logger.info(f"Pago {payment_id} retenido exitosamente")
                    return PaymentResponse(**updated_payment)
                else:
                    raise HTTPException(status_code=update_response.status_code, detail=update_response.text)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error reteniendo pago: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado reteniendo pago: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.patch("/{payment_id}/release", response_model=PaymentResponse)
async def release_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Liberar un pago (cambiar estado a 'released').
    Solo el empleador puede liberar pagos.
    """
    current_user_id = current_user.get("sub")
    logger.info(f"Liberando pago {payment_id} por usuario {current_user_id}")
    
    try:
        # Verificar que el pago existe y pertenece al usuario
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/payments?id=eq.{payment_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                payments = response.json()
                if not payments:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Pago no encontrado"
                    )
                
                payment = payments[0]
                if payment["employer_id"] != current_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para liberar este pago"
                    )
                
                if payment["status"] != "held":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"No se puede liberar un pago con estado {payment['status']}"
                    )
                
                # Actualizar estado a 'released'
                update_data = {
                    "status": "released",
                    "released_at": datetime.now().isoformat()
                }
                
                update_response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/payments?id=eq.{payment_id}",
                    json=update_data,
                    headers=SUPABASE_HEADERS
                )
                
                if update_response.status_code == 200:
                    updated_payment = update_response.json()[0]
                    
                    # Crear notificaciones para ambas partes
                    try:
                        import sys
                        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
                        from notification_service import notification_service
                        
                        job = await get_job_info(payment["job_id"])
                        employer = await get_user_info(current_user_id)
                        worker = await get_user_info(payment["worker_id"])
                        
                        if job and employer and worker:
                            # Notificación para el trabajador
                            await notification_service.notify_payment_released(
                                worker_id=payment["worker_id"],
                                employer_name=employer.get("full_name", "Empleador"),
                                amount=payment["amount"],
                                job_title=job.get("title", "Trabajo"),
                                payment_id=payment_id,
                                job_id=payment["job_id"]
                            )
                            
                            # Notificación para el empleador
                            await notification_service.notify_payment_released_employer(
                                employer_id=current_user_id,
                                worker_name=worker.get("full_name", "Trabajador"),
                                amount=payment["amount"],
                                job_title=job.get("title", "Trabajo"),
                                payment_id=payment_id,
                                job_id=payment["job_id"]
                            )
                            
                            logger.info(f"Notificaciones de pago liberado enviadas")
                    except Exception as e:
                        logger.error(f"Error enviando notificaciones de pago liberado: {e}")
                    
                    logger.info(f"Pago {payment_id} liberado exitosamente")
                    return PaymentResponse(**updated_payment)
                else:
                    raise HTTPException(status_code=update_response.status_code, detail=update_response.text)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error liberando pago: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado liberando pago: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def mercado_pago_webhook(request: Request):
    """
    Webhook mejorado de Mercado Pago con validación de firma, reintentos y logs detallados.
    """
    try:
        # Obtener el payload y la firma
        body = await request.body()
        payload = body.decode('utf-8')
        signature = request.headers.get('x-signature', '')
        
        # Importar el servicio de webhooks mejorado
        from services.payment_webhook_service import payment_webhook_service
        
        # Procesar el webhook
        result = await payment_webhook_service.process_webhook(payload, signature)
        
        return result
        
    except Exception as e:
        logger.error(f"Error procesando webhook de Mercado Pago: {e}")
        return {"status": "error", "message": "Internal server error"}

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener información de un pago específico.
    """
    current_user_id = current_user.get("sub")
    logger.info(f"Obteniendo pago {payment_id} para usuario {current_user_id}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/payments?id=eq.{payment_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                payments = response.json()
                if not payments:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Pago no encontrado"
                    )
                
                payment = payments[0]
                
                # Verificar que el usuario tiene acceso a este pago
                if payment["employer_id"] != current_user_id and payment["worker_id"] != current_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para ver este pago"
                    )
                
                logger.info(f"Pago {payment_id} obtenido exitosamente")
                return PaymentResponse(**payment)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo pago: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo pago: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/auto-release", status_code=status.HTTP_200_OK)
async def auto_release_payments():
    """
    Endpoint para liberar automáticamente pagos retenidos por más de 7 días.
    Este endpoint debería ser llamado por un cron job o scheduler.
    """
    logger.info("Ejecutando liberación automática de pagos")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/auto_release_payments",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                released_count = response.json()
                logger.info(f"Liberados automáticamente {released_count} pagos")
                return {"released_count": released_count}
            else:
                logger.error(f"Error en liberación automática: {response.text}")
                return {"error": "Error en liberación automática"}
                
    except Exception as e:
        logger.error(f"Error inesperado en liberación automática: {e}")
        return {"error": "Error interno del servidor"}



