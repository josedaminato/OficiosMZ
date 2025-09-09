import React, { useEffect, useRef, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * Modal accesible con navegación por teclado y ARIA
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {string} props.title - Título del modal
 * @param {string} props.description - Descripción del modal
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.closeOnOverlayClick - Cerrar al hacer click en overlay
 * @param {boolean} props.closeOnEscape - Cerrar con tecla Escape
 * @param {string} props.size - Tamaño del modal (sm, md, lg, xl)
 */
const AccessibleModal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md'
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Tamaños del modal
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // Manejar tecla Escape
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  // Manejar click en overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // Manejar navegación por teclado
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Efectos cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      // Guardar elemento activo anterior
      previousActiveElement.current = document.activeElement;
      
      // Agregar event listeners
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);
      
      // Enfocar el modal después de un tick
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar elemento activo anterior
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Remover event listeners
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restaurar scroll del body
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative bg-white rounded-lg shadow-xl w-full
          ${sizeClasses[size]}
          ${className}
          animate-modal-in
        `}
        tabIndex={-1}
        role="document"
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="
                  p-2 text-gray-400 hover:text-gray-600
                  hover:bg-gray-100 rounded-lg transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20
                "
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="px-6 pt-4">
            <p
              id="modal-description"
              className="text-sm text-gray-600"
            >
              {description}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AccessibleModal;
