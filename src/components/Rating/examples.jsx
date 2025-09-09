import React, { useState } from 'react';
import { 
  RatingSystem, 
  RatingBadge, 
  WorkerRatingBadge,
  RatingForm, 
  RatingSummary, 
  RatingList 
} from './index';

/**
 * Ejemplos de uso del Sistema de Calificaciones
 */

// 1. Vista completa de calificaciones de un usuario
export const UserProfileRatings = ({ userId }) => {
  return (
    <div className=\"bg-gray-50 min-h-screen p-6\">
      <div className=\"max-w-4xl mx-auto\">
        <h1 className=\"text-2xl font-bold text-gray-800 mb-6\">
          Perfil de Usuario - Calificaciones
        </h1>
        
        <RatingSystem
          mode=\"view\"
          userId={userId}
          showStats={true}
          showList={true}
          className=\"bg-white rounded-lg shadow-lg p-6\"
        />
      </div>
    </div>
  );
};

// 2. Formulario de calificación después de completar un trabajo
export const JobCompletionRating = ({ jobId, workerId, clientId, currentUserId }) => {
  const ratedUserId = currentUserId === clientId ? workerId : clientId;
  
  return (
    <div className=\"max-w-2xl mx-auto p-6\">
      <div className=\"bg-white rounded-lg shadow-lg p-6\">
        <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">
          ¡Trabajo Completado! 🎉
        </h2>
        <p className=\"text-gray-600 mb-6\">
          Tu trabajo ha sido completado exitosamente. Por favor, califica tu experiencia.
        </p>
        
        <RatingSystem
          mode=\"rate\"
          userId={ratedUserId}
          jobId={jobId}
          ratedUserId={ratedUserId}
          showStats={false}
          showList={false}
        />
      </div>
    </div>
  );
};

// 3. Card de trabajador con calificación
export const WorkerCard = ({ worker, onContactClick, onViewProfile }) => {
  return (
    <div className=\"bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow\">
      {/* Header con foto y nombre */}
      <div className=\"flex items-center space-x-4 mb-4\">
        <img
          src={worker.avatar_url || '/default-avatar.png'}
          alt={worker.full_name}
          className=\"w-16 h-16 rounded-full object-cover\"
        />
        <div className=\"flex-1\">
          <h3 className=\"text-lg font-semibold text-gray-800\">{worker.full_name}</h3>
          <p className=\"text-sm text-gray-600\">{worker.profession}</p>
          
          {/* Calificación Badge */}
          <WorkerRatingBadge 
            workerId={worker.id} 
            onClick={() => onViewProfile(worker.id)}
          />
        </div>
      </div>

      {/* Descripción */}
      <p className=\"text-gray-700 text-sm mb-4 line-clamp-3\">
        {worker.description}
      </p>

      {/* Precio */}
      <div className=\"flex items-center justify-between mb-4\">
        <span className=\"text-lg font-semibold text-green-600\">
          ${worker.hourly_rate}/hora
        </span>
        <span className=\"text-sm text-gray-500\">{worker.location}</span>
      </div>

      {/* Botones de acción */}
      <div className=\"flex space-x-2\">
        <button
          onClick={() => onContactClick(worker.id)}
          className=\"flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors\"
        >
          Contactar
        </button>
        <button
          onClick={() => onViewProfile(worker.id)}
          className=\"px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors\"
        >
          Ver Perfil
        </button>
      </div>
    </div>
  );
};

// 4. Dashboard de trabajador con sus calificaciones
export const WorkerDashboard = ({ workerId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className=\"max-w-6xl mx-auto p-6\">
      <div className=\"bg-white rounded-lg shadow-lg\">
        {/* Tabs */}
        <div className=\"border-b border-gray-200\">
          <nav className=\"flex space-x-8 px-6\">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'ratings', label: 'Calificaciones' },
              { id: 'jobs', label: 'Trabajos' },
              { id: 'settings', label: 'Configuración' }
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
        <div className=\"p-6\">
          {activeTab === 'overview' && (
            <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
              {/* Estadísticas rápidas */}
              <div className=\"lg:col-span-2 space-y-4\">
                <h2 className=\"text-xl font-semibold text-gray-800\">Resumen del Perfil</h2>
                {/* Aquí irían otras estadísticas */}
              </div>
              
              {/* Calificaciones compactas */}
              <div>
                <RatingSystem
                  mode=\"view\"
                  userId={workerId}
                  showStats={true}
                  showList={false}
                />
              </div>
            </div>
          )}

          {activeTab === 'ratings' && (
            <RatingSystem
              mode=\"view\"
              userId={workerId}
              showStats={true}
              showList={true}
            />
          )}

          {activeTab === 'jobs' && (
            <div>
              <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">Historial de Trabajos</h2>
              {/* Lista de trabajos */}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">Configuración</h2>
              {/* Configuraciones */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 5. Lista de trabajadores con calificaciones
export const WorkerSearchResults = ({ workers, onWorkerSelect }) => {
  return (
    <div className=\"space-y-4\">
      <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">
        Trabajadores Encontrados ({workers.length})
      </h2>
      
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
        {workers.map(worker => (
          <div key={worker.id} className=\"relative\">
            <WorkerCard
              worker={worker}
              onContactClick={onWorkerSelect}
              onViewProfile={onWorkerSelect}
            />
            
            {/* Badge de calificación flotante */}
            <div className=\"absolute top-2 right-2 bg-white rounded-full shadow-lg p-2\">
              <RatingBadge userId={worker.id} size=\"small\" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. Modal de calificación independiente
export const RatingModal = ({ isOpen, onClose, jobId, ratedUserId }) => {
  const [loading, setLoading] = useState(false);

  const handleRatingSubmit = async (ratingData) => {
    setLoading(true);
    try {
      // Aquí iría la lógica de envío
      console.log('Rating submitted:', ratingData);
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('¡Calificación enviada exitosamente!');
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
      <div className=\"max-w-md w-full\">
        <RatingForm
          jobId={jobId}
          ratedUserId={ratedUserId}
          onSubmit={handleRatingSubmit}
          onCancel={onClose}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

// Datos de ejemplo para testing
export const mockWorkers = [
  {
    id: '1',
    full_name: 'Juan Pérez',
    profession: 'Plomero',
    description: 'Especialista en reparaciones de plomería residencial y comercial. +10 años de experiencia.',
    hourly_rate: 2500,
    location: 'Godoy Cruz, Mendoza',
    avatar_url: null
  },
  {
    id: '2',
    full_name: 'María González',
    profession: 'Electricista',
    description: 'Instalaciones eléctricas, reparaciones y mantenimiento. Certificada y con seguro.',
    hourly_rate: 3000,
    location: 'Ciudad, Mendoza',
    avatar_url: null
  },
  {
    id: '3',
    full_name: 'Carlos Rodríguez',
    profession: 'Pintor',
    description: 'Pintura interior y exterior, empapelado, trabajos de decoración.',
    hourly_rate: 2000,
    location: 'Las Heras, Mendoza',
    avatar_url: null
  }
];

export default {
  UserProfileRatings,
  JobCompletionRating,
  WorkerCard,
  WorkerDashboard,
  WorkerSearchResults,
  RatingModal,
  mockWorkers
};




