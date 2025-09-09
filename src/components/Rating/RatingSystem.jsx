import React, { useState } from 'react';
import RatingForm from './RatingForm';
import RatingSummary, { RatingStats } from './RatingSummary';
import RatingList from './RatingList';
import { useRatings, useUserRatings } from '../../hooks/useRatings';

/**
 * Componente principal del sistema de calificaciones
 */
const RatingSystem = ({ 
  mode = 'view', // 'view' | 'rate' | 'manage'
  userId,
  jobId = null,
  ratedUserId = null,
  showStats = true,
  showList = true,
  className = ''
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [showRatingForm, setShowRatingForm] = useState(false);
  
  const { createRating, loading: ratingLoading, error: ratingError } = useRatings();
  const { 
    ratings, 
    averageScore, 
    totalRatings, 
    loading: userRatingsLoading, 
    error: userRatingsError 
  } = useUserRatings(userId);

  // Manejar envío de calificación
  const handleRatingSubmit = async (ratingData) => {
    try {
      await createRating(ratingData);
      
      // Mostrar mensaje de éxito
      alert('¡Calificación enviada exitosamente!');
      
      // Volver al modo de visualización
      setShowRatingForm(false);
      setCurrentMode('view');
      
    } catch (error) {
      // El error ya se maneja en el hook
      console.error('Error al enviar calificación:', error);
    }
  };

  // Renderizar formulario de calificación
  const renderRatingForm = () => {
    if (!showRatingForm || !jobId || !ratedUserId) return null;

    return (
      <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4\">
        <div className=\"max-w-md w-full\">
          <RatingForm
            jobId={jobId}
            ratedUserId={ratedUserId}
            onSubmit={handleRatingSubmit}
            onCancel={() => setShowRatingForm(false)}
            isLoading={ratingLoading}
          />
        </div>
      </div>
    );
  };

  // Renderizar botón para calificar
  const renderRateButton = () => {
    if (currentMode !== 'rate' || !jobId || !ratedUserId) return null;

    return (
      <div className=\"mb-6\">
        <button
          onClick={() => setShowRatingForm(true)}
          className=\"w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2\"
        >
          <span>⭐</span>
          <span>Calificar Trabajo</span>
        </button>
      </div>
    );
  };

  // Renderizar errores
  const renderErrors = () => {
    const errors = [ratingError, userRatingsError].filter(Boolean);
    if (errors.length === 0) return null;

    return (
      <div className=\"bg-red-50 border border-red-200 rounded-lg p-4 mb-6\">
        <div className=\"flex items-center space-x-2 text-red-800\">
          <span>⚠️</span>
          <span className=\"font-medium\">Error</span>
        </div>
        <div className=\"mt-2 text-sm text-red-700\">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Errores */}
      {renderErrors()}

      {/* Botón para calificar */}
      {renderRateButton()}

      {/* Estadísticas de calificaciones */}
      {showStats && (
        <RatingStats
          averageScore={averageScore}
          totalRatings={totalRatings}
          className=\"mb-6\"
        />
      )}

      {/* Lista de calificaciones */}
      {showList && (
        <div>
          <div className=\"flex items-center justify-between mb-4\">
            <h3 className=\"text-lg font-semibold text-gray-800\">
              Calificaciones Recibidas
            </h3>
            {totalRatings > 0 && (
              <RatingSummary
                averageScore={averageScore}
                totalRatings={totalRatings}
                size=\"small\"
              />
            )}
          </div>
          
          <RatingList
            userId={userId}
            className=\"\"
          />
        </div>
      )}

      {/* Modal de formulario de calificación */}
      {renderRatingForm()}

      {/* Indicador de carga global */}
      {(ratingLoading || userRatingsLoading) && (
        <div className=\"fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40\">
          <div className=\"bg-white rounded-lg p-6 flex items-center space-x-3\">
            <svg className=\"animate-spin h-5 w-5 text-blue-600\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">
              <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>
              <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>
            </svg>
            <span className=\"text-gray-700\">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente compacto para mostrar solo el resumen de calificaciones
 */
export const RatingBadge = ({ userId, size = 'small', onClick = null }) => {
  const { averageScore, totalRatings, loading } = useUserRatings(userId);

  if (loading) {
    return (
      <div className=\"flex items-center space-x-1\">
        <div className=\"w-4 h-4 bg-gray-300 rounded animate-pulse\"></div>
        <div className=\"w-8 h-3 bg-gray-300 rounded animate-pulse\"></div>
      </div>
    );
  }

  const component = (
    <RatingSummary
      averageScore={averageScore}
      totalRatings={totalRatings}
      size={size}
      showDetails={false}
    />
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className=\"hover:bg-gray-50 rounded px-2 py-1 transition-colors\"
      >
        {component}
      </button>
    );
  }

  return component;
};

/**
 * Componente para integrar en cards de trabajadores
 */
export const WorkerRatingBadge = ({ workerId, onClick = null }) => {
  return (
    <RatingBadge 
      userId={workerId} 
      size=\"small\" 
      onClick={onClick}
    />
  );
};

export default RatingSystem;




