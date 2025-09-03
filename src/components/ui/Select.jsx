import React from 'react';
import { useFormField } from '../../hooks/useFormField.jsx';

/**
 * Componente Select reutilizable
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo
 * @param {Array} props.options - Array de opciones {value, label}
 * @param {Object} props.register - Función de registro de react-hook-form
 * @param {Object} props.error - Error del campo
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 * @param {string} props.placeholder - Placeholder del select
 * @param {string} props.className - Clases CSS adicionales
 */
const Select = ({
  label,
  name,
  options = [],
  register,
  error,
  required = false,
  disabled = false,
  placeholder = 'Selecciona una opción',
  className = '',
  ...props
}) => {
  const { labelElement, errorElement, baseInputClasses, containerClasses } = useFormField({
    label,
    name,
    required,
    error,
    className
  });
  
  return (
    <div className={containerClasses}>
      {labelElement}
      <select
        id={name}
        disabled={disabled}
        className={`
          ${baseInputClasses}
          appearance-none bg-white
          bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M5 6l5 5 5-5 2 1-7 7-7-7 2-1z" fill="%236b7280"/></svg>')] 
          bg-[length:20px] bg-[right_12px_center] bg-no-repeat
        `}
        {...register(name, {
          required: required ? `${label || 'Este campo'} es obligatorio` : false
        })}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorElement}
    </div>
  );
};

export default Select; 