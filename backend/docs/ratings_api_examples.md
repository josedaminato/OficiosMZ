# 📊 API de Calificaciones - Oficios MZ

## 🎯 Endpoints Disponibles

### 1. **POST /api/ratings/** - Crear Calificación

Crear una nueva calificación para un trabajo completado.

#### Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174001",
  "rated_id": "123e4567-e89b-12d3-a456-426614174002",
  "score": 5,
  "comment": "Excelente trabajo, muy profesional"
}
```

#### Response (201 Created)
```json
{
  "id": "rating-123",
  "job_id": "123e4567-e89b-12d3-a456-426614174001",
  "rater_id": "123e4567-e89b-12d3-a456-426614174000",
  "rated_id": "123e4567-e89b-12d3-a456-426614174002",
  "score": 5,
  "comment": "Excelente trabajo, muy profesional",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Validaciones
- ✅ El trabajo debe existir y estar completado
- ✅ El usuario autenticado debe haber participado en el trabajo
- ✅ El usuario a calificar debe haber participado en el trabajo
- ✅ No se puede calificar a uno mismo
- ✅ Solo una calificación por trabajo por usuario
- ✅ Score debe estar entre 1 y 5

#### Errores Posibles
```json
// 400 - Ya existe calificación
{
  "detail": "Ya has calificado este trabajo"
}

// 400 - Auto-calificación
{
  "detail": "No puedes calificarte a ti mismo"
}

// 403 - Usuario no participó
{
  "detail": "Solo puedes calificar trabajos en los que participaste"
}

// 404 - Trabajo no encontrado
{
  "detail": "Trabajo no encontrado"
}
```

---

### 2. **GET /api/ratings/user/{user_id}** - Obtener Calificaciones

Obtener todas las calificaciones recibidas por un usuario.

#### Request
```
GET /api/ratings/user/123e4567-e89b-12d3-a456-426614174002
```

#### Response (200 OK)
```json
[
  {
    "id": "rating-123",
    "job_id": "123e4567-e89b-12d3-a456-426614174001",
    "rater_id": "123e4567-e89b-12d3-a456-426614174000",
    "rated_id": "123e4567-e89b-12d3-a456-426614174002",
    "score": 5,
    "comment": "Excelente trabajo, muy profesional",
    "created_at": "2024-01-15T10:30:00Z",
    "rater_name": "Juan Pérez",
    "rater_avatar": "https://example.com/avatar.jpg",
    "job_title": "Reparación de plomería",
    "job_budget": 5000.00
  },
  {
    "id": "rating-124",
    "job_id": "123e4567-e89b-12d3-a456-426614174003",
    "rater_id": "123e4567-e89b-12d3-a456-426614174004",
    "rated_id": "123e4567-e89b-12d3-a456-426614174002",
    "score": 4,
    "comment": "Buen trabajo, puntual",
    "created_at": "2024-01-14T15:20:00Z",
    "rater_name": "María García",
    "rater_avatar": null,
    "job_title": "Instalación eléctrica",
    "job_budget": 3000.00
  }
]
```

---

### 3. **GET /api/ratings/user/{user_id}/average** - Promedio de Calificaciones

Obtener estadísticas de calificaciones de un usuario.

#### Request
```
GET /api/ratings/user/123e4567-e89b-12d3-a456-426614174002/average
```

#### Response (200 OK)
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174002",
  "average_rating": 4.5,
  "total_ratings": 10,
  "rating_breakdown": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4
  }
}
```

---

### 4. **GET /api/ratings/health** - Health Check

Verificar el estado del módulo de calificaciones.

#### Request
```
GET /api/ratings/health
```

#### Response (200 OK)
```json
{
  "status": "healthy",
  "module": "ratings",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔧 Ejemplos de Uso con JavaScript/React

### Crear Calificación
```javascript
const createRating = async (jobId, ratedUserId, score, comment) => {
  try {
    const response = await fetch('/api/ratings/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_id: jobId,
        rated_id: ratedUserId,
        score: score,
        comment: comment
      })
    });

    if (response.ok) {
      const rating = await response.json();
      console.log('Calificación creada:', rating);
      return rating;
    } else {
      const error = await response.json();
      console.error('Error:', error.detail);
      throw new Error(error.detail);
    }
  } catch (error) {
    console.error('Error al crear calificación:', error);
    throw error;
  }
};

// Uso
createRating(
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002',
  5,
  'Excelente trabajo'
);
```

### Obtener Calificaciones de Usuario
```javascript
const getUserRatings = async (userId) => {
  try {
    const response = await fetch(`/api/ratings/user/${userId}`);
    
    if (response.ok) {
      const ratings = await response.json();
      return ratings;
    } else {
      throw new Error('Error al obtener calificaciones');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Uso
const ratings = await getUserRatings('123e4567-e89b-12d3-a456-426614174002');
console.log('Calificaciones:', ratings);
```

### Obtener Promedio de Calificaciones
```javascript
const getUserRatingAverage = async (userId) => {
  try {
    const response = await fetch(`/api/ratings/user/${userId}/average`);
    
    if (response.ok) {
      const summary = await response.json();
      return summary;
    } else {
      throw new Error('Error al obtener promedio');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Uso
const summary = await getUserRatingAverage('123e4567-e89b-12d3-a456-426614174002');
console.log('Promedio:', summary.average_rating);
console.log('Total:', summary.total_ratings);
```

---

## 🧪 Ejemplos de Testing

### Test con curl
```bash
# Crear calificación
curl -X POST "http://localhost:8000/api/ratings/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "123e4567-e89b-12d3-a456-426614174001",
    "rated_id": "123e4567-e89b-12d3-a456-426614174002",
    "score": 5,
    "comment": "Excelente trabajo"
  }'

# Obtener calificaciones
curl -X GET "http://localhost:8000/api/ratings/user/123e4567-e89b-12d3-a456-426614174002"

# Obtener promedio
curl -X GET "http://localhost:8000/api/ratings/user/123e4567-e89b-12d3-a456-426614174002/average"
```

### Test con Python
```python
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
JWT_TOKEN = "your_jwt_token_here"
HEADERS = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

# Crear calificación
def create_rating(job_id, rated_id, score, comment=None):
    url = f"{BASE_URL}/api/ratings/"
    data = {
        "job_id": job_id,
        "rated_id": rated_id,
        "score": score,
        "comment": comment
    }
    
    response = requests.post(url, headers=HEADERS, json=data)
    return response.json()

# Obtener calificaciones
def get_user_ratings(user_id):
    url = f"{BASE_URL}/api/ratings/user/{user_id}"
    response = requests.get(url)
    return response.json()

# Obtener promedio
def get_user_average(user_id):
    url = f"{BASE_URL}/api/ratings/user/{user_id}/average"
    response = requests.get(url)
    return response.json()

# Ejemplos de uso
if __name__ == "__main__":
    # Crear calificación
    rating = create_rating(
        "123e4567-e89b-12d3-a456-426614174001",
        "123e4567-e89b-12d3-a456-426614174002",
        5,
        "Excelente trabajo"
    )
    print("Calificación creada:", rating)
    
    # Obtener calificaciones
    ratings = get_user_ratings("123e4567-e89b-12d3-a456-426614174002")
    print("Calificaciones:", ratings)
    
    # Obtener promedio
    average = get_user_average("123e4567-e89b-12d3-a456-426614174002")
    print("Promedio:", average)
```

---

## 📋 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Calificación creada exitosamente |
| 400 | Bad Request - Datos inválidos o reglas de negocio violadas |
| 401 | Unauthorized - Token JWT inválido o faltante |
| 403 | Forbidden - Usuario no tiene permisos |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Error de validación de datos |
| 500 | Internal Server Error - Error interno del servidor |

---

## 🔒 Seguridad

- **Autenticación**: Todos los endpoints de creación requieren JWT válido
- **Autorización**: Solo usuarios que participaron en el trabajo pueden calificar
- **Validación**: Múltiples capas de validación en datos y reglas de negocio
- **Rate Limiting**: Considerar implementar límites de velocidad
- **Logging**: Todas las operaciones se registran para auditoría

---

## 🚀 Próximos Pasos

1. **Implementar en Frontend**: Integrar con componentes React
2. **Notificaciones**: Enviar notificaciones cuando se recibe calificación
3. **Analytics**: Agregar métricas de uso y rendimiento
4. **Cache**: Implementar cache para consultas frecuentes
5. **Rate Limiting**: Agregar límites de velocidad para prevenir spam

