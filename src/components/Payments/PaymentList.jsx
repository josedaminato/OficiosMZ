import React, { useState } from 'react';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import PaymentCard from './PaymentCard';

const PaymentList = ({ 
    payments, 
    loading, 
    onHold, 
    onRelease, 
    onCreatePayment,
    onRefresh,
    userRole,
    className = "" 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            payment.job_id?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const sortedPayments = [...filteredPayments].sort((a, b) => {
        switch (sortBy) {
            case 'amount':
                return b.amount - a.amount;
            case 'status':
                return a.status.localeCompare(b.status);
            case 'created_at':
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    const statusOptions = [
        { value: 'all', label: 'Todos los estados' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'held', label: 'Retenido' },
        { value: 'released', label: 'Liberado' },
        { value: 'disputed', label: 'En Disputa' },
        { value: 'refunded', label: 'Reembolsado' }
    ];

    const sortOptions = [
        { value: 'created_at', label: 'Fecha de creación' },
        { value: 'amount', label: 'Monto' },
        { value: 'status', label: 'Estado' }
    ];

    if (loading) {
        return (
            <div className={`space-y-4 ${className}`}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Mis Pagos
                    </h2>
                    <p className="text-gray-600">
                        {sortedPayments.length} de {payments.length} pagos
                    </p>
                </div>
                
                <div className="flex space-x-3">
                    {onCreatePayment && (
                        <button
                            onClick={onCreatePayment}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Pago</span>
                        </button>
                    )}
                    
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium flex items-center space-x-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Actualizar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por ID de pago o trabajo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-white"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    Ordenar por: {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            {sortedPayments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay pagos
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== 'all' 
                            ? 'No se encontraron pagos con los filtros aplicados.'
                            : 'Aún no has realizado ningún pago.'
                        }
                    </p>
                    {onCreatePayment && !searchTerm && statusFilter === 'all' && (
                        <button
                            onClick={onCreatePayment}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Crear Primer Pago
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sortedPayments.map(payment => (
                        <PaymentCard
                            key={payment.id}
                            payment={payment}
                            onHold={onHold}
                            onRelease={onRelease}
                            userRole={userRole}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaymentList;




