import React from 'react';
import { useFormField } from '../../hooks/useFormField.jsx';

const TextInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  error = null,
  className = ''
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
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseInputClasses} placeholder-gray-400`}
      />
      {errorElement}
    </div>
  );
};

export default TextInput; 