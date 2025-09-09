import React from 'react';
import { 
  Clock, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw,
  DollarSign,
  Shield,
  XCircle
} from 'lucide-react';

/**
 * Componente para mostrar el estado de un pago con estilos claros
 * @param {Object} props - Propiedades del componente
 * @param {string} props.status - Estado del pago
 * @param {string} props.size - Tamaño del badge ('sm', 'md', 'lg')
 * @param {boolean} props.showIcon - Si mostrar icono
 * @param {string} props.className - Clases CSS adicionales
 */
const PaymentStatusBadge = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className = '' 
}) => {
  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  // Configuración de estados
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      icon: Clock,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'Esperando acreditación'
    },
    held: {
      label: 'Retenido',
      icon: Lock,
      colors: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Trabajo en curso'
    },
    released: {
      label: 'Liberado',
      icon: CheckCircle,
      colors: 'bg-green-100 text-green-800 border-green-200',
      description: 'Ya disponible'
    },
    disputed: {
      label: 'Disputado',
      icon: AlertTriangle,
      colors: 'bg-red-100 text-red-800 border-red-200',
      description: 'En revisión'
    },
    refunded: {
      label: 'Reembolsado',
      icon: RotateCcw,
      colors: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Dinero devuelto'
    },
    failed: {
      label: 'Fallido',
      icon: XCircle,
      colors: 'bg-red-100 text-red-800 border-red-200',
      description: 'Pago no procesado'
    },
    processing: {
      label: 'Procesando',
      icon: DollarSign,
      colors: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'En proceso'
    },
    secure: {
      label: 'Seguro',
      icon: Shield,
      colors: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Protegido por garantía'
    }
  };

  // Obtener configuración del estado
  const config = statusConfig[status] || statusConfig.pending;
  const sizeStyle = sizeConfig[size];
  const IconComponent = config.icon;

  return (
    <div 
      className={`
        inline-flex items-center gap-2 rounded-full border font-medium
        ${config.colors}
        ${sizeStyle.container}
        ${className}
      `}
      title={config.description}
    >
      {showIcon && (
        <IconComponent 
          className={`${sizeStyle.icon} flex-shrink-0`}
          aria-hidden="true"
        />
      )}
      <span className={`${sizeStyle.text} font-semibold`}>
        {config.label}
      </span>
    </div>
  );
};

/**
 * Componente para mostrar múltiples estados de pago
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.statuses - Array de estados a mostrar
 * @param {string} props.size - Tamaño de los badges
 * @param {string} props.className - Clases CSS adicionales
 */
export const PaymentStatusList = ({ 
  statuses = [], 
  size = 'sm', 
  className = '' 
}) => {
  if (!statuses || statuses.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statuses.map((status, index) => (
        <PaymentStatusBadge
          key={`${status}-${index}`}
          status={status}
          size={size}
        />
      ))}
    </div>
  );
};

/**
 * Componente para mostrar el progreso de un pago
 * @param {Object} props - Propiedades del componente
 * @param {string} props.status - Estado actual del pago
 * @param {Array} props.steps - Pasos del proceso de pago
 * @param {string} props.className - Clases CSS adicionales
 */
export const PaymentProgress = ({ 
  status, 
  steps = ['pending', 'held', 'released'],
  className = '' 
}) => {
  const currentStepIndex = steps.indexOf(status);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const config = statusConfig[step] || statusConfig.pending;
          const IconComponent = config.icon;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-600 mt-1 text-center">
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Línea de progreso */}
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-green-500 h-1 rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para mostrar estadísticas de pagos por estado
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.stats - Estadísticas de pagos
 * @param {string} props.className - Clases CSS adicionales
 */
export const PaymentStatsCards = ({ 
  stats = {}, 
  className = '' 
}) => {
  const statsConfig = [
    {
      key: 'total',
      label: 'Total Pagos',
      value: stats.total_payments || 0,
      icon: DollarSign,
      color: 'bg-blue-500'
    },
    {
      key: 'pending',
      label: 'Pendientes',
      value: stats.pending_payments || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      key: 'held',
      label: 'Retenidos',
      value: stats.held_payments || 0,
      icon: Lock,
      color: 'bg-blue-500'
    },
    {
      key: 'released',
      label: 'Liberados',
      value: stats.released_payments || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      key: 'disputed',
      label: 'Disputados',
      value: stats.disputed_payments || 0,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      {statsConfig.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.key}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentStatusBadge;
