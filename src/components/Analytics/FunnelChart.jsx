import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MousePointer, 
  FileText, 
  CreditCard, 
  CheckCircle,
  TrendingDown,
  AlertCircle,
  Loader2
} from 'lucide-react';

/**
 * Componente de gráfico de embudo de conversión
 * Muestra el flujo de conversión desde búsqueda hasta pago liberado
 */
const FunnelChart = ({ data = {}, loading = false, className = "" }) => {
  // Extraer datos del embudo
  const funnelData = data.funnel_metrics?.funnel_data || {};
  const conversions = data.funnel_metrics?.conversions || {};

  // Definir etapas del embudo
  const funnelStages = [
    {
      key: 'search_performed',
      title: 'Búsquedas Realizadas',
      icon: Search,
      color: 'blue',
      description: 'Usuarios que realizaron búsquedas'
    },
    {
      key: 'search_result_click',
      title: 'Clicks en Resultados',
      icon: MousePointer,
      color: 'green',
      description: 'Usuarios que hicieron click en resultados'
    },
    {
      key: 'request_created',
      title: 'Solicitudes Creadas',
      icon: FileText,
      color: 'yellow',
      description: 'Usuarios que crearon solicitudes'
    },
    {
      key: 'payment_held',
      title: 'Pagos Retenidos',
      icon: CreditCard,
      color: 'orange',
      description: 'Pagos retenidos por la plataforma'
    },
    {
      key: 'payment_released',
      title: 'Pagos Liberados',
      icon: CheckCircle,
      color: 'green',
      description: 'Pagos liberados exitosamente'
    }
  ];

  // Calcular datos del embudo
  const funnelStats = useMemo(() => {
    const stages = funnelStages.map((stage, index) => {
      const value = funnelData[stage.key] || 0;
      const previousValue = index > 0 ? funnelData[funnelStages[index - 1].key] || 0 : value;
      const conversionRate = previousValue > 0 ? (value / previousValue) * 100 : 0;
      const dropOff = previousValue - value;
      const dropOffRate = previousValue > 0 ? (dropOff / previousValue) * 100 : 0;

      return {
        ...stage,
        value,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOff,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
        isLast: index === funnelStages.length - 1
      };
    });

    return stages;
  }, [funnelData]);

  // Calcular métricas generales
  const overallStats = useMemo(() => {
    const totalSearches = funnelData.search_performed || 0;
    const totalConversions = funnelData.payment_released || 0;
    const overallConversionRate = totalSearches > 0 ? (totalConversions / totalSearches) * 100 : 0;

    return {
      totalSearches,
      totalConversions,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100
    };
  }, [funnelData]);

  // Función para obtener colores
  const getColors = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-500',
        bar: 'bg-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: 'text-green-500',
        bar: 'bg-green-500'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: 'text-yellow-500',
        bar: 'bg-yellow-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'text-orange-500',
        bar: 'bg-orange-500'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  // Función para calcular ancho de barra
  const getBarWidth = (value, maxValue) => {
    if (maxValue === 0) return 0;
    return Math.max((value / maxValue) * 100, 2); // Mínimo 2% para visibilidad
  };

  // Encontrar valor máximo para escalar las barras
  const maxValue = Math.max(...funnelStats.map(stage => stage.value));

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

  const stageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Embudo de Conversión</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Embudo de Conversión</h2>
        <div className="text-sm text-gray-500">
          Tasa de conversión general: {overallStats.overallConversionRate}%
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {overallStats.totalSearches.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">Total Búsquedas</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {overallStats.totalConversions.toLocaleString()}
          </div>
          <div className="text-sm text-green-700">Conversiones</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {overallStats.overallConversionRate}%
          </div>
          <div className="text-sm text-purple-700">Tasa de Conversión</div>
        </div>
      </div>

      {/* Embudo visual */}
      <div className="space-y-4">
        {funnelStats.map((stage, index) => {
          const colors = getColors(stage.color);
          const Icon = stage.icon;
          const barWidth = getBarWidth(stage.value, maxValue);
          
          return (
            <motion.div
              key={stage.key}
              variants={stageVariants}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div>
                    <div className={`font-semibold ${colors.text}`}>
                      {stage.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stage.description}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${colors.text}`}>
                    {stage.value.toLocaleString()}
                  </div>
                  {!stage.isLast && (
                    <div className="text-sm text-gray-600">
                      {stage.conversionRate}% conversión
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className={`h-3 rounded-full ${colors.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>
                
                {/* Indicador de drop-off */}
                {!stage.isLast && stage.dropOff > 0 && (
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>{stage.dropOff.toLocaleString()} usuarios perdidos ({stage.dropOffRate}%)</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Análisis de conversión por etapa */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Análisis de Conversión por Etapa
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnelStats.slice(0, -1).map((stage, index) => {
            const nextStage = funnelStats[index + 1];
            const isGoodConversion = stage.conversionRate >= 50;
            const isPoorConversion = stage.conversionRate < 20;
            
            return (
              <div
                key={stage.key}
                className={`p-4 rounded-lg border ${
                  isGoodConversion 
                    ? 'bg-green-50 border-green-200' 
                    : isPoorConversion 
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {stage.title} → {nextStage.title}
                  </div>
                  <div className={`text-sm font-semibold ${
                    isGoodConversion 
                      ? 'text-green-600' 
                      : isPoorConversion 
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {stage.conversionRate}%
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  {stage.value.toLocaleString()} → {nextStage.value.toLocaleString()}
                </div>
                
                <div className="mt-2">
                  {isGoodConversion ? (
                    <div className="flex items-center space-x-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Excelente conversión</span>
                    </div>
                  ) : isPoorConversion ? (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Necesita mejora</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-yellow-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Conversión moderada</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default FunnelChart;
