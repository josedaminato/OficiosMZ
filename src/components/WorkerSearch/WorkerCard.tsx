// Tarjeta individual de trabajador
// Muestra la información de un trabajador.
import React from 'react';
import { WorkerCardData } from '../../hooks/useWorkerSearch';

interface WorkerCardProps {
  worker: WorkerCardData;
  onViewProfile?: () => void;
}

// Simulación de datos adicionales (en producción, estos vendrían de la base de datos)
const oficioPorTrabajador: Record<string, string> = {
  '1': 'Carpintero',
  '2': 'Plomera',
  '3': 'Electricista',
  '4': 'Albañil',
  '5': 'Herrero',
  '6': 'Pintora',
  '7': 'Vidriero',
  '8': 'Tapicera',
};
const descripcionPorTrabajador: Record<string, string> = {
  '1': 'Especialista en muebles a medida y restauración de madera.',
  '2': 'Soluciones rápidas y limpias para tu hogar.',
  '3': 'Instalaciones y reparaciones eléctricas seguras.',
  '4': 'Obras grandes y pequeñas, siempre con calidad.',
  '5': 'Estructuras metálicas y herrería artística.',
  '6': 'Pintura de interiores y exteriores, prolijidad garantizada.',
  '7': 'Colocación de vidrios y ventanales.',
  '8': 'Tapizado profesional de muebles.',
};

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onViewProfile }) => {
  const oficio = oficioPorTrabajador[worker.id] || 'Oficio no especificado';
  const descripcion = descripcionPorTrabajador[worker.id] || 'Trabajador experimentado y confiable.';
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition">
      <img
        src={worker.avatar_url}
        alt={worker.name}
        className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-blue-200 shadow"
      />
      <h3 className="text-xl font-bold mb-1 text-blue-900">{worker.name}</h3>
      <div className="text-blue-700 font-semibold mb-1">{oficio}</div>
      <div className="flex items-center mb-1">
        <span className="text-yellow-500 mr-1 text-lg">{'★'.repeat(Math.round(worker.rating))}</span>
        <span className="font-semibold text-blue-900">{worker.rating.toFixed(2)}</span>
        <span className="text-gray-500 ml-2">({worker.reviews} reseñas)</span>
      </div>
      <div className="text-gray-700 text-sm mb-2">{descripcion}</div>
      <div className="text-gray-600 text-xs mb-2">Trabajos realizados: <span className="font-bold">{worker.reviews}</span></div>
      <button
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={onViewProfile}
        aria-label="Ver perfil completo del trabajador"
        title="Ver perfil completo del trabajador"
      >
        Ver perfil
      </button>
    </div>
  );
};

export default WorkerCard; 