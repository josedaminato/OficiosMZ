# Backend Oficios MZ - FastAPI

## Mejoras Implementadas

### 🔐 Autenticación y Seguridad
- **Validación JWT**: Verificación de tokens de autenticación
- **Control de acceso**: Validación de que el usuario autenticado coincida con el userId solicitado
- **Headers de autorización**: Requiere `Authorization: Bearer <token>` en las peticiones

### 📝 Logging Completo
- **Logging estructurado**: Registro de eventos importantes con timestamps
- **Archivo de logs**: Los logs se guardan en `app.log`
- **Niveles de log**: INFO, WARNING, ERROR para diferentes tipos de eventos
- **Eventos registrados**:
  - Inicio/cierre de aplicación
  - Verificaciones faciales
  - Errores de autenticación
  - Tiempos de procesamiento
  - Accesos no autorizados

### 🏗️ Refactorización del Código
- **Funciones auxiliares extraídas**:
  - `save_uploaded_image()`: Guarda imágenes temporales de forma segura
  - `compare_faces()`: Compara rostros usando DeepFace
  - `cleanup_temp_file()`: Elimina archivos temporales
  - `validate_user_access()`: Valida permisos de usuario
  - `verify_jwt_token()`: Verifica tokens JWT

### 🚀 Nuevas Funcionalidades
- **Endpoint de salud**: `/api/health` para monitoreo
- **Manejo de errores mejorado**: Respuestas HTTP apropiadas
- **Archivos temporales seguros**: Uso de `tempfile` para archivos temporales
- **Métricas de rendimiento**: Tiempo de procesamiento en respuestas

## Instalación

```bash
pip install -r requirements.txt
```

## Configuración

1. **Variables de entorno** (crear archivo `.env`):
```env
JWT_SECRET=your-super-secret-key-change-this-in-production
LOG_LEVEL=INFO
PROFILE_PICS_DIR=profile_pics
```

2. **Estructura de directorios**:
```
backend/
├── main.py
├── requirements.txt
├── profile_pics/          # Fotos de perfil de usuarios
├── app.log               # Archivo de logs
└── .env                  # Variables de entorno
```

## Uso

### Iniciar el servidor:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Endpoints disponibles:

#### POST `/api/verify-face`
Verifica la identidad facial de un usuario.

**Headers requeridos:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Parámetros:**
- `userId` (string): ID del usuario a verificar
- `image` (file): Imagen capturada para comparación

**Respuesta exitosa:**
```json
{
  "verified": true,
  "processing_time": 2.34,
  "timestamp": "2024-01-15T10:30:00.123456"
}
```

#### GET `/api/health`
Verifica el estado del servicio.

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.123456",
  "service": "Oficios MZ API"
}
```

## Seguridad

- **Tokens JWT**: Autenticación basada en tokens
- **Validación de acceso**: Solo el usuario autenticado puede verificar su propia identidad
- **Archivos temporales**: Limpieza automática de archivos temporales
- **Logging de seguridad**: Registro de intentos de acceso no autorizados

## Logs

Los logs se guardan en `app.log` con el formato:
```
2024-01-15 10:30:00,123 - __main__ - INFO - Iniciando verificación facial para usuario: user123
```

## Dependencias

- `fastapi`: Framework web
- `uvicorn`: Servidor ASGI
- `deepface`: Verificación facial
- `pillow`: Procesamiento de imágenes
- `PyJWT`: Manejo de tokens JWT
- `python-multipart`: Manejo de archivos multipart 