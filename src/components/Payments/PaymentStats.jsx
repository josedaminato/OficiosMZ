import React from 'react';
import { 
    DollarSign, 
    CreditCard, 
    Clock, 
    AlertTriangle, 
    TrendingUp,
    Calendar
} from 'lucide-react';

const PaymentStats = ({ stats, loading = false, className = "" }) => {
    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
                <p className="text-gray-500 text-center">No hay estadísticas disponibles</p>
            </div>
        );
    }

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR');
    };

    const statItems = [
        {
            label: 'Total Pagos',
            value: stats.total_payments || 0,
            icon: CreditCard,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            label: 'Monto Total',
            value: formatAmount(stats.total_amount || 0),
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            label: 'Liberados',
            value: formatAmount(stats.released_amount || 0),
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            label: 'Retenidos',
            value: formatAmount(stats.held_amount || 0),
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        },
        {
            label: 'En Disputa',
            value: formatAmount(stats.disputed_amount || 0),
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        },
        {
            label: 'Promedio',
            value: formatAmount(stats.avg_payment || 0),
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        }
    ];

    return (
        <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
            <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Estadísticas de Pagos
                    </h3>
                    <p className="text-sm text-gray-600">
                        Resumen de tu actividad de pagos
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {statItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                        <div key={index} className="text-center">
                            <div className={`${item.bgColor} rounded-lg p-3 mb-2 inline-flex items-center justify-center`}>
                                <IconComponent className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className={`text-lg font-semibold ${item.color}`}>
                                {item.value}
                            </div>
                            <div className="text-xs text-gray-600">
                                {item.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Last Payment Date */}
            {stats.last_payment_date && (
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Último pago: {formatDate(stats.last_payment_date)}</span>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Resumen</h4>
                <div className="text-sm text-gray-600 space-y-1">
                    <p>
                        Has realizado <strong>{stats.total_payments || 0}</strong> pagos por un total de{' '}
                        <strong>{formatAmount(stats.total_amount || 0)}</strong>
                    </p>
                    <p>
                        <strong>{formatAmount(stats.released_amount || 0)}</strong> han sido liberados,{' '}
                        <strong>{formatAmount(stats.held_amount || 0)}</strong> están retenidos
                    </p>
                    {stats.disputed_amount > 0 && (
                        <p className="text-red-600">
                            <strong>{formatAmount(stats.disputed_amount)}</strong> están en disputa
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentStats;

