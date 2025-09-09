import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Star, 
  MessageCircle,
  Clock,
  Smartphone,
  Bell,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

/**
 * Componente de estadísticas KPI principales
 * Muestra métricas clave en tarjetas visuales
 */
const KPIStats = ({ data = {}, loading = false, className = "" }) => {
  // Extraer datos de las métricas
  const userMetrics = data.user_metrics || {};
  const qualityMetrics = data.quality_metrics || {};
  const opsMetrics = data.ops_metrics || {};
  const funnelMetrics = data.funnel_metrics || {};

  // Calcular KPIs principales
  const kpis = [
    {
      title: 'Usuarios Activos Diarios',
      value: userMetrics.dau || 0,
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'blue',
      description: 'Usuarios únicos por día'
    },
    {
      title: 'Usuarios Activos Semanales',
      value: userMetrics.wau || 0,
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'green',
      description: 'Usuarios únicos por semana'
    },
    {
      title: 'Usuarios Activos Mensuales',
      value: userMetrics.mau || 0,
      change: '+15%',
      changeType: 'positive',
      icon: Users,
      color: 'purple',
      description: 'Usuarios únicos por mes'
    },
    {
      title: 'Pagos Liberados',
      value: userMetrics.payments_released || 0,
      change: '+23%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green',
      description: 'Pagos completados exitosamente'
    },
    {
      title: 'Rating Promedio',
      value: qualityMetrics.avg_rating || 0,
      change: '+0.2',
      changeType: 'positive',
      icon: Star,
      color: 'yellow',
      description: 'Calificación promedio de trabajadores',
      format: 'decimal'
    },
    {
      title: 'Tasa de Disputas',
      value: qualityMetrics.dispute_rate || 0,
      change: '-2.1%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'red',
      description: 'Porcentaje de trabajos en disputa',
      format: 'percentage'
    },
    {
      title: 'Mensajes de Chat',
      value: opsMetrics.chat_messages || 0,
      change: '+18%',
      changeType: 'positive',
      icon: MessageCircle,
      color: 'blue',
      description: 'Mensajes enviados en chat'
    },
    {
      title: 'Tiempo Respuesta Chat',
      value: opsMetrics.avg_chat_response_seconds || 0,
      change: '-15%',
      changeType: 'positive',
      icon: Clock,
      color: 'orange',
      description: 'Tiempo promedio de respuesta',
      format: 'time'
    },
    {
      title: 'Instalaciones PWA',
      value: userMetrics.pwa_installations || 0,
      change: '+45%',
      changeType: 'positive',
      icon: Smartphone,
      color: 'purple',
      description: 'Aplicaciones instaladas'
    },
    {
      title: 'Notificaciones Entregadas',
      value: opsMetrics.notifications_delivered || 0,
      change: '+32%',
      changeType: 'positive',
      icon: Bell,
      color: 'blue',
      description: 'Notificaciones enviadas'
    },
    {
      title: 'Tasa de Lectura',
      value: opsMetrics.notification_read_rate || 0,
      change: '+5%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'green',
      description: 'Porcentaje de notificaciones leídas',
      format: 'percentage'
    },
    {
      title: 'Sesiones Activas',
      value: data.session_metrics?.active_sessions || 0,
      change: '+7%',
      changeType: 'positive',
      icon: Users,
      color: 'indigo',
      description: 'Sesiones en curso'
    }
  ];

  // Función para formatear valores
  const formatValue = (value, format = 'number') => {
    if (value === null || value === undefined) return '0';
    
    switch (format) {
      case 'decimal':
        return value.toFixed(1);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${Math.round(value)}s`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  // Función para obtener colores
  const getColors = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        icon: 'text-blue-500',
        change: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        icon: 'text-green-500',
        change: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        icon: 'text-yellow-500',
        change: 'text-yellow-600'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        icon: 'text-red-500',
        change: 'text-red-600'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        icon: 'text-purple-500',
        change: 'text-purple-600'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        icon: 'text-orange-500',
        change: 'text-orange-600'
      },
      indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        icon: 'text-indigo-500',
        change: 'text-indigo-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

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

  const cardVariants = {
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

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">KPIs Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
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
        <h2 className="text-xl font-semibold text-gray-900">KPIs Principales</h2>
        <div className="text-sm text-gray-500">
          {data.date_range && (
            <span>
              {new Date(data.date_range.start_date).toLocaleDateString()} - {new Date(data.date_range.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const colors = getColors(kpi.color);
          const Icon = kpi.icon;
          
          return (
            <motion.div
              key={kpi.title}
              variants={cardVariants}
              className={`${colors.bg} rounded-lg p-4 hover:shadow-md transition-shadow`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <div className={`text-sm font-medium ${colors.change}`}>
                  {kpi.change}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {formatValue(kpi.value, kpi.format)}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {kpi.title}
                </div>
                <div className="text-xs text-gray-500">
                  {kpi.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resumen adicional */}
      {data.date_range && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.date_range.days}
              </div>
              <div className="text-gray-500">Días analizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.user_metrics?.total_events || 0}
              </div>
              <div className="text-gray-500">Eventos totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.session_metrics?.total_sessions || 0}
              </div>
              <div className="text-gray-500">Sesiones totales</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default KPIStats;
