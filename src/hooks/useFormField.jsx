import { useMemo } from 'react';

/**
 * Hook personalizado para manejar la lógica común de campos de formulario
 * @param {Object} props - Propiedades del campo
 * @returns {Object} - Objetos y funciones para el campo
 */
export const useFormField = ({
  label,
  name,
  required = false,
  error = null,
  className = ''
}) => {
  const labelElement = useMemo(() => {
    if (!label) return null;
    
    return (
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }, [label, name, required]);

  const errorElement = useMemo(() => {
    if (!error) return null;
    
    return (
      <p className="mt-1 text-sm text-red-600">
        {typeof error === 'string' ? error : error?.message || 'Error de validación'}
      </p>
    );
  }, [error]);

  const baseInputClasses = useMemo(() => {
    return `
      block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
      focus:outline-none focus:ring-blue-500 focus:border-blue-500 
      disabled:bg-gray-100 disabled:cursor-not-allowed
      ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    `;
  }, [error]);

  return {
    labelElement,
    errorElement,
    baseInputClasses,
    containerClasses: className
  };
};

