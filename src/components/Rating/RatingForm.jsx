import React, { useState } from 'react';

/**
 * Componente para crear una nueva calificación
 */
const RatingForm = ({ 
  jobId, 
  ratedUserId, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [rating, setRating] = useState({
    score: 0,
    comment: ''
  });
  const [errors, setErrors] = useState({});

  const handleStarClick = (starValue) => {
    setRating(prev => ({ ...prev, score: starValue }));
    if (errors.score) {
      setErrors(prev => ({ ...prev, score: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors = {};
    if (!rating.score || rating.score < 1 || rating.score > 5) {
      newErrors.score = 'Debes seleccionar una calificación del 1 al 5';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        job_id: jobId,
        rated_id: ratedUserId,
        score: rating.score,
        comment: rating.comment.trim() || null
      });
    } catch (error) {
      console.error('Error al enviar calificación:', error);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= rating.score;
      
      return (
        <button
          key={starValue}
          type=\"button\"
          onClick={() => handleStarClick(starValue)}
          className={`text-3xl transition-colors duration-200 hover:scale-110 transform ${
            isFilled 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-300'
          }`}
          disabled={isLoading}
        >
          ⭐
        </button>
      );
    });
  };

  return (
    <div className=\"bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto\">
      <h3 className=\"text-xl font-semibold text-gray-800 mb-4\">
        Calificar Trabajo
      </h3>
      
      <form onSubmit={handleSubmit} className=\"space-y-4\">
        {/* Estrellas */}
        <div className=\"text-center\">
          <label className=\"block text-sm font-medium text-gray-700 mb-2\">
            Calificación *
          </label>
          <div className=\"flex justify-center space-x-1 mb-2\">
            {renderStars()}
          </div>
          {rating.score > 0 && (
            <p className=\"text-sm text-gray-600\">
              {rating.score} de 5 estrella{rating.score !== 1 ? 's' : ''}
            </p>
          )}
          {errors.score && (
            <p className=\"text-sm text-red-600 mt-1\">{errors.score}</p>
          )}
        </div>

        {/* Comentario */}
        <div>
          <label className=\"block text-sm font-medium text-gray-700 mb-1\">
            Comentario (opcional)
          </label>
          <textarea
            value={rating.comment}
            onChange={(e) => setRating(prev => ({ ...prev, comment: e.target.value }))}
            placeholder=\"Comparte tu experiencia con este trabajo...\"
            rows={4}
            className=\"w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"
            disabled={isLoading}
            maxLength={500}
          />
          <p className=\"text-xs text-gray-500 mt-1\">
            {rating.comment.length}/500 caracteres
          </p>
        </div>

        {/* Botones */}
        <div className=\"flex space-x-3 pt-4\">
          <button
            type=\"button\"
            onClick={onCancel}
            disabled={isLoading}
            className=\"flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50\"
          >
            Cancelar
          </button>
          <button
            type=\"submit\"
            disabled={isLoading || rating.score === 0}
            className=\"flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed\"
          >
            {isLoading ? (
              <span className=\"flex items-center justify-center\">
                <svg className=\"animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">
                  <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>
                  <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              'Enviar Calificación'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;




