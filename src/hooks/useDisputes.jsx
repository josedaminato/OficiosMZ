import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const useDisputes = (userId) => {
    const [disputes, setDisputes] = useState([]);
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

    const fetchDisputes = useCallback(async (statusFilter = null, limit = 20, offset = 0) => {
        if (!userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status_filter', statusFilter);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await axios.get(
                `${API_BASE_URL}/disputes/user/${userId}?${params}`,
                { headers: getAuthHeaders() }
            );
            
            setDisputes(response.data);
        } catch (err) {
            console.error("Error fetching disputes:", err);
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, getAuthHeaders]);

    const fetchAllDisputes = useCallback(async (statusFilter = null, limit = 50, offset = 0) => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status_filter', statusFilter);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await axios.get(
                `${API_BASE_URL}/disputes/admin?${params}`,
                { headers: getAuthHeaders() }
            );
            
            setDisputes(response.data);
        } catch (err) {
            console.error("Error fetching all disputes:", err);
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    const createDispute = useCallback(async (disputeData) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/disputes/`,
                disputeData,
                { headers: getAuthHeaders() }
            );
            
            // Refrescar la lista de disputas
            await fetchDisputes();
            
            return response.data;
        } catch (err) {
            console.error("Error creating dispute:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders, fetchDisputes]);

    const updateDispute = useCallback(async (disputeId, updateData) => {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/disputes/${disputeId}`,
                updateData,
                { headers: getAuthHeaders() }
            );
            
            // Actualizar la disputa en la lista local
            setDisputes(prev => 
                prev.map(dispute => 
                    dispute.id === disputeId 
                        ? { ...dispute, ...updateData }
                        : dispute
                )
            );
            
            return response.data;
        } catch (err) {
            console.error("Error updating dispute:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders]);

    const getDispute = useCallback(async (disputeId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/disputes/${disputeId}`,
                { headers: getAuthHeaders() }
            );
            
            return response.data;
        } catch (err) {
            console.error("Error fetching dispute:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders]);

    const uploadEvidence = useCallback(async (disputeId, file, description = null) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (description) {
                formData.append('description', description);
            }

            const response = await axios.post(
                `${API_BASE_URL}/disputes/${disputeId}/evidence`,
                formData,
                { 
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            return response.data;
        } catch (err) {
            console.error("Error uploading evidence:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders]);

    const getEvidence = useCallback(async (disputeId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/disputes/${disputeId}/evidence`,
                { headers: getAuthHeaders() }
            );
            
            return response.data;
        } catch (err) {
            console.error("Error fetching evidence:", err);
            setError(err.response?.data?.detail || err.message);
            throw err;
        }
    }, [getAuthHeaders]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    useEffect(() => {
        if (userId) {
            fetchDisputes();
        }
    }, [userId, fetchDisputes]);

    return {
        disputes,
        loading,
        error,
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

