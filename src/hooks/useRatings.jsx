import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useApi, useAsyncState } from './useApi';

/**
 * Hook personalizado para manejar operaciones de calificaciones
 * Refactorizado para usar useApi base
 */
export const useRatings = () => {
  const { execute: executeApi, loading, error, clearError } = useApi('/api/ratings/');

  // Crear una nueva calificación
  const createRating = useCallback(async (ratingData) => {
    return executeApi(ratingData, { method: 'POST' });
  }, [executeApi]);

  // Obtener calificaciones de un usuario
  const getUserRatings = useCallback(async (userId, page = 1, limit = 10) => {
    return executeApi(
      { page, limit },
      { 
        method: 'GET',
        endpoint: `/api/ratings/user/${userId}`
      }
    );
  }, [executeApi]);

  // Obtener promedio de calificaciones de un usuario
  const getUserRatingAverage = useCallback(async (userId) => {
    return executeApi(
      {},
      { 
        method: 'GET',
        endpoint: `/api/ratings/user/${userId}/average`
      }
    );
  }, [executeApi]);

  // Hook para manejo de estados asíncronos para canRateJob
  const canRateJobState = useAsyncState();

  // Verificar si se puede calificar un trabajo
  const canRateJob = useCallback(async (jobId) => {
    return canRateJobState.execute(async () => {
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
    });
  }, [canRateJobState]);

  return {
    loading: loading || canRateJobState.loading,
    error: error || canRateJobState.error,
    createRating,
    getUserRatings,
    getUserRatingAverage,
    canRateJob,
    clearError
  };
};

/**
 * Hook para obtener y gestionar calificaciones en tiempo real
 * Refactorizado para usar useApi base
 */
export const useUserRatings = (userId) => {
  const [ratings, setRatings] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  // Usar useAsyncState para manejo de estados
  const dataState = useAsyncState();

  const { getUserRatings, getUserRatingAverage } = useRatings();

  // Memoizar funciones para evitar recreaciones innecesarias
  const memoizedGetUserRatings = useMemo(() => getUserRatings, [getUserRatings]);
  const memoizedGetUserRatingAverage = useMemo(() => getUserRatingAverage, [getUserRatingAverage]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!userId) return;

    dataState.execute(async () => {
      // Cargar calificaciones y promedio en paralelo
      const [ratingsResponse, averageResponse] = await Promise.all([
        memoizedGetUserRatings(userId),
        memoizedGetUserRatingAverage(userId)
      ]);

      setRatings(ratingsResponse.ratings || []);
      setAverageScore(averageResponse.average_score || 0);
      setTotalRatings(averageResponse.total_ratings || 0);

      return { ratings: ratingsResponse.ratings || [], average: averageResponse };
    });
  }, [userId, memoizedGetUserRatings, memoizedGetUserRatingAverage, dataState]);

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
    loading: dataState.loading,
    error: dataState.error
  };
};

export default useRatings;


