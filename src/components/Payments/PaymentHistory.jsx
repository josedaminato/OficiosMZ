import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Eye, 
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PaymentStatusBadge, { PaymentStatsCards } from './PaymentStatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Componente para mostrar el historial de pagos con filtros avanzados
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.payments - Array de pagos
 * @param {Function} props.onPaymentClick - Callback cuando se hace clic en un pago
 * @param {Function} props.onRefresh - Callback para refrescar datos
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.className - Clases CSS adicionales
 */
const PaymentHistory = ({ 
  payments = [], 
  onPaymentClick, 
  onRefresh,
  loading = false,
  className = '' 
}) => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);

  // Opciones de filtros
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'held', label: 'Retenidos' },
    { value: 'released', label: 'Liberados' },
    { value: 'disputed', label: 'Disputados' },
    { value: 'refunded', label: 'Reembolsados' }
  ];

  const dateOptions = [
    { value: 'all', label: 'Todas las fechas' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' },
    { value: 'year', label: 'Este año' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'amount', label: 'Monto' },
    { value: 'status', label: 'Estado' },
    { value: 'job_title', label: 'Título del trabajo' }
  ];

  // Filtrar y ordenar pagos
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount?.toString().includes(searchTerm)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const paymentDate = new Date(payment.created_at);
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(payment => 
            new Date(payment.created_at).toDateString() === now.toDateString()
          );
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => 
            new Date(payment.created_at) >= weekAgo
          );
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => 
            new Date(payment.created_at) >= monthAgo
          );
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => 
            new Date(payment.created_at) >= quarterAgo
          );
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => 
            new Date(payment.created_at) >= yearAgo
          );
          break;
      }
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [payments, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = payments.length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const held = payments.filter(p => p.status === 'held').length;
    const released = payments.filter(p => p.status === 'released').length;
    const disputed = payments.filter(p => p.status === 'disputed').length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const releasedAmount = payments
      .filter(p => p.status === 'released')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      total_payments: total,
      pending_payments: pending,
      held_payments: held,
      released_payments: released,
      disputed_payments: disputed,
      total_amount: totalAmount,
      released_amount: releasedAmount
    };
  }, [payments]);

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear monto
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // Exportar datos
  const exportData = () => {
    const csvContent = [
      ['ID', 'Trabajo', 'Monto', 'Estado', 'Fecha', 'Empleador', 'Trabajador'],
      ...filteredPayments.map(payment => [
        payment.id,
        payment.job_title || 'N/A',
        payment.amount,
        payment.status,
        formatDate(payment.created_at),
        payment.employer_name || 'N/A',
        payment.worker_name || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historial de Pagos</h2>
            <p className="text-gray-600 mt-1">
              {filteredPayments.length} de {payments.length} pagos
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Actualizar'}
            </button>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-6 border-b border-gray-200">
        <PaymentStatsCards stats={stats} />
      </div>

      {/* Filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ID, trabajo, monto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenar por */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción de filtros */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Limpiar filtros
          </button>
          
          <div className="text-sm text-gray-500">
            Mostrando {filteredPayments.length} resultados
          </div>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" text="Cargando pagos..." />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron pagos con los filtros aplicados</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onPaymentClick && onPaymentClick(payment)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.job_title || 'Trabajo sin título'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {payment.id}
                      </p>
                    </div>
                    
                    <PaymentStatusBadge 
                      status={payment.status} 
                      size="md"
                    />
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                    <span className="font-semibold text-lg text-green-600">
                      {formatAmount(payment.amount)}
                    </span>
                    <span>{formatDate(payment.created_at)}</span>
                    {payment.employer_name && (
                      <span>Empleador: {payment.employer_name}</span>
                    )}
                    {payment.worker_name && (
                      <span>Trabajador: {payment.worker_name}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPaymentClick && onPaymentClick(payment);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Más opciones"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
