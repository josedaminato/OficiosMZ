#!/usr/bin/env node

/**
 * Script de Prueba de Notificaciones en Tiempo Real
 * Simula eventos para probar que las notificaciones lleguen correctamente
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

console.log('🔔 PRUEBA DE NOTIFICACIONES EN TIEMPO REAL');
console.log('='.repeat(50));

// Simular datos de prueba
const testData = {
  userId: 'test-user-123',
  jobId: 'test-job-456',
  ratingId: 'test-rating-789',
  paymentId: 'test-payment-101',
  disputeId: 'test-dispute-202'
};

// Función para simular creación de calificación
async function simulateRatingCreation() {
  console.log('\n⭐ Simulando creación de calificación...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ratings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // En producción usar token real
      },
      body: JSON.stringify({
        job_id: testData.jobId,
        rated_id: testData.userId,
        score: 5,
        comment: 'Excelente trabajo!'
      })
    });
    
    if (response.ok) {
      console.log('   ✅ Calificación creada exitosamente');
      console.log('   🔔 Notificación debería llegar en tiempo real');
    } else {
      console.log(`   ❌ Error creando calificación: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Función para simular liberación de pago
async function simulatePaymentRelease() {
  console.log('\n💰 Simulando liberación de pago...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // En producción usar token real
      },
      body: JSON.stringify({
        request_id: testData.jobId,
        worker_id: testData.userId
      })
    });
    
    if (response.ok) {
      console.log('   ✅ Pago liberado exitosamente');
      console.log('   🔔 Notificación debería llegar en tiempo real');
    } else {
      console.log(`   ❌ Error liberando pago: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Función para simular creación de disputa
async function simulateDisputeCreation() {
  console.log('\n⚠️ Simulando creación de disputa...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/disputes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // En producción usar token real
      },
      body: JSON.stringify({
        payment_id: testData.paymentId,
        reason: 'Trabajo no completado según lo acordado',
        status: 'open'
      })
    });
    
    if (response.ok) {
      console.log('   ✅ Disputa creada exitosamente');
      console.log('   🔔 Notificación debería llegar en tiempo real');
    } else {
      console.log(`   ❌ Error creando disputa: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Función para verificar notificaciones del usuario
async function checkUserNotifications() {
  console.log('\n📬 Verificando notificaciones del usuario...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/user/${testData.userId}`, {
      headers: {
        'Authorization': 'Bearer test-token' // En producción usar token real
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Notificaciones encontradas: ${data.notifications?.length || 0}`);
      console.log(`   📊 No leídas: ${data.unread_count || 0}`);
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('   📋 Últimas notificaciones:');
        data.notifications.slice(0, 3).forEach((notif, index) => {
          console.log(`      ${index + 1}. ${notif.title} - ${notif.type}`);
        });
      }
    } else {
      console.log(`   ❌ Error obteniendo notificaciones: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Función principal
async function runRealtimeTest() {
  console.log('🚀 INICIANDO PRUEBA DE TIEMPO REAL');
  console.log('⚠️  Nota: Asegúrate de que el backend esté ejecutándose');
  console.log('⚠️  Nota: Asegúrate de que el frontend esté abierto para ver las notificaciones');
  
  // Esperar un poco para que el usuario lea las instrucciones
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Ejecutar simulaciones
  await simulateRatingCreation();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await simulatePaymentRelease();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await simulateDisputeCreation();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar notificaciones
  await checkUserNotifications();
  
  console.log('\n🎯 INSTRUCCIONES PARA VERIFICAR:');
  console.log('1. Abre el frontend en http://localhost:5173');
  console.log('2. Inicia sesión en la aplicación');
  console.log('3. Observa la campana de notificaciones en el header');
  console.log('4. Haz clic en la campana para ver las notificaciones');
  console.log('5. Verifica que aparezcan las notificaciones en tiempo real');
  
  console.log('\n✅ Prueba de tiempo real completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runRealtimeTest().catch(console.error);
}

module.exports = { runRealtimeTest };

