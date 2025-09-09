"""
Router de Analytics para Oficios MZ
Endpoints para métricas, KPIs y reportes
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import logging
import csv
import io
import json

from services.auth_service import AuthService
from services.analytics_service import AnalyticsService

# Configurar logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Inicializar servicio de analytics
analytics_service = AnalyticsService()

# Modelos Pydantic
class DateRange(BaseModel):
    """Rango de fechas para consultas"""
    start_date: date = Field(..., description="Fecha de inicio")
    end_date: date = Field(..., description="Fecha de fin")

class EventTracking(BaseModel):
    """Modelo para tracking de eventos"""
    event_type: str = Field(..., description="Tipo de evento")
    payload: Dict[str, Any] = Field(default={}, description="Datos del evento")
    session_id: Optional[str] = Field(None, description="ID de sesión")
    device_info: Optional[Dict[str, str]] = Field(None, description="Información del dispositivo")

class ConsentRequest(BaseModel):
    """Modelo para consentimiento de tracking"""
    consent: bool = Field(..., description="Consentimiento dado")
    ip_address: Optional[str] = Field(None, description="Dirección IP")
    user_agent: Optional[str] = Field(None, description="User Agent")

# =====================================================
# MIDDLEWARE DE AUTENTICACIÓN Y ROLES
# =====================================================

async def get_current_user_admin(current_user: dict = Depends(AuthService.get_current_user)):
    """Verificar que el usuario sea administrador"""
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado. Se requiere rol de administrador."
        )
    return current_user

async def get_current_user_or_anon(current_user: dict = Depends(AuthService.get_current_user)):
    """Permitir usuarios autenticados o anónimos"""
    return current_user

# =====================================================
# ENDPOINTS DE MÉTRICAS PRINCIPALES
# =====================================================

@router.get("/kpis")
async def get_kpis(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener KPIs principales (DAU, WAU, MAU, retención, PWA, pagos, disputas)
    """
    try:
        # Validar rango de fechas
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la fecha de fin")
        
        if (end_date - start_date).days > 365:
            raise HTTPException(status_code=400, detail="El rango de fechas no puede exceder 365 días")
        
        # Obtener métricas
        user_metrics = await analytics_service.get_user_metrics(start_date, end_date)
        retention_metrics = await analytics_service.get_retention_metrics(start_date, end_date)
        session_metrics = await analytics_service.get_session_metrics(start_date, end_date)
        quality_metrics = await analytics_service.get_quality_metrics(start_date, end_date)
        ops_metrics = await analytics_service.get_ops_metrics(start_date, end_date)
        
        # Combinar métricas
        kpis = {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "user_metrics": user_metrics,
            "retention_metrics": retention_metrics,
            "session_metrics": session_metrics,
            "quality_metrics": quality_metrics,
            "ops_metrics": ops_metrics,
            "generated_at": datetime.now().isoformat()
        }
        
        return kpis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo KPIs: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/funnel")
async def get_funnel_metrics(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    segment: Optional[str] = Query(None, description="Segmento (oficio, zona, etc.)"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener métricas de embudo de conversión
    """
    try:
        funnel_data = await analytics_service.get_funnel_metrics(start_date, end_date, segment)
        
        return {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "segment": segment or "all",
            "funnel_data": funnel_data,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo métricas de embudo: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/quality")
async def get_quality_metrics(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener métricas de calidad y reputación
    """
    try:
        quality_data = await analytics_service.get_quality_metrics(start_date, end_date)
        
        return {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "quality_metrics": quality_data,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo métricas de calidad: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/ops")
async def get_ops_metrics(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener métricas operacionales
    """
    try:
        ops_data = await analytics_service.get_ops_metrics(start_date, end_date)
        
        return {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "ops_metrics": ops_data,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo métricas operacionales: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/geo")
async def get_geo_metrics(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener métricas de geolocalización
    """
    try:
        geo_data = await analytics_service.get_geo_metrics(start_date, end_date)
        
        return {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "geo_metrics": geo_data,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo métricas de geolocalización: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/performance")
async def get_performance_metrics(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener métricas de rendimiento
    """
    try:
        perf_data = await analytics_service.get_performance_metrics(start_date, end_date)
        
        return {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "performance_metrics": perf_data,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo métricas de rendimiento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =====================================================
# ENDPOINTS DE MÉTRICAS PERSONALIZADAS
# =====================================================

@router.get("/user-kpis")
async def get_user_kpis(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener KPIs personalizados para el usuario actual
    """
    try:
        user_id = current_user.get('id') or current_user.get('user_id')
        if not user_id:
            raise HTTPException(status_code=400, detail="ID de usuario no encontrado")
        
        user_kpis = await analytics_service.get_user_kpis(user_id, start_date, end_date)
        
        return {
            "user_id": user_id,
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "user_kpis": user_kpis,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo KPIs de usuario: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =====================================================
# ENDPOINTS DE TRACKING DE EVENTOS
# =====================================================

@router.post("/track-event")
async def track_event(
    event_data: EventTracking,
    current_user: dict = Depends(get_current_user_or_anon)
):
    """
    Registrar un evento de tracking
    """
    try:
        # Verificar consentimiento si el usuario está autenticado
        user_id = current_user.get('id') or current_user.get('user_id')
        if user_id:
            consent = await analytics_service.get_consent_status(user_id)
            if not consent:
                raise HTTPException(status_code=403, detail="Consentimiento de tracking requerido")
        
        # Registrar evento
        success = await analytics_service.track_event(
            user_id=user_id,
            event_type=event_data.event_type,
            payload=event_data.payload,
            session_id=event_data.session_id,
            device_info=event_data.device_info
        )
        
        if success:
            return {"message": "Evento registrado exitosamente"}
        else:
            raise HTTPException(status_code=500, detail="Error registrando evento")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registrando evento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/consent-status")
async def get_consent_status(
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Obtener estado de consentimiento de tracking
    """
    try:
        user_id = current_user.get('id') or current_user.get('user_id')
        if not user_id:
            raise HTTPException(status_code=400, detail="ID de usuario no encontrado")
        
        consent = await analytics_service.get_consent_status(user_id)
        
        return {
            "user_id": user_id,
            "consent_given": consent,
            "checked_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verificando consentimiento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("/consent")
async def set_consent_status(
    consent_data: ConsentRequest,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Establecer estado de consentimiento de tracking
    """
    try:
        user_id = current_user.get('id') or current_user.get('user_id')
        if not user_id:
            raise HTTPException(status_code=400, detail="ID de usuario no encontrado")
        
        success = await analytics_service.set_consent_status(
            user_id=user_id,
            consent=consent_data.consent,
            ip_address=consent_data.ip_address,
            user_agent=consent_data.user_agent
        )
        
        if success:
            return {"message": "Consentimiento actualizado exitosamente"}
        else:
            raise HTTPException(status_code=500, detail="Error actualizando consentimiento")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando consentimiento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =====================================================
# ENDPOINTS DE EXPORTACIÓN
# =====================================================

@router.get("/export.csv")
async def export_analytics_csv(
    report_type: str = Query(..., description="Tipo de reporte (kpis, funnel, quality, ops, geo)"),
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Exportar datos de analytics en formato CSV
    """
    try:
        # Obtener datos según el tipo de reporte
        if report_type == "kpis":
            data = await analytics_service.get_user_metrics(start_date, end_date)
            filename = f"kpis_{start_date}_{end_date}.csv"
        elif report_type == "funnel":
            data = await analytics_service.get_funnel_metrics(start_date, end_date)
            filename = f"funnel_{start_date}_{end_date}.csv"
        elif report_type == "quality":
            data = await analytics_service.get_quality_metrics(start_date, end_date)
            filename = f"quality_{start_date}_{end_date}.csv"
        elif report_type == "ops":
            data = await analytics_service.get_ops_metrics(start_date, end_date)
            filename = f"ops_{start_date}_{end_date}.csv"
        elif report_type == "geo":
            data = await analytics_service.get_geo_metrics(start_date, end_date)
            filename = f"geo_{start_date}_{end_date}.csv"
        else:
            raise HTTPException(status_code=400, detail="Tipo de reporte no válido")
        
        # Crear CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escribir headers y datos
        if isinstance(data, dict):
            writer.writerow(["metric", "value"])
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    writer.writerow([key, json.dumps(value)])
                else:
                    writer.writerow([key, value])
        elif isinstance(data, list):
            if data and isinstance(data[0], dict):
                writer.writerow(data[0].keys())
                for row in data:
                    writer.writerow(row.values())
        
        # Preparar respuesta
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exportando CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# =====================================================
# ENDPOINTS DE MANTENIMIENTO
# =====================================================

@router.post("/refresh-views")
async def refresh_materialized_views(
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Refrescar vistas materializadas
    """
    try:
        success = await analytics_service.refresh_materialized_views()
        
        if success:
            return {"message": "Vistas materializadas refrescadas exitosamente"}
        else:
            raise HTTPException(status_code=500, detail="Error refrescando vistas")
            
    except Exception as e:
        logger.error(f"Error refrescando vistas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/health")
async def health_check():
    """
    Health check para el servicio de analytics
    """
    try:
        # Verificar conexión a Supabase
        supabase_status = "connected"
        try:
            analytics_service.supabase.table('events').select('id').limit(1).execute()
        except:
            supabase_status = "disconnected"
        
        # Verificar conexión a Redis
        redis_status = "connected"
        try:
            analytics_service.redis.ping()
        except:
            redis_status = "disconnected"
        
        return {
            "status": "healthy" if supabase_status == "connected" and redis_status == "connected" else "unhealthy",
            "service": "analytics",
            "timestamp": datetime.now().isoformat(),
            "supabase": supabase_status,
            "redis": redis_status
        }
        
    except Exception as e:
        logger.error(f"Error en health check: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "analytics",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# =====================================================
# ENDPOINTS DE DASHBOARD
# =====================================================

@router.get("/dashboard")
async def get_dashboard_data(
    start_date: date = Query(..., description="Fecha de inicio"),
    end_date: date = Query(..., description="Fecha de fin"),
    current_user: dict = Depends(get_current_user_admin)
):
    """
    Obtener datos completos para el dashboard de analytics
    """
    try:
        # Obtener todas las métricas en paralelo
        user_metrics = await analytics_service.get_user_metrics(start_date, end_date)
        funnel_metrics = await analytics_service.get_funnel_metrics(start_date, end_date)
        quality_metrics = await analytics_service.get_quality_metrics(start_date, end_date)
        ops_metrics = await analytics_service.get_ops_metrics(start_date, end_date)
        geo_metrics = await analytics_service.get_geo_metrics(start_date, end_date)
        performance_metrics = await analytics_service.get_performance_metrics(start_date, end_date)
        
        dashboard_data = {
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "user_metrics": user_metrics,
            "funnel_metrics": funnel_metrics,
            "quality_metrics": quality_metrics,
            "ops_metrics": ops_metrics,
            "geo_metrics": geo_metrics,
            "performance_metrics": performance_metrics,
            "generated_at": datetime.now().isoformat()
        }
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"Error obteniendo datos del dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
