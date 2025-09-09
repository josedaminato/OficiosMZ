import { useState, useEffect, useCallback } from 'react';
import { useApi, useAsyncState } from './useApi';
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const useDisputes = (userId) => {
    const [disputes, setDisputes] = useState([]);

    // Usar useApi para llamadas a la API
    const { execute: executeApi, loading, error, clearError } = useApi(`/api/disputes/user/${userId}`);

    // Función para obtener token de autenticación
    const getAuthToken = useCallback(async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Sesión no válida');
        return session.access_token;
    }, []);

    const fetchDisputes = useCallback(async (statusFilter = null, limit = 20, offset = 0) => {
        if (!userId) return;
        
        const params = {};
        if (statusFilter) params.status_filter = statusFilter;
        params.limit = limit;
        params.offset = offset;

        const data = await executeApi(params, { method: 'GET' });
        setDisputes(data);
        return data;
    }, [userId, executeApi]);

    const fetchAllDisputes = useCallback(async (statusFilter = null, limit = 50, offset = 0) => {
        const params = {};
        if (statusFilter) params.status_filter = statusFilter;
        params.limit = limit;
        params.offset = offset;

        const data = await executeApi(params, { 
            method: 'GET',
            endpoint: '/api/disputes/admin'
        });
        
        setDisputes(data);
        return data;
    }, [executeApi]);

    const createDispute = useCallback(async (disputeData) => {
        const data = await executeApi(disputeData, { 
            method: 'POST',
            endpoint: '/api/disputes/'
        });
        
        // Refrescar la lista de disputas
        await fetchDisputes();
        
        return data;
    }, [executeApi, fetchDisputes]);

    const updateDispute = useCallback(async (disputeId, updateData) => {
        const data = await executeApi(updateData, { 
            method: 'PATCH',
            endpoint: `/api/disputes/${disputeId}`
        });
        
        // Actualizar la disputa en la lista local
        setDisputes(prev => 
            prev.map(dispute => 
                dispute.id === disputeId 
                    ? { ...dispute, ...updateData }
                    : dispute
            )
        );
        
        return data;
    }, [executeApi]);

    const getDispute = useCallback(async (disputeId) => {
        return executeApi({}, { 
            method: 'GET',
            endpoint: `/api/disputes/${disputeId}`
        });
    }, [executeApi]);

    // Hook para manejo de estados asíncronos para uploadEvidence
    const uploadState = useAsyncState();

    const uploadEvidence = useCallback(async (disputeId, file, description = null) => {
        return uploadState.execute(async () => {
            const formData = new FormData();
            formData.append('file', file);
            if (description) {
                formData.append('description', description);
            }

            // Usar fetch directamente para FormData
            const token = await getAuthToken();
            const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error uploading evidence');
            }

            return response.json();
        });
    }, [uploadState]);

    const getEvidence = useCallback(async (disputeId) => {
        return executeApi({}, { 
            method: 'GET',
            endpoint: `/api/disputes/${disputeId}/evidence`
        });
    }, [executeApi]);

    useEffect(() => {
        if (userId) {
            fetchDisputes();
        }
    }, [userId, fetchDisputes]);

    return {
        disputes,
        loading: loading || uploadState.loading,
        error: error || uploadState.error,
        fetchDisputes,
        fetchAllDisputes,
        createDispute,
        updateDispute,
        getDispute,
        uploadEvidence,
        getEvidence,
        clearError
    };
};

export default useDisputes;



