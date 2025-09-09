#!/bin/bash

# Script de instalación de dependencias para Analytics & Reportes
# Oficios MZ

echo "🚀 Instalando dependencias para Analytics & Reportes..."

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecutar desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado o no está en el PATH."
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar si npm está disponible
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está disponible."
    exit 1
fi

echo "✅ Node.js y npm detectados"

# Instalar dependencias de frontend
echo "📦 Instalando dependencias de frontend..."
npm install

# Verificar instalación
if [ $? -eq 0 ]; then
    echo "✅ Dependencias de frontend instaladas correctamente"
else
    echo "❌ Error instalando dependencias de frontend"
    exit 1
fi

# Verificar si Python está disponible
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Error: Python no está instalado o no está en el PATH."
    exit 1
fi

# Instalar dependencias de backend
echo "🐍 Instalando dependencias de backend..."
if command -v python3 &> /dev/null; then
    python3 -m pip install redis==5.0.1 supabase==2.0.0
else
    python -m pip install redis==5.0.1 supabase==2.0.0
fi

# Verificar instalación
if [ $? -eq 0 ]; then
    echo "✅ Dependencias de backend instaladas correctamente"
else
    echo "❌ Error instalando dependencias de backend"
    exit 1
fi

echo ""
echo "🎉 ¡Instalación completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar variables de entorno en .env"
echo "2. Ejecutar migraciones de base de datos:"
echo "   - Ejecutar backend/docs/analytics_database.sql en Supabase"
echo "3. Iniciar el backend:"
echo "   - python backend/main.py"
echo "4. Iniciar el frontend:"
echo "   - npm run dev"
echo "5. Probar el sistema:"
echo "   - python test_analytics_backend.py"
echo ""
echo "📊 Dashboard disponible en: /admin/analytics"
echo "📚 Documentación: ANALYTICS_REPORTES.md"
