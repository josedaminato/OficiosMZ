import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, CheckCircle } from 'lucide-react';
import usePushNotifications from '../../hooks/usePushNotifications';

/**
 * Componente para mostrar prompt de instalación de PWA
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Si mostrar el prompt
 * @param {Function} props.onClose - Función para cerrar el prompt
 * @param {string} props.userId - ID del usuario actual
 */
const PWAInstallPrompt = ({ show, onClose, userId }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState('unknown');
  
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    subscribe: subscribePush,
    requestPermission: requestPushPermission,
    canSubscribe: canSubscribePush,
    canRequestPermission: canRequestPermissionPush,
    isLoading: pushLoading
  } = usePushNotifications(userId);

  // Detectar plataforma
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/windows/.test(userAgent)) {
      setPlatform('windows');
    } else if (/mac/.test(userAgent)) {
      setPlatform('mac');
    } else {
      setPlatform('desktop');
    }
  }, []);

  // Detectar si ya está instalado
  useEffect(() => {
    const checkInstalled = () => {
      // Verificar si está en modo standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      
      setIsInstalled(isStandalone || isInApp);
    };

    checkInstalled();
    
    // Escuchar cambios en el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);
    
    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  // Capturar evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Manejar instalación
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Para iOS, mostrar instrucciones
      if (platform === 'ios') {
        showIOSInstructions();
        return;
      }
      
      // Para otros navegadores, mostrar instrucciones genéricas
      showGenericInstructions();
      return;
    }

    try {
      setIsInstalling(true);
      
      // Mostrar prompt de instalación
      deferredPrompt.prompt();
      
      // Esperar respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalada por el usuario');
        setIsInstalled(true);
        onClose();
      } else {
        console.log('Usuario rechazó la instalación');
      }
      
      // Limpiar prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error durante la instalación:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Mostrar instrucciones para iOS
  const showIOSInstructions = () => {
    const instructions = `
      Para instalar Oficios MZ en tu iPhone:
      
      1. Toca el botón "Compartir" en la parte inferior
      2. Desplázate hacia abajo y toca "Agregar a pantalla de inicio"
      3. Toca "Agregar" en la esquina superior derecha
      
      ¡Listo! La app aparecerá en tu pantalla de inicio.
    `;
    
    alert(instructions);
  };

  // Mostrar instrucciones genéricas
  const showGenericInstructions = () => {
    const instructions = `
      Para instalar Oficios MZ:
      
      1. Busca el ícono de "Instalar" en la barra de direcciones
      2. Haz clic en "Instalar" cuando aparezca
      3. Confirma la instalación
      
      O usa el menú del navegador (⋮) y selecciona "Instalar app"
    `;
    
    alert(instructions);
  };

  // Manejar suscripción a push notifications
  const handlePushSubscribe = async () => {
    if (canRequestPermissionPush) {
      await requestPushPermission();
    } else if (canSubscribePush) {
      await subscribePush();
    }
  };

  // Animaciones
  const promptVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
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
      y: 50, 
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Prompt */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={promptVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Contenido */}
              <div className="text-center">
                {/* Ícono */}
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-blue-600" />
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Instalar Oficios MZ
                </h3>

                {/* Descripción */}
                <p className="text-gray-600 mb-6">
                  Instala la app para una experiencia más rápida y acceso directo desde tu pantalla de inicio.
                </p>

                {/* Beneficios */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Acceso rápido desde la pantalla de inicio
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Notificaciones push en tiempo real
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Funciona sin conexión a internet
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Experiencia similar a app nativa
                  </div>
                </div>

                {/* Botones */}
                <div className="space-y-3">
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isInstalling ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Instalando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Download className="w-4 h-4 mr-2" />
                        Instalar App
                      </div>
                    )}
                  </button>

                  {/* Push Notifications */}
                  {pushSupported && (
                    <button
                      onClick={handlePushSubscribe}
                      disabled={pushLoading || pushSubscribed}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        pushSubscribed
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pushLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                          Configurando...
                        </div>
                      ) : pushSubscribed ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Notificaciones Activadas
                        </div>
                      ) : (
                        'Activar Notificaciones'
                      )}
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors"
                  >
                    Más tarde
                  </button>
                </div>

                {/* Información de plataforma */}
                <div className="mt-4 text-xs text-gray-500">
                  {platform === 'ios' && (
                    <p>En iOS, usa el botón "Compartir" para instalar</p>
                  )}
                  {platform === 'android' && (
                    <p>En Android, busca el ícono de instalación en la barra de direcciones</p>
                  )}
                  {platform === 'desktop' && (
                    <p>En desktop, busca el ícono de instalación en la barra de direcciones</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
