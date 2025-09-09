import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Componente de notificación toast con animaciones
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isVisible - Si la notificación es visible
 * @param {Function} props.onClose - Función para cerrar la notificación
 * @param {string} props.type - Tipo de notificación (success, error, warning, info)
 * @param {string} props.title - Título de la notificación
 * @param {string} props.message - Mensaje de la notificación
 * @param {number} props.duration - Duración en ms (0 = no auto-close)
 * @param {boolean} props.closable - Si se puede cerrar manualmente
 * @param {string} props.position - Posición de la notificación
 */
const ToastNotification = ({
  isVisible,
  onClose,
  type = 'info',
  title,
  message,
  duration = 5000,
  closable = true,
  position = 'top-right'
}) => {
  const [progress, setProgress] = useState(100);

  // Configuración por tipo
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
    },
  };

  // Configuración de posición
  const positionConfig = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  // Auto-close con barra de progreso
  useEffect(() => {
    if (isVisible && duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isVisible, duration, onClose]);

  // Reset progress cuando se muestra
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
    }
  }, [isVisible]);

  // Animaciones
  const notificationVariants = {
    hidden: {
      opacity: 0,
      x: position.includes('right') ? 300 : -300,
      y: position.includes('top') ? -50 : 50,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      x: position.includes('right') ? 300 : -300,
      y: position.includes('top') ? -50 : 50,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  };

  const progressVariants = {
    hidden: { scaleX: 1 },
    visible: { 
      scaleX: progress / 100,
      transition: {
        duration: 0.1,
        ease: 'linear',
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            fixed z-50 max-w-sm w-full
            ${positionConfig[position]}
          `}
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className={`
              relative bg-white rounded-lg shadow-lg border
              ${config.bgColor} ${config.borderColor}
              overflow-hidden
            `}
          >
            {/* Barra de progreso */}
            {duration > 0 && (
              <motion.div
                className="absolute top-0 left-0 h-1 bg-current opacity-30 origin-left"
                style={{ width: '100%' }}
                variants={progressVariants}
                initial="hidden"
                animate="visible"
              />
            )}

            {/* Contenido */}
            <div className="p-4">
              <div className="flex items-start">
                {/* Icono */}
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>

                {/* Texto */}
                <div className="ml-3 flex-1">
                  {title && (
                    <h3 className={`text-sm font-medium ${config.titleColor}`}>
                      {title}
                    </h3>
                  )}
                  {message && (
                    <p className={`text-sm ${config.messageColor} ${title ? 'mt-1' : ''}`}>
                      {message}
                    </p>
                  )}
                </div>

                {/* Botón de cerrar */}
                {closable && (
                  <button
                    onClick={onClose}
                    className="
                      flex-shrink-0 ml-4 p-1 rounded-full
                      hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
                      transition-colors duration-200
                    "
                    aria-label="Cerrar notificación"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
