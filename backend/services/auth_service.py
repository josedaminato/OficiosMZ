"""
AuthService - Servicio centralizado de autenticación para Oficios MZ
Maneja validación JWT, JWKS de Supabase y validaciones de permisos
"""

import os
import json
import logging
import jwt
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import base64

# Configurar logging
logger = logging.getLogger(__name__)

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Headers para requests a Supabase
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# Cache para JWKS
_jwks_cache = None
_jwks_cache_time = None
JWKS_CACHE_DURATION = timedelta(hours=1)


class AuthService:
    """Servicio centralizado de autenticación"""
    
    @staticmethod
    async def get_jwks() -> Optional[Dict[str, Any]]:
        """
        Obtener y cachear las claves públicas JWKS de Supabase
        
        Returns:
            Dict con las claves JWKS o None si hay error
        """
        global _jwks_cache, _jwks_cache_time
        
        # Verificar si el cache es válido
        if (_jwks_cache is not None and 
            _jwks_cache_time is not None and 
            datetime.now() - _jwks_cache_time < JWKS_CACHE_DURATION):
            logger.debug("Usando JWKS desde cache")
            return _jwks_cache
        
        try:
            logger.info("Obteniendo JWKS de Supabase")
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SUPABASE_URL}/auth/v1/jwks",
                    headers=SUPABASE_HEADERS,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    jwks = response.json()
                    _jwks_cache = jwks
                    _jwks_cache_time = datetime.now()
                    logger.info("JWKS obtenido y cacheado exitosamente")
                    return jwks
                else:
                    logger.error(f"Error al obtener JWKS: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.RequestError as e:
            logger.error(f"Error de conexión al obtener JWKS: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error inesperado al obtener JWKS: {str(e)}")
            return None

    @staticmethod
    def get_public_key(jwks: Dict[str, Any], kid: str) -> Optional[rsa.RSAPublicKey]:
        """
        Extraer la clave pública RSA desde JWKS
        
        Args:
            jwks: Diccionario con las claves JWKS
            kid: Key ID del token
            
        Returns:
            Clave pública RSA o None si no se encuentra
        """
        try:
            keys = jwks.get('keys', [])
            
            for key in keys:
                if key.get('kid') == kid:
                    # Decodificar la clave pública
                    n = base64.urlsafe_b64decode(key['n'] + '==')
                    e = base64.urlsafe_b64decode(key['e'] + '==')
                    
                    # Convertir a enteros
                    n_int = int.from_bytes(n, 'big')
                    e_int = int.from_bytes(e, 'big')
                    
                    # Crear clave pública RSA
                    public_key = rsa.RSAPublicNumbers(e_int, n_int).public_key()
                    return public_key
            
            logger.error(f"Clave pública no encontrada para kid: {kid}")
            return None
            
        except Exception as e:
            logger.error(f"Error al extraer clave pública: {str(e)}")
            return None

    @staticmethod
    async def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
        """
        Verificar un token JWT de Supabase
        
        Args:
            token: Token JWT a verificar
            
        Returns:
            Payload del token si es válido, None si no
        """
        try:
            # Decodificar el header del token para obtener el kid
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            if not kid:
                logger.error("No kid found in token header")
                return None
            
            # Obtener las claves públicas
            jwks = await AuthService.get_jwks()
            if not jwks:
                logger.error("Could not fetch JWKS")
                return None
            
            # Obtener la clave pública específica
            public_key = AuthService.get_public_key(jwks, kid)
            if not public_key:
                logger.error(f"Could not find public key for kid: {kid}")
                return None
            
            # Verificar el token
            try:
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=['RS256'],
                    audience='authenticated',
                    issuer=f"{SUPABASE_URL}/auth/v1"
                )
                
                logger.info(f"Token verificado exitosamente para usuario: {payload.get('sub')}")
                return payload
                
            except jwt.ExpiredSignatureError:
                logger.error("Token has expired")
                return None
            except jwt.InvalidTokenError as e:
                logger.error(f"Invalid token: {e}")
                return None
                
        except Exception as e:
            logger.error(f"Error verifying JWT: {e}")
            return None

    @staticmethod
    async def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Obtener información del usuario desde un token JWT
        
        Args:
            token: Token JWT
            
        Returns:
            Diccionario con información del usuario o None si hay error
        """
        try:
            payload = await AuthService.verify_jwt(token)
            if not payload:
                return None
            
            # Extraer información del usuario del payload
            user_id = payload.get('sub')
            if not user_id:
                logger.error("Invalid token: no user ID found")
                return None
            
            # Obtener rol del usuario (si está disponible en el token)
            user_role = payload.get('role', 'user')
            
            logger.info(f"Usuario autenticado: {user_id} con rol: {user_role}")
            
            return {
                "id": user_id,
                "user_id": user_id,  # Compatibilidad con código existente
                "role": user_role,
                "email": payload.get('email'),
                "aud": payload.get('aud'),
                "exp": payload.get('exp')
            }
            
        except Exception as e:
            logger.error(f"Error getting user from token: {e}")
            return None

    @staticmethod
    def validate_user_access(current_user_id: str, required_user_id: str) -> None:
        """
        Validar que el usuario autenticado coincida con el userId solicitado
        
        Args:
            current_user_id: ID del usuario autenticado
            required_user_id: ID del usuario requerido
            
        Raises:
            ValueError: Si el usuario no tiene permisos
        """
        if current_user_id != required_user_id:
            logger.warning(f"Intento de acceso no autorizado: usuario {current_user_id} intentó acceder a {required_user_id}")
            raise ValueError("No tienes permisos para realizar esta acción")
        
        logger.info(f"Acceso validado para usuario: {required_user_id}")

    @staticmethod
    def extract_token_from_header(authorization: str) -> Optional[str]:
        """
        Extraer token JWT del header Authorization
        
        Args:
            authorization: Header Authorization completo
            
        Returns:
            Token JWT o None si el formato es inválido
        """
        try:
            if not authorization.startswith("Bearer "):
                logger.error("Invalid authorization header format")
                return None
            
            token = authorization.split(" ")[1]
            return token
            
        except Exception as e:
            logger.error(f"Error extracting token from header: {e}")
            return None

    @staticmethod
    async def get_current_user(authorization: str) -> Dict[str, Any]:
        """
        Obtener usuario actual desde JWT token (función principal para dependencias)
        
        Args:
            authorization: Header Authorization completo
            
        Returns:
            Diccionario con información del usuario
            
        Raises:
            ValueError: Si el token es inválido o el usuario no tiene permisos
        """
        try:
            # Extraer token del header
            token = AuthService.extract_token_from_header(authorization)
            if not token:
                raise ValueError("Invalid authorization header format")
            
            # Obtener usuario desde token
            user = await AuthService.get_user_from_token(token)
            if not user:
                raise ValueError("Invalid or expired token")
            
            return user
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error validating user: {e}")
            raise ValueError("Invalid or expired token")

