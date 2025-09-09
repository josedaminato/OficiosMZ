import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  MessageCircle,
  MapPin,
  Clock,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

import useAnalytics from '../../hooks/useAnalytics';
import KPIStats from './KPIStats';
import FunnelChart from './FunnelChart';
import QualityCharts from './QualityCharts';
import OpsCharts from './OpsCharts';
import GeoHeatmap from './GeoHeatmap';
import PerformanceCharts from './PerformanceCharts';

/**
 * Dashboard principal de Analytics
 * Incluye filtros globales, métricas principales y gráficos
 */
const AnalyticsDashboard = ({ className = "" }) => {
  // Estado de filtros
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    end_date: new Date().toISOString().split('T')[0] // Hoy
  });
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Hook de analytics
  const {
    metrics,
    loading,
    error,
    lastUpdated,
    fetchDashboardData,
    exportData,
    refreshViews,
    clearCache,
    hasData,
    isLoading
  } = useAnalytics({
    enableAutoRefresh: autoRefresh,
    refreshInterval: 60000 // 1 minuto
  });

  // Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    await fetchDashboardData(dateRange);
  }, [fetchDashboardData, dateRange]);

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Manejar cambio de rango de fechas
  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  // Manejar cambio de segmento
  const handleSegmentChange = useCallback((newSegment) => {
    setSelectedSegment(newSegment);
  }, []);

  // Exportar datos
  const handleExport = useCallback(async (reportType) => {
    const success = await exportData(reportType, dateRange.start_date, dateRange.end_date);
    if (success) {
      console.log(`Datos de ${reportType} exportados exitosamente`);
    } else {
      console.error('Error exportando datos');
    }
  }, [exportData, dateRange]);

  // Refrescar vistas
  const handleRefreshViews = useCallback(async () => {
    const success = await refreshViews();
    if (success) {
      await loadDashboardData();
    }
  }, [refreshViews, loadDashboardData]);

  // Limpiar cache
  const handleClearCache = useCallback(() => {
    clearCache();
    loadDashboardData();
  }, [clearCache, loadDashboardData]);

  // Obtener datos del dashboard
  const dashboardData = metrics.dashboard?.data || {};

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header del Dashboard */}
      <motion.div variants={sectionVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span>Analytics Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Métricas y reportes de Oficios MZ
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Auto-refresh</span>
            </button>

            {/* Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
            </button>

            {/* Exportar */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Exportar</span>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2">
                  <button
                    onClick={() => handleExport('kpis')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    KPIs (CSV)
                  </button>
                  <button
                    onClick={() => handleExport('funnel')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    Embudo (CSV)
                  </button>
                  <button
                    onClick={() => handleExport('quality')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    Calidad (CSV)
                  </button>
                  <button
                    onClick={() => handleExport('ops')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    Operaciones (CSV)
                  </button>
                </div>
              </div>
            </div>

            {/* Refrescar */}
            <button
              onClick={handleRefreshViews}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refrescar</span>
            </button>
          </div>
        </div>

        {/* Información de última actualización */}
        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Última actualización: {lastUpdated.toLocaleString()}</span>
          </div>
        )}
      </motion.div>

      {/* Panel de Filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rango de fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de Fechas
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Segmento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segmento
                </label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="oficio">Por Oficio</option>
                  <option value="zona">Por Zona</option>
                  <option value="device">Por Dispositivo</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="flex items-end space-x-2">
                <button
                  onClick={loadDashboardData}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Aplicar Filtros'
                  )}
                </button>
                <button
                  onClick={handleClearCache}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Limpiar cache"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido del Dashboard */}
      {error ? (
        <motion.div
          variants={sectionVariants}
          className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Error cargando datos
          </h3>
          <p className="text-red-600">{error}</p>
        </motion.div>
      ) : isLoading && !hasData ? (
        <motion.div
          variants={sectionVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando datos del dashboard...
          </h3>
          <p className="text-gray-600">
            Esto puede tomar unos momentos
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* KPIs Principales */}
          <motion.div variants={sectionVariants}>
            <KPIStats data={dashboardData} loading={isLoading} />
          </motion.div>

          {/* Gráficos de Embudo */}
          <motion.div variants={sectionVariants}>
            <FunnelChart data={dashboardData} loading={isLoading} />
          </motion.div>

          {/* Gráficos de Calidad */}
          <motion.div variants={sectionVariants}>
            <QualityCharts data={dashboardData} loading={isLoading} />
          </motion.div>

          {/* Gráficos Operacionales */}
          <motion.div variants={sectionVariants}>
            <OpsCharts data={dashboardData} loading={isLoading} />
          </motion.div>

          {/* Mapa de Calor Geográfico */}
          <motion.div variants={sectionVariants}>
            <GeoHeatmap data={dashboardData} loading={isLoading} />
          </motion.div>

          {/* Gráficos de Rendimiento */}
          <motion.div variants={sectionVariants}>
            <PerformanceCharts data={dashboardData} loading={isLoading} />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsDashboard;
