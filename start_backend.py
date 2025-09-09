#!/usr/bin/env python3
"""
Script de inicio para el backend de Oficios MZ
"""

import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Cambiar al directorio backend
os.chdir('backend')

# Importar y ejecutar main
if __name__ == "__main__":
    import main
    import uvicorn
    uvicorn.run(main.app, host="0.0.0.0", port=8000)
