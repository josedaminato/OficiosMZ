import React, { useState } from 'react';
import RequestPaymentStatus from './RequestPaymentStatus';
import RequestHitos from './RequestHitos';
import RequestPhotoUpload from './RequestPhotoUpload';
// import RequestChat from './RequestChat'; // Opcional

// Simulación de props de una solicitud
const mockRequest = {
  request_id: 'REQ123',
  cliente_id: 'C1',
  worker_id: 'W1',
  oficio: 'Albañil',
  descripcion: 'Reparación de techo',
  estado_pago: 'retenido', // 'liberado', 'en disputa'
  hitos: [
    { nombre: 'Inicio', descripcion: 'Foto antes de empezar', foto: '', estado: 'pendiente' },
    { nombre: 'Avance', descripcion: 'Foto de avance', foto: '', estado: 'pendiente' },
    { nombre: 'Final', descripcion: 'Foto final', foto: '', estado: 'pendiente' },
  ],
  foto_inicio: '',
  foto_final: '',
  estado_general: 'en curso', // 'pendiente', 'completado', 'en disputa'
};

interface RequestBoardProps {
  role: 'cliente' | 'trabajador';
}

const RequestBoard: React.FC<RequestBoardProps> = ({ role }) => {
  const [conformidad, setConformidad] = useState<null | 'conforme' | 'disconforme'>(null);
  // Aquí se manejarán los estados y lógica de la solicitud
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Solicitud #{mockRequest.request_id}</h2>
      <div className="mb-4">
        <RequestPaymentStatus estado_pago={mockRequest.estado_pago} />
      </div>
      <div className="mb-4">
        <RequestHitos hitos={mockRequest.hitos} role={role} />
      </div>
      <div className="mb-4">
        {/* Foto de inicio solo la sube el trabajador */}
        {role === 'trabajador' && <RequestPhotoUpload tipo="inicio" />}
        {/* Foto final la sube el trabajador, el cliente solo la ve */}
        {role === 'trabajador' && <RequestPhotoUpload tipo="final" />}
        {role === 'cliente' && mockRequest.foto_final && (
          <div className="mb-2">
            <label className="font-semibold block mb-1">Foto final del trabajo</label>
            <img src={mockRequest.foto_final} alt="Foto final" className="w-40 h-32 object-cover rounded border" />
          </div>
        )}
      </div>
      {/* Acciones del cliente tras la foto final */}
      {role === 'cliente' && mockRequest.foto_final && (
        <div className="flex gap-4 mt-4">
          <button
            className={`px-4 py-2 rounded font-bold bg-green-500 text-white hover:bg-green-600 ${conformidad === 'conforme' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => setConformidad('conforme')}
          >
            Estoy conforme (liberar pago)
          </button>
          <button
            className={`px-4 py-2 rounded font-bold bg-red-500 text-white hover:bg-red-600 ${conformidad === 'disconforme' ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => setConformidad('disconforme')}
          >
            No estoy conforme (abrir disputa)
          </button>
        </div>
      )}
      {/* <RequestChat /> */}
    </div>
  );
};

export default RequestBoard; 