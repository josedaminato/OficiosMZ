import logging
import httpx
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header, UploadFile, File, Form
from pydantic import BaseModel, Field, validator
from datetime import datetime
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

router = APIRouter(prefix="/api/disputes", tags=["disputes"])

# =====================================================
# ENUMS Y MODELOS PYDANTIC
# =====================================================

class DisputeStatus(str, Enum):
    OPEN = "open"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class DisputeReason(str, Enum):
    WORK_NOT_COMPLETED = "work_not_completed"
    POOR_QUALITY = "poor_quality"
    PAYMENT_ISSUE = "payment_issue"
    COMMUNICATION_PROBLEM = "communication_problem"
    OTHER = "other"

class DisputeCreate(BaseModel):
    payment_id: str = Field(..., description="ID del pago en disputa")
    reason: DisputeReason = Field(..., description="Razón de la disputa")
    description: str = Field(..., min_length=10, max_length=1000, description="Descripción detallada")
    
    @validator('description')
    def validate_description(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('La descripción debe tener al menos 10 caracteres')
        return v.strip()

class DisputeResponse(BaseModel):
    id: str
    payment_id: str
    initiator_id: str
    reason: DisputeReason
    description: str
    status: DisputeStatus
    evidence_urls: List[str] = []
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class DisputeUpdate(BaseModel):
    status: DisputeStatus
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None

class DisputeEvidence(BaseModel):
    id: str
    dispute_id: str
    file_url: str
    file_type: str
    description: Optional[str] = None
    uploaded_by: str
    created_at: datetime

class DisputeWithPaymentInfo(BaseModel):
    id: str
    payment_id: str
    initiator_id: str
    reason: DisputeReason
    description: str
    status: DisputeStatus
    evidence_urls: List[str] = []
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Información del pago
    job_id: str
    employer_id: str
    worker_id: str
    amount: float
    payment_status: str
    job_title: str
    initiator_name: str
    resolver_name: Optional[str] = None

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

def is_admin(current_user: dict) -> bool:
    """Verificar si el usuario es administrador"""
    return current_user.get("role") == "admin" or current_user.get("is_admin", False)

# =====================================================
# FUNCIONES AUXILIARES
# =====================================================

async def get_payment_info(payment_id: str) -> Optional[Dict[str, Any]]:
    """Obtener información del pago"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/payments?id=eq.{payment_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            if response.status_code == 200:
                payments = response.json()
                return payments[0] if payments else None
            return None
    except Exception as e:
        logger.error(f"Error obteniendo información del pago {payment_id}: {e}")
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

async def upload_evidence_file(file: UploadFile, dispute_id: str) -> Optional[str]:
    """Subir archivo de evidencia a Supabase Storage"""
    try:
        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        file_name = f"dispute_{dispute_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        
        # Leer contenido del archivo
        file_content = await file.read()
        
        # Subir a Supabase Storage
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/dispute-evidence/{file_name}",
                content=file_content,
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": file.content_type or "application/octet-stream"
                }
            )
            
            if response.status_code == 200:
                file_url = f"{SUPABASE_URL}/storage/v1/object/public/dispute-evidence/{file_name}"
                return file_url
            else:
                logger.error(f"Error subiendo archivo: {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Error subiendo archivo de evidencia: {e}")
        return None

# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    dispute_data: DisputeCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear una nueva disputa.
    Solo los participantes del pago pueden crear disputas.
    """
    initiator_id = current_user.get("sub")
    logger.info(f"Creando disputa para pago {dispute_data.payment_id} por usuario {initiator_id}")
    
    # Validar que el pago existe y el usuario participa en él
    payment = await get_payment_info(dispute_data.payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado"
        )
    
    if initiator_id not in [payment["employer_id"], payment["worker_id"]]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear disputas para este pago"
        )
    
    # Verificar que no existe ya una disputa para este pago
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes?payment_id=eq.{dispute_data.payment_id}",
                headers=SUPABASE_HEADERS
            )
            if response.status_code == 200:
                existing_disputes = response.json()
                if existing_disputes:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ya existe una disputa para este pago"
                    )
    except httpx.HTTPStatusError as e:
        if e.response.status_code != 400:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        raise
    
    # Crear disputa en la base de datos
    dispute_record = {
        "payment_id": dispute_data.payment_id,
        "initiator_id": initiator_id,
        "reason": dispute_data.reason.value,
        "description": dispute_data.description,
        "status": "open"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/disputes",
                json=dispute_record,
                headers=SUPABASE_HEADERS
            )
            response.raise_for_status()
            created_dispute = response.json()[0]
            
            # Actualizar estado del pago a 'disputed'
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/payments?id=eq.{dispute_data.payment_id}",
                json={"status": "disputed", "disputed_at": datetime.now().isoformat()},
                headers=SUPABASE_HEADERS
            )
            
            # Crear notificaciones para ambas partes
            try:
                import sys
                sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
                from notification_service import notification_service
                
                initiator = await get_user_info(initiator_id)
                other_party_id = payment["worker_id"] if initiator_id == payment["employer_id"] else payment["employer_id"]
                other_party = await get_user_info(other_party_id)
                
                if initiator and other_party:
                    # Notificación para la otra parte
                    await notification_service.notify_dispute_opened(
                        user_id=other_party_id,
                        initiator_name=initiator.get("full_name", "Usuario"),
                        reason=dispute_data.reason.value,
                        payment_amount=payment["amount"],
                        dispute_id=created_dispute["id"],
                        payment_id=dispute_data.payment_id
                    )
                    
                    # Notificación para el iniciador
                    await notification_service.notify_dispute_created(
                        initiator_id=initiator_id,
                        reason=dispute_data.reason.value,
                        payment_amount=payment["amount"],
                        dispute_id=created_dispute["id"],
                        payment_id=dispute_data.payment_id
                    )
                    
                    logger.info(f"Notificaciones de disputa enviadas")
            except Exception as e:
                logger.error(f"Error enviando notificaciones de disputa: {e}")
            
            logger.info(f"Disputa creada exitosamente: {created_dispute['id']}")
            return DisputeResponse(**created_dispute)
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Error creando disputa en Supabase: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado creando disputa: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/user/{user_id}", response_model=List[DisputeWithPaymentInfo])
async def get_user_disputes(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[DisputeStatus] = None,
    limit: int = 20,
    offset: int = 0
):
    """
    Obtener disputas de un usuario.
    """
    current_user_id = current_user.get("sub")
    validate_user_access(current_user_id, user_id)
    
    logger.info(f"Obteniendo disputas para usuario {user_id}")
    
    try:
        async with httpx.AsyncClient() as client:
            # Usar la vista que incluye información del pago
            query_params = f"initiator_id=eq.{user_id}&select=*"
            if status_filter:
                query_params += f"&status=eq.{status_filter.value}"
            
            query_params += f"&order=created_at.desc&limit={limit}&offset={offset}"
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes_with_payment_info?{query_params}",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                disputes = response.json()
                logger.info(f"Encontradas {len(disputes)} disputas para usuario {user_id}")
                return [DisputeWithPaymentInfo(**dispute) for dispute in disputes]
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo disputas: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo disputas: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/admin", response_model=List[DisputeWithPaymentInfo])
async def get_all_disputes(
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[DisputeStatus] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Obtener todas las disputas (solo para administradores).
    """
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden acceder a esta información"
        )
    
    logger.info("Obteniendo todas las disputas para administrador")
    
    try:
        async with httpx.AsyncClient() as client:
            query_params = "select=*"
            if status_filter:
                query_params += f"&status=eq.{status_filter.value}"
            
            query_params += f"&order=created_at.desc&limit={limit}&offset={offset}"
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes_with_payment_info?{query_params}",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                disputes = response.json()
                logger.info(f"Encontradas {len(disputes)} disputas para administrador")
                return [DisputeWithPaymentInfo(**dispute) for dispute in disputes]
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo disputas para admin: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo disputas para admin: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/{dispute_id}", response_model=DisputeWithPaymentInfo)
async def get_dispute(
    dispute_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener información de una disputa específica.
    """
    current_user_id = current_user.get("sub")
    logger.info(f"Obteniendo disputa {dispute_id} para usuario {current_user_id}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes_with_payment_info?id=eq.{dispute_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                disputes = response.json()
                if not disputes:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Disputa no encontrada"
                    )
                
                dispute = disputes[0]
                
                # Verificar que el usuario tiene acceso a esta disputa
                if (not is_admin(current_user) and 
                    dispute["initiator_id"] != current_user_id and 
                    dispute["employer_id"] != current_user_id and 
                    dispute["worker_id"] != current_user_id):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para ver esta disputa"
                    )
                
                logger.info(f"Disputa {dispute_id} obtenida exitosamente")
                return DisputeWithPaymentInfo(**dispute)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo disputa: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo disputa: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.patch("/{dispute_id}", response_model=DisputeResponse)
async def update_dispute(
    dispute_id: str,
    dispute_update: DisputeUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar una disputa (solo para administradores).
    """
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden actualizar disputas"
        )
    
    current_user_id = current_user.get("sub")
    logger.info(f"Actualizando disputa {dispute_id} por administrador {current_user_id}")
    
    try:
        # Verificar que la disputa existe
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes?id=eq.{dispute_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                disputes = response.json()
                if not disputes:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Disputa no encontrada"
                    )
                
                dispute = disputes[0]
                
                # Preparar datos de actualización
                update_data = {
                    "status": dispute_update.status.value,
                    "admin_notes": dispute_update.admin_notes,
                    "resolution": dispute_update.resolution
                }
                
                # Si se resuelve la disputa, agregar información de resolución
                if dispute_update.status == DisputeStatus.RESOLVED:
                    update_data["resolved_by"] = current_user_id
                    update_data["resolved_at"] = datetime.now().isoformat()
                
                # Actualizar disputa
                update_response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/disputes?id=eq.{dispute_id}",
                    json=update_data,
                    headers=SUPABASE_HEADERS
                )
                
                if update_response.status_code == 200:
                    updated_dispute = update_response.json()[0]
                    
                    # Si se resuelve la disputa, actualizar el estado del pago
                    if dispute_update.status == DisputeStatus.RESOLVED:
                        # Determinar el nuevo estado del pago basado en la resolución
                        new_payment_status = "released" if "favor" in dispute_update.resolution.lower() else "refunded"
                        
                        await client.patch(
                            f"{SUPABASE_URL}/rest/v1/payments?id=eq.{dispute['payment_id']}",
                            json={"status": new_payment_status},
                            headers=SUPABASE_HEADERS
                        )
                    
                    # Crear notificaciones para las partes involucradas
                    try:
                        import sys
                        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
                        from notification_service import notification_service
                        
                        payment = await get_payment_info(dispute["payment_id"])
                        if payment:
                            # Notificar a ambas partes
                            await notification_service.notify_dispute_resolved(
                                user_id=dispute["initiator_id"],
                                dispute_id=dispute_id,
                                resolution=dispute_update.resolution,
                                admin_notes=dispute_update.admin_notes
                            )
                            
                            other_party_id = payment["worker_id"] if dispute["initiator_id"] == payment["employer_id"] else payment["employer_id"]
                            await notification_service.notify_dispute_resolved(
                                user_id=other_party_id,
                                dispute_id=dispute_id,
                                resolution=dispute_update.resolution,
                                admin_notes=dispute_update.admin_notes
                            )
                            
                            logger.info(f"Notificaciones de disputa resuelta enviadas")
                    except Exception as e:
                        logger.error(f"Error enviando notificaciones de disputa resuelta: {e}")
                    
                    logger.info(f"Disputa {dispute_id} actualizada exitosamente")
                    return DisputeResponse(**updated_dispute)
                else:
                    raise HTTPException(status_code=update_response.status_code, detail=update_response.text)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error actualizando disputa: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado actualizando disputa: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.post("/{dispute_id}/evidence", response_model=DisputeEvidence)
async def upload_evidence(
    dispute_id: str,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Subir evidencia para una disputa.
    """
    current_user_id = current_user.get("sub")
    logger.info(f"Subiendo evidencia para disputa {dispute_id} por usuario {current_user_id}")
    
    try:
        # Verificar que la disputa existe y el usuario tiene acceso
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes?id=eq.{dispute_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                disputes = response.json()
                if not disputes:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Disputa no encontrada"
                    )
                
                dispute = disputes[0]
                
                # Verificar que el usuario tiene acceso a esta disputa
                if (not is_admin(current_user) and 
                    dispute["initiator_id"] != current_user_id):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Solo el iniciador de la disputa puede subir evidencia"
                    )
                
                # Subir archivo
                file_url = await upload_evidence_file(file, dispute_id)
                if not file_url:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Error subiendo archivo"
                    )
                
                # Determinar tipo de archivo
                file_type = "image" if file.content_type and file.content_type.startswith("image/") else "document"
                
                # Crear registro de evidencia
                evidence_record = {
                    "dispute_id": dispute_id,
                    "file_url": file_url,
                    "file_type": file_type,
                    "description": description,
                    "uploaded_by": current_user_id
                }
                
                evidence_response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/dispute_evidence",
                    json=evidence_record,
                    headers=SUPABASE_HEADERS
                )
                
                if evidence_response.status_code == 201:
                    created_evidence = evidence_response.json()[0]
                    logger.info(f"Evidencia subida exitosamente: {created_evidence['id']}")
                    return DisputeEvidence(**created_evidence)
                else:
                    raise HTTPException(status_code=evidence_response.status_code, detail=evidence_response.text)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error subiendo evidencia: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado subiendo evidencia: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")

@router.get("/{dispute_id}/evidence", response_model=List[DisputeEvidence])
async def get_dispute_evidence(
    dispute_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener evidencia de una disputa.
    """
    current_user_id = current_user.get("sub")
    logger.info(f"Obteniendo evidencia para disputa {dispute_id} por usuario {current_user_id}")
    
    try:
        # Verificar que la disputa existe y el usuario tiene acceso
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/disputes?id=eq.{dispute_id}&select=*",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                disputes = response.json()
                if not disputes:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Disputa no encontrada"
                    )
                
                dispute = disputes[0]
                
                # Verificar que el usuario tiene acceso a esta disputa
                if (not is_admin(current_user) and 
                    dispute["initiator_id"] != current_user_id):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para ver la evidencia de esta disputa"
                    )
                
                # Obtener evidencia
                evidence_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/dispute_evidence?dispute_id=eq.{dispute_id}&select=*&order=created_at.desc",
                    headers=SUPABASE_HEADERS
                )
                
                if evidence_response.status_code == 200:
                    evidence_list = evidence_response.json()
                    logger.info(f"Encontrada {len(evidence_list)} evidencia para disputa {dispute_id}")
                    return [DisputeEvidence(**evidence) for evidence in evidence_list]
                else:
                    raise HTTPException(status_code=evidence_response.status_code, detail=evidence_response.text)
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
                
    except httpx.HTTPStatusError as e:
        logger.error(f"Error obteniendo evidencia: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error inesperado obteniendo evidencia: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor")



