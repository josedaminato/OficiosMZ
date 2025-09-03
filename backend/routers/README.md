# 🏆 Módulo de Calificaciones - Oficios MZ

## 📋 Descripción

Este módulo implementa el sistema completo de calificaciones para la plataforma Oficios MZ, permitiendo que usuarios califiquen a otros usuarios después de completar trabajos.

## 🚀 Características

- ✅ **Crear calificaciones** con validaciones completas
- ✅ **Obtener historial** de calificaciones por usuario
- ✅ **Calcular promedios** y estadísticas automáticamente
- ✅ **Validaciones de seguridad** y reglas de negocio
- ✅ **Integración con Supabase** para persistencia
- ✅ **Tests completos** con pytest
- ✅ **Documentación detallada** con ejemplos

## 📁 Estructura de Archivos

```
backend/
├── routers/
│   ├── __init__.py
│   ├── ratings.py          # Módulo principal de calificaciones
│   └── README.md          # Esta documentación
├── tests/
│   └── test_ratings.py    # Tests del módulo
├── docs/
│   └── ratings_api_examples.md  # Ejemplos de uso
└── main.py                # Aplicación principal (actualizada)
```

## 🔧 Instalación

1. **Instalar dependencias**:
```bash
pip install -r requirements.txt
```

2. **Configurar variables de entorno**:
```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
JWT_SECRET=tu_jwt_secret
```

3. **Ejecutar la aplicación**:
```bash
uvicorn main:app --reload
```

## 📊 Endpoints Disponibles

### POST /api/ratings/
Crear una nueva calificación.

**Headers**: `Authorization: Bearer <jwt_token>`

**Body**:
```json
{
  "job_id": "uuid",
  "rated_id": "uuid", 
  "score": 5,
  "comment": "Excelente trabajo"
}
```

### GET /api/ratings/user/{user_id}
Obtener todas las calificaciones recibidas por un usuario.

### GET /api/ratings/user/{user_id}/average
Obtener promedio y estadísticas de calificaciones.

### GET /api/ratings/health
Health check del módulo.

## 🧪 Testing

Ejecutar tests:
```bash
# Todos los tests
pytest tests/test_ratings.py

# Test específico
pytest tests/test_ratings.py::TestRatingsEndpoints::test_create_rating_success

# Con cobertura
pytest tests/test_ratings.py --cov=routers.ratings
```

## 🔒 Validaciones Implementadas

### Reglas de Negocio
- ✅ Solo se puede calificar trabajos completados
- ✅ Usuario debe haber participado en el trabajo
- ✅ No se puede calificar a uno mismo
- ✅ Solo una calificación por trabajo por usuario
- ✅ Score debe estar entre 1 y 5

### Seguridad
- ✅ Autenticación JWT requerida
- ✅ Validación de permisos por usuario
- ✅ Sanitización de datos de entrada
- ✅ Logging de todas las operaciones

## 📈 Modelos de Datos

### RatingCreate
```python
{
  "job_id": str,
  "rated_id": str,
  "score": int (1-5),
  "comment": str (opcional, max 500 chars)
}
```

### RatingResponse
```python
{
  "id": str,
  "job_id": str,
  "rater_id": str,
  "rated_id": str,
  "score": int,
  "comment": str,
  "created_at": datetime
}
```

### RatingSummary
```python
{
  "user_id": str,
  "average_rating": float,
  "total_ratings": int,
  "rating_breakdown": dict
}
```

## 🔄 Flujo de Validación

1. **Autenticación**: Verificar JWT token
2. **Validación de datos**: Verificar formato y rangos
3. **Validación de trabajo**: Verificar que existe y está completado
4. **Validación de participación**: Verificar que usuario participó
5. **Validación de duplicados**: Verificar que no existe calificación previa
6. **Creación**: Insertar en base de datos
7. **Respuesta**: Retornar datos creados

## 🚨 Manejo de Errores

### Códigos de Estado
- **201**: Calificación creada exitosamente
- **400**: Datos inválidos o reglas violadas
- **401**: Token JWT inválido
- **403**: Sin permisos para la operación
- **404**: Recurso no encontrado
- **422**: Error de validación de datos
- **500**: Error interno del servidor

### Logging
Todas las operaciones se registran con:
- Timestamp
- Usuario autenticado
- Operación realizada
- Resultado (éxito/error)
- Detalles del error (si aplica)

## 🔧 Configuración

### Variables de Entorno
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# JWT
JWT_SECRET=tu_jwt_secret_key

# Logging
LOG_LEVEL=INFO
```

### Headers de Supabase
```python
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}
```

## 📚 Ejemplos de Uso

Ver `docs/ratings_api_examples.md` para ejemplos completos con:
- JavaScript/React
- Python
- curl
- Testing

## 🚀 Próximos Pasos

1. **Integración Frontend**: Conectar con componentes React
2. **Notificaciones**: Enviar alertas cuando se recibe calificación
3. **Cache**: Implementar cache para consultas frecuentes
4. **Analytics**: Agregar métricas de uso
5. **Rate Limiting**: Prevenir spam de calificaciones

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
