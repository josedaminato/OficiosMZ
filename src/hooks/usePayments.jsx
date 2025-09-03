import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const usePayments = (userId) => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('supabase.auth.token');
        const parsedToken = token ? JSON.parse(token) : null;
        const accessToken = parsedToken?.currentSession?.access_token;

        if (!accessToken) {
            throw new Error("No authentication token found.");
        }

        return {
            Authorization: `Bearer ${accessToken}`,
        };
    }, []);

    const fetchPayments = useCallback(async (statusFilter = null, limit = 20, offset = 0) => {
        if (!userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status_filter', statusFilter);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await axios.get(
                `${API_BASE_URL}/payments/user/${userId}?${params}`,
                { headers: getAuthHeaders() }
            );
            
            setPayments(response.data);
        } catch (err) {
            console.error("Error fetching payments:", err);
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, getAuthHeaders]);

    const fetchStats = useCallback(async () => {
        if (!userId) return;
        
        try {
            const response = await axios.get(
                `${API_BASE_URL}/payments/user/${userId}/stats`,
                { headers: getAuthHeaders() }
            );
            
            setStats(response.data);
        } catch (err) {
            console.error("Error fetching payment stats:", err);
            setError(err.response?.data?.detail || err.message);
        }
    }, [userId, getAuthHeaders]);

    const createPayment = useCallback(async (paymentData) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/payments/`,
                paymentData,
                { headers: getAuthHeaders() }
            );
            
            // Refrescar la lista de pagos
            await fetchPayments();
            await fetchStats();
            
            return response.data;
        } catch (err) {
            console.error("Error creating payment:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders, fetchPayments, fetchStats]);

    const holdPayment = useCallback(async (paymentId) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/payments/${paymentId}/hold`,
                {},
                { headers: getAuthHeaders() }
            );
            
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
            
            return response.data;
        } catch (err) {
            console.error("Error holding payment:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders, fetchStats]);

    const releasePayment = useCallback(async (paymentId) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/payments/${paymentId}/release`,
                {},
                { headers: getAuthHeaders() }
            );
            
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
            
            return response.data;
        } catch (err) {
            console.error("Error releasing payment:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders, fetchStats]);

    const getPayment = useCallback(async (paymentId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/payments/${paymentId}`,
                { headers: getAuthHeaders() }
            );
            
            return response.data;
        } catch (err) {
            console.error("Error fetching payment:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

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

