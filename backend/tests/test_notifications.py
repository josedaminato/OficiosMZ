"""
Tests para el módulo de notificaciones
"""

import pytest
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json
from datetime import datetime

# Importar la aplicación
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

# Datos de prueba
TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174000"
TEST_NOTIFICATION_ID = "456e7890-e89b-12d3-a456-426614174001"

# Mock de notificación
MOCK_NOTIFICATION = {
    "id": TEST_NOTIFICATION_ID,
    "user_id": TEST_USER_ID,
    "title": "Nueva Calificación",
    "message": "Has recibido una calificación de 5 estrellas",
    "type": "rating",
    "is_read": False,
    "metadata": {"score": 5, "job_id": "789e0123-e89b-12d3-a456-426614174002"},
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

# Mock de estadísticas
MOCK_STATS = {
    "total_notifications": 10,
    "unread_notifications": 3,
    "last_notification_date": datetime.now().isoformat()
}

class TestNotifications:
    """Tests para los endpoints de notificaciones"""

    @patch('httpx.AsyncClient.get')
    @patch('httpx.AsyncClient.post')
    def test_create_notification_success(self, mock_post, mock_get):
        """Test crear notificación exitosamente"""
        # Mock de verificación de usuario
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{"id": TEST_USER_ID}]
        
        # Mock de creación de notificación
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = TEST_NOTIFICATION_ID
        
        # Mock de obtención de notificación creada
        mock_get.return_value.json.return_value = [MOCK_NOTIFICATION]
        
        notification_data = {
            "user_id": TEST_USER_ID,
            "title": "Nueva Calificación",
            "message": "Has recibido una calificación de 5 estrellas",
            "type": "rating",
            "metadata": {"score": 5}
        }
        
        response = client.post(
            "/api/notifications/",
            json=notification_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == TEST_NOTIFICATION_ID
        assert data["title"] == notification_data["title"]
        assert data["type"] == "rating"

    def test_create_notification_invalid_type(self):
        """Test crear notificación con tipo inválido"""
        notification_data = {
            "user_id": TEST_USER_ID,
            "title": "Test",
            "message": "Test message",
            "type": "invalid_type"
        }
        
        response = client.post(
            "/api/notifications/",
            json=notification_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422  # Validation error

    def test_create_notification_missing_fields(self):
        """Test crear notificación con campos faltantes"""
        notification_data = {
            "user_id": TEST_USER_ID,
            "title": "Test"
            # Falta message y type
        }
        
        response = client.post(
            "/api/notifications/",
            json=notification_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422  # Validation error

    @patch('httpx.AsyncClient.get')
    def test_get_user_notifications_success(self, mock_get):
        """Test obtener notificaciones de usuario exitosamente"""
        # Mock de respuesta de notificaciones
        mock_response_data = {
            "notifications": [MOCK_NOTIFICATION],
            "total": 1,
            "unread_count": 1,
            "page": 1,
            "limit": 20
        }
        
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [MOCK_NOTIFICATION]
        
        response = client.get(
            f"/api/notifications/user/{TEST_USER_ID}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert len(data["notifications"]) == 1

    @patch('httpx.AsyncClient.get')
    def test_get_user_notifications_with_pagination(self, mock_get):
        """Test obtener notificaciones con paginación"""
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [MOCK_NOTIFICATION]
        
        response = client.get(
            f"/api/notifications/user/{TEST_USER_ID}?page=2&limit=10",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200

    @patch('httpx.AsyncClient.get')
    @patch('httpx.AsyncClient.post')
    def test_mark_notification_read_success(self, mock_post, mock_get):
        """Test marcar notificación como leída exitosamente"""
        # Mock de verificación de notificación
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{"id": TEST_NOTIFICATION_ID}]
        
        # Mock de actualización
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = True
        
        response = client.patch(
            f"/api/notifications/{TEST_NOTIFICATION_ID}/read",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @patch('httpx.AsyncClient.get')
    def test_mark_notification_read_not_found(self, mock_get):
        """Test marcar notificación como leída cuando no existe"""
        # Mock de notificación no encontrada
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = []
        
        response = client.patch(
            f"/api/notifications/{TEST_NOTIFICATION_ID}/read",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 404

    @patch('httpx.AsyncClient.post')
    def test_mark_all_notifications_read_success(self, mock_post):
        """Test marcar todas las notificaciones como leídas"""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = 5  # 5 notificaciones actualizadas
        
        response = client.patch(
            f"/api/notifications/user/{TEST_USER_ID}/read-all",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["updated_count"] == 5

    @patch('httpx.AsyncClient.get')
    def test_get_notification_stats_success(self, mock_get):
        """Test obtener estadísticas de notificaciones"""
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [MOCK_STATS]
        
        response = client.get(
            f"/api/notifications/user/{TEST_USER_ID}/stats",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_notifications"] == 10
        assert data["unread_notifications"] == 3

    def test_health_check(self):
        """Test health check del módulo de notificaciones"""
        response = client.get("/api/notifications/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["module"] == "notifications"

    def test_unauthorized_access(self):
        """Test acceso sin autorización"""
        response = client.get(f"/api/notifications/user/{TEST_USER_ID}")
        
        assert response.status_code == 401

    def test_invalid_authorization_header(self):
        """Test header de autorización inválido"""
        response = client.get(
            f"/api/notifications/user/{TEST_USER_ID}",
            headers={"Authorization": "Invalid token"}
        )
        
        assert response.status_code == 401

# Tests de integración
class TestNotificationIntegration:
    """Tests de integración para el flujo completo de notificaciones"""

    @patch('httpx.AsyncClient')
    def test_complete_notification_flow(self, mock_client):
        """Test flujo completo: crear -> obtener -> marcar como leída"""
        # Configurar mocks
        mock_instance = AsyncMock()
        mock_client.return_value.__aenter__.return_value = mock_instance
        
        # Mock para verificar usuario
        mock_instance.get.return_value.status_code = 200
        mock_instance.get.return_value.json.return_value = [{"id": TEST_USER_ID}]
        
        # Mock para crear notificación
        mock_instance.post.return_value.status_code = 200
        mock_instance.post.return_value.json.return_value = TEST_NOTIFICATION_ID
        
        # Mock para obtener notificación creada
        mock_instance.get.return_value.json.return_value = [MOCK_NOTIFICATION]
        
        # 1. Crear notificación
        notification_data = {
            "user_id": TEST_USER_ID,
            "title": "Test Notification",
            "message": "This is a test notification",
            "type": "system"
        }
        
        create_response = client.post(
            "/api/notifications/",
            json=notification_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert create_response.status_code == 201
        
        # 2. Obtener notificaciones del usuario
        get_response = client.get(
            f"/api/notifications/user/{TEST_USER_ID}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert get_response.status_code == 200
        
        # 3. Marcar como leída
        mark_read_response = client.patch(
            f"/api/notifications/{TEST_NOTIFICATION_ID}/read",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert mark_read_response.status_code == 200

# Tests de validación de datos
class TestNotificationValidation:
    """Tests para validación de datos de notificaciones"""

    def test_notification_title_validation(self):
        """Test validación del título de notificación"""
        # Título muy largo
        notification_data = {
            "user_id": TEST_USER_ID,
            "title": "x" * 201,  # Más de 200 caracteres
            "message": "Test message",
            "type": "system"
        }
        
        response = client.post(
            "/api/notifications/",
            json=notification_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422

    def test_notification_message_validation(self):
        """Test validación del mensaje de notificación"""
        # Mensaje muy largo
        notification_data = {
            "user_id": TEST_USER_ID,
            "title": "Test",
            "message": "x" * 1001,  # Más de 1000 caracteres
            "type": "system"
        }
        
        response = client.post(
            "/api/notifications/",
            json=notification_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422

    def test_notification_type_validation(self):
        """Test validación del tipo de notificación"""
        valid_types = ['rating', 'payment', 'system', 'chat', 'job_request', 'job_accepted', 'job_completed', 'job_cancelled']
        
        for notification_type in valid_types:
            notification_data = {
                "user_id": TEST_USER_ID,
                "title": "Test",
                "message": "Test message",
                "type": notification_type
            }
            
            # No debería fallar la validación (aunque puede fallar en otros puntos)
            response = client.post(
                "/api/notifications/",
                json=notification_data,
                headers={"Authorization": "Bearer test-token"}
            )
            
            # No debería ser un error de validación (422)
            assert response.status_code != 422

if __name__ == "__main__":
    pytest.main([__file__])




