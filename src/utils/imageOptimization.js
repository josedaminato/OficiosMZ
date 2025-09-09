/**
 * Utilidades para optimización de imágenes
 * Incluye lazy loading, formatos modernos y compresión
 */

/**
 * Componente de imagen optimizada con lazy loading
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  placeholder = null,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef(null);

  // Intersection Observer para lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
      {...props}
    >
      {/* Placeholder mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || (
            <div className="w-8 h-8 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      {/* Imagen real */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

/**
 * Hook para optimización de imágenes
 */
export const useImageOptimization = () => {
  const [isWebPSupported, setIsWebPSupported] = React.useState(false);

  React.useEffect(() => {
    // Detectar soporte para WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const isSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    setIsWebPSupported(isSupported);
  }, []);

  /**
   * Obtener la mejor URL de imagen disponible
   */
  const getOptimizedImageUrl = (originalUrl, options = {}) => {
    if (!originalUrl) return null;

    const {
      width,
      height,
      quality = 80,
      format = 'auto'
    } = options;

    // Si es una URL externa, devolver tal como está
    if (originalUrl.startsWith('http')) {
      return originalUrl;
    }

    // Para imágenes locales, podrías implementar transformaciones
    // usando un servicio como Cloudinary o similar
    let optimizedUrl = originalUrl;

    if (width || height) {
      const params = new URLSearchParams();
      if (width) params.append('w', width);
      if (height) params.append('h', height);
      if (quality) params.append('q', quality);
      
      if (format === 'auto' && isWebPSupported) {
        params.append('f', 'webp');
      } else if (format !== 'auto') {
        params.append('f', format);
      }

      optimizedUrl += `?${params.toString()}`;
    }

    return optimizedUrl;
  };

  /**
   * Preload de imágenes críticas
   */
  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  /**
   * Preload de múltiples imágenes
   */
  const preloadImages = async (urls) => {
    try {
      await Promise.all(urls.map(preloadImage));
    } catch (error) {
      console.warn('Error preloading images:', error);
    }
  };

  return {
    isWebPSupported,
    getOptimizedImageUrl,
    preloadImage,
    preloadImages
  };
};

/**
 * Componente de avatar optimizado
 */
export const OptimizedAvatar = ({ 
  src, 
  name, 
  size = 'md',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl'
  };

  const initials = name
    ?.split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <OptimizedImage
      src={src}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      placeholder={
        <div className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold`}>
          {initials}
        </div>
      }
      {...props}
    />
  );
};

/**
 * Utilidad para comprimir imágenes antes de subir
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      outputFormat = 'image/jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob
      canvas.toBlob(resolve, outputFormat, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Hook para lazy loading de imágenes en listas
 */
export const useLazyImages = (imageUrls, options = {}) => {
  const [loadedImages, setLoadedImages] = React.useState(new Set());
  const [loadingImages, setLoadingImages] = React.useState(new Set());

  const loadImage = React.useCallback(async (url) => {
    if (loadedImages.has(url) || loadingImages.has(url)) {
      return;
    }

    setLoadingImages(prev => new Set(prev).add(url));

    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      setLoadedImages(prev => new Set(prev).add(url));
    } catch (error) {
      console.warn(`Error loading image: ${url}`, error);
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  }, [loadedImages, loadingImages]);

  const isImageLoaded = React.useCallback((url) => {
    return loadedImages.has(url);
  }, [loadedImages]);

  const isImageLoading = React.useCallback((url) => {
    return loadingImages.has(url);
  }, [loadingImages]);

  return {
    loadImage,
    isImageLoaded,
    isImageLoading,
    loadedCount: loadedImages.size,
    totalCount: imageUrls.length
  };
};
