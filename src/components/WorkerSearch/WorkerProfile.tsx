import React from 'react';
import { WorkerCardData } from '../../hooks/useWorkerSearch';

interface WorkerProfileProps {
  worker: WorkerCardData & {
    skills?: string[];
    certifications?: string[];
    work_zones?: string[];
    description?: string;
  };
}

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker }) => {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col items-center gap-4 mt-8">
      <img
        src={worker.avatar_url}
        alt={worker.name}
        className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow mb-2"
      />
      <h2 className="text-2xl font-bold text-blue-900 mb-1">{worker.name}</h2>
      <div className="text-blue-700 font-semibold text-lg mb-1">{worker.oficio}</div>
      <div className="text-gray-700 text-base mb-1">
        <span className="font-semibold">Especialidad:</span> {worker.specialty}
      </div>
      {worker.experience && (
        <div className="text-gray-700 text-base mb-1">
          <span className="font-semibold">Años de experiencia:</span> {worker.experience}
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-yellow-500 text-xl">{'★'.repeat(Math.round(worker.rating))}</span>
        <span className="font-bold text-lg text-blue-900">{worker.rating.toFixed(2)}</span>
        <span className="text-gray-600">({worker.reviews} reseñas)</span>
      </div>
      {worker.skills && worker.skills.length > 0 && (
        <div className="w-full">
          <span className="font-semibold">Habilidades:</span>
          <ul className="flex flex-wrap gap-2 mt-1">
            {worker.skills.map((skill, idx) => (
              <li key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{skill}</li>
            ))}
          </ul>
        </div>
      )}
      {worker.certifications && worker.certifications.length > 0 && (
        <div className="w-full">
          <span className="font-semibold">Certificaciones:</span>
          <ul className="flex flex-wrap gap-2 mt-1">
            {worker.certifications.map((cert, idx) => (
              <li key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{cert}</li>
            ))}
          </ul>
        </div>
      )}
      {worker.work_zones && worker.work_zones.length > 0 && (
        <div className="w-full">
          <span className="font-semibold">Zonas de trabajo:</span>
          <ul className="flex flex-wrap gap-2 mt-1">
            {worker.work_zones.map((zone, idx) => (
              <li key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">{zone}</li>
            ))}
          </ul>
        </div>
      )}
      {worker.description && (
        <div className="w-full text-gray-700 mt-2 text-center italic">{worker.description}</div>
      )}
      <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg text-lg font-bold hover:bg-blue-700 transition">
        Contactar trabajador
      </button>
    </div>
  );
};

export default WorkerProfile; 