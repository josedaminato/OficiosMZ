import React, { useState } from 'react';
import { DollarSign, Briefcase, AlertCircle } from 'lucide-react';

const PaymentForm = ({ jobId, jobTitle, onSubmit, onCancel, loading = false }) => {
    const [formData, setFormData] = useState({
        amount: '',
        job_id: jobId
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.amount || formData.amount <= 0) {
            newErrors.amount = 'El monto debe ser mayor a 0';
        }

        if (formData.amount > 1000000) {
            newErrors.amount = 'El monto no puede ser mayor a $1,000,000';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            onSubmit({
                job_id: formData.job_id,
                amount: parseFloat(formData.amount)
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const formatAmount = (value) => {
        // Remove non-numeric characters except decimal point
        const numericValue = value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point
        const parts = numericValue.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }
        
        return numericValue;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
            <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Crear Pago
                    </h2>
                    <p className="text-sm text-gray-600">
                        Configurar pago para el trabajo
                    </p>
                </div>
            </div>

            {/* Job Info */}
            {jobTitle && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Trabajo:</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Monto del Pago *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="text"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={(e) => {
                                const formatted = formatAmount(e.target.value);
                                handleInputChange({
                                    target: {
                                        name: 'amount',
                                        value: formatted
                                    }
                                });
                            }}
                            placeholder="0.00"
                            className={`block w-full pl-7 pr-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                errors.amount 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300'
                            }`}
                        />
                    </div>
                    {errors.amount && (
                        <div className="mt-2 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <p className="text-sm text-red-600">{errors.amount}</p>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Información Importante
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>El pago será retenido hasta que confirmes la finalización del trabajo</li>
                                    <li>El trabajador recibirá una notificación cuando crees el pago</li>
                                    <li>Puedes liberar el pago una vez que estés satisfecho con el resultado</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Creando...' : 'Crear Pago'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PaymentForm;




