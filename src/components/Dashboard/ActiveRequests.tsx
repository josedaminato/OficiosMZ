import React from 'react';

const SecurityNotice: React.FC = () => (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded text-center" role="alert">
    <strong>¡Importante para tu seguridad!</strong><br />
    El trabajador que realice el trabajo debe ser el mismo que aparece en la foto de su perfil.<br />
    <span className="font-semibold">No permitas que otra persona se presente en su lugar.</span><br />
    Si notas algo sospechoso, repórtalo a través de la plataforma.
  </div>
);

const ActiveRequests: React.FC = () => {
  // Simular solicitudes activas
  const requests = [
    { id: 1, cliente: 'María Cliente', oficio: 'Plomería', estado: 'En curso' },
    { id: 2, cliente: 'Carlos Cliente', oficio: 'Electricidad', estado: 'Pendiente' },
  ];
  return (
    <div className="bg-white rounded shadow p-4">
      <SecurityNotice />
      <div className="font-bold mb-2">Solicitudes activas</div>
      <ul className="divide-y">
        {requests.map((r) => (
          <li key={r.id} className="py-2 flex justify-between">
            <span>{r.oficio} para {r.cliente}</span>
            <span className="text-sm text-gray-600">{r.estado}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveRequests; 