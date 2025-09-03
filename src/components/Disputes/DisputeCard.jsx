import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    AlertTriangle, 
    Clock, 
    CheckCircle, 
    User, 
    DollarSign,
    Calendar,
    FileText,
    Eye
} from 'lucide-react';

const DisputeCard = ({ dispute, onView, onUpdate, userRole, className = "" }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'open':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'reviewing':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'resolved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'escalated':
                return <AlertTriangle className="w-5 h-5 text-purple-500" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'open':
                return 'Abierta';
            case 'reviewing':
                return 'En Revisión';
            case 'resolved':
                return 'Resuelta';
            case 'escalated':
                return 'Escalada';
            default:
                return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'reviewing':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'resolved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'escalated':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getReasonText = (reason) => {
        switch (reason) {
            case 'work_not_completed':
                return 'Trabajo no completado';
            case 'poor_quality':
                return 'Mala calidad del trabajo';
            case 'payment_issue':
                return 'Problema con el pago';
            case 'communication_problem':
                return 'Problema de comunicación';
            case 'other':
                return 'Otro';
            default:
                return reason;
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

    const canUpdate = userRole === 'admin' && dispute.status !== 'resolved';

    return (
        <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    {getStatusIcon(dispute.status)}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Disputa #{dispute.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                            Pago: #{dispute.payment_id.slice(-8)}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(dispute.status)}`}>
                    {getStatusText(dispute.status)}
                </span>
            </div>

            {/* Job Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{dispute.job_title}</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatAmount(dispute.amount)}</span>
                </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Razón:</span>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {getReasonText(dispute.reason)}
                </p>
            </div>

            {/* Description */}
            <div className="mb-4">
                <span className="text-sm font-medium text-gray-900">Descripción:</span>
                <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">
                    {dispute.description}
                </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Iniciada por: {dispute.initiator_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Creada: {formatDate(dispute.created_at)}</span>
                </div>
                
                {dispute.resolved_at && (
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Resuelta: {formatDate(dispute.resolved_at)}</span>
                    </div>
                )}
                
                {dispute.resolver_name && (
                    <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Resuelta por: {dispute.resolver_name}</span>
                    </div>
                )}
            </div>

            {/* Admin Notes */}
            {dispute.admin_notes && (
                <div className="mb-4">
                    <span className="text-sm font-medium text-gray-900">Notas del administrador:</span>
                    <p className="text-sm text-gray-700 mt-1 bg-blue-50 rounded-lg p-3">
                        {dispute.admin_notes}
                    </p>
                </div>
            )}

            {/* Resolution */}
            {dispute.resolution && (
                <div className="mb-4">
                    <span className="text-sm font-medium text-gray-900">Resolución:</span>
                    <p className="text-sm text-gray-700 mt-1 bg-green-50 rounded-lg p-3">
                        {dispute.resolution}
                    </p>
                </div>
            )}

            {/* Evidence */}
            {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                <div className="mb-4">
                    <span className="text-sm font-medium text-gray-900">Evidencia:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {dispute.evidence_urls.map((url, index) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                Archivo {index + 1}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                    onClick={() => onView(dispute.id)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                    <Eye className="w-4 h-4" />
                    <span>Ver Detalles</span>
                </button>
                
                {canUpdate && (
                    <button
                        onClick={() => onUpdate(dispute.id)}
                        className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                        Actualizar
                    </button>
                )}
            </div>
        </div>
    );
};

export default DisputeCard;
