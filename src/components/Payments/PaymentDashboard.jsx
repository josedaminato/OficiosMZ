import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import PaymentStatusBadge, { PaymentStatsCards, PaymentProgress } from './PaymentStatusBadge';
import PaymentHistory from './PaymentHistory';
import PaymentCard from './PaymentCard';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Dashboard mejorado de pagos con separación por estados
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.payments - Array de pagos
 * @param {Function} props.onPaymentAction - Callback para acciones de pago
 * @param {Function} props.onRefresh - Callback para refrescar datos
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.userRole - Rol del usuario ('cliente' o 'trabajador')
 * @param {string} props.className - Clases CSS adicionales
 */
const PaymentDashboard = ({ 
  payments = [], 
  onPaymentAction,
  onRefresh,
  loading = false,
  userRole = 'cliente',
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Separar pagos por estado
  const paymentsByStatus = {
    pending: payments.filter(p => p.status === 'pending'),
    held: payments.filter(p => p.status === 'held'),
    released: payments.filter(p => p.status === 'released'),
    disputed: payments.filter(p => p.status === 'disputed'),
    refunded: payments.filter(p => p.status === 'refunded')
  };

  // Calcular estadísticas
  const stats = {
    total_payments: payments.length,
    pending_payments: paymentsByStatus.pending.length,
    held_payments: paymentsByStatus.held.length,
    released_payments: paymentsByStatus.released.length,
    disputed_payments: paymentsByStatus.disputed.length,
    total_amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    released_amount: paymentsByStatus.released.reduce((sum, p) => sum + (p.amount || 0), 0),
    held_amount: paymentsByStatus.held.reduce((sum, p) => sum + (p.amount || 0), 0),
    disputed_amount: paymentsByStatus.disputed.reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  // Tabs del dashboard
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'pending', label: 'Pendientes', icon: Clock, count: paymentsByStatus.pending.length },
    { id: 'held', label: 'Retenidos', icon: DollarSign, count: paymentsByStatus.held.length },
    { id: 'released', label: 'Liberados', icon: CheckCircle, count: paymentsByStatus.released.length },
    { id: 'disputed', label: 'Disputados', icon: AlertTriangle, count: paymentsByStatus.disputed.length },
    { id: 'history', label: 'Historial', icon: Filter }
  ];

  // Formatear monto
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // Manejar acción de pago
  const handlePaymentAction = (payment, action) => {
    setSelectedPayment(payment);
    if (onPaymentAction) {
      onPaymentAction(payment, action);
    }
  };

  // Renderizar contenido según tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Estadísticas principales */}
            <PaymentStatsCards stats={stats} />
            
            {/* Resumen de estados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(paymentsByStatus).map(([status, statusPayments]) => {
                if (statusPayments.length === 0) return null;
                
                const totalAmount = statusPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                
                return (
                  <div key={status} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <PaymentStatusBadge status={status} size="md" />
                      <span className="text-2xl font-bold text-gray-900">
                        {statusPayments.length}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Total: {formatAmount(totalAmount)}</p>
                      <p>Promedio: {formatAmount(totalAmount / statusPayments.length)}</p>
                    </div>
                    
                    <button
                      onClick={() => setActiveTab(status)}
                      className="mt-4 w-full text-left text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver detalles →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Gráfico de progreso de pagos */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Progreso de Pagos
              </h3>
              <PaymentProgress 
                status="released" 
                steps={['pending', 'held', 'released']}
              />
            </div>
          </div>
        );

      case 'history':
        return (
          <PaymentHistory
            payments={payments}
            onPaymentClick={setSelectedPayment}
            onRefresh={onRefresh}
            loading={loading}
          />
        );

      default:
        // Mostrar pagos del estado seleccionado
        const statusPayments = paymentsByStatus[activeTab] || [];
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Pagos {tabs.find(t => t.id === activeTab)?.label}
                {statusPayments.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({statusPayments.length} pagos)
                  </span>
                )}
              </h3>
              
              {statusPayments.length > 0 && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver historial completo
                </button>
              )}
            </div>

            {statusPayments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-4">
                  {activeTab === 'pending' && <Clock className="w-12 h-12 mx-auto" />}
                  {activeTab === 'held' && <DollarSign className="w-12 h-12 mx-auto" />}
                  {activeTab === 'released' && <CheckCircle className="w-12 h-12 mx-auto" />}
                  {activeTab === 'disputed' && <AlertTriangle className="w-12 h-12 mx-auto" />}
                </div>
                <p className="text-gray-600 text-lg">
                  No hay pagos {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Los pagos aparecerán aquí cuando cambien de estado
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusPayments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    onAction={handlePaymentAction}
                    userRole={userRole}
                  />
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Pagos</h1>
              <p className="text-gray-600 mt-1">
                Gestiona y monitorea todos tus pagos
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              {userRole === 'cliente' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Pago
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-2 px-1 border-b-2 font-medium text-sm
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`
                        ml-2 py-0.5 px-2 rounded-full text-xs
                        ${isActive 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-lg shadow-lg">
          {loading && activeTab !== 'history' ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" text="Cargando pagos..." />
            </div>
          ) : (
            <div className="p-6">
              {renderTabContent()}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles de pago */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Pago
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID</label>
                    <p className="text-gray-900">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado</label>
                    <div className="mt-1">
                      <PaymentStatusBadge status={selectedPayment.status} size="sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Monto</label>
                    <p className="text-gray-900 text-lg font-semibold">
                      {formatAmount(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                    <p className="text-gray-900">
                      {new Date(selectedPayment.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                
                {selectedPayment.job_title && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Trabajo</label>
                    <p className="text-gray-900">{selectedPayment.job_title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
