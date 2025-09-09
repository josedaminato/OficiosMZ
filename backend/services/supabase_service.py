"""
Servicio para conexión con Supabase
Centraliza la configuración y manejo de la conexión
"""

import os
import logging
from supabase import create_client, Client
from typing import Optional, Dict, Any, List

# Configurar logging
logger = logging.getLogger(__name__)

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Cliente global de Supabase
_supabase_client: Optional[Client] = None

class MockSupabaseClient:
    """
    Cliente mock de Supabase para testing
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Inicializando cliente mock de Supabase")
    
    def table(self, table_name: str):
        """Mock de la función table"""
        return MockTable(table_name)
    
    def auth(self):
        """Mock de la función auth"""
        return MockAuth()
    
    def storage(self):
        """Mock de la función storage"""
        return MockStorage()

class MockTable:
    """Mock de una tabla de Supabase"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.logger = logging.getLogger(__name__)
    
    def select(self, columns: str = "*"):
        """Mock de select"""
        self.logger.info(f"Mock SELECT from {self.table_name}: {columns}")
        return self
    
    def insert(self, data: Dict[str, Any] or List[Dict[str, Any]]):
        """Mock de insert"""
        self.logger.info(f"Mock INSERT into {self.table_name}: {data}")
        return self
    
    def update(self, data: Dict[str, Any]):
        """Mock de update"""
        self.logger.info(f"Mock UPDATE {self.table_name}: {data}")
        return self
    
    def delete(self):
        """Mock de delete"""
        self.logger.info(f"Mock DELETE from {self.table_name}")
        return self
    
    def eq(self, column: str, value: Any):
        """Mock de eq"""
        self.logger.info(f"Mock WHERE {column} = {value}")
        return self
    
    def neq(self, column: str, value: Any):
        """Mock de neq"""
        self.logger.info(f"Mock WHERE {column} != {value}")
        return self
    
    def gte(self, column: str, value: Any):
        """Mock de gte"""
        self.logger.info(f"Mock WHERE {column} >= {value}")
        return self
    
    def lte(self, column: str, value: Any):
        """Mock de lte"""
        self.logger.info(f"Mock WHERE {column} <= {value}")
        return self
    
    def like(self, column: str, pattern: str):
        """Mock de like"""
        self.logger.info(f"Mock WHERE {column} LIKE {pattern}")
        return self
    
    def ilike(self, column: str, pattern: str):
        """Mock de ilike"""
        self.logger.info(f"Mock WHERE {column} ILIKE {pattern}")
        return self
    
    def order(self, column: str, desc: bool = False):
        """Mock de order"""
        self.logger.info(f"Mock ORDER BY {column} {'DESC' if desc else 'ASC'}")
        return self
    
    def limit(self, count: int):
        """Mock de limit"""
        self.logger.info(f"Mock LIMIT {count}")
        return self
    
    def offset(self, count: int):
        """Mock de offset"""
        self.logger.info(f"Mock OFFSET {count}")
        return self
    
    def execute(self):
        """Mock de execute - retorna datos de prueba"""
        self.logger.info(f"Mock EXECUTE on {self.table_name}")
        return MockResponse()

class MockAuth:
    """Mock de autenticación de Supabase"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def get_user(self, token: str = None):
        """Mock de get_user"""
        self.logger.info("Mock get_user")
        return MockUser()
    
    def sign_in_with_password(self, credentials: Dict[str, str]):
        """Mock de sign_in_with_password"""
        self.logger.info("Mock sign_in_with_password")
        return MockAuthResponse()

class MockStorage:
    """Mock de storage de Supabase"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def from_(self, bucket: str):
        """Mock de from_"""
        return MockBucket(bucket)

class MockBucket:
    """Mock de bucket de Supabase"""
    
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.logger = logging.getLogger(__name__)
    
    def upload(self, path: str, file_data: bytes):
        """Mock de upload"""
        self.logger.info(f"Mock upload to {self.bucket_name}/{path}")
        return MockResponse()

class MockResponse:
    """Mock de respuesta de Supabase"""
    
    def __init__(self):
        self.data = []
        self.count = 0
        self.status_code = 200
        self.status_text = "OK"
    
    def json(self):
        """Mock de json"""
        return {
            "data": self.data,
            "count": self.count,
            "status": self.status_code,
            "statusText": self.status_text
        }

class MockUser:
    """Mock de usuario de Supabase"""
    
    def __init__(self):
        self.id = "mock-user-id"
        self.email = "test@example.com"
        self.user_metadata = {}

class MockAuthResponse:
    """Mock de respuesta de autenticación"""
    
    def __init__(self):
        self.user = MockUser()
        self.session = {"access_token": "mock-token"}

def get_supabase_client() -> Client:
    """
    Obtener cliente de Supabase (singleton)
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados")
        
        # Verificar si las claves son válidas (no son valores por defecto)
        if (SUPABASE_URL == "https://your-project-id.supabase.co" or 
            SUPABASE_SERVICE_ROLE_KEY == "your-supabase-service-role-key"):
            logger.warning("Usando cliente mock de Supabase para testing")
            _supabase_client = MockSupabaseClient()
        else:
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            logger.info("Cliente de Supabase inicializado correctamente")
    
    return _supabase_client

def get_supabase_anon_client() -> Client:
    """
    Obtener cliente anónimo de Supabase para operaciones públicas
    """
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados")
    
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
