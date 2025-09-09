import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Hook base para centralizar llamadas a API
 * Maneja loading, error, datos y autenticación JWT
 */
export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const {
    method = 'GET',
    immediate = false,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    transform,
    ...fetchOptions
  } = options;

  /**
   * Obtener token JWT de Supabase
   */
  const getAuthToken = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Sesión no válida');
      return session.access_token;
    } catch (err) {
      throw new Error(`Error de autenticación: ${err.message}`);
    }
  }, []);

  /**
   * Ejecutar llamada a API
   */
  const execute = useCallback(async (params = {}, retryAttempt = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();

      // Obtener token de autenticación
      const token = await getAuthToken();

      // Construir URL
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

      // Construir opciones de fetch
      const fetchConfig = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...fetchOptions.headers
        },
        signal: abortControllerRef.current.signal,
        ...fetchOptions
      };

      // Agregar body si es necesario
      if (method !== 'GET' && params) {
        fetchConfig.body = JSON.stringify(params);
      } else if (method === 'GET' && params) {
        // Agregar parámetros como query string para GET
        const urlParams = new URLSearchParams(params);
        const separator = url.includes('?') ? '&' : '?';
        fetchConfig.url = `${url}${separator}${urlParams}`;
      }

      // Realizar llamada
      const response = await fetch(url, fetchConfig);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Transformar datos si se especifica
      const transformedData = transform ? transform(result) : result;

      setData(transformedData);

      // Callback de éxito
      if (onSuccess) {
        onSuccess(transformedData);
      }

      return transformedData;

    } catch (err) {
      // No mostrar error si fue cancelado
      if (err.name === 'AbortError') {
        return;
      }

      const errorMessage = err.message || 'Error desconocido';

      // Reintentar si es necesario
      if (retryAttempt < retryCount) {
        setTimeout(() => {
          execute(params, retryAttempt + 1);
        }, retryDelay * (retryAttempt + 1));
        return;
      }

      setError(errorMessage);

      // Callback de error
      if (onError) {
        onError(errorMessage);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, getAuthToken, retryCount, retryDelay, onSuccess, onError, transform, fetchOptions]);

  /**
   * Ejecutar inmediatamente si se especifica
   */
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Resetear estado
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    clearError,
    reset
  };
};

/**
 * Hook especializado para operaciones CRUD
 */
export const useCrudApi = (baseEndpoint, options = {}) => {
  const api = useApi(baseEndpoint, options);

  const create = useCallback(async (data) => {
    return api.execute(data, { method: 'POST' });
  }, [api]);

  const read = useCallback(async (id, params = {}) => {
    const endpoint = id ? `${baseEndpoint}/${id}` : baseEndpoint;
    return api.execute(params, { method: 'GET', endpoint });
  }, [api, baseEndpoint]);

  const update = useCallback(async (id, data) => {
    return api.execute(data, { method: 'PUT', endpoint: `${baseEndpoint}/${id}` });
  }, [api, baseEndpoint]);

  const remove = useCallback(async (id) => {
    return api.execute({}, { method: 'DELETE', endpoint: `${baseEndpoint}/${id}` });
  }, [api, baseEndpoint]);

  return {
    ...api,
    create,
    read,
    update,
    remove
  };
};

/**
 * Hook para manejo de estados asíncronos
 */
export const useAsyncState = (initialState = null) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFunction) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setData(initialState);
    setError(null);
    setLoading(false);
  }, [initialState]);

  return {
    data,
    loading,
    error,
    execute,
    clearError,
    reset
  };
};

export default useApi;

