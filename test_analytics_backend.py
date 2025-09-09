"""
Script de prueba para el módulo de Analytics & Reportes
Ejecutar con: python test_analytics_backend.py
"""

import asyncio
import httpx
import json
import os
from datetime import datetime, date, timedelta
from typing import Dict, Any

# Configuración
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TEST_AUTH_TOKEN = "test-admin-token-123"  # Token de admin para testing

# Headers para requests
HEADERS = {
    "Authorization": f"Bearer {TEST_AUTH_TOKEN}",
    "Content-Type": "application/json"
}

# Colores para console
class Colors:
    GREEN = '\x1b[32m'
    RED = '\x1b[31m'
    YELLOW = '\x1b[33m'
    BLUE = '\x1b[34m'
    RESET = '\x1b[0m'
    BOLD = '\x1b[1m'

def log(message, color=Colors.RESET):
    print(f"{color}{message}{Colors.RESET}")

def log_success(message):
    log(f"✅ {message}", Colors.GREEN)

def log_error(message):
    log(f"❌ {message}", Colors.RED)

def log_warning(message):
    log(f"⚠️  {message}", Colors.YELLOW)

def log_info(message):
    log(f"ℹ️  {message}", Colors.BLUE)

async def make_request(url: str, method: str = "GET", data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Hacer request HTTP"""
    async with httpx.AsyncClient() as client:
        try:
            if method.upper() == "GET":
                response = await client.get(url, headers=HEADERS)
            elif method.upper() == "POST":
                response = await client.post(url, headers=HEADERS, json=data)
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "success": 200 <= response.status_code < 300
            }
        except Exception as e:
            return {
                "status_code": 0,
                "data": None,
                "success": False,
                "error": str(e)
            }

async def test_health_check():
    """Test 1: Health Check del servicio de analytics"""
    log_info("Test 1: Health Check del servicio de analytics")
    
    try:
        response = await make_request(f"{API_BASE_URL}/api/analytics/health")
        
        if response["success"]:
            log_success("Health check exitoso")
            log_info(f"Estado: {response['data'].get('status', 'unknown')}")
            log_info(f"Supabase: {response['data'].get('supabase', 'unknown')}")
            log_info(f"Redis: {response['data'].get('redis', 'unknown')}")
            return True
        else:
            log_error(f"Health check falló con status: {response['status_code']}")
            return False
    except Exception as e:
        log_error(f"Error en health check: {str(e)}")
        return False

async def test_track_event():
    """Test 2: Tracking de eventos"""
    log_info("Test 2: Tracking de eventos")
    
    try:
        # Test evento de búsqueda
        search_event = {
            "event_type": "search_performed",
            "payload": {
                "query": "plomero",
                "filters": {"location": "mendoza"},
                "results_count": 15
            },
            "session_id": "test-session-123",
            "device_info": {
                "device": "mobile",
                "browser": "Chrome",
                "os": "Android"
            }
        }
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/track-event",
            "POST",
            search_event
        )
        
        if response["success"]:
            log_success("Evento de búsqueda trackeado exitosamente")
        else:
            log_error(f"Error trackeando evento: {response['status_code']}")
            return False
        
        # Test evento de click en resultado
        click_event = {
            "event_type": "search_result_click",
            "payload": {
                "worker_id": "worker-123",
                "position": 1,
                "query": "plomero"
            },
            "session_id": "test-session-123"
        }
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/track-event",
            "POST",
            click_event
        )
        
        if response["success"]:
            log_success("Evento de click trackeado exitosamente")
            return True
        else:
            log_error(f"Error trackeando evento de click: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de tracking: {str(e)}")
        return False

async def test_consent_management():
    """Test 3: Gestión de consentimiento"""
    log_info("Test 3: Gestión de consentimiento")
    
    try:
        # Test establecer consentimiento
        consent_data = {
            "consent": True,
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Test Browser)"
        }
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/consent",
            "POST",
            consent_data
        )
        
        if response["success"]:
            log_success("Consentimiento establecido exitosamente")
        else:
            log_error(f"Error estableciendo consentimiento: {response['status_code']}")
            return False
        
        # Test verificar consentimiento
        response = await make_request(f"{API_BASE_URL}/api/analytics/consent-status")
        
        if response["success"]:
            log_success("Estado de consentimiento obtenido exitosamente")
            log_info(f"Consentimiento dado: {response['data'].get('consent_given', False)}")
            return True
        else:
            log_error(f"Error verificando consentimiento: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de consentimiento: {str(e)}")
        return False

async def test_kpis_endpoint():
    """Test 4: Endpoint de KPIs"""
    log_info("Test 4: Endpoint de KPIs")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/kpis?start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("KPIs obtenidos exitosamente")
            data = response["data"]
            
            # Verificar estructura de datos
            required_keys = ["user_metrics", "quality_metrics", "ops_metrics"]
            for key in required_keys:
                if key in data:
                    log_info(f"✓ {key} presente")
                else:
                    log_warning(f"⚠ {key} ausente")
            
            # Mostrar algunos valores
            user_metrics = data.get("user_metrics", {})
            log_info(f"DAU: {user_metrics.get('dau', 'N/A')}")
            log_info(f"WAU: {user_metrics.get('wau', 'N/A')}")
            log_info(f"MAU: {user_metrics.get('mau', 'N/A')}")
            
            return True
        else:
            log_error(f"Error obteniendo KPIs: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de KPIs: {str(e)}")
        return False

async def test_funnel_endpoint():
    """Test 5: Endpoint de embudo"""
    log_info("Test 5: Endpoint de embudo")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/funnel?start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("Datos de embudo obtenidos exitosamente")
            data = response["data"]
            
            funnel_data = data.get("funnel_data", {})
            conversions = data.get("conversions", {})
            
            log_info("Datos del embudo:")
            for stage, value in funnel_data.items():
                log_info(f"  {stage}: {value}")
            
            log_info("Tasas de conversión:")
            for stage, rate in conversions.items():
                log_info(f"  {stage}: {rate}%")
            
            return True
        else:
            log_error(f"Error obteniendo datos de embudo: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de embudo: {str(e)}")
        return False

async def test_quality_endpoint():
    """Test 6: Endpoint de calidad"""
    log_info("Test 6: Endpoint de calidad")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/quality?start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("Métricas de calidad obtenidas exitosamente")
            data = response["data"]
            
            quality_metrics = data.get("quality_metrics", {})
            log_info(f"Rating promedio: {quality_metrics.get('avg_rating', 'N/A')}")
            log_info(f"Total ratings: {quality_metrics.get('total_ratings', 'N/A')}")
            log_info(f"Tasa de disputas: {quality_metrics.get('dispute_rate', 'N/A')}%")
            
            return True
        else:
            log_error(f"Error obteniendo métricas de calidad: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de calidad: {str(e)}")
        return False

async def test_ops_endpoint():
    """Test 7: Endpoint operacional"""
    log_info("Test 7: Endpoint operacional")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/ops?start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("Métricas operacionales obtenidas exitosamente")
            data = response["data"]
            
            ops_metrics = data.get("ops_metrics", {})
            log_info(f"Mensajes de chat: {ops_metrics.get('chat_messages', 'N/A')}")
            log_info(f"Notificaciones entregadas: {ops_metrics.get('notifications_delivered', 'N/A')}")
            log_info(f"Tasa de lectura: {ops_metrics.get('notification_read_rate', 'N/A')}%")
            
            return True
        else:
            log_error(f"Error obteniendo métricas operacionales: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test operacional: {str(e)}")
        return False

async def test_dashboard_endpoint():
    """Test 8: Endpoint de dashboard completo"""
    log_info("Test 8: Endpoint de dashboard completo")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/dashboard?start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("Datos del dashboard obtenidos exitosamente")
            data = response["data"]
            
            # Verificar que todas las secciones estén presentes
            sections = ["user_metrics", "funnel_metrics", "quality_metrics", "ops_metrics", "geo_metrics", "performance_metrics"]
            for section in sections:
                if section in data:
                    log_info(f"✓ {section} presente")
                else:
                    log_warning(f"⚠ {section} ausente")
            
            return True
        else:
            log_error(f"Error obteniendo datos del dashboard: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de dashboard: {str(e)}")
        return False

async def test_export_csv():
    """Test 9: Exportación CSV"""
    log_info("Test 9: Exportación CSV")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        # Test exportación de KPIs
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/export.csv?report_type=kpis&start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("Exportación CSV de KPIs exitosa")
            log_info(f"Tamaño de respuesta: {len(str(response['data']))} caracteres")
        else:
            log_error(f"Error exportando CSV: {response['status_code']}")
            return False
        
        return True
        
    except Exception as e:
        log_error(f"Error en test de exportación: {str(e)}")
        return False

async def test_refresh_views():
    """Test 10: Refrescar vistas materializadas"""
    log_info("Test 10: Refrescar vistas materializadas")
    
    try:
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/refresh-views",
            "POST"
        )
        
        if response["success"]:
            log_success("Vistas materializadas refrescadas exitosamente")
            return True
        else:
            log_error(f"Error refrescando vistas: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de refresh: {str(e)}")
        return False

async def test_user_kpis():
    """Test 11: KPIs de usuario"""
    log_info("Test 11: KPIs de usuario")
    
    try:
        start_date = (date.today() - timedelta(days=7)).isoformat()
        end_date = date.today().isoformat()
        
        response = await make_request(
            f"{API_BASE_URL}/api/analytics/user-kpis?start_date={start_date}&end_date={end_date}"
        )
        
        if response["success"]:
            log_success("KPIs de usuario obtenidos exitosamente")
            data = response["data"]
            
            user_kpis = data.get("user_kpis", {})
            log_info(f"Total búsquedas: {user_kpis.get('total_searches', 'N/A')}")
            log_info(f"Total solicitudes: {user_kpis.get('total_requests', 'N/A')}")
            log_info(f"Total pagos: {user_kpis.get('total_payments', 'N/A')}")
            
            return True
        else:
            log_error(f"Error obteniendo KPIs de usuario: {response['status_code']}")
            return False
            
    except Exception as e:
        log_error(f"Error en test de KPIs de usuario: {str(e)}")
        return False

async def run_all_tests():
    """Ejecutar todos los tests"""
    log(f"{Colors.BOLD}{Colors.BLUE}📊 Iniciando tests de Analytics & Reportes{Colors.RESET}")
    log(f"{Colors.BLUE}================================================{Colors.RESET}")
    
    tests = [
        ("Health Check", test_health_check),
        ("Tracking de Eventos", test_track_event),
        ("Gestión de Consentimiento", test_consent_management),
        ("Endpoint de KPIs", test_kpis_endpoint),
        ("Endpoint de Embudo", test_funnel_endpoint),
        ("Endpoint de Calidad", test_quality_endpoint),
        ("Endpoint Operacional", test_ops_endpoint),
        ("Dashboard Completo", test_dashboard_endpoint),
        ("Exportación CSV", test_export_csv),
        ("Refrescar Vistas", test_refresh_views),
        ("KPIs de Usuario", test_user_kpis)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        log(f"\n{Colors.YELLOW}Ejecutando: {test_name}{Colors.RESET}")
        try:
            result = await test_func()
            if result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            log_error(f"Error inesperado en {test_name}: {str(e)}")
            failed += 1
    
    # Resumen final
    log(f"\n{Colors.BLUE}================================================{Colors.RESET}")
    log(f"{Colors.BOLD}📊 Resumen de Tests{Colors.RESET}")
    log(f"{Colors.GREEN}✅ Exitosos: {passed}{Colors.RESET}")
    log(f"{Colors.RED}❌ Fallidos: {failed}{Colors.RESET}")
    log(f"{Colors.BLUE}📈 Total: {passed + failed}{Colors.RESET}")
    
    if failed == 0:
        log(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ¡Todos los tests pasaron exitosamente!{Colors.RESET}")
    else:
        log(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Algunos tests fallaron. Revisar la configuración.{Colors.RESET}")
    
    return {"passed": passed, "failed": failed, "total": passed + failed}

if __name__ == "__main__":
    asyncio.run(run_all_tests())
