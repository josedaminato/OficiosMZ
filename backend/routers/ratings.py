"""
Módulo de Calificaciones - Oficios MZ
Endpoints para gestionar calificaciones entre usuarios después de completar trabajos.
"""

import logging
import httpx
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from datetime import datetime
import os
import sys

# Agregar el directorio services al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
from notification_service import notification_service

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
router = APIRouter(prefix="/api/ratings", tags=["ratings"])

# =====================================================
# MODELOS PYDANTIC
# =====================================================

class RatingCreate(BaseModel):
    """Modelo para crear una nueva calificación"""
    job_id: str = Field(..., description="ID del trabajo completado")
    rated_id: str = Field(..., description="ID del usuario a calificar")
    score: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    comment: Optional[str] = Field(None, max_length=500, description="Comentario opcional")
    
    @validator('score')
    def validate_score(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('La calificación debe estar entre 1 y 5')
        return v
    
    @validator('comment')
    def validate_comment(cls, v):
        if v is not None and len(v.strip()) == 0:
            return None
        return v

class RatingResponse(BaseModel):
    """Modelo de respuesta para una calificación"""
    id: str
    job_id: str
    rater_id: str
    rated_id: str
    score: int
    comment: Optional[str]
    created_at: datetime

class RatingWithDetails(RatingResponse):
    """Modelo de respuesta con detalles adicionales"""
    rater_name: str
    rater_avatar: Optional[str]
    job_title: str
    job_budget: Optional[float]

class RatingSummary(BaseModel):
    """Modelo para resumen de calificaciones de un usuario"""
    user_id: str
    average_rating: float
    total_ratings: int
    rating_breakdown: dict  # {1: count, 2: count, ..., 5: count}

# =====================================================
# FUNCIONES AUXILIARES
# =====================================================

async def get_user_name(user_id: str) -> Optional[str]:
    """
    Obtener el nombre de un usuario por su ID
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Nombre del usuario o None si no se encuentra
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}&select=full_name",
                headers=SUPABASE_HEADERS
            )
            
            if response.status_code == 200:
                users = response.json()
                if users:
                    return users[0].get("full_name")
            
            return None
            
    except Exception as e:
        logger.error(f"Error obteniendo nombre de usuario {user_id}: {e}")
        return None

async def get_current_user(authorization: str = None) -> dict:
    """
    Obtiene el usuario actual desde el token JWT.
    Esta función debe ser importada desde main.py o definida aquí.
    """
    # Importar la función de verificación desde main.py
    from main import verify_jwt_token
    return verify_jwt_token(authorization)

async def validate_job_exists(job_id: str) -> dict:
    """
    Valida que el trabajo existe y está completado.
    
    Args:
        job_id: ID del trabajo a validar
        
    Returns:
        dict: Datos del trabajo si existe y está completado
        
    Raises:
        HTTPException: Si el trabajo no existe o no está completado
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/requests",
                headers=SUPABASE_HEADERS,
                params={"id": f"eq.{job_id}"}
            )
            
            if response.status_code != 200:
                logger.error(f"Error al consultar trabajo {job_id}: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Error al validar el trabajo"
                )
            
            jobs = response.json()
            if not jobs:
                raise HTTPException(
                    status_code=404,
                    detail="Trabajo no encontrado"
                )
            
            job = jobs[0]
            if job.get("status") != "completado":
                raise HTTPException(
                    status_code=400,
                    detail="Solo se pueden calificar trabajos completados"
                )
            
            return job
            
    except httpx.RequestError as e:
        logger.error(f"Error de conexión al validar trabajo {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error de conexión con la base de datos"
        )

async def validate_user_participated_in_job(job: dict, user_id: str) -> bool:
    """
    Valida que el usuario participó en el trabajo.
    
    Args:
        job: Datos del trabajo
        user_id: ID del usuario a validar
        
    Returns:
        bool: True si el usuario participó en el trabajo
    """
    client_id = job.get("client_id")
    worker_id = job.get("worker_id")
    
    return str(client_id) == user_id or str(worker_id) == user_id

async def check_existing_rating(job_id: str, rater_id: str) -> bool:
    """
    Verifica si ya existe una calificación para este trabajo por este usuario.
    
    Args:
        job_id: ID del trabajo
        rater_id: ID del usuario que califica
        
    Returns:
        bool: True si ya existe una calificación
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/ratings",
                headers=SUPABASE_HEADERS,
                params={
                    "job_id": f"eq.{job_id}",
                    "rater_id": f"eq.{rater_id}"
                }
            )
            
            if response.status_code == 200:
                ratings = response.json()
                return len(ratings) > 0
            
            return False
            
    except httpx.RequestError as e:
        logger.error(f"Error al verificar calificación existente: {str(e)}")
        return False

async def create_rating_record(rating_data: RatingCreate, rater_id: str) -> dict:
    """
    Crea un nuevo registro de calificación en la base de datos.
    
    Args:
        rating_data: Datos de la calificación
        rater_id: ID del usuario que califica
        
    Returns:
        dict: Datos de la calificación creada
    """
    try:
        rating_payload = {
            "job_id": rating_data.job_id,
            "rater_id": rater_id,
            "rated_id": rating_data.rated_id,
            "score": rating_data.score,
            "comment": rating_data.comment
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/ratings",
                headers=SUPABASE_HEADERS,
                json=rating_payload
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Error al crear calificación: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Error al crear la calificación"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        logger.error(f"Error de conexión al crear calificación: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error de conexión con la base de datos"
        )

async def get_user_ratings(user_id: str) -> List[dict]:
    """
    Obtiene todas las calificaciones recibidas por un usuario.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        List[dict]: Lista de calificaciones con detalles
    """
    try:
        async with httpx.AsyncClient() as client:
            # Query con joins para obtener información del evaluador y trabajo
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/ratings",
                headers=SUPABASE_HEADERS,
                params={
                    "rated_id": f"eq.{user_id}",
                    "select": """
                        *,
                        rater:profiles!ratings_rater_id_fkey(
                            full_name,
                            avatar_url
                        ),
                        job:requests!ratings_job_id_fkey(
                            title,
                            budget
                        )
                    """,
                    "order": "created_at.desc"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error al obtener calificaciones: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Error al obtener calificaciones"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        logger.error(f"Error de conexión al obtener calificaciones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error de conexión con la base de datos"
        )

async def calculate_rating_summary(user_id: str) -> dict:
    """
    Calcula el resumen de calificaciones para un usuario.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        dict: Resumen con promedio, total y desglose
    """
    try:
        async with httpx.AsyncClient() as client:
            # Obtener todas las calificaciones del usuario
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/ratings",
                headers=SUPABASE_HEADERS,
                params={
                    "rated_id": f"eq.{user_id}",
                    "select": "score"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Error al calcular resumen: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Error al calcular resumen de calificaciones"
                )
            
            ratings = response.json()
            
            if not ratings:
                return {
                    "user_id": user_id,
                    "average_rating": 0.0,
                    "total_ratings": 0,
                    "rating_breakdown": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
                }
            
            # Calcular estadísticas
            scores = [rating["score"] for rating in ratings]
            total = len(scores)
            average = sum(scores) / total
            
            # Desglose por calificaciones
            breakdown = {i: scores.count(i) for i in range(1, 6)}
            
            return {
                "user_id": user_id,
                "average_rating": round(average, 2),
                "total_ratings": total,
                "rating_breakdown": breakdown
            }
            
    except httpx.RequestError as e:
        logger.error(f"Error de conexión al calcular resumen: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error de conexión con la base de datos"
        )

# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def create_rating(
    rating_data: RatingCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear una nueva calificación.
    
    Solo se puede calificar después de que el trabajo esté completado.
    Un usuario no puede calificarse a sí mismo.
    Solo se permite una calificación por trabajo por usuario.
    """
    try:
        rater_id = current_user.get("user_id")
        if not rater_id:
            raise HTTPException(
                status_code=401,
                detail="Usuario no autenticado correctamente"
            )
        
        # Validar que no se está calificando a sí mismo
        if rater_id == rating_data.rated_id:
            raise HTTPException(
                status_code=400,
                detail="No puedes calificarte a ti mismo"
            )
        
        # Validar que el trabajo existe y está completado
        job = await validate_job_exists(rating_data.job_id)
        
        # Validar que el usuario participó en el trabajo
        if not await validate_user_participated_in_job(job, rater_id):
            raise HTTPException(
                status_code=403,
                detail="Solo puedes calificar trabajos en los que participaste"
            )
        
        # Validar que el usuario a calificar también participó en el trabajo
        if not await validate_user_participated_in_job(job, rating_data.rated_id):
            raise HTTPException(
                status_code=400,
                detail="El usuario a calificar no participó en este trabajo"
            )
        
        # Verificar que no se ha calificado antes
        if await check_existing_rating(rating_data.job_id, rater_id):
            raise HTTPException(
                status_code=400,
                detail="Ya has calificado este trabajo"
            )
        
        # Crear la calificación
        rating = await create_rating_record(rating_data, rater_id)
        
        # Crear notificación automática para el usuario calificado
        try:
            # Obtener información del trabajo y del evaluador
            job_title = job.get("title", "Trabajo")
            rater_name = await get_user_name(rater_id)
            
            await notification_service.notify_rating_received(
                rated_user_id=rating_data.rated_id,
                rater_name=rater_name or "Un usuario",
                score=rating_data.score,
                job_title=job_title,
                rating_id=rating["id"],
                job_id=rating_data.job_id
            )
            
            logger.info(f"Notificación de calificación enviada a usuario {rating_data.rated_id}")
            
        except Exception as e:
            # No fallar la creación de la calificación si falla la notificación
            logger.error(f"Error enviando notificación de calificación: {e}")
        
        logger.info(f"Calificación creada: {rating['id']} por usuario {rater_id}")
        
        return RatingResponse(**rating)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado al crear calificación: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/user/{user_id}", response_model=List[RatingWithDetails])
async def get_user_ratings_endpoint(user_id: str):
    """
    Obtener todas las calificaciones recibidas por un usuario.
    
    Incluye información del evaluador y del trabajo.
    """
    try:
        ratings = await get_user_ratings(user_id)
        
        # Transformar los datos para incluir información adicional
        detailed_ratings = []
        for rating in ratings:
            rater_info = rating.get("rater", {})
            job_info = rating.get("job", {})
            
            detailed_rating = {
                "id": rating["id"],
                "job_id": rating["job_id"],
                "rater_id": rating["rater_id"],
                "rated_id": rating["rated_id"],
                "score": rating["score"],
                "comment": rating.get("comment"),
                "created_at": rating["created_at"],
                "rater_name": rater_info.get("full_name", "Usuario"),
                "rater_avatar": rater_info.get("avatar_url"),
                "job_title": job_info.get("title", "Trabajo"),
                "job_budget": job_info.get("budget")
            }
            
            detailed_ratings.append(detailed_rating)
        
        return detailed_ratings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado al obtener calificaciones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/user/{user_id}/average", response_model=RatingSummary)
async def get_user_rating_average(user_id: str):
    """
    Obtener el promedio de calificaciones y estadísticas de un usuario.
    
    Incluye promedio, total de calificaciones y desglose por puntuación.
    """
    try:
        summary = await calculate_rating_summary(user_id)
        return RatingSummary(**summary)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado al calcular promedio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.get("/health")
async def ratings_health_check():
    """
    Endpoint de verificación de salud del módulo de calificaciones.
    """
    return {
        "status": "healthy",
        "module": "ratings",
        "timestamp": datetime.now().isoformat()
    }
