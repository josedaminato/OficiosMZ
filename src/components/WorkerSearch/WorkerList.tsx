// Lista de tarjetas de trabajadores
// Muestra la lista de tarjetas y el botón "Cargar Más".
import React, { useState } from 'react';
import { WorkerCardData } from '../../hooks/useWorkerSearch';
import WorkerCard from './WorkerCard';
import WorkerProfile from './WorkerProfile';

interface WorkerListProps {
  workers: WorkerCardData[];
}

const WorkerList: React.FC<WorkerListProps> = ({ workers }) => {
  const [selectedWorker, setSelectedWorker] = useState<WorkerCardData | null>(null);

  if (selectedWorker) {
    // Mostrar el perfil completo del trabajador
    return (
      <div>
        <button
          className="mb-4 text-blue-600 underline"
          onClick={() => setSelectedWorker(null)}
        >
          ← Volver a la lista
        </button>
        <WorkerProfile worker={selectedWorker} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workers.map((worker) => (
        <WorkerCard
          key={worker.id}
          worker={worker}
          onViewProfile={() => setSelectedWorker(worker)}
        />
      ))}
    </div>
  );
};

export default WorkerList; 