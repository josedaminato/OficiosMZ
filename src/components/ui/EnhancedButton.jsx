import React, { useState, useRef } from 'react';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';

/**
 * Componente Button mejorado con microinteracciones y accesibilidad
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {string} props.variant - Variante del botón (primary, secondary, danger, ghost)
 * @param {string} props.size - Tamaño del botón (sm, md, lg, xl)
 * @param {boolean} props.disabled - Si el botón está deshabilitado
 * @param {boolean} props.loading - Si el botón está en estado de carga
 * @param {boolean} props.success - Si el botón está en estado de éxito
 * @param {boolean} props.error - Si el botón está en estado de error
 * @param {Function} props.onClick - Función de click
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.type - Tipo del botón (button, submit, reset)
 * @param {string} props.ariaLabel - Label para accesibilidad
 * @param {boolean} props.fullWidth - Si el botón ocupa todo el ancho
 * @param {boolean} props.ripple - Si mostrar efecto ripple
 */
const EnhancedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  success = false,
  error = false,
  onClick,
  className = '',
  type = 'button',
  ariaLabel,
  fullWidth = false,
  ripple = true,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  // Determinar si el botón está deshabilitado
  const isDisabled = disabled || loading;

  // Manejar click
  const handleClick = (e) => {
    if (isDisabled) return;

    // Efecto ripple
    if (ripple) {
      createRipple(e);
    }

    onClick?.(e);
  };

  // Crear efecto ripple
  const createRipple = (e) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remover ripple después de la animación
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Manejar presión del botón
  const handleMouseDown = () => {
    if (!isDisabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // Clases base
  const baseClasses = `
    relative inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    overflow-hidden
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  // Clases por variante
  const variantClasses = {
    primary: `
      bg-blue-600 text-white hover:bg-blue-700
      focus:ring-blue-500 active:bg-blue-800
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-gray-200 text-gray-900 hover:bg-gray-300
      focus:ring-gray-500 active:bg-gray-400
      shadow-sm hover:shadow-md
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500 active:bg-red-800
      shadow-sm hover:shadow-md
    `,
    ghost: `
      bg-transparent text-gray-700 hover:bg-gray-100
      focus:ring-gray-500 active:bg-gray-200
      border border-gray-300
    `,
    success: `
      bg-green-600 text-white hover:bg-green-700
      focus:ring-green-500 active:bg-green-800
      shadow-sm hover:shadow-md
    `,
    error: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500 active:bg-red-800
      shadow-sm hover:shadow-md
    `
  };

  // Clases por tamaño
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  // Clases de estado
  const stateClasses = `
    ${isPressed ? 'scale-95' : 'scale-100'}
    ${loading ? 'cursor-wait' : ''}
    ${success ? 'animate-pulse' : ''}
    ${error ? 'animate-shake' : ''}
  `;

  // Determinar variante final
  const finalVariant = success ? 'success' : error ? 'error' : variant;

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[finalVariant]}
        ${sizeClasses[size]}
        ${stateClasses}
      `}
      {...props}
    >
      {/* Contenido del botón */}
      <span className={`
        flex items-center justify-center space-x-2
        ${loading ? 'opacity-0' : 'opacity-100'}
        transition-opacity duration-200
      `}>
        {children}
      </span>

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}

      {/* Success Icon */}
      {success && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Error Icon */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <X className="w-4 h-4" />
        </div>
      )}

      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white bg-opacity-30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  );
};

export default EnhancedButton;
