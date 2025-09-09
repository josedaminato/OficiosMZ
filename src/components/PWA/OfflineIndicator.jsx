import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

/**
 * Componente para mostrar el estado de conexión y funcionalidades offline
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastOnline, setLastOnline] = useState(new Date());
  const [offlineDuration, setOfflineDuration] = useState(0);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calcular duración offline
  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now - lastOnline) / 1000);
        setOfflineDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setOfflineDuration(0);
    }
  }, [isOnline, lastOnline]);

  // Intentar reconectar
  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    try {
      // Intentar hacer una petición para verificar la conexión
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setIsOnline(true);
        setLastOnline(new Date());
      }
    } catch (error) {
      console.log('Aún sin conexión');
    } finally {
      setIsReconnecting(false);
    }
  };

  // Formatear duración offline
  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Animaciones
  const indicatorVariants = {
    hidden: { 
      opacity: 0, 
      y: -50, 
      scale: 0.9 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg"
          variants={indicatorVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Estado offline */}
              <div className="flex items-center">
                <motion.div
                  variants={pulseVariants}
                  animate="pulse"
                  className="mr-3"
                >
                  <WifiOff className="w-5 h-5" />
                </motion.div>
                
                <div>
                  <p className="font-medium">
                    Sin conexión a internet
                  </p>
                  <p className="text-sm text-red-100">
                    {offlineDuration > 0 && `Offline por ${formatDuration(offlineDuration)}`}
                  </p>
                </div>
              </div>

              {/* Botón reconectar */}
              <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="flex items-center px-3 py-1 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reconectando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconectar
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Indicador de reconexión exitosa */}
      <AnimatePresence>
        {isOnline && offlineDuration > 0 && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white shadow-lg"
            variants={indicatorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationComplete={() => {
              // Auto-ocultar después de 3 segundos
              setTimeout(() => {
                // El componente se ocultará automáticamente
              }, 3000);
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">
                    ¡Conexión restaurada!
                  </p>
                  <p className="text-sm text-green-100">
                    Sincronizando datos...
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default OfflineIndicator;
