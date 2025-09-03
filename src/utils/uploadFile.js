import { supabase } from '../supabaseClient';

/**
 * Sube un archivo a Supabase Storage
 * @param {string} bucket - Nombre del bucket de Supabase
 * @param {File} file - Archivo a subir
 * @param {string} path - Ruta donde guardar el archivo
 * @param {Object} options - Opciones adicionales para la subida
 * @returns {Promise<string>} URL pública del archivo subido
 */
export const uploadFile = async (bucket, file, path, options = {}) => {
  try {
    // Configuración por defecto
    const defaultOptions = {
      upsert: true,
      cacheControl: '3600',
      ...options
    };

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, defaultOptions);

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error en uploadFile:', error);
    throw error;
  }
};

// Exportar el cliente de Supabase para uso en otros componentes
uploadFile.supabase = supabase;

/**
 * Sube múltiples archivos a Supabase Storage
 * @param {Array} files - Array de objetos con { bucket, file, path, options }
 * @param {Function} onProgress - Callback para el progreso (opcional)
 * @returns {Promise<Array>} Array de URLs públicas
 */
export const uploadMultipleFiles = async (files, onProgress = null) => {
  const results = [];
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const { bucket, file, path, options } = files[i];
    
    try {
      const url = await uploadFile(bucket, file, path, options);
      results.push({ success: true, url, path });
      
      // Reportar progreso
      if (onProgress) {
        const progress = ((i + 1) / totalFiles) * 100;
        onProgress(progress, i + 1, totalFiles);
      }
    } catch (error) {
      results.push({ success: false, error: error.message, path });
      throw error; // Detener si hay error
    }
  }

  return results;
};

/**
 * Elimina un archivo de Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo a eliminar
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error en deleteFile:', error);
    throw error;
  }
};

/**
 * Obtiene la URL pública de un archivo
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @returns {string} URL pública del archivo
 */
export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}; 