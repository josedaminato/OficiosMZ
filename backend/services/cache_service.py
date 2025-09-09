"""
Servicio de Cache con Redis para optimización de rendimiento
Maneja cache distribuido para endpoints frecuentes
"""

import json
import logging
import os
from typing import Any, Optional, Union
from datetime import datetime, timedelta
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class CacheService:
    """Servicio de cache con Redis para optimización de rendimiento"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = None
        self.default_ttl = int(os.getenv("CACHE_DEFAULT_TTL", "300"))  # 5 minutos por defecto
        
    async def connect(self):
        """Conectar a Redis"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("Conectado a Redis exitosamente")
        except Exception as e:
            logger.error(f"Error conectando a Redis: {e}")
            self.redis_client = None
    
    async def disconnect(self):
        """Desconectar de Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtener valor del cache"""
        if not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error obteniendo cache key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Guardar valor en cache"""
        if not self.redis_client:
            return False
        
        try:
            ttl = ttl or self.default_ttl
            serialized_value = json.dumps(value, default=str)
            await self.redis_client.setex(key, ttl, serialized_value)
            return True
        except Exception as e:
            logger.error(f"Error guardando cache key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Eliminar valor del cache"""
        if not self.redis_client:
            return False
        
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error eliminando cache key {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """Eliminar múltiples keys por patrón"""
        if not self.redis_client:
            return 0
        
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Error eliminando cache pattern {pattern}: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Verificar si existe una key en cache"""
        if not self.redis_client:
            return False
        
        try:
            return await self.redis_client.exists(key)
        except Exception as e:
            logger.error(f"Error verificando existencia de cache key {key}: {e}")
            return False
    
    async def get_or_set(self, key: str, fetch_func, ttl: Optional[int] = None) -> Any:
        """Obtener del cache o ejecutar función y guardar resultado"""
        # Intentar obtener del cache
        cached_value = await self.get(key)
        if cached_value is not None:
            logger.debug(f"Cache hit para key: {key}")
            return cached_value
        
        # Si no está en cache, ejecutar función
        logger.debug(f"Cache miss para key: {key}")
        try:
            value = await fetch_func()
            await self.set(key, value, ttl)
            return value
        except Exception as e:
            logger.error(f"Error en get_or_set para key {key}: {e}")
            raise e
    
    # Métodos específicos para diferentes tipos de datos
    
    async def cache_worker_search(self, filters: dict, page: int, limit: int, result: Any) -> bool:
        """Cache para búsquedas de trabajadores"""
        key = f"worker_search:{hash(str(sorted(filters.items())))}:page_{page}:limit_{limit}"
        return await self.set(key, result, ttl=600)  # 10 minutos
    
    async def get_cached_worker_search(self, filters: dict, page: int, limit: int) -> Optional[Any]:
        """Obtener búsqueda de trabajadores del cache"""
        key = f"worker_search:{hash(str(sorted(filters.items())))}:page_{page}:limit_{limit}"
        return await self.get(key)
    
    async def cache_user_ratings(self, user_id: str, result: Any) -> bool:
        """Cache para calificaciones de usuario"""
        key = f"user_ratings:{user_id}"
        return await self.set(key, result, ttl=300)  # 5 minutos
    
    async def get_cached_user_ratings(self, user_id: str) -> Optional[Any]:
        """Obtener calificaciones de usuario del cache"""
        key = f"user_ratings:{user_id}"
        return await self.get(key)
    
    async def cache_payment_stats(self, user_id: str, result: Any) -> bool:
        """Cache para estadísticas de pagos"""
        key = f"payment_stats:{user_id}"
        return await self.set(key, result, ttl=180)  # 3 minutos
    
    async def get_cached_payment_stats(self, user_id: str) -> Optional[Any]:
        """Obtener estadísticas de pagos del cache"""
        key = f"payment_stats:{user_id}"
        return await self.get(key)
    
    async def cache_notification_stats(self, user_id: str, result: Any) -> bool:
        """Cache para estadísticas de notificaciones"""
        key = f"notification_stats:{user_id}"
        return await self.set(key, result, ttl=120)  # 2 minutos
    
    async def get_cached_notification_stats(self, user_id: str) -> Optional[Any]:
        """Obtener estadísticas de notificaciones del cache"""
        key = f"notification_stats:{user_id}"
        return await self.get(key)
    
    async def invalidate_user_cache(self, user_id: str) -> int:
        """Invalidar todo el cache relacionado con un usuario"""
        patterns = [
            f"user_ratings:{user_id}",
            f"payment_stats:{user_id}",
            f"notification_stats:{user_id}",
            f"worker_search:*"  # Invalida búsquedas que podrían incluir al usuario
        ]
        
        total_deleted = 0
        for pattern in patterns:
            deleted = await self.delete_pattern(pattern)
            total_deleted += deleted
        
        logger.info(f"Invalidado cache para usuario {user_id}: {total_deleted} keys eliminadas")
        return total_deleted
    
    async def get_cache_stats(self) -> dict:
        """Obtener estadísticas del cache"""
        if not self.redis_client:
            return {"status": "disconnected"}
        
        try:
            info = await self.redis_client.info()
            return {
                "status": "connected",
                "used_memory": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(info)
            }
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de cache: {e}")
            return {"status": "error", "error": str(e)}
    
    def _calculate_hit_rate(self, info: dict) -> float:
        """Calcular tasa de aciertos del cache"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses
        
        if total == 0:
            return 0.0
        
        return round((hits / total) * 100, 2)

# Instancia global del servicio de cache
cache_service = CacheService()
