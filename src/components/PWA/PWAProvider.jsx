import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PWAInstallPrompt from './PWAInstallPrompt';
import OfflineIndicator from './OfflineIndicator';
import usePushNotifications from '../../hooks/usePushNotifications';

/**
 * Context para funcionalidades PWA
 */
const PWAContext = createContext();

/**
 * Hook para usar el contexto PWA
 */
export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA debe usarse dentro de PWAProvider');
  }
  return context;
};

/**
 * Provider principal para funcionalidades PWA
 */
const PWAProvider = ({ children, userId }) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState(new Date());

  // Hook de notificaciones push
  const pushNotifications = usePushNotifications(userId);

  // Detectar si es PWA instalada
  useEffect(() => {
    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      const isPWA = isStandalone || isInApp;
      
      setIsPWAInstalled(isPWA);
    };

    checkPWAStatus();

    // Escuchar cambios en el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAStatus);
    
    return () => mediaQuery.removeEventListener('change', checkPWAStatus);
  }, []);

  // Capturar evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt después de un delay
      setTimeout(() => {
        if (!isPWAInstalled) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isPWAInstalled]);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-suscribir a push notifications si es PWA instalada
  useEffect(() => {
    if (isPWAInstalled && pushNotifications.canSubscribe) {
      // Esperar un poco antes de suscribir
      const timer = setTimeout(() => {
        pushNotifications.subscribe();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isPWAInstalled, pushNotifications.canSubscribe]);

  // Manejar instalación de PWA
  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast.success('¡PWA instalada exitosamente!');
          setIsPWAInstalled(true);
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error durante la instalación:', error);
        toast.error('Error durante la instalación');
      }
    }
    
    setShowInstallPrompt(false);
  };

  // Cerrar prompt de instalación
  const handleCloseInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  // Mostrar prompt de instalación manualmente
  const showInstallPromptManually = () => {
    setShowInstallPrompt(true);
  };

  // Obtener información de la PWA
  const getPWAInfo = () => {
    return {
      isInstalled: isPWAInstalled,
      isOnline,
      lastOnline,
      canInstall: !!deferredPrompt,
      pushSupported: pushNotifications.isSupported,
      pushSubscribed: pushNotifications.isSubscribed,
    };
  };

  // Context value
  const contextValue = {
    // Estado
    isPWAInstalled,
    isOnline,
    lastOnline,
    canInstall: !!deferredPrompt,
    
    // Funciones
    handleInstall,
    showInstallPromptManually,
    getPWAInfo,
    
    // Push notifications
    pushNotifications,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* Componentes PWA */}
      <OfflineIndicator />
      
      <PWAInstallPrompt
        show={showInstallPrompt}
        onClose={handleCloseInstallPrompt}
        userId={userId}
      />
    </PWAContext.Provider>
  );
};

export default PWAProvider;
