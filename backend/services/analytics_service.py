"""
Servicio de Analytics para Oficios MZ
Maneja cálculo de métricas, KPIs y reportes
"""

import os
import json
import logging
import redis
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional, Tuple
from decimal import Decimal
import asyncio

from .supabase_service import get_supabase_client

# Configurar logging
logger = logging.getLogger(__name__)

# Configuración Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class AnalyticsService:
    """Servicio centralizado para analytics y métricas"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.redis = redis_client
    
    # =====================================================
    # MÉTRICAS DE USO Y ENGAGEMENT
    # =====================================================
    
    async def get_user_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener métricas de usuarios (DAU, WAU, MAU)"""
        try:
            # Verificar cache
            cache_key = f"user_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Calcular métricas desde base de datos
            result = self.supabase.rpc('calculate_user_metrics', {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }).execute()
            
            metrics = {}
            for row in result.data:
                metrics[row['period']] = {
                    'unique_users': row['unique_users'],
                    'total_events': row['total_events']
                }
            
            # Cachear por 10 minutos
            self.redis.setex(cache_key, 600, json.dumps(metrics))
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculando métricas de usuario: {str(e)}")
            return {}
    
    async def get_retention_metrics(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Obtener métricas de retención D1/D7/D30"""
        try:
            cache_key = f"retention_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = self.supabase.rpc('calculate_retention', {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }).execute()
            
            # Cachear por 30 minutos
            self.redis.setex(cache_key, 1800, json.dumps(result.data))
            
            return result.data
            
        except Exception as e:
            logger.error(f"Error calculando métricas de retención: {str(e)}")
            return []
    
    async def get_session_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener métricas de sesiones"""
        try:
            cache_key = f"session_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Consultar sesiones activas
            sessions_result = self.supabase.table('user_sessions').select('*').gte('started_at', start_date.isoformat()).lte('started_at', end_date.isoformat()).execute()
            
            total_sessions = len(sessions_result.data)
            active_sessions = len([s for s in sessions_result.data if s.get('is_active', False)])
            avg_duration = sum(s.get('duration_seconds', 0) for s in sessions_result.data) / max(total_sessions, 1)
            avg_page_views = sum(s.get('page_views', 0) for s in sessions_result.data) / max(total_sessions, 1)
            
            metrics = {
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
                'avg_duration_seconds': round(avg_duration, 2),
                'avg_page_views': round(avg_page_views, 2)
            }
            
            # Cachear por 10 minutos
            self.redis.setex(cache_key, 600, json.dumps(metrics))
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculando métricas de sesión: {str(e)}")
            return {}
    
    # =====================================================
    # MÉTRICAS DE CONVERSIÓN
    # =====================================================
    
    async def get_funnel_metrics(self, start_date: date, end_date: date, segment: Optional[str] = None) -> Dict[str, Any]:
        """Obtener métricas de embudo de conversión"""
        try:
            cache_key = f"funnel_metrics:{start_date}:{end_date}:{segment or 'all'}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Construir filtros
            filters = {
                'created_at': f"gte.{start_date.isoformat()},lte.{end_date.isoformat()}"
            }
            
            if segment:
                filters['payload->segment'] = f"eq.{segment}"
            
            # Obtener eventos del embudo
            funnel_events = ['search_performed', 'search_result_click', 'request_created', 'payment_held', 'payment_released']
            
            funnel_data = {}
            for event_type in funnel_events:
                result = self.supabase.table('events').select('user_id').eq('type', event_type).gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
                
                if segment:
                    # Filtrar por segmento si se especifica
                    filtered_users = []
                    for event in result.data:
                        if event.get('payload', {}).get('segment') == segment:
                            filtered_users.append(event['user_id'])
                    funnel_data[event_type] = len(set(filtered_users))
                else:
                    funnel_data[event_type] = len(set(event['user_id'] for event in result.data))
            
            # Calcular tasas de conversión
            conversions = {}
            if funnel_data['search_performed'] > 0:
                conversions['search_to_click'] = round(funnel_data['search_result_click'] / funnel_data['search_performed'] * 100, 2)
            if funnel_data['search_result_click'] > 0:
                conversions['click_to_request'] = round(funnel_data['request_created'] / funnel_data['search_result_click'] * 100, 2)
            if funnel_data['request_created'] > 0:
                conversions['request_to_payment'] = round(funnel_data['payment_held'] / funnel_data['request_created'] * 100, 2)
            if funnel_data['payment_held'] > 0:
                conversions['payment_success'] = round(funnel_data['payment_released'] / funnel_data['payment_held'] * 100, 2)
            
            result_data = {
                'funnel_data': funnel_data,
                'conversions': conversions,
                'segment': segment or 'all'
            }
            
            # Cachear por 15 minutos
            self.redis.setex(cache_key, 900, json.dumps(result_data))
            
            return result_data
            
        except Exception as e:
            logger.error(f"Error calculando métricas de embudo: {str(e)}")
            return {}
    
    async def get_conversion_by_segment(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener conversión por segmento (oficio, zona)"""
        try:
            cache_key = f"conversion_by_segment:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Obtener eventos de búsqueda con segmentos
            search_events = self.supabase.table('events').select('payload').eq('type', 'search_performed').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            # Agrupar por oficio y zona
            oficio_conversions = {}
            zona_conversions = {}
            
            for event in search_events.data:
                payload = event.get('payload', {})
                oficio = payload.get('oficio', 'unknown')
                zona = payload.get('zona', 'unknown')
                
                if oficio not in oficio_conversions:
                    oficio_conversions[oficio] = {'searches': 0, 'conversions': 0}
                if zona not in zona_conversions:
                    zona_conversions[zona] = {'searches': 0, 'conversions': 0}
                
                oficio_conversions[oficio]['searches'] += 1
                zona_conversions[zona]['searches'] += 1
            
            # Obtener conversiones (requests creados)
            request_events = self.supabase.table('events').select('payload').eq('type', 'request_created').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            for event in request_events.data:
                payload = event.get('payload', {})
                oficio = payload.get('oficio', 'unknown')
                zona = payload.get('zona', 'unknown')
                
                if oficio in oficio_conversions:
                    oficio_conversions[oficio]['conversions'] += 1
                if zona in zona_conversions:
                    zona_conversions[zona]['conversions'] += 1
            
            # Calcular tasas de conversión
            for oficio, data in oficio_conversions.items():
                if data['searches'] > 0:
                    data['conversion_rate'] = round(data['conversions'] / data['searches'] * 100, 2)
                else:
                    data['conversion_rate'] = 0
            
            for zona, data in zona_conversions.items():
                if data['searches'] > 0:
                    data['conversion_rate'] = round(data['conversions'] / data['searches'] * 100, 2)
                else:
                    data['conversion_rate'] = 0
            
            result_data = {
                'by_oficio': oficio_conversions,
                'by_zona': zona_conversions
            }
            
            # Cachear por 20 minutos
            self.redis.setex(cache_key, 1200, json.dumps(result_data))
            
            return result_data
            
        except Exception as e:
            logger.error(f"Error calculando conversión por segmento: {str(e)}")
            return {}
    
    # =====================================================
    # MÉTRICAS DE CALIDAD Y REPUTACIÓN
    # =====================================================
    
    async def get_quality_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener métricas de calidad y reputación"""
        try:
            cache_key = f"quality_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Obtener ratings
            rating_events = self.supabase.table('events').select('payload').eq('type', 'rating_submitted').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            ratings = [float(event['payload'].get('score', 0)) for event in rating_events.data if event['payload'].get('score')]
            avg_rating = sum(ratings) / len(ratings) if ratings else 0
            
            # Obtener disputas
            dispute_events = self.supabase.table('events').select('payload').eq('type', 'dispute_opened').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            # Obtener trabajos completados (pagos liberados)
            completed_jobs = self.supabase.table('events').select('id').eq('type', 'payment_released').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            dispute_rate = len(dispute_events.data) / max(len(completed_jobs.data), 1) * 100 if completed_jobs.data else 0
            
            # Obtener tiempo de resolución de disputas
            resolved_disputes = self.supabase.table('events').select('payload').eq('type', 'dispute_resolved').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            resolution_times = []
            for event in resolved_disputes.data:
                payload = event.get('payload', {})
                if 'opened_at' in payload and 'resolved_at' in payload:
                    try:
                        opened = datetime.fromisoformat(payload['opened_at'].replace('Z', '+00:00'))
                        resolved = datetime.fromisoformat(payload['resolved_at'].replace('Z', '+00:00'))
                        resolution_time = (resolved - opened).total_seconds() / 3600  # en horas
                        resolution_times.append(resolution_time)
                    except:
                        continue
            
            avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
            
            metrics = {
                'avg_rating': round(avg_rating, 2),
                'total_ratings': len(ratings),
                'dispute_rate': round(dispute_rate, 2),
                'total_disputes': len(dispute_events.data),
                'avg_resolution_hours': round(avg_resolution_time, 2),
                'completed_jobs': len(completed_jobs.data)
            }
            
            # Cachear por 15 minutos
            self.redis.setex(cache_key, 900, json.dumps(metrics))
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculando métricas de calidad: {str(e)}")
            return {}
    
    # =====================================================
    # MÉTRICAS OPERACIONALES
    # =====================================================
    
    async def get_ops_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener métricas operacionales"""
        try:
            cache_key = f"ops_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Obtener métricas de chat
            chat_events = self.supabase.table('events').select('payload').eq('type', 'chat_message_sent').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            response_times = []
            for event in chat_events.data:
                payload = event.get('payload', {})
                if 'response_time' in payload:
                    try:
                        # Parsear tiempo de respuesta (formato HH:MM:SS)
                        time_str = payload['response_time']
                        if isinstance(time_str, str) and ':' in time_str:
                            parts = time_str.split(':')
                            if len(parts) == 3:
                                hours, minutes, seconds = map(int, parts)
                                total_seconds = hours * 3600 + minutes * 60 + seconds
                                response_times.append(total_seconds)
                    except:
                        continue
            
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            # Obtener métricas de notificaciones
            notification_delivered = self.supabase.table('events').select('id').eq('type', 'notification_delivered').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            notification_read = self.supabase.table('events').select('id').eq('type', 'notification_read').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            read_rate = len(notification_read.data) / max(len(notification_delivered.data), 1) * 100 if notification_delivered.data else 0
            
            # Obtener métricas de API (simuladas - en producción vendrían de logs)
            api_metrics = {
                'avg_response_time_ms': 250,  # Simulado
                'p95_response_time_ms': 800,  # Simulado
                'error_rate': 0.5,  # Simulado
                'total_requests': 10000  # Simulado
            }
            
            metrics = {
                'chat_messages': len(chat_events.data),
                'avg_chat_response_seconds': round(avg_response_time, 2),
                'notifications_delivered': len(notification_delivered.data),
                'notifications_read': len(notification_read.data),
                'notification_read_rate': round(read_rate, 2),
                'api_metrics': api_metrics
            }
            
            # Cachear por 10 minutos
            self.redis.setex(cache_key, 600, json.dumps(metrics))
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculando métricas operacionales: {str(e)}")
            return {}
    
    # =====================================================
    # MÉTRICAS DE GEOLOCALIZACIÓN
    # =====================================================
    
    async def get_geo_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener métricas de geolocalización"""
        try:
            cache_key = f"geo_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = self.supabase.rpc('calculate_geo_metrics', {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }).execute()
            
            # Cachear por 30 minutos
            self.redis.setex(cache_key, 1800, json.dumps(result.data))
            
            return {
                'by_location': result.data,
                'total_locations': len(result.data)
            }
            
        except Exception as e:
            logger.error(f"Error calculando métricas de geolocalización: {str(e)}")
            return {}
    
    # =====================================================
    # MÉTRICAS DE RENDIMIENTO
    # =====================================================
    
    async def get_performance_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener métricas de rendimiento"""
        try:
            cache_key = f"performance_metrics:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Obtener eventos de performance
            perf_events = self.supabase.table('events').select('payload').eq('type', 'performance_metric').gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            # Agrupar métricas por tipo
            metrics_by_type = {}
            for event in perf_events.data:
                payload = event.get('payload', {})
                metric_type = payload.get('metric_type', 'unknown')
                value = payload.get('value', 0)
                
                if metric_type not in metrics_by_type:
                    metrics_by_type[metric_type] = []
                metrics_by_type[metric_type].append(value)
            
            # Calcular promedios y percentiles
            performance_metrics = {}
            for metric_type, values in metrics_by_type.items():
                if values:
                    values.sort()
                    performance_metrics[metric_type] = {
                        'avg': round(sum(values) / len(values), 2),
                        'p50': round(values[len(values) // 2], 2),
                        'p95': round(values[int(len(values) * 0.95)], 2),
                        'p99': round(values[int(len(values) * 0.99)], 2),
                        'count': len(values)
                    }
            
            # Métricas simuladas para Web Vitals
            web_vitals = {
                'fcp_avg': 1.2,  # First Contentful Paint
                'tti_avg': 2.5,  # Time to Interactive
                'lcp_avg': 2.8,  # Largest Contentful Paint
                'cls_avg': 0.1,  # Cumulative Layout Shift
                'fid_avg': 100   # First Input Delay
            }
            
            result_data = {
                'performance_metrics': performance_metrics,
                'web_vitals': web_vitals,
                'total_measurements': sum(len(values) for values in metrics_by_type.values())
            }
            
            # Cachear por 15 minutos
            self.redis.setex(cache_key, 900, json.dumps(result_data))
            
            return result_data
            
        except Exception as e:
            logger.error(f"Error calculando métricas de rendimiento: {str(e)}")
            return {}
    
    # =====================================================
    # MÉTRICAS PERSONALIZADAS POR USUARIO
    # =====================================================
    
    async def get_user_kpis(self, user_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """Obtener KPIs personalizados para un usuario"""
        try:
            cache_key = f"user_kpis:{user_id}:{start_date}:{end_date}"
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Obtener eventos del usuario
            user_events = self.supabase.table('events').select('*').eq('user_id', user_id).gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()
            
            # Calcular KPIs
            kpis = {
                'total_searches': len([e for e in user_events.data if e['type'] == 'search_performed']),
                'total_requests': len([e for e in user_events.data if e['type'] == 'request_created']),
                'total_payments': len([e for e in user_events.data if e['type'] == 'payment_released']),
                'total_ratings': len([e for e in user_events.data if e['type'] == 'rating_submitted']),
                'avg_rating_received': 0,  # Se calcularía desde la tabla de ratings
                'total_disputes': len([e for e in user_events.data if e['type'] == 'dispute_opened']),
                'pwa_installed': len([e for e in user_events.data if e['type'] == 'pwa_installed']) > 0,
                'push_enabled': len([e for e in user_events.data if e['type'] == 'push_enabled']) > 0
            }
            
            # Cachear por 5 minutos
            self.redis.setex(cache_key, 300, json.dumps(kpis))
            
            return kpis
            
        except Exception as e:
            logger.error(f"Error calculando KPIs de usuario: {str(e)}")
            return {}
    
    # =====================================================
    # FUNCIONES DE MANTENIMIENTO
    # =====================================================
    
    async def refresh_materialized_views(self) -> bool:
        """Refrescar vistas materializadas"""
        try:
            result = self.supabase.rpc('refresh_analytics_views').execute()
            logger.info("Vistas materializadas refrescadas exitosamente")
            return True
        except Exception as e:
            logger.error(f"Error refrescando vistas materializadas: {str(e)}")
            return False
    
    async def track_event(self, user_id: str, event_type: str, payload: Dict[str, Any], session_id: str = None, device_info: Dict[str, str] = None) -> bool:
        """Registrar un evento de tracking"""
        try:
            event_data = {
                'user_id': user_id,
                'session_id': session_id,
                'type': event_type,
                'payload': payload,
                'device': device_info.get('device') if device_info else None,
                'browser': device_info.get('browser') if device_info else None,
                'os': device_info.get('os') if device_info else None,
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('events').insert(event_data).execute()
            
            if result.data:
                logger.debug(f"Evento {event_type} registrado para usuario {user_id}")
                return True
            else:
                logger.error(f"Error registrando evento {event_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error registrando evento: {str(e)}")
            return False
    
    async def get_consent_status(self, user_id: str) -> bool:
        """Verificar estado de consentimiento de tracking"""
        try:
            result = self.supabase.table('tracking_consent').select('consent_given').eq('user_id', user_id).order('consent_date', desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]['consent_given']
            return False
            
        except Exception as e:
            logger.error(f"Error verificando consentimiento: {str(e)}")
            return False
    
    async def set_consent_status(self, user_id: str, consent: bool, ip_address: str = None, user_agent: str = None) -> bool:
        """Establecer estado de consentimiento de tracking"""
        try:
            consent_data = {
                'user_id': user_id,
                'consent_given': consent,
                'consent_date': datetime.now().isoformat(),
                'ip_address': ip_address,
                'user_agent': user_agent
            }
            
            result = self.supabase.table('tracking_consent').insert(consent_data).execute()
            
            if result.data:
                logger.info(f"Consentimiento {consent} establecido para usuario {user_id}")
                return True
            else:
                logger.error(f"Error estableciendo consentimiento para usuario {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error estableciendo consentimiento: {str(e)}")
            return False
