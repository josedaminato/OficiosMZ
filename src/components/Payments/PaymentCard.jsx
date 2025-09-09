import React, { useState } from 'react';
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
    Briefcase,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import useDisputes from '../../hooks/useDisputes';

const PaymentCard = ({ payment, onHold, onRelease, userRole, className = "", onDisputeCreated }) => {
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [isCreatingDispute, setIsCreatingDispute] = useState(false);
    const { createDispute } = useDisputes();
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
    const canDispute = userRole === 'worker' && payment.status === 'held';

    const handleOpenDispute = () => {
        setShowDisputeModal(true);
        setDisputeReason('');
    };

    const handleCloseDispute = () => {
        setShowDisputeModal(false);
        setDisputeReason('');
    };

    const handleCreateDispute = async () => {
        if (!disputeReason.trim()) {
            toast.error('Por favor ingresa una razón para la disputa');
            return;
        }

        setIsCreatingDispute(true);
        try {
            const disputeData = {
                payment_id: payment.id,
                reason: disputeReason.trim(),
                status: 'open'
            };

            await createDispute(disputeData);
            
            toast.success('Disputa creada exitosamente');
            
            // Actualizar el estado del pago localmente
            if (onDisputeCreated) {
                onDisputeCreated(payment.id);
            }
            
            handleCloseDispute();
        } catch (error) {
            console.error('Error creating dispute:', error);
            toast.error('Error al crear la disputa. Inténtalo de nuevo.');
        } finally {
            setIsCreatingDispute(false);
        }
    };

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
            {canDispute && (
                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={handleOpenDispute}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Abrir Disputa
                    </button>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Abrir Disputa
                            </h3>
                            <button
                                onClick={handleCloseDispute}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Pago #{payment.id.slice(-8)} - {formatAmount(payment.amount)}
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Razón de la disputa *
                            </label>
                            <textarea
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                placeholder="Describe el motivo de la disputa..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={4}
                                disabled={isCreatingDispute}
                            />
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleCloseDispute}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={isCreatingDispute}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateDispute}
                                disabled={isCreatingDispute || !disputeReason.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingDispute ? 'Creando...' : 'Crear Disputa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentCard;


