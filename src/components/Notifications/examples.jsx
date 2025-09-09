import React, { useState } from 'react';
import { 
  NotificationBell, 
  NotificationList, 
  NotificationSystem,
  NotificationHeader,
  NotificationPage,
  NotificationSidebar
} from './index';

/**
 * Ejemplos de uso del Sistema de Notificaciones
 */

// 1. Campana de notificaciones en el header
export const HeaderWithNotifications = ({ userId }) => {
  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    // Aquí podrías navegar a la página relevante
    // o abrir un modal con más detalles
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">Oficios MZ</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationHeader 
            userId={userId}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      </div>
    </header>
  );
};

// 2. Dashboard con notificaciones
export const DashboardWithNotifications = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWithNotifications userId={userId} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Resumen' },
                { id: 'notifications', label: 'Notificaciones' },
                { id: 'jobs', label: 'Trabajos' },
                { id: 'profile', label: 'Perfil' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Resumen</h2>
                {/* Aquí irían otras estadísticas */}
              </div>
            )}

            {activeTab === 'notifications' && (
              <NotificationSystem
                userId={userId}
                mode="dashboard"
              />
            )}

            {activeTab === 'jobs' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Mis Trabajos</h2>
                {/* Lista de trabajos */}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Mi Perfil</h2>
                {/* Configuración del perfil */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Página completa de notificaciones
export const NotificationsPage = ({ userId }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWithNotifications userId={userId} />
      <NotificationPage userId={userId} />
    </div>
  );
};

// 4. Sidebar de notificaciones
export const AppWithNotificationSidebar = ({ userId }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWithNotifications userId={userId} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Mi Dashboard</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ver Notificaciones
          </button>
        </div>
        
        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contenido Principal</h2>
          <p className="text-gray-600">
            Aquí iría el contenido principal de tu aplicación.
          </p>
        </div>
      </div>

      {/* Sidebar de notificaciones */}
      <NotificationSidebar
        userId={userId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
};

// 5. Componente compacto para mobile
export const MobileNotificationBell = ({ userId }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <NotificationBell
        userId={userId}
        className="bg-blue-600 text-white shadow-lg"
        maxNotifications={5}
      />
    </div>
  );
};

// 6. Lista de notificaciones independiente
export const StandaloneNotificationList = ({ userId }) => {
  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    
    // Ejemplo de navegación basada en el tipo de notificación
    switch (notification.type) {
      case 'rating':
        // Navegar a la página de calificaciones
        console.log('Navigate to ratings page');
        break;
      case 'payment':
        // Navegar a la página de pagos
        console.log('Navigate to payments page');
        break;
      case 'job_request':
        // Navegar a la solicitud de trabajo
        console.log('Navigate to job request:', notification.metadata.job_id);
        break;
      default:
        console.log('Navigate to general notification');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Notificaciones</h1>
      
      <NotificationList
        userId={userId}
        onNotificationClick={handleNotificationClick}
        showPagination={true}
        itemsPerPage={10}
        showMarkAllRead={true}
      />
    </div>
  );
};

// 7. Ejemplo de integración con sistema de ratings
export const RatingWithNotification = ({ jobId, workerId, clientId, currentUserId }) => {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleRatingSubmit = async (ratingData) => {
    try {
      // Aquí iría la lógica para enviar la calificación
      console.log('Rating submitted:', ratingData);
      
      // Simular envío exitoso
      setRatingSubmitted(true);
      setShowRatingForm(false);
      
      // La notificación se enviará automáticamente desde el backend
      
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  if (ratingSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          ¡Calificación Enviada!
        </h3>
        <p className="text-green-700">
          Tu calificación ha sido enviada exitosamente. 
          El trabajador recibirá una notificación automática.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Calificar Trabajo Completado
      </h3>
      
      <p className="text-gray-600 mb-4">
        El trabajo ha sido completado exitosamente. 
        Por favor, califica tu experiencia.
      </p>
      
      <button
        onClick={() => setShowRatingForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Calificar Trabajo
      </button>
      
      {showRatingForm && (
        <div className="mt-4">
          {/* Aquí iría el componente RatingForm */}
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              Formulario de calificación (RatingForm component)
            </p>
            <button
              onClick={() => handleRatingSubmit({
                job_id: jobId,
                rated_id: workerId,
                score: 5,
                comment: 'Excelente trabajo!'
              })}
              className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Enviar Calificación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 8. Ejemplo de notificaciones en tiempo real
export const RealTimeNotificationsDemo = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

  // Simular notificaciones en tiempo real
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newNotification = {
        id: Date.now().toString(),
        title: 'Nueva Notificación',
        message: `Notificación de prueba ${Date.now()}`,
        type: 'system',
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Demo de Notificaciones en Tiempo Real
      </h2>
      
      <div className="space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <div className="font-medium text-blue-800">{notification.title}</div>
            <div className="text-sm text-blue-600">{notification.message}</div>
            <div className="text-xs text-blue-500 mt-1">
              {new Date(notification.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Las notificaciones aparecerán automáticamente cada 10 segundos
      </div>
    </div>
  );
};

// Datos de ejemplo para testing
export const mockNotifications = [
  {
    id: '1',
    user_id: 'user-123',
    title: 'Nueva Calificación ⭐',
    message: 'María González te calificó con 5 estrellas por tu trabajo de plomería',
    type: 'rating',
    is_read: false,
    metadata: {
      rating_id: 'rating-1',
      job_id: 'job-1',
      score: 5,
      rater_name: 'María González',
      job_title: 'Reparación de plomería'
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    user_id: 'user-123',
    title: 'Pago Recibido 💰',
    message: 'Carlos Méndez ha liberado tu pago de $2,500 por el trabajo completado',
    type: 'payment',
    is_read: false,
    metadata: {
      payment_id: 'payment-1',
      job_id: 'job-2',
      amount: 2500,
      client_name: 'Carlos Méndez',
      job_title: 'Instalación eléctrica'
    },
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    user_id: 'user-123',
    title: 'Nueva Solicitud de Trabajo 🔨',
    message: 'Ana López te ha enviado una solicitud para "Pintura de casa" en Las Heras',
    type: 'job_request',
    is_read: true,
    metadata: {
      job_id: 'job-3',
      client_name: 'Ana López',
      job_title: 'Pintura de casa',
      location: 'Las Heras'
    },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

export default {
  HeaderWithNotifications,
  DashboardWithNotifications,
  NotificationsPage,
  AppWithNotificationSidebar,
  MobileNotificationBell,
  StandaloneNotificationList,
  RatingWithNotification,
  RealTimeNotificationsDemo,
  mockNotifications
};




