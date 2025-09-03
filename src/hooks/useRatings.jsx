import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook personalizado para manejar operaciones de calificaciones
 */
export const useRatings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Crear una nueva calificación
  const createRating = useCallback(async (ratingData) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');

      // Llamar al endpoint del backend
      const response = await fetch('/api/ratings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(ratingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear la calificación');
      }

      const rating = await response.json();
      return rating;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener calificaciones de un usuario
  const getUserRatings = useCallback(async (userId, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ratings/user/${userId}?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener las calificaciones');
      }

      const data = await response.json();
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener promedio de calificaciones de un usuario
  const getUserRatingAverage = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ratings/user/${userId}/average`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al obtener el promedio de calificaciones');
      }

      const data = await response.json();
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar si se puede calificar un trabajo
  const canRateJob = useCallback(async (jobId) => {
    try {
      // Obtener información del trabajo
      const { data: job, error: jobError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      if (!job) throw new Error('Trabajo no encontrado');

      // Verificar que el trabajo esté completado
      if (job.status !== 'completado') {
        return {
          canRate: false,
          reason: 'El trabajo debe estar completado para poder calificar'
        };
      }

      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el usuario sea parte del trabajo
      const isClient = job.client_id === user.id;
      const isWorker = job.worker_id === user.id;

      if (!isClient && !isWorker) {
        return {
          canRate: false,
          reason: 'Solo los participantes del trabajo pueden calificar'
        };
      }

      // Determinar a quién puede calificar
      const ratedUserId = isClient ? job.worker_id : job.client_id;

      // Verificar si ya calificó
      const { data: existingRating, error: ratingError } = await supabase
        .from('ratings')
        .select('*')
        .eq('job_id', jobId)
        .eq('rater_id', user.id)
        .single();

      if (ratingError && ratingError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw ratingError;
      }

      if (existingRating) {
        return {
          canRate: false,
          reason: 'Ya has calificado este trabajo'
        };
      }

      return {
        canRate: true,
        ratedUserId,
        job
      };

    } catch (err) {
      setError(err.message);
      return {
        canRate: false,
        reason: err.message
      };
    }
  }, []);

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createRating,
    getUserRatings,
    getUserRatingAverage,
    canRateJob,
    clearError
  };
};

/**
 * Hook para obtener y gestionar calificaciones en tiempo real
 */
export const useUserRatings = (userId) => {
  const [ratings, setRatings] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getUserRatings, getUserRatingAverage } = useRatings();

  // Cargar datos iniciales
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar calificaciones y promedio en paralelo
        const [ratingsResponse, averageResponse] = await Promise.all([
          getUserRatings(userId),
          getUserRatingAverage(userId)
        ]);

        setRatings(ratingsResponse.ratings || []);
        setAverageScore(averageResponse.average_score || 0);
        setTotalRatings(averageResponse.total_ratings || 0);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, getUserRatings, getUserRatingAverage]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`ratings_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ratings',
        filter: `rated_id=eq.${userId}`
      }, (payload) => {
        console.log('Rating change:', payload);
        
        // Recargar datos cuando hay cambios
        getUserRatings(userId).then(response => {
          setRatings(response.ratings || []);
        });
        
        getUserRatingAverage(userId).then(response => {
          setAverageScore(response.average_score || 0);
          setTotalRatings(response.total_ratings || 0);
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, getUserRatings, getUserRatingAverage]);

  return {
    ratings,
    averageScore,
    totalRatings,
    loading,
    error
  };
};

export default useRatings;

