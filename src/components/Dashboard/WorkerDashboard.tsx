import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import ProfileSummary from './ProfileSummary';
import NotificationBell from './NotificationBell';
import RequestBoard from '../Requests/RequestBoard';

// Simulación de solicitudes activas
const mockRequests = [
  {
    request_id: 'REQ123',
    cliente: 'María Cliente',
    oficio: 'Albañil',
    estado: 'En curso',
  },
  {
    request_id: 'REQ124',
    cliente: 'Carlos Cliente',
    oficio: 'Electricista',
    estado: 'Pendiente',
  },
];

const WorkerDashboard: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  if (selectedRequest) {
    // Mostrar detalles de la solicitud seleccionada
    return <RequestBoard role="trabajador" />;
  }

  return (
    <DashboardLayout>
      <ProfileSummary userType="worker" />
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="font-bold mb-2 text-lg">Solicitudes activas</div>
        <ul className="divide-y">
          {mockRequests.map((req) => (
            <li key={req.request_id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{req.oficio}</div>
                <div className="text-gray-600 text-sm">Cliente: {req.cliente}</div>
                <div className="text-xs text-gray-500">Estado: {req.estado}</div>
              </div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold"
                onClick={() => setSelectedRequest(req.request_id)}
              >
                Ver detalles
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
};

export default WorkerDashboard; 