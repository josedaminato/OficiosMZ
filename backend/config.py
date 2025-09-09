"""
Configuración temporal para el backend de Oficios MZ
"""

import os

# Configuración de Supabase (valores por defecto para testing)
os.environ.setdefault("SUPABASE_URL", "https://your-project-id.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "your-supabase-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "your-supabase-anon-key")

# Configuración JWT
os.environ.setdefault("JWT_SECRET", "your-jwt-secret-key-here")

# Configuración Redis
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")

# Configuración de logging
os.environ.setdefault("LOG_LEVEL", "INFO")

# Configuración de directorios
os.environ.setdefault("PROFILE_PICS_DIR", "profile_pics")

# Configuración de Mercado Pago
os.environ.setdefault("MERCADO_PAGO_ACCESS_TOKEN", "your-mercado-pago-access-token")
os.environ.setdefault("MERCADO_PAGO_WEBHOOK_SECRET", "your-mercado-pago-webhook-secret")
os.environ.setdefault("MERCADO_PAGO_PUBLIC_KEY", "your-mercado-pago-public-key")

# Configuración VAPID
os.environ.setdefault("VAPID_PRIVATE_KEY", "your-vapid-private-key-here")
os.environ.setdefault("VAPID_EMAIL", "your-email@example.com")

print("🔧 Configuración temporal cargada para testing")
