import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Providers
import { AuthProvider } from './hooks/useSupabase';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const LoginForm = lazy(() => import('./components/auth/LoginForm'));
const RegisterWorkerForm = lazy(() => import('./components/RegisterWorkerForm'));
const WorkerDashboard = lazy(() => import('./components/Dashboard/WorkerDashboard'));
const ClientDashboard = lazy(() => import('./components/Dashboard/ClientDashboard'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const LandingPage = lazy(() => import('./components/LandingPage'));

// Styles
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Cargando aplicación..." />
              </div>
            }>
              <Routes>
                {/* Landing moderna como home */}
                <Route path="/" element={<LandingPage />} />
                {/* Rutas públicas */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterWorkerForm />} />
                {/* Rutas protegidas */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <WorkerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/client-dashboard" 
                  element={
                    <ProtectedRoute>
                      <ClientDashboard />
                    </ProtectedRoute>
                  } 
                />
                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 