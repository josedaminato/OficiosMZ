import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from './DashboardLayout';
import ProfileSummary from './ProfileSummary';
import NotificationBell from './NotificationBell';
import RequestBoard from '../Requests/RequestBoard';
import RequestCard from './RequestCard';
import { useWorkerRequests } from '../../hooks/useWorkerRequests';
import { useAuth } from '../../hooks/useSupabase';
import { LoadingSpinner } from '../ui';

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Usar el hook personalizado para manejar las solicitudes
  const {
    requests,
    loading,
    error,
    actionLoading,
    stats,
    acceptRequest,
    rejectRequest,
    completeRequest,
    cancelRequest,
  } = useWorkerRequests(user?.id || undefined, statusFilter);

  // Manejar ver detalles de una solicitud
  const handleViewDetails = (requestId: string) => {
    setSelectedRequest(requestId);
  };

  // Manejar aceptar solicitud
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
    }
  };

  // Manejar rechazar solicitud
  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
    }
  };

  // Si hay una solicitud seleccionada, mostrar el tablero de solicitudes
  if (selectedRequest) {
    return <RequestBoard role="trabajador" />;
  }

  return (
    <>
      <DashboardLayout>
        <div className="mb-6">
          <ProfileSummary userType="worker" />
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">En Curso</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled + stats.rejected}</div>
            <div className="text-sm text-gray-600">Canceladas</div>
          </div>
        </div>

        {/* Controles de filtro y vista */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">Mis Solicitudes</h2>
              
              {/* Filtros de estado */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter('pendiente')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'pendiente'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setStatusFilter('en curso')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'en curso'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  En Curso
                </button>
                <button
                  onClick={() => setStatusFilter('completado')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'completado'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Completadas
                </button>
              </div>
            </div>

            {/* Cambiar vista */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Vista de cuadrícula"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Vista de lista"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
                         <div className="p-8 text-center">
               <LoadingSpinner size="lg" color="blue" text="Cargando solicitudes..." className="" />
             </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="font-medium">Error al cargar las solicitudes</p>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter ? `No hay solicitudes ${statusFilter}` : 'No tienes solicitudes'}
              </h3>
              <p className="text-gray-600">
                {statusFilter 
                  ? `No tienes solicitudes con estado "${statusFilter}"`
                  : 'Cuando recibas solicitudes de trabajo, aparecerán aquí.'
                }
              </p>
            </div>
          ) : (
            <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={handleViewDetails}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  loading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Contenedor de notificaciones */}
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
      />
    </>
  );
};

export default WorkerDashboard; 