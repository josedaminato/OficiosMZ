import React, { useState, useEffect, createContext, useContext } from 'react';
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
          setError(error.message);
        } else {
          setUser(session?.user || null);
        }
      } catch (err) {
        setError('Error inesperado al obtener la sesión');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Funciones de autenticación (signIn, signUp, signOut, etc.) aquí...

  const value = {
    user,
    loading,
    error,
    // signIn, signUp, signOut, etc.
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 