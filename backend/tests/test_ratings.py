"""
Tests para el módulo de calificaciones - Oficios MZ
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from unittest.mock import patch, AsyncMock
import json

# Importar la aplicación principal
from main import app

client = TestClient(app)

# Datos de prueba
TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174000"
TEST_JOB_ID = "123e4567-e89b-12d3-a456-426614174001"
TEST_RATED_USER_ID = "123e4567-e89b-12d3-a456-426614174002"

# Mock de token JWT válido
VALID_JWT_TOKEN = "valid_jwt_token"
VALID_HEADERS = {"Authorization": f"Bearer {VALID_JWT_TOKEN}"}

# Mock de datos de trabajo
MOCK_JOB_DATA = {
    "id": TEST_JOB_ID,
    "client_id": TEST_USER_ID,
    "worker_id": TEST_RATED_USER_ID,
    "title": "Reparación de plomería",
    "status": "completado",
    "budget": 5000.00
}

# Mock de calificación creada
MOCK_RATING_RESPONSE = {
    "id": "rating-123",
    "job_id": TEST_JOB_ID,
    "rater_id": TEST_USER_ID,
    "rated_id": TEST_RATED_USER_ID,
    "score": 5,
    "comment": "Excelente trabajo",
    "created_at": "2024-01-15T10:30:00Z"
}

class TestRatingsEndpoints:
    """Tests para los endpoints de calificaciones"""
    
    @patch('routers.ratings.verify_jwt_token')
    @patch('routers.ratings.validate_job_exists')
    @patch('routers.ratings.validate_user_participated_in_job')
    @patch('routers.ratings.check_existing_rating')
    @patch('routers.ratings.create_rating_record')
    async def test_create_rating_success(
        self,
        mock_create_rating,
        mock_check_existing,
        mock_validate_participation,
        mock_validate_job,
        mock_verify_jwt
    ):
        """Test crear calificación exitosa"""
        # Configurar mocks
        mock_verify_jwt.return_value = {"user_id": TEST_USER_ID}
        mock_validate_job.return_value = MOCK_JOB_DATA
        mock_validate_participation.return_value = True
        mock_check_existing.return_value = False
        mock_create_rating.return_value = MOCK_RATING_RESPONSE
        
        # Datos de la calificación
        rating_data = {
            "job_id": TEST_JOB_ID,
            "rated_id": TEST_RATED_USER_ID,
            "score": 5,
            "comment": "Excelente trabajo"
        }
        
        # Realizar request
        response = client.post(
            "/api/ratings/",
            json=rating_data,
            headers=VALID_HEADERS
        )
        
        # Verificar respuesta
        assert response.status_code == 201
        data = response.json()
        assert data["score"] == 5
        assert data["comment"] == "Excelente trabajo"
        assert data["rater_id"] == TEST_USER_ID
        assert data["rated_id"] == TEST_RATED_USER_ID
    
    @patch('routers.ratings.verify_jwt_token')
    def test_create_rating_invalid_score(self, mock_verify_jwt):
        """Test calificación con score inválido"""
        mock_verify_jwt.return_value = {"user_id": TEST_USER_ID}
        
        rating_data = {
            "job_id": TEST_JOB_ID,
            "rated_id": TEST_RATED_USER_ID,
            "score": 6,  # Score inválido
            "comment": "Test"
        }
        
        response = client.post(
            "/api/ratings/",
            json=rating_data,
            headers=VALID_HEADERS
        )
        
        assert response.status_code == 422
    
    @patch('routers.ratings.verify_jwt_token')
    def test_create_rating_self_rating(self, mock_verify_jwt):
        """Test intento de calificarse a sí mismo"""
        mock_verify_jwt.return_value = {"user_id": TEST_USER_ID}
        
        rating_data = {
            "job_id": TEST_JOB_ID,
            "rated_id": TEST_USER_ID,  # Mismo usuario
            "score": 5,
            "comment": "Test"
        }
        
        response = client.post(
            "/api/ratings/",
            json=rating_data,
            headers=VALID_HEADERS
        )
        
        assert response.status_code == 400
        assert "No puedes calificarte a ti mismo" in response.json()["detail"]
    
    @patch('routers.ratings.verify_jwt_token')
    @patch('routers.ratings.validate_job_exists')
    def test_create_rating_job_not_found(self, mock_validate_job, mock_verify_jwt):
        """Test calificación para trabajo inexistente"""
        mock_verify_jwt.return_value = {"user_id": TEST_USER_ID}
        mock_validate_job.side_effect = HTTPException(status_code=404, detail="Trabajo no encontrado")
        
        rating_data = {
            "job_id": "invalid-job-id",
            "rated_id": TEST_RATED_USER_ID,
            "score": 5,
            "comment": "Test"
        }
        
        response = client.post(
            "/api/ratings/",
            json=rating_data,
            headers=VALID_HEADERS
        )
        
        assert response.status_code == 404
    
    @patch('routers.ratings.verify_jwt_token')
    @patch('routers.ratings.validate_job_exists')
    @patch('routers.ratings.validate_user_participated_in_job')
    def test_create_rating_user_not_participated(
        self,
        mock_validate_participation,
        mock_validate_job,
        mock_verify_jwt
    ):
        """Test calificación cuando usuario no participó en el trabajo"""
        mock_verify_jwt.return_value = {"user_id": TEST_USER_ID}
        mock_validate_job.return_value = MOCK_JOB_DATA
        mock_validate_participation.return_value = False
        
        rating_data = {
            "job_id": TEST_JOB_ID,
            "rated_id": TEST_RATED_USER_ID,
            "score": 5,
            "comment": "Test"
        }
        
        response = client.post(
            "/api/ratings/",
            json=rating_data,
            headers=VALID_HEADERS
        )
        
        assert response.status_code == 403
        assert "Solo puedes calificar trabajos en los que participaste" in response.json()["detail"]
    
    @patch('routers.ratings.verify_jwt_token')
    @patch('routers.ratings.validate_job_exists')
    @patch('routers.ratings.validate_user_participated_in_job')
    @patch('routers.ratings.check_existing_rating')
    def test_create_rating_already_exists(
        self,
        mock_check_existing,
        mock_validate_participation,
        mock_validate_job,
        mock_verify_jwt
    ):
        """Test calificación cuando ya existe una calificación previa"""
        mock_verify_jwt.return_value = {"user_id": TEST_USER_ID}
        mock_validate_job.return_value = MOCK_JOB_DATA
        mock_validate_participation.return_value = True
        mock_check_existing.return_value = True
        
        rating_data = {
            "job_id": TEST_JOB_ID,
            "rated_id": TEST_RATED_USER_ID,
            "score": 5,
            "comment": "Test"
        }
        
        response = client.post(
            "/api/ratings/",
            json=rating_data,
            headers=VALID_HEADERS
        )
        
        assert response.status_code == 400
        assert "Ya has calificado este trabajo" in response.json()["detail"]
    
    @patch('routers.ratings.get_user_ratings')
    def test_get_user_ratings_success(self, mock_get_ratings):
        """Test obtener calificaciones de usuario exitoso"""
        mock_ratings = [
            {
                "id": "rating-1",
                "job_id": TEST_JOB_ID,
                "rater_id": TEST_USER_ID,
                "rated_id": TEST_RATED_USER_ID,
                "score": 5,
                "comment": "Excelente trabajo",
                "created_at": "2024-01-15T10:30:00Z",
                "rater": {
                    "full_name": "Juan Pérez",
                    "avatar_url": "https://example.com/avatar.jpg"
                },
                "job": {
                    "title": "Reparación de plomería",
                    "budget": 5000.00
                }
            }
        ]
        mock_get_ratings.return_value = mock_ratings
        
        response = client.get(f"/api/ratings/user/{TEST_RATED_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["score"] == 5
        assert data[0]["rater_name"] == "Juan Pérez"
        assert data[0]["job_title"] == "Reparación de plomería"
    
    @patch('routers.ratings.calculate_rating_summary')
    def test_get_user_rating_average_success(self, mock_calculate_summary):
        """Test obtener promedio de calificaciones exitoso"""
        mock_summary = {
            "user_id": TEST_RATED_USER_ID,
            "average_rating": 4.5,
            "total_ratings": 10,
            "rating_breakdown": {1: 0, 2: 1, 3: 2, 4: 3, 5: 4}
        }
        mock_calculate_summary.return_value = mock_summary
        
        response = client.get(f"/api/ratings/user/{TEST_RATED_USER_ID}/average")
        
        assert response.status_code == 200
        data = response.json()
        assert data["average_rating"] == 4.5
        assert data["total_ratings"] == 10
        assert data["rating_breakdown"][5] == 4
    
    def test_ratings_health_check(self):
        """Test endpoint de salud del módulo de ratings"""
        response = client.get("/api/ratings/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["module"] == "ratings"
        assert "timestamp" in data

class TestRatingValidation:
    """Tests para validaciones de calificaciones"""
    
    def test_rating_create_model_validation(self):
        """Test validación del modelo RatingCreate"""
        from routers.ratings import RatingCreate
        
        # Test score válido
        valid_rating = RatingCreate(
            job_id=TEST_JOB_ID,
            rated_id=TEST_RATED_USER_ID,
            score=5,
            comment="Excelente trabajo"
        )
        assert valid_rating.score == 5
        assert valid_rating.comment == "Excelente trabajo"
        
        # Test score inválido
        with pytest.raises(ValueError):
            RatingCreate(
                job_id=TEST_JOB_ID,
                rated_id=TEST_RATED_USER_ID,
                score=6,  # Inválido
                comment="Test"
            )
        
        # Test score inválido (0)
        with pytest.raises(ValueError):
            RatingCreate(
                job_id=TEST_JOB_ID,
                rated_id=TEST_RATED_USER_ID,
                score=0,  # Inválido
                comment="Test"
            )
    
    def test_rating_create_comment_validation(self):
        """Test validación de comentarios"""
        from routers.ratings import RatingCreate
        
        # Test comentario vacío se convierte en None
        rating = RatingCreate(
            job_id=TEST_JOB_ID,
            rated_id=TEST_RATED_USER_ID,
            score=5,
            comment="   "  # Solo espacios
        )
        assert rating.comment is None
        
        # Test comentario válido
        rating = RatingCreate(
            job_id=TEST_JOB_ID,
            rated_id=TEST_RATED_USER_ID,
            score=5,
            comment="Excelente trabajo"
        )
        assert rating.comment == "Excelente trabajo"

if __name__ == "__main__":
    pytest.main([__file__])
