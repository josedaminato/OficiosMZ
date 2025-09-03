import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    CreditCard, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    DollarSign,
    Calendar,
    User,
    Briefcase
} from 'lucide-react';

const PaymentCard = ({ payment, onHold, onRelease, userRole, className = "" }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'held':
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'released':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'disputed':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'refunded':
                return <CreditCard className="w-5 h-5 text-blue-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pendiente';
            case 'held':
                return 'Retenido';
            case 'released':
                return 'Liberado';
            case 'disputed':
                return 'En Disputa';
            case 'refunded':
                return 'Reembolsado';
            default:
                return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'held':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'released':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'disputed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'refunded':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    };

    const canHold = userRole === 'employer' && payment.status === 'pending';
    const canRelease = userRole === 'employer' && payment.status === 'held';

    return (
        <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    {getStatusIcon(payment.status)}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Pago #{payment.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                            Trabajo: {payment.job_id ? `#${payment.job_id.slice(-8)}` : 'N/A'}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                </span>
            </div>

            {/* Amount */}
            <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">
                    {formatAmount(payment.amount)}
                </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Creado: {formatDate(payment.created_at)}</span>
                </div>
                
                {payment.held_at && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Retenido: {formatDate(payment.held_at)}</span>
                    </div>
                )}
                
                {payment.released_at && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Liberado: {formatDate(payment.released_at)}</span>
                    </div>
                )}
                
                {payment.disputed_at && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Disputado: {formatDate(payment.disputed_at)}</span>
                    </div>
                )}
            </div>

            {/* Mercado Pago Info */}
            {payment.mercado_pago_preference_id && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">
                        <strong>Preferencia MP:</strong> {payment.mercado_pago_preference_id}
                    </p>
                    {payment.mercado_pago_status && (
                        <p className="text-sm text-gray-600">
                            <strong>Estado MP:</strong> {payment.mercado_pago_status}
                        </p>
                    )}
                </div>
            )}

            {/* Actions */}
            {(canHold || canRelease) && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    {canHold && (
                        <button
                            onClick={() => onHold(payment.id)}
                            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                        >
                            Retener Pago
                        </button>
                    )}
                    {canRelease && (
                        <button
                            onClick={() => onRelease(payment.id)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            Liberar Pago
                        </button>
                    )}
                </div>
            )}

            {/* Dispute Button */}
            {payment.status === 'held' && userRole === 'worker' && (
                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={() => {/* TODO: Implement dispute creation */}}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Abrir Disputa
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentCard;

