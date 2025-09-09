import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

// Lazy loading de componentes pesados
export const MapView = lazy(() => import('./Map/MapView'));
export const PaymentDashboard = lazy(() => import('./Payments/PaymentDashboard'));
export const PaymentHistory = lazy(() => import('./Payments/PaymentHistory'));
export const WorkerSearch = lazy(() => import('./WorkerSearch/WorkerSearch'));
export const RatingSystem = lazy(() => import('./Rating/RatingSystem'));
export const ChatBox = lazy(() => import('./Chat/ChatBox'));
export const NotificationSystem = lazy(() => import('./Notifications/NotificationSystem'));

// Componente wrapper para Suspense
export const LazyWrapper = ({ children, fallback = null }) => (
  <Suspense fallback={fallback || <LoadingSpinner size="lg" text="Cargando..." />}>
    {children}
  </Suspense>
);

// Componentes lazy con fallbacks específicos
export const LazyMapView = (props) => (
  <LazyWrapper fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
    <MapView {...props} />
  </LazyWrapper>
);

export const LazyPaymentDashboard = (props) => (
  <LazyWrapper fallback={<div className="h-screen bg-gray-50 animate-pulse" />}>
    <PaymentDashboard {...props} />
  </LazyWrapper>
);

export const LazyWorkerSearch = (props) => (
  <LazyWrapper fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
    <WorkerSearch {...props} />
  </LazyWrapper>
);

export const LazyRatingSystem = (props) => (
  <LazyWrapper fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
    <RatingSystem {...props} />
  </LazyWrapper>
);

export const LazyChatBox = (props) => (
  <LazyWrapper fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
    <ChatBox {...props} />
  </LazyWrapper>
);
