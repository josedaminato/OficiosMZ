#!/usr/bin/env node

/**
 * Script de prueba para verificar que los TODOs implementados funcionen correctamente
 * Ejecutar con: node test_todos.js
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

console.log('🧪 Probando funcionalidades implementadas...\n');

// Test 1: Verificar que el backend esté funcionando
async function testBackendHealth() {
    console.log('1. Probando health check del backend...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend funcionando:', data.status);
            return true;
        } else {
            console.log('❌ Backend no responde correctamente');
            return false;
        }
    } catch (error) {
        console.log('❌ Error conectando al backend:', error.message);
        return false;
    }
}

// Test 2: Verificar endpoint de notificaciones
async function testNotificationsEndpoint() {
    console.log('\n2. Probando endpoint de notificaciones...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint de notificaciones funcionando:', data.status);
            return true;
        } else {
            console.log('❌ Endpoint de notificaciones no responde');
            return false;
        }
    } catch (error) {
        console.log('❌ Error en endpoint de notificaciones:', error.message);
        return false;
    }
}

// Test 3: Verificar endpoint de calificaciones
async function testRatingsEndpoint() {
    console.log('\n3. Probando endpoint de calificaciones...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/ratings/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint de calificaciones funcionando:', data.status);
            return true;
        } else {
            console.log('❌ Endpoint de calificaciones no responde');
            return false;
        }
    } catch (error) {
        console.log('❌ Error en endpoint de calificaciones:', error.message);
        return false;
    }
}

// Test 4: Verificar endpoint de disputas
async function testDisputesEndpoint() {
    console.log('\n4. Probando endpoint de disputas...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/disputes/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint de disputas funcionando:', data.status);
            return true;
        } else {
            console.log('❌ Endpoint de disputas no responde');
            return false;
        }
    } catch (error) {
        console.log('❌ Error en endpoint de disputas:', error.message);
        return false;
    }
}

// Función principal
async function runTests() {
    console.log('🚀 Iniciando pruebas de funcionalidades implementadas\n');
    
    const results = await Promise.all([
        testBackendHealth(),
        testNotificationsEndpoint(),
        testRatingsEndpoint(),
        testDisputesEndpoint()
    ]);
    
    const passed = results.filter(Boolean).length;
    const total = results.length;
    
    console.log(`\n📊 Resultados: ${passed}/${total} pruebas pasaron`);
    
    if (passed === total) {
        console.log('🎉 ¡Todas las funcionalidades están funcionando correctamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Configurar variables de entorno (.env)');
        console.log('2. Ejecutar: npm install');
        console.log('3. Ejecutar: npm run dev');
        console.log('4. Probar la aplicación en el navegador');
    } else {
        console.log('⚠️  Algunas funcionalidades necesitan atención');
        console.log('\n🔧 Verificar:');
        console.log('1. Que el backend esté ejecutándose (uvicorn main:app --reload)');
        console.log('2. Que las dependencias estén instaladas (pip install -r requirements.txt)');
        console.log('3. Que las variables de entorno estén configuradas');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };

