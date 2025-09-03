import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente para mostrar una lista de calificaciones recibidas
 */
const RatingList = ({ 
  userId, 
  limit = 10,
  showPagination = true,
  className = '' 
}) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Simular carga de calificaciones (reemplazar con llamada real a la API)
  useEffect(() => {
    loadRatings();
  }, [userId, currentPage]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Reemplazar con llamada real a la API
      // const response = await fetch(`/api/ratings/user/${userId}?page=${currentPage}&limit=${limit}`);
      // const data = await response.json();
      
      // Datos simulados para desarrollo
      const mockRatings = [
        {
          id: '1',
          score: 5,
          comment: 'Excelente trabajo, muy profesional y puntual. Recomiendo ampliamente.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          rater: {
            id: 'rater1',
            full_name: 'María González',
            avatar_url: null
          },
          job_title: 'Reparación de plomería'
        },
        {
          id: '2',
          score: 4,
          comment: 'Buen trabajo, llegó a tiempo y resolvió el problema eficientemente.',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          rater: {
            id: 'rater2',
            full_name: 'Carlos Méndez',
            avatar_url: null
          },
          job_title: 'Instalación eléctrica'
        },
        {
          id: '3',
          score: 5,
          comment: 'Perfecto! Muy satisfecho con el resultado.',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          rater: {
            id: 'rater3',
            full_name: 'Ana López',
            avatar_url: null
          },
          job_title: 'Pintura de casa'
        }
      ];
      
      setTimeout(() => {
        setRatings(mockRatings);
        setTotalPages(Math.ceil(mockRatings.length / limit));
        setLoading(false);
      }, 500);
      
    } catch (err) {
      setError('Error al cargar las calificaciones');
      setLoading(false);
    }
  };

  const renderStars = (score) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < score ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ⭐
      </span>
    ));
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className=\"bg-white rounded-lg border border-gray-200 p-4 animate-pulse\">
            <div className=\"flex items-start space-x-3\">
              <div className=\"w-10 h-10 bg-gray-300 rounded-full\"></div>
              <div className=\"flex-1 space-y-2\">
                <div className=\"h-4 bg-gray-300 rounded w-1/4\"></div>
                <div className=\"h-3 bg-gray-300 rounded w-1/3\"></div>
                <div className=\"h-3 bg-gray-300 rounded w-full\"></div>
                <div className=\"h-3 bg-gray-300 rounded w-2/3\"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className=\"text-red-500 mb-2\">❌</div>
        <div className=\"text-gray-600\">{error}</div>
        <button
          onClick={loadRatings}
          className=\"mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors\"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className=\"text-gray-400 text-4xl mb-2\">⭐</div>
        <div className=\"text-gray-600 mb-1\">Aún no hay calificaciones</div>
        <div className=\"text-sm text-gray-500\">Las calificaciones aparecerán aquí cuando recibas tu primera evaluación</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className=\"space-y-4\">
        {ratings.map((rating) => (
          <div key={rating.id} className=\"bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow\">
            <div className=\"flex items-start space-x-3\">
              {/* Avatar */}
              <div className=\"flex-shrink-0\">
                {rating.rater.avatar_url ? (
                  <img
                    src={rating.rater.avatar_url}
                    alt={rating.rater.full_name}
                    className=\"w-10 h-10 rounded-full object-cover\"
                  />
                ) : (
                  <div className=\"w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm\">
                    {getInitials(rating.rater.full_name)}
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className=\"flex-1 min-w-0\">
                {/* Header */}
                <div className=\"flex items-center justify-between mb-2\">
                  <div>
                    <div className=\"font-medium text-gray-900\">{rating.rater.full_name}</div>
                    <div className=\"text-sm text-gray-500\">{rating.job_title}</div>
                  </div>
                  <div className=\"text-right\">
                    <div className=\"flex items-center mb-1\">{renderStars(rating.score)}</div>
                    <div className=\"text-xs text-gray-500\">
                      {formatDistanceToNow(new Date(rating.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </div>
                  </div>
                </div>

                {/* Comentario */}
                {rating.comment && (
                  <div className=\"text-gray-700 text-sm leading-relaxed\">
                    \"{rating.comment}\"
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {showPagination && totalPages > 1 && (
        <div className=\"flex items-center justify-center space-x-2 mt-6\">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className=\"px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50\"
          >
            Anterior
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className=\"px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50\"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default RatingList;

