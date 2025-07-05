import React, { useRef } from 'react';

const FileUpload = ({
  label,
  name,
  accept,
  onChange,
  required = false,
  disabled = false,
  error = null,
  className = '',
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  preview = false
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tamaño de archivos
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`El archivo ${file.name} excede el tamaño máximo permitido (${maxSize / 1024 / 1024}MB)`);
        return false;
      }
      return true;
    });

    if (onChange) {
      onChange(validFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    if (onChange) {
      onChange(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-200
          ${error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleFileChange}
          required={required}
          disabled={disabled}
          multiple={multiple}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="text-gray-600">
            <span className="font-medium">Haz clic para subir</span> o arrastra y suelta
          </div>
          
          <p className="text-xs text-gray-500">
            {accept && `Tipos permitidos: ${accept}`}
            {maxSize && ` (Máximo ${maxSize / 1024 / 1024}MB)`}
          </p>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 