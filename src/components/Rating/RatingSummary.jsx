import React from 'react';

/**
 * Componente para mostrar el resumen de calificaciones de un usuario
 */
const RatingSummary = ({ 
  averageScore, 
  totalRatings, 
  className = '',
  showDetails = true,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  // Determinar clases según el tamaño
  const sizeClasses = {
    small: {
      container: 'text-sm',
      star: 'text-sm',
      text: 'text-xs'
    },
    medium: {
      container: 'text-base',
      star: 'text-lg',
      text: 'text-sm'
    },
    large: {
      container: 'text-lg',
      star: 'text-2xl',
      text: 'text-base'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.medium;

  // Función para renderizar estrellas
  const renderStars = () => {
    if (!averageScore || averageScore === 0) {
      return (
        <span className={`text-gray-400 ${classes.text}`}>
          Sin calificaciones
        </span>
      );
    }

    const fullStars = Math.floor(averageScore);
    const hasHalfStar = averageScore % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className=\"flex items-center\">
        {/* Estrellas llenas */}
        {[...Array(fullStars)].map((_, index) => (
          <span key={`full-${index}`} className={`text-yellow-400 ${classes.star}`}>
            ⭐
          </span>
        ))}
        
        {/* Media estrella */}
        {hasHalfStar && (
          <span className={`text-yellow-400 ${classes.star}`}>
            ⭐
          </span>
        )}
        
        {/* Estrellas vacías */}
        {[...Array(emptyStars)].map((_, index) => (
          <span key={`empty-${index}`} className={`text-gray-300 ${classes.star}`}>
            ⭐
          </span>
        ))}
      </div>
    );
  };

  // Función para obtener el color basado en la calificación
  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    if (score >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  // Función para obtener texto descriptivo
  const getScoreDescription = (score) => {
    if (score >= 4.5) return 'Excelente';
    if (score >= 3.5) return 'Muy bueno';
    if (score >= 2.5) return 'Bueno';
    if (score >= 1.5) return 'Regular';
    return 'Necesita mejorar';
  };

  if (!averageScore || totalRatings === 0) {
    return (
      <div className={`flex items-center space-x-2 ${classes.container} ${className}`}>
        <span className={`text-gray-400 ${classes.text}`}>
          Sin calificaciones aún
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${classes.container} ${className}`}>
      {/* Estrellas */}
      {renderStars()}
      
      {showDetails && (
        <>
          {/* Puntuación numérica */}
          <span className={`font-semibold ${getScoreColor(averageScore)}`}>
            {averageScore.toFixed(1)}
          </span>
          
          {/* Descripción y cantidad */}
          <span className={`text-gray-600 ${classes.text}`}>
            ({getScoreDescription(averageScore)} - {totalRatings} {totalRatings === 1 ? 'calificación' : 'calificaciones'})
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Componente para mostrar estadísticas detalladas de calificaciones
 */
export const RatingStats = ({ 
  averageScore, 
  totalRatings, 
  ratingDistribution = {},
  className = '' 
}) => {
  // Distribución por estrellas (si está disponible)
  const renderDistribution = () => {
    if (!ratingDistribution || Object.keys(ratingDistribution).length === 0) {
      return null;
    }

    return (
      <div className=\"mt-4 space-y-2\">
        <h4 className=\"text-sm font-medium text-gray-700\">Distribución de calificaciones</h4>
        {[5, 4, 3, 2, 1].map(stars => {
          const count = ratingDistribution[stars] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <div key={stars} className=\"flex items-center space-x-2 text-sm\">
              <span className=\"w-3 text-yellow-400\">⭐</span>
              <span className=\"w-2 text-gray-600\">{stars}</span>
              <div className=\"flex-1 bg-gray-200 rounded-full h-2\">
                <div 
                  className=\"bg-yellow-400 h-2 rounded-full transition-all duration-300\"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className=\"w-8 text-xs text-gray-500 text-right\">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className=\"flex items-center justify-between mb-4\">
        <h3 className=\"text-lg font-semibold text-gray-800\">Calificaciones</h3>
        <RatingSummary 
          averageScore={averageScore} 
          totalRatings={totalRatings} 
          size=\"large\"
          showDetails={false}
        />
      </div>
      
      {totalRatings > 0 ? (
        <div className=\"text-center mb-4\">
          <div className=\"text-3xl font-bold text-gray-800\">{averageScore.toFixed(1)}</div>
          <div className=\"text-sm text-gray-600\">
            Basado en {totalRatings} {totalRatings === 1 ? 'calificación' : 'calificaciones'}
          </div>
        </div>
      ) : (
        <div className=\"text-center text-gray-500 py-8\">
          <div className=\"text-4xl mb-2\">⭐</div>
          <div>Aún no hay calificaciones</div>
          <div className=\"text-sm\">Sé el primero en calificar</div>
        </div>
      )}
      
      {renderDistribution()}
    </div>
  );
};

export default RatingSummary;




