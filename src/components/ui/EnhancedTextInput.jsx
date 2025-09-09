import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';

/**
 * Componente TextInput mejorado con microinteracciones y accesibilidad
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo
 * @param {string} props.type - Tipo de input (text, email, password, etc.)
 * @param {string} props.value - Valor del campo
 * @param {Function} props.onChange - Función de cambio
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {string} props.placeholder - Placeholder del campo
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 * @param {string|Object} props.error - Error del campo
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.helpText - Texto de ayuda
 * @param {boolean} props.showValidation - Mostrar indicadores de validación
 * @param {boolean} props.isValid - Estado de validación
 * @param {Function} props.onFocus - Función al enfocar
 * @param {Function} props.onBlur - Función al desenfocar
 */
const EnhancedTextInput = ({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  error = null,
  className = '',
  helpText = '',
  showValidation = false,
  isValid = false,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef(null);
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;

  // Actualizar estado de valor
  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  // Manejar foco
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Manejar cambio
  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determinar tipo de input
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Determinar estado visual
  const getInputState = () => {
    if (error) return 'error';
    if (showValidation && isValid) return 'success';
    if (isFocused) return 'focused';
    return 'default';
  };

  const inputState = getInputState();

  // Clases base
  const baseClasses = `
    w-full px-4 py-3 text-gray-900 placeholder-gray-400
    bg-white border rounded-lg transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${className}
  `;

  // Clases por estado
  const stateClasses = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    focused: 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
  };

  // Clases de contenedor
  const containerClasses = `
    relative group
    ${error ? 'animate-shake' : ''}
  `;

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className={`
            block text-sm font-medium transition-colors duration-200
            ${error ? 'text-red-700' : isFocused ? 'text-blue-700' : 'text-gray-700'}
            ${disabled ? 'text-gray-400' : ''}
          `}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="requerido">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className={containerClasses}>
        {/* Input */}
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          className={`
            ${baseClasses}
            ${stateClasses[inputState]}
            ${type === 'password' ? 'pr-12' : 'pr-4'}
            ${showValidation ? 'pr-12' : ''}
          `}
          {...props}
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`
              absolute right-3 top-1/2 transform -translate-y-1/2
              p-1 text-gray-400 hover:text-gray-600
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 rounded
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            disabled={disabled}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Validation Icon */}
        {showValidation && !type === 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : error ? (
              <X className="w-5 h-5 text-red-500" />
            ) : null}
          </div>
        )}

        {/* Focus Ring Animation */}
        {isFocused && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-blue-500 ring-opacity-20 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          id={errorId}
          className="flex items-center space-x-2 text-sm text-red-600 animate-fade-in"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{typeof error === 'string' ? error : error.message}</span>
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <div
          id={helpId}
          className="text-sm text-gray-500 animate-fade-in"
        >
          {helpText}
        </div>
      )}

      {/* Character Count (si hay maxLength) */}
      {props.maxLength && (
        <div className="text-xs text-gray-400 text-right">
          {value.length}/{props.maxLength}
        </div>
      )}
    </div>
  );
};

export default EnhancedTextInput;
