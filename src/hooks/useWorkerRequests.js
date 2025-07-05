import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

/**
 * Hook personalizado para manejar las solicitudes de un trabajador
 * @param {string} workerId - ID del trabajador
 * @param {string} statusFilter - Filtro de estado (opcional)
 */
export const useWorkerRequests = (workerId, statusFilter = null) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar solicitudes del trabajador
  const fetchRequests = async () => {
    if (!workerId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('requests')
        .select(`
          *,
          client:profiles!requests_client_id_fkey(
            id,
            full_name,
            email,
            phone
          ),
          worker:profiles!requests_worker_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

      // Aplicar filtro de estado si se especifica
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Transformar datos para incluir información del cliente
      const transformedRequests = data?.map(request => ({
        ...request,
        client_name: request.client?.full_name || 'Cliente no especificado',
        client_email: request.client?.email,
        client_phone: request.client?.phone,
      })) || [];

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setError(err.message);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  // Aceptar una solicitud
  const acceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: 'en curso',
          accepted_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('worker_id', workerId);

      if (error) throw error;

      // Actualizar estado local
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'en curso', accepted_at: new Date().toISOString() }
            : req
        )
      );

      toast.success('Solicitud aceptada exitosamente');
    } catch (err) {
      console.error('Error al aceptar solicitud:', err);
      toast.error('Error al aceptar la solicitud');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar una solicitud
  const rejectRequest = async (requestId, reason = '') => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: 'rechazado',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId)
        .eq('worker_id', workerId);

      if (error) throw error;

      // Actualizar estado local
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rechazado', rejected_at: new Date().toISOString(), rejection_reason: reason }
            : req
        )
      );

      toast.success('Solicitud rechazada');
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
      toast.error('Error al rechazar la solicitud');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Completar una solicitud
  const completeRequest = async (requestId) => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: 'completado',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('worker_id', workerId);

      if (error) throw error;

      // Actualizar estado local
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'completado', completed_at: new Date().toISOString() }
            : req
        )
      );

      toast.success('Solicitud marcada como completada');
    } catch (err) {
      console.error('Error al completar solicitud:', err);
      toast.error('Error al completar la solicitud');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Cancelar una solicitud
  const cancelRequest = async (requestId, reason = '') => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: 'cancelado',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', requestId)
        .eq('worker_id', workerId);

      if (error) throw error;

      // Actualizar estado local
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'cancelado', cancelled_at: new Date().toISOString(), cancellation_reason: reason }
            : req
        )
      );

      toast.success('Solicitud cancelada');
    } catch (err) {
      console.error('Error al cancelar solicitud:', err);
      toast.error('Error al cancelar la solicitud');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Actualizar solicitudes cuando cambie el workerId o filtro
  useEffect(() => {
    fetchRequests();
  }, [workerId, statusFilter]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!workerId) return;

    const subscription = supabase
      .channel('worker-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `worker_id=eq.${workerId}`
        },
        (payload) => {
          console.log('Cambio en solicitudes:', payload);
          // Recargar solicitudes cuando haya cambios
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [workerId]);

  // Estadísticas de las solicitudes
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pendiente').length,
    inProgress: requests.filter(r => r.status === 'en curso').length,
    completed: requests.filter(r => r.status === 'completado').length,
    cancelled: requests.filter(r => r.status === 'cancelado').length,
    rejected: requests.filter(r => r.status === 'rechazado').length,
  };

  return {
    requests,
    loading,
    error,
    actionLoading,
    stats,
    fetchRequests,
    acceptRequest,
    rejectRequest,
    completeRequest,
    cancelRequest,
  };
}; 