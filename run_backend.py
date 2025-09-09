#!/usr/bin/env python3
"""
Script de inicio para el backend de Oficios MZ
"""

import sys
import os

# Agregar el directorio actual al path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Cambiar al directorio backend
backend_dir = os.path.join(current_dir, 'backend')
os.chdir(backend_dir)

# Agregar el directorio backend al path
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    # Cargar configuración temporal
    import config
    
    import uvicorn
    import main
    
    print("🚀 Iniciando backend de Oficios MZ...")
    print(f"📁 Directorio de trabajo: {os.getcwd()}")
    print(f"🐍 Python path: {sys.path[:3]}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
