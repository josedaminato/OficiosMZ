import { useState, useEffect, useCallback } from 'react';
import { useApi, useAsyncState } from './useApi';

const usePayments = (userId) => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);

    // Usar useApi para llamadas a la API
    const { execute: executeApi, loading, error, clearError } = useApi(`/api/payments/user/${userId}`);

    const fetchPayments = useCallback(async (statusFilter = null, limit = 20, offset = 0) => {
        if (!userId) return;
        
        const params = {};
        if (statusFilter) params.status_filter = statusFilter;
        params.limit = limit;
        params.offset = offset;

        const data = await executeApi(params, { method: 'GET' });
        setPayments(data);
        return data;
    }, [userId, executeApi]);

    const fetchStats = useCallback(async () => {
        if (!userId) return;
        
        const data = await executeApi({}, { 
            method: 'GET',
            endpoint: `/api/payments/user/${userId}/stats`
        });
        
        setStats(data);
        return data;
    }, [userId, executeApi]);

    const createPayment = useCallback(async (paymentData) => {
        const data = await executeApi(paymentData, { 
            method: 'POST',
            endpoint: '/api/payments/'
        });
        
        // Refrescar la lista de pagos
        await fetchPayments();
        await fetchStats();
        
        return data;
    }, [executeApi, fetchPayments, fetchStats]);

    const holdPayment = useCallback(async (paymentId) => {
        const data = await executeApi({}, { 
            method: 'PATCH',
            endpoint: `/api/payments/${paymentId}/hold`
        });
        
        // Actualizar el pago en la lista local
        setPayments(prev => 
            prev.map(payment => 
                payment.id === paymentId 
                    ? { ...payment, status: 'held', held_at: new Date().toISOString() }
                    : payment
            )
        );
        
        // Refrescar estadísticas
        await fetchStats();
        
        return data;
    }, [executeApi, fetchStats]);

    const releasePayment = useCallback(async (paymentId) => {
        const data = await executeApi({}, { 
            method: 'PATCH',
            endpoint: `/api/payments/${paymentId}/release`
        });
        
        // Actualizar el pago en la lista local
        setPayments(prev => 
            prev.map(payment => 
                payment.id === paymentId 
                    ? { ...payment, status: 'released', released_at: new Date().toISOString() }
                    : payment
            )
        );
        
        // Refrescar estadísticas
        await fetchStats();
        
        return data;
    }, [executeApi, fetchStats]);

    const getPayment = useCallback(async (paymentId) => {
        return executeApi({}, { 
            method: 'GET',
            endpoint: `/api/payments/${paymentId}`
        });
    }, [executeApi]);

    useEffect(() => {
        if (userId) {
            fetchPayments();
            fetchStats();
        }
    }, [userId, fetchPayments, fetchStats]);

    return {
        payments,
        stats,
        loading,
        error,
        fetchPayments,
        fetchStats,
        createPayment,
        holdPayment,
        releasePayment,
        getPayment,
        clearError
    };
};

export default usePayments;



