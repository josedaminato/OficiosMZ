"""
Router para búsqueda avanzada de trabajadores
Incluye filtros combinables, autocompletado, cache con Redis y analytics
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import json
import redis
import asyncio
from datetime import datetime, timedelta
import hashlib
import os

from services.auth_service import AuthService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["advanced-search"])

# Configuración Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Modelos Pydantic
class SearchFilters(BaseModel):
    """Filtros de búsqueda avanzada"""
    search_text: Optional[str] = Field(None, description="Texto de búsqueda general")
    oficio: Optional[str] = Field(None, description="Filtro por oficio específico")
    location: Optional[str] = Field(None, description="Filtro por ubicación")
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="Rating mínimo")
    max_hourly_rate: Optional[float] = Field(None, ge=0, description="Precio máximo por hora")
    min_hourly_rate: Optional[float] = Field(None, ge=0, description="Precio mínimo por hora")
    max_service_rate: Optional[float] = Field(None, ge=0, description="Precio máximo por servicio")
    min_service_rate: Optional[float] = Field(None, ge=0, description="Precio mínimo por servicio")
    is_available: Optional[bool] = Field(None, description="Filtro por disponibilidad")
    radius_km: Optional[int] = Field(50, ge=1, le=200, description="Radio de búsqueda en km")
    user_lat: Optional[float] = Field(None, ge=-90, le=90, description="Latitud del usuario")
    user_lng: Optional[float] = Field(None, ge=-180, le=180, description="Longitud del usuario")

class SearchRequest(BaseModel):
    """Request de búsqueda"""
    filters: SearchFilters
    page: int = Field(1, ge=1, description="Página de resultados")
    limit: int = Field(20, ge=1, le=100, description="Límite de resultados por página")
    sort_by: Optional[str] = Field("relevance", description="Criterio de ordenamiento")

class SearchResponse(BaseModel):
    """Response de búsqueda"""
    workers: List[Dict[str, Any]]
    total_count: int
    page: int
    limit: int
    total_pages: int
    has_more: bool
    search_time_ms: float
    cached: bool = False

class SuggestionRequest(BaseModel):
    """Request de sugerencias"""
    query: str = Field(..., min_length=1, max_length=100)
    type: Optional[str] = Field("all", description="Tipo de sugerencia: oficio, location, all")

class SuggestionResponse(BaseModel):
    """Response de sugerencias"""
    suggestions: List[Dict[str, Any]]
    query: str
    type: str

class SavedSearchRequest(BaseModel):
    """Request para guardar búsqueda"""
    search_name: str = Field(..., min_length=1, max_length=100)
    filters: SearchFilters

class SavedSearchResponse(BaseModel):
    """Response de búsqueda guardada"""
    id: str
    search_name: str
    filters: SearchFilters
    created_at: datetime

# Funciones auxiliares
def generate_cache_key(filters: SearchFilters, page: int, limit: int) -> str:
    """Generar clave de cache para la búsqueda"""
    cache_data = {
        "filters": filters.dict(exclude_none=True),
        "page": page,
        "limit": limit
    }
    cache_string = json.dumps(cache_data, sort_keys=True)
    return f"search:{hashlib.md5(cache_string.encode()).hexdigest()}"

def sanitize_search_text(text: str) -> str:
    """Sanitizar texto de búsqueda para prevenir inyección"""
    if not text:
        return ""
    
    # Remover caracteres especiales peligrosos
    dangerous_chars = [';', '--', '/*', '*/', 'xp_', 'sp_']
    for char in dangerous_chars:
        text = text.replace(char, '')
    
    # Limitar longitud
    return text[:100].strip()

async def get_workers_from_db(filters: SearchFilters, page: int, limit: int) -> Dict[str, Any]:
    """Obtener trabajadores desde la base de datos"""
    try:
        # Importar supabase client
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        # Construir consulta
        query = supabase.table('workers').select('*')
        
        # Aplicar filtros
        if filters.search_text:
            sanitized_text = sanitize_search_text(filters.search_text)
            if sanitized_text:
                # Usar función de búsqueda full-text
                query = query.text_search('oficio,description', sanitized_text)
        
        if filters.oficio:
            query = query.ilike('oficio', f'%{filters.oficio}%')
        
        if filters.location:
            query = query.or_(f'location_city.ilike.%{filters.location}%,location_province.ilike.%{filters.location}%')
        
        if filters.min_rating is not None:
            query = query.gte('rating', filters.min_rating)
        
        if filters.max_hourly_rate is not None:
            query = query.lte('hourly_rate', filters.max_hourly_rate)
        
        if filters.min_hourly_rate is not None:
            query = query.gte('hourly_rate', filters.min_hourly_rate)
        
        if filters.max_service_rate is not None:
            query = query.lte('service_rate', filters.max_service_rate)
        
        if filters.min_service_rate is not None:
            query = query.gte('service_rate', filters.min_service_rate)
        
        if filters.is_available is not None:
            query = query.eq('is_available', filters.is_available)
        
        # Solo trabajadores verificados
        query = query.eq('verification_status', 'verified')
        
        # Aplicar paginación
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        # Ordenar por rating descendente
        query = query.order('rating', desc=True)
        
        # Ejecutar consulta
        response = query.execute()
        
        # Obtener total count
        count_query = supabase.table('workers').select('id', count='exact')
        # Aplicar mismos filtros para count
        if filters.search_text:
            sanitized_text = sanitize_search_text(filters.search_text)
            if sanitized_text:
                count_query = count_query.text_search('oficio,description', sanitized_text)
        
        if filters.oficio:
            count_query = count_query.ilike('oficio', f'%{filters.oficio}%')
        
        if filters.location:
            count_query = count_query.or_(f'location_city.ilike.%{filters.location}%,location_province.ilike.%{filters.location}%')
        
        if filters.min_rating is not None:
            count_query = count_query.gte('rating', filters.min_rating)
        
        if filters.max_hourly_rate is not None:
            count_query = count_query.lte('hourly_rate', filters.max_hourly_rate)
        
        if filters.min_hourly_rate is not None:
            count_query = count_query.gte('hourly_rate', filters.min_hourly_rate)
        
        if filters.max_service_rate is not None:
            count_query = count_query.lte('service_rate', filters.max_service_rate)
        
        if filters.min_service_rate is not None:
            count_query = count_query.gte('service_rate', filters.min_service_rate)
        
        if filters.is_available is not None:
            count_query = count_query.eq('is_available', filters.is_available)
        
        count_query = count_query.eq('verification_status', 'verified')
        
        count_response = count_query.execute()
        total_count = count_response.count if count_response.count else 0
        
        return {
            "workers": response.data or [],
            "total_count": total_count
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo trabajadores desde DB: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

async def get_suggestions_from_db(query: str, suggestion_type: str) -> List[Dict[str, Any]]:
    """Obtener sugerencias desde la base de datos"""
    try:
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        suggestions = []
        
        if suggestion_type in ['oficio', 'all']:
            # Obtener sugerencias de oficios
            oficio_query = supabase.table('workers').select('oficio').ilike('oficio', f'%{query}%').limit(10)
            oficio_response = oficio_query.execute()
            
            if oficio_response.data:
                oficio_suggestions = [{"suggestion": item['oficio'], "type": "oficio"} for item in oficio_response.data]
                suggestions.extend(oficio_suggestions)
        
        if suggestion_type in ['location', 'all']:
            # Obtener sugerencias de ubicaciones
            location_query = supabase.table('workers').select('location_city').ilike('location_city', f'%{query}%').limit(10)
            location_response = location_query.execute()
            
            if location_response.data:
                location_suggestions = [{"suggestion": item['location_city'], "type": "location"} for item in location_response.data]
                suggestions.extend(location_suggestions)
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Error obteniendo sugerencias desde DB: {str(e)}")
        return []

# Endpoints
@router.post("/workers", response_model=SearchResponse)
async def search_workers(
    search_request: SearchRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Búsqueda avanzada de trabajadores con filtros combinables
    """
    start_time = datetime.now()
    
    try:
        # Generar clave de cache
        cache_key = generate_cache_key(search_request.filters, search_request.page, search_request.limit)
        
        # Intentar obtener desde cache
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info(f"Resultado obtenido desde cache: {cache_key}")
            result = json.loads(cached_result)
            result["cached"] = True
            result["search_time_ms"] = (datetime.now() - start_time).total_seconds() * 1000
            return SearchResponse(**result)
        
        # Obtener desde base de datos
        db_result = await get_workers_from_db(search_request.filters, search_request.page, search_request.limit)
        
        # Calcular métricas
        total_pages = (db_result["total_count"] + search_request.limit - 1) // search_request.limit
        has_more = search_request.page < total_pages
        
        # Preparar respuesta
        result = {
            "workers": db_result["workers"],
            "total_count": db_result["total_count"],
            "page": search_request.page,
            "limit": search_request.limit,
            "total_pages": total_pages,
            "has_more": has_more,
            "search_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "cached": False
        }
        
        # Guardar en cache (TTL 10 minutos)
        redis_client.setex(cache_key, 600, json.dumps(result, default=str))
        
        # Registrar en analytics (background)
        background_tasks.add_task(
            log_search_analytics,
            search_request.filters.search_text or "",
            search_request.filters.dict(exclude_none=True),
            db_result["total_count"]
        )
        
        return SearchResponse(**result)
        
    except Exception as e:
        logger.error(f"Error en búsqueda de trabajadores: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/suggestions", response_model=SuggestionResponse)
async def get_search_suggestions(
    query: str = Query(..., min_length=1, max_length=100),
    type: str = Query("all", description="Tipo de sugerencia: oficio, location, all"),
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener sugerencias de autocompletado
    """
    try:
        # Sanitizar query
        sanitized_query = sanitize_search_text(query)
        if not sanitized_query:
            return SuggestionResponse(suggestions=[], query=query, type=type)
        
        # Generar clave de cache para sugerencias
        cache_key = f"suggestions:{type}:{hashlib.md5(sanitized_query.encode()).hexdigest()}"
        
        # Intentar obtener desde cache
        cached_suggestions = redis_client.get(cache_key)
        if cached_suggestions:
            suggestions = json.loads(cached_suggestions)
            return SuggestionResponse(suggestions=suggestions, query=query, type=type)
        
        # Obtener desde base de datos
        suggestions = await get_suggestions_from_db(sanitized_query, type)
        
        # Guardar en cache (TTL 5 minutos)
        redis_client.setex(cache_key, 300, json.dumps(suggestions))
        
        return SuggestionResponse(suggestions=suggestions, query=query, type=type)
        
    except Exception as e:
        logger.error(f"Error obteniendo sugerencias: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/saved", response_model=SavedSearchResponse)
async def save_search(
    saved_search_request: SavedSearchRequest,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Guardar búsqueda en el perfil del usuario
    """
    try:
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        # Verificar que no exista una búsqueda con el mismo nombre
        existing = supabase.table('saved_searches').select('id').eq('user_id', current_user['sub']).eq('search_name', saved_search_request.search_name).execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Ya existe una búsqueda guardada con este nombre")
        
        # Crear búsqueda guardada
        saved_search = {
            "user_id": current_user['sub'],
            "search_name": saved_search_request.search_name,
            "search_filters": saved_search_request.filters.dict(exclude_none=True),
            "is_active": True
        }
        
        response = supabase.table('saved_searches').insert(saved_search).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Error guardando búsqueda")
        
        saved_search_data = response.data[0]
        
        return SavedSearchResponse(
            id=saved_search_data['id'],
            search_name=saved_search_data['search_name'],
            filters=SearchFilters(**saved_search_data['search_filters']),
            created_at=datetime.fromisoformat(saved_search_data['created_at'].replace('Z', '+00:00'))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error guardando búsqueda: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/saved", response_model=List[SavedSearchResponse])
async def get_saved_searches(
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener búsquedas guardadas del usuario
    """
    try:
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        response = supabase.table('saved_searches').select('*').eq('user_id', current_user['sub']).eq('is_active', True).order('created_at', desc=True).execute()
        
        if not response.data:
            return []
        
        saved_searches = []
        for item in response.data:
            saved_searches.append(SavedSearchResponse(
                id=item['id'],
                search_name=item['search_name'],
                filters=SearchFilters(**item['search_filters']),
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))
            ))
        
        return saved_searches
        
    except Exception as e:
        logger.error(f"Error obteniendo búsquedas guardadas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.delete("/saved/{search_id}")
async def delete_saved_search(
    search_id: str,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Eliminar búsqueda guardada
    """
    try:
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        # Verificar que la búsqueda pertenece al usuario
        existing = supabase.table('saved_searches').select('id').eq('id', search_id).eq('user_id', current_user['sub']).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Búsqueda no encontrada")
        
        # Marcar como inactiva (soft delete)
        response = supabase.table('saved_searches').update({'is_active': False}).eq('id', search_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Error eliminando búsqueda")
        
        return {"message": "Búsqueda eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando búsqueda guardada: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/analytics")
async def get_search_analytics(
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener analytics de búsquedas (solo para administradores)
    """
    try:
        # Verificar que el usuario sea administrador
        if current_user.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        # Obtener estadísticas de búsqueda
        response = supabase.table('search_analytics').select('*').order('search_count', desc=True).limit(50).execute()
        
        if not response.data:
            return {"analytics": []}
        
        return {"analytics": response.data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/health")
async def health_check():
    """
    Health check para el servicio de búsqueda
    """
    try:
        # Verificar conexión a Redis
        redis_status = "connected" if redis_client.ping() else "disconnected"
        
        # Verificar conexión a Supabase
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        supabase_status = "connected"
        
        try:
            supabase.table('workers').select('id').limit(1).execute()
        except:
            supabase_status = "disconnected"
        
        return {
            "status": "healthy",
            "service": "advanced-search",
            "timestamp": datetime.now().isoformat(),
            "redis": redis_status,
            "supabase": supabase_status
        }
        
    except Exception as e:
        logger.error(f"Error en health check: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "advanced-search",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# Funciones de background
async def log_search_analytics(search_query: str, filters: Dict[str, Any], result_count: int):
    """Registrar búsqueda en analytics (background task)"""
    try:
        from services.supabase_service import get_supabase_client
        supabase = get_supabase_client()
        
        analytics_data = {
            "search_query": search_query,
            "filters": filters,
            "result_count": result_count,
            "search_count": 1,
            "last_searched": datetime.now().isoformat()
        }
        
        # Intentar insertar o actualizar
        supabase.table('search_analytics').upsert(analytics_data, on_conflict='search_query').execute()
        
    except Exception as e:
        logger.error(f"Error registrando analytics: {str(e)}")
