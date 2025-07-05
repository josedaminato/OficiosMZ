import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

// Contexto para la autenticación
const AuthContext = createContext({});

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setError('Error inesperado al obtener la sesión');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Función para iniciar sesión
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = 'Error inesperado al iniciar sesión';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    }
  };

  // Función para registrarse
  const signUp = async (email, password, userData = {}) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = 'Error inesperado al registrarse';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'Error inesperado al cerrar sesión';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Función para restablecer contraseña
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = 'Error inesperado al enviar email de restablecimiento';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = 'Error inesperado al actualizar perfil';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para operaciones generales de Supabase
export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeQuery = async (queryFn) => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      return result;
    } catch (err) {
      const errorMessage = 'Error inesperado en la consulta';
      setError(errorMessage);
      console.error('Supabase query error:', err);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    executeQuery,
    supabase
  };
}; 