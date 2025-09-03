import logging
import os
import io
import tempfile
from typing import Optional, Tuple
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from deepface import DeepFace
from PIL import Image
import jwt
from datetime import datetime
import requests

# Importar routers
from routers import ratings, notifications, payments, disputes

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Oficios MZ API", version="1.0.0")

# Permitir CORS para desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(ratings.router)
app.include_router(notifications.router)
app.include_router(payments.router)
app.include_router(disputes.router)

PROFILE_PICS_DIR = "profile_pics"
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # En producción, usar variable de entorno

# Mercado Pago config
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "test-access-token")  # Reemplazar por tu token real en producción
MERCADOPAGO_BASE_URL = "https://api.mercadopago.com"

# Asegurar que el directorio de fotos de perfil existe
os.makedirs(PROFILE_PICS_DIR, exist_ok=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def verify_jwt_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verifica el token JWT y retorna la información del usuario.
    
    Args:
        authorization: Header de autorización con el token JWT
        
    Returns:
        dict: Información del usuario decodificada del token
        
    Raises:
        HTTPException: Si el token es inválido o no está presente
    """
    if not authorization:
        logger.warning("Intento de acceso sin token de autorización")
        raise HTTPException(status_code=401, detail="Token de autorización requerido")
    
    try:
        # Extraer el token del header "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        logger.info(f"Token verificado para usuario: {payload.get('user_id')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expirado")
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        logger.warning("Token inválido")
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        logger.error(f"Error al verificar token: {str(e)}")
        raise HTTPException(status_code=401, detail="Error de autenticación")

def save_uploaded_image(image: UploadFile) -> str:
    """
    Guarda la imagen subida en un archivo temporal.
    
    Args:
        image: Archivo de imagen subido
        
    Returns:
        str: Ruta del archivo temporal guardado
        
    Raises:
        HTTPException: Si hay error al procesar la imagen
    """
    try:
        # Leer imagen capturada
        captured_bytes = image.file.read()
        captured_img = Image.open(io.BytesIO(captured_bytes)).convert("RGB")
        
        # Crear archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        temp_path = temp_file.name
        temp_file.close()
        
        # Guardar imagen
        captured_img.save(temp_path)
        logger.info(f"Imagen temporal guardada en: {temp_path}")
        
        return temp_path
    except Exception as e:
        logger.error(f"Error al guardar imagen temporal: {str(e)}")
        raise HTTPException(status_code=400, detail="Error al procesar la imagen")

def compare_faces(profile_pic_path: str, captured_pic_path: str) -> Tuple[bool, Optional[str]]:
    """
    Compara dos rostros usando DeepFace.
    
    Args:
        profile_pic_path: Ruta de la foto de perfil
        captured_pic_path: Ruta de la foto capturada
        
    Returns:
        Tuple[bool, Optional[str]]: (verificado, mensaje_de_error)
    """
    try:
        logger.info(f"Iniciando comparación facial entre {profile_pic_path} y {captured_pic_path}")
        
        result = DeepFace.verify(
            img1_path=profile_pic_path,
            img2_path=captured_pic_path,
            enforce_detection=False
        )
        
        verified = result.get("verified", False)
        distance = result.get("distance", 0)
        
        logger.info(f"Comparación facial completada. Verificado: {verified}, Distancia: {distance}")
        return verified, None
        
    except Exception as e:
        error_msg = f"Error en comparación facial: {str(e)}"
        logger.error(error_msg)
        return False, error_msg

def cleanup_temp_file(file_path: str) -> None:
    """
    Elimina un archivo temporal.
    
    Args:
        file_path: Ruta del archivo a eliminar
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Archivo temporal eliminado: {file_path}")
    except Exception as e:
        logger.warning(f"No se pudo eliminar archivo temporal {file_path}: {str(e)}")

def validate_user_access(user_payload: dict, requested_user_id: str) -> None:
    """
    Valida que el usuario autenticado coincida con el userId solicitado.
    
    Args:
        user_payload: Información del usuario del token JWT
        requested_user_id: ID del usuario solicitado
        
    Raises:
        HTTPException: Si el usuario no tiene permisos
    """
    token_user_id = user_payload.get("user_id")
    
    if token_user_id != requested_user_id:
        logger.warning(f"Intento de acceso no autorizado: usuario {token_user_id} intentó acceder a {requested_user_id}")
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción")
    
    logger.info(f"Acceso validado para usuario: {requested_user_id}")

@app.post("/api/verify-face")
async def verify_face(
    userId: str = Form(...),
    image: UploadFile = File(...),
    user_payload: dict = Depends(verify_jwt_token)
):
    """
    Endpoint para verificación facial.
    
    Args:
        userId: ID del usuario a verificar
        image: Imagen capturada para comparación
        user_payload: Información del usuario autenticado
        
    Returns:
        JSONResponse: Resultado de la verificación
    """
    start_time = datetime.now()
    temp_file_path = None
    
    try:
        logger.info(f"Iniciando verificación facial para usuario: {userId}")
        
        # Validar acceso del usuario
        validate_user_access(user_payload, userId)
        
        # Verificar que existe la foto de perfil
        profile_pic_path = os.path.join(PROFILE_PICS_DIR, f"{userId}.jpg")
        if not os.path.exists(profile_pic_path):
            logger.warning(f"No se encontró foto de perfil para usuario: {userId}")
            return JSONResponse(
                {"verified": False, "error": "No se encontró foto de perfil."}, 
                status_code=404
            )
        
        # Guardar imagen temporal
        temp_file_path = save_uploaded_image(image)
        
        # Comparar rostros
        verified, error = compare_faces(profile_pic_path, temp_file_path)
        
        if error:
            return JSONResponse(
                {"verified": False, "error": error}, 
                status_code=500
            )
        
        # Calcular tiempo de procesamiento
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Verificación facial completada en {processing_time:.2f}s para usuario {userId}")
        
        return {
            "verified": verified,
            "processing_time": processing_time,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        # Re-lanzar excepciones HTTP
        raise
    except Exception as e:
        logger.error(f"Error inesperado en verificación facial para usuario {userId}: {str(e)}")
        return JSONResponse(
            {"verified": False, "error": "Error interno del servidor"}, 
            status_code=500
        )
    finally:
        # Limpiar archivo temporal
        if temp_file_path:
            cleanup_temp_file(temp_file_path)

@app.post("/api/payments/mercadopago/create")
async def create_mercadopago_payment(
    user_payload: dict = Depends(verify_jwt_token),
    request: Request = None
):
    """
    Crea una preferencia de pago en Mercado Pago y devuelve el link de pago.
    """
    data = await request.json()
    # Ejemplo de datos esperados: {"title": "Servicio de plomería", "description": "Reparación de caño", "amount": 1000, "request_id": "REQ123"}
    title = data.get("title", "Servicio")
    description = data.get("description", "")
    amount = data.get("amount", 0)
    request_id = data.get("request_id", "")

    preference_data = {
        "items": [
            {
                "title": title,
                "description": description,
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(amount)
            }
        ],
        "external_reference": request_id,
        # Puedes agregar payer info, back_urls, notification_url, etc.
    }

    headers = {
        "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(f"{MERCADOPAGO_BASE_URL}/checkout/preferences", json=preference_data, headers=headers)
        response.raise_for_status()
        mp_data = response.json()
        return {"init_point": mp_data.get("init_point"), "preference_id": mp_data.get("id")}
    except Exception as e:
        logger.error(f"Error creando preferencia de Mercado Pago: {e}")
        raise HTTPException(status_code=500, detail="Error al crear preferencia de pago")

@app.post("/api/payments/mercadopago/webhook")
async def mercadopago_webhook(request: Request):
    """
    Endpoint para recibir notificaciones de Mercado Pago (webhook IPN).
    """
    try:
        data = await request.json()
        logger.info(f"Webhook Mercado Pago recibido: {data}")
        # Aquí deberías validar y actualizar el estado del pago en tu base de datos
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Error en webhook de Mercado Pago: {e}")
        return JSONResponse({"error": str(e)}, status_code=400)

@app.post("/api/payments/release")
async def release_payment(request: Request, user_payload: dict = Depends(verify_jwt_token)):
    """
    Libera el pago de una solicitud (solo el cliente puede hacerlo).
    """
    data = await request.json()
    request_id = data.get("request_id")
    if not request_id:
        raise HTTPException(status_code=400, detail="Falta request_id")

    # Obtener la solicitud desde Supabase
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    req_url = f"{SUPABASE_URL}/rest/v1/requests?id=eq.{request_id}"
    resp = requests.get(req_url, headers=headers)
    if resp.status_code != 200 or not resp.json():
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    solicitud = resp.json()[0]

    # Validar que el usuario autenticado es el cliente
    if solicitud.get("client_id") != user_payload.get("sub"):
        raise HTTPException(status_code=403, detail="No autorizado para liberar este pago")

    # Actualizar estado a 'liberado' y guardar fecha
    update_url = f"{SUPABASE_URL}/rest/v1/requests?id=eq.{request_id}"
    update_data = {
        "payment_status": "liberado",
        "payment_released_at": datetime.now().isoformat()
    }
    update_resp = requests.patch(update_url, headers=headers, json=update_data)
    if update_resp.status_code not in (200, 204):
        logger.error(f"Error actualizando estado de pago: {update_resp.text}")
        raise HTTPException(status_code=500, detail="Error al liberar el pago")

    # Crear notificación automática para el trabajador
    try:
        # Importar el servicio de notificaciones
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))
        from services import notification_service
        
        # Obtener información del trabajo y del cliente
        job_title = solicitud.get("title", "Trabajo")
        client_name = user_payload.get("full_name", "Cliente")
        amount = solicitud.get("budget", 0)
        worker_id = solicitud.get("worker_id")
        
        if worker_id:
            await notification_service.notify_payment_received(
                worker_id=worker_id,
                client_name=client_name,
                amount=amount,
                job_title=job_title,
                payment_id=f"payment_{request_id}",
                job_id=request_id
            )
            
            logger.info(f"Notificación de pago enviada a trabajador {worker_id}")
            
    except Exception as e:
        # No fallar la liberación del pago si falla la notificación
        logger.error(f"Error enviando notificación de pago: {e}")

    logger.info(f"Pago liberado para solicitud {request_id} por cliente {user_payload.get('sub')}")
    return {"status": "liberado", "request_id": request_id}

@app.get("/api/health")
async def health_check():
    """
    Endpoint de verificación de salud del servicio.
    """
    logger.info("Verificación de salud del servicio solicitada")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Oficios MZ API"
    }

@app.on_event("startup")
async def startup_event():
    """
    Evento ejecutado al iniciar la aplicación.
    """
    logger.info("Iniciando aplicación Oficios MZ API")
    logger.info(f"Directorio de fotos de perfil: {os.path.abspath(PROFILE_PICS_DIR)}")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Evento ejecutado al cerrar la aplicación.
    """
    logger.info("Cerrando aplicación Oficios MZ API") 