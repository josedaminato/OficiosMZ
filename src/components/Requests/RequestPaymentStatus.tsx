import React from 'react';

interface RequestPaymentStatusProps {
  estado_pago: 'retenido' | 'liberado' | 'en disputa';
}

const statusMap = {
  'retenido': { color: 'bg-yellow-100 text-yellow-800', label: 'Pago retenido (escrow)' },
  'liberado': { color: 'bg-green-100 text-green-800', label: 'Pago liberado al trabajador' },
  'en disputa': { color: 'bg-red-100 text-red-800', label: 'Pago en disputa' },
};

const RequestPaymentStatus: React.FC<RequestPaymentStatusProps> = ({ estado_pago }) => {
  const status = statusMap[estado_pago];
  return (
    <div className={`rounded p-3 font-semibold text-center ${status.color}`}>{status.label}</div>
  );
};

export default RequestPaymentStatus; 