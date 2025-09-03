import React, { useState, useRef, useEffect } from 'react';

/**
 * Componente CameraCapture reutilizable
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo
 * @param {Object} props.register - Función de registro de react-hook-form
 * @param {Object} props.error - Error del campo
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 * @param {Function} props.onCapture - Callback cuando se captura una foto
 * @param {string} props.className - Clases CSS adicionales
 */
const CameraCapture = ({
  label,
  name,
  register,
  error,
  required = false,
  disabled = false,
  onCapture,
  className = '',
  ...props
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está disponible en este dispositivo');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true);
          setIsLoading(false);
        };
      }
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
      setCameraError(error.message);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir a blob
      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        
        // Crear un archivo para el formulario
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        
        // Llamar al callback si existe
        if (onCapture) {
          onCapture(file, imageUrl);
        }
        
        // Detener la cámara
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    if (onCapture) {
      onCapture(null, null);
    }
  };

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <label 
          className={`font-semibold text-gray-700 ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`}
        >
          {label}
        </label>
      )}
      
      {/* Input oculto para react-hook-form */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        {...register(name, {
          required: required ? `${label || 'La captura'} es obligatoria` : false
        })}
        {...props}
      />

      {/* Estado inicial - Botón para iniciar cámara */}
      {!isCameraActive && !capturedImage && !isLoading && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all duration-200
              ${disabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            Iniciar Cámara
          </button>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Iniciando cámara...</span>
          </div>
        </div>
      )}

      {/* Error de cámara */}
      {cameraError && (
        <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">Error al acceder a la cámara</p>
          </div>
          <p className="text-sm text-red-500 mb-3">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Cámara activa */}
      {isCameraActive && (
        <div className="border-2 border-gray-300 rounded-lg p-4">
          <div className="flex flex-col items-center gap-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-md rounded-lg border"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Capturar
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Foto capturada */}
      {capturedImage && (
        <div className="border-2 border-gray-300 rounded-lg p-4">
          <div className="flex flex-col items-center gap-4">
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full max-w-md rounded-lg border"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={retakePhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver a Capturar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error de validación */}
      {error && (
        <span className="text-red-500 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error.message}
        </span>
      )}
    </div>
  );
};

export default CameraCapture; 