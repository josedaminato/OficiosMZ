import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén definidas
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL no está definida en las variables de entorno');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY no está definida en las variables de entorno');
}

// Validar formato de la URL de Supabase
if (!supabaseUrl.includes('supabase.co')) {
  console.warn('La URL de Supabase no parece tener el formato correcto');
}

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Función de utilidad para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Error de conexión con Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error al verificar conexión con Supabase:', error);
    return false;
  }
};

// Exportar configuración para debugging (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('Supabase configurado con URL:', supabaseUrl);
  console.log('Cliente Supabase inicializado correctamente');
} 