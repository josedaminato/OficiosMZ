import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from './useApi';

/**
 * Hook para analytics y métricas
 * Maneja fetching, cache y revalidación de datos de analytics
 */

// Tipos de métricas disponibles
export const MetricTypes = {
  KPIS: 'kpis',
  FUNNEL: 'funnel',
  QUALITY: 'quality',
  OPS: 'ops',
  GEO: 'geo',
  PERFORMANCE: 'performance',
  USER_KPIS: 'user-kpis'
};

// Tipos de eventos de tracking
export const EventTypes = {
  PAGE_VIEW: 'page_view',
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICK: 'search_result_click',
  REQUEST_CREATED: 'request_created',
  PAYMENT_HELD: 'payment_held',
  PAYMENT_RELEASED: 'payment_released',
  RATING_SUBMITTED: 'rating_submitted',
  DISPUTE_OPENED: 'dispute_opened',
  DISPUTE_RESOLVED: 'dispute_resolved',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  NOTIFICATION_DELIVERED: 'notification_delivered',
  NOTIFICATION_READ: 'notification_read',
  PWA_INSTALLED: 'pwa_installed',
  PUSH_ENABLED: 'push_enabled',
  PERFORMANCE_METRIC: 'performance_metric'
};

/**
 * Hook principal de analytics
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y funciones de analytics
 */
export const useAnalytics = (options = {}) => {
  const {
    enableCache = true,
    cacheTimeout = 300000, // 5 minutos por defecto
    enableAutoRefresh = false,
    refreshInterval = 60000, // 1 minuto
    enableTracking = true
  } = options;

  // Estado de analytics
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Hook de API
  const { execute: executeApi } = useApi('/api/analytics');

  // Generar session ID único
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  // Verificar consentimiento al montar
  useEffect(() => {
    if (enableTracking) {
      checkConsentStatus();
    }
  }, [enableTracking]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        // Refrescar métricas activas
        Object.keys(metrics).forEach(metricType => {
          if (metrics[metricType]?.lastFetched) {
            const timeSinceLastFetch = Date.now() - metrics[metricType].lastFetched;
            if (timeSinceLastFetch > cacheTimeout) {
              fetchMetric(metricType, metrics[metricType].params);
            }
          }
        });
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [enableAutoRefresh, refreshInterval, metrics, cacheTimeout]);

  // Verificar estado de consentimiento
  const checkConsentStatus = useCallback(async () => {
    try {
      const response = await executeApi({}, { method: 'GET', endpoint: '/consent-status' });
      if (response.success) {
        setConsentGiven(response.data.consent_given);
      }
    } catch (error) {
      console.warn('Error verificando consentimiento:', error);
      // En caso de error, asumir que no hay consentimiento
      setConsentGiven(false);
    }
  }, [executeApi]);

  // Establecer consentimiento
  const setConsent = useCallback(async (consent, ipAddress = null, userAgent = null) => {
    try {
      const response = await executeApi(
        { consent, ip_address: ipAddress, user_agent: userAgent },
        { method: 'POST', endpoint: '/consent' }
      );
      
      if (response.success) {
        setConsentGiven(consent);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error estableciendo consentimiento:', error);
      return false;
    }
  }, [executeApi]);

  // Obtener métricas específicas
  const fetchMetric = useCallback(async (metricType, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache si está habilitado
      if (enableCache && metrics[metricType]?.lastFetched) {
        const timeSinceLastFetch = Date.now() - metrics[metricType].lastFetched;
        if (timeSinceLastFetch < cacheTimeout) {
          setLoading(false);
          return metrics[metricType].data;
        }
      }

      // Construir query parameters
      const queryParams = new URLSearchParams();
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.segment) queryParams.append('segment', params.segment);

      const endpoint = metricType === MetricTypes.USER_KPIS ? '/user-kpis' : `/${metricType}`;
      const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;

      const response = await executeApi({}, { method: 'GET', endpoint: url });

      if (response.success) {
        const metricData = {
          data: response.data,
          lastFetched: Date.now(),
          params: params
        };

        setMetrics(prev => ({
          ...prev,
          [metricType]: metricData
        }));

        setLastUpdated(new Date());
        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo métricas');
      }
    } catch (error) {
      console.error(`Error obteniendo métrica ${metricType}:`, error);
      setError(error.message || 'Error obteniendo métricas');
      return null;
    } finally {
      setLoading(false);
    }
  }, [executeApi, enableCache, cacheTimeout, metrics]);

  // Obtener múltiples métricas
  const fetchMetrics = useCallback(async (metricTypes, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const promises = metricTypes.map(metricType => fetchMetric(metricType, params));
      const results = await Promise.all(promises);

      const successCount = results.filter(result => result !== null).length;
      if (successCount === 0) {
        throw new Error('No se pudieron obtener las métricas');
      }

      return results;
    } catch (error) {
      console.error('Error obteniendo múltiples métricas:', error);
      setError(error.message || 'Error obteniendo métricas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchMetric]);

  // Obtener datos del dashboard completo
  const fetchDashboardData = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await executeApi(
        {},
        { 
          method: 'GET', 
          endpoint: '/dashboard',
          params: {
            start_date: params.start_date,
            end_date: params.end_date
          }
        }
      );

      if (response.success) {
        setMetrics(prev => ({
          ...prev,
          dashboard: {
            data: response.data,
            lastFetched: Date.now(),
            params: params
          }
        }));

        setLastUpdated(new Date());
        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo datos del dashboard');
      }
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      setError(error.message || 'Error obteniendo datos del dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, [executeApi]);

  // Trackear evento
  const trackEvent = useCallback(async (eventType, payload = {}, deviceInfo = null) => {
    if (!enableTracking || !consentGiven) {
      console.warn('Tracking deshabilitado o sin consentimiento');
      return false;
    }

    try {
      const response = await executeApi(
        {
          event_type: eventType,
          payload: payload,
          session_id: sessionId,
          device_info: deviceInfo
        },
        { method: 'POST', endpoint: '/track-event' }
      );

      if (response.success) {
        console.debug(`Evento ${eventType} trackeado exitosamente`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error trackeando evento ${eventType}:`, error);
      return false;
    }
  }, [executeApi, enableTracking, consentGiven, sessionId]);

  // Trackear página vista
  const trackPageView = useCallback(async (page, metadata = {}) => {
    return await trackEvent(EventTypes.PAGE_VIEW, {
      page: page,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }, [trackEvent]);

  // Trackear búsqueda
  const trackSearch = useCallback(async (query, filters = {}, resultsCount = 0) => {
    return await trackEvent(EventTypes.SEARCH_PERFORMED, {
      query: query,
      filters: filters,
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear click en resultado
  const trackSearchResultClick = useCallback(async (workerId, position, query) => {
    return await trackEvent(EventTypes.SEARCH_RESULT_CLICK, {
      worker_id: workerId,
      position: position,
      query: query,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear creación de solicitud
  const trackRequestCreated = useCallback(async (requestId, workerId, amount, oficio, zona) => {
    return await trackEvent(EventTypes.REQUEST_CREATED, {
      request_id: requestId,
      worker_id: workerId,
      amount: amount,
      oficio: oficio,
      zona: zona,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear pago retenido
  const trackPaymentHeld = useCallback(async (paymentId, amount, requestId) => {
    return await trackEvent(EventTypes.PAYMENT_HELD, {
      payment_id: paymentId,
      amount: amount,
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear pago liberado
  const trackPaymentReleased = useCallback(async (paymentId, amount, requestId) => {
    return await trackEvent(EventTypes.PAYMENT_RELEASED, {
      payment_id: paymentId,
      amount: amount,
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear calificación
  const trackRatingSubmitted = useCallback(async (ratingId, score, comment, workerId) => {
    return await trackEvent(EventTypes.RATING_SUBMITTED, {
      rating_id: ratingId,
      score: score,
      comment: comment,
      worker_id: workerId,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear instalación PWA
  const trackPWAInstalled = useCallback(async (platform, version) => {
    return await trackEvent(EventTypes.PWA_INSTALLED, {
      platform: platform,
      version: version,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear habilitación de push
  const trackPushEnabled = useCallback(async (permission) => {
    return await trackEvent(EventTypes.PUSH_ENABLED, {
      permission: permission,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Trackear métrica de performance
  const trackPerformanceMetric = useCallback(async (metricType, value, metadata = {}) => {
    return await trackEvent(EventTypes.PERFORMANCE_METRIC, {
      metric_type: metricType,
      value: value,
      metadata: metadata,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  // Exportar datos
  const exportData = useCallback(async (reportType, startDate, endDate) => {
    try {
      const response = await executeApi(
        {},
        { 
          method: 'GET', 
          endpoint: '/export.csv',
          params: {
            report_type: reportType,
            start_date: startDate,
            end_date: endDate
          }
        }
      );

      if (response.success) {
        // Crear y descargar archivo
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_${startDate}_${endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error exportando datos:', error);
      return false;
    }
  }, [executeApi]);

  // Refrescar vistas materializadas
  const refreshViews = useCallback(async () => {
    try {
      const response = await executeApi({}, { method: 'POST', endpoint: '/refresh-views' });
      return response.success;
    } catch (error) {
      console.error('Error refrescando vistas:', error);
      return false;
    }
  }, [executeApi]);

  // Limpiar cache
  const clearCache = useCallback(() => {
    setMetrics({});
    setLastUpdated(null);
  }, []);

  // Obtener métrica específica del cache
  const getCachedMetric = useCallback((metricType) => {
    return metrics[metricType]?.data || null;
  }, [metrics]);

  // Verificar si una métrica está en cache y es válida
  const isMetricCached = useCallback((metricType) => {
    if (!enableCache || !metrics[metricType]) return false;
    const timeSinceLastFetch = Date.now() - metrics[metricType].lastFetched;
    return timeSinceLastFetch < cacheTimeout;
  }, [enableCache, metrics, cacheTimeout]);

  // Memoizar valores calculados
  const memoizedValues = useMemo(() => ({
    hasData: Object.keys(metrics).length > 0,
    isLoading: loading,
    hasError: !!error,
    canTrack: enableTracking && consentGiven,
    lastUpdated: lastUpdated,
    sessionId: sessionId
  }), [metrics, loading, error, enableTracking, consentGiven, lastUpdated, sessionId]);

  return {
    // Estado
    metrics,
    loading,
    error,
    lastUpdated,
    consentGiven,
    sessionId,

    // Funciones de fetching
    fetchMetric,
    fetchMetrics,
    fetchDashboardData,

    // Funciones de tracking
    trackEvent,
    trackPageView,
    trackSearch,
    trackSearchResultClick,
    trackRequestCreated,
    trackPaymentHeld,
    trackPaymentReleased,
    trackRatingSubmitted,
    trackPWAInstalled,
    trackPushEnabled,
    trackPerformanceMetric,

    // Funciones de consentimiento
    setConsent,
    checkConsentStatus,

    // Funciones de utilidad
    exportData,
    refreshViews,
    clearCache,
    getCachedMetric,
    isMetricCached,

    // Valores memoizados
    ...memoizedValues
  };
};

export default useAnalytics;
