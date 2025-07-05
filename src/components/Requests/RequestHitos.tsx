import React from 'react';

interface Hito {
  nombre: string;
  descripcion: string;
  foto: string;
  estado: string;
}

interface RequestHitosProps {
  hitos: Hito[];
  role: 'cliente' | 'trabajador';
}

const RequestHitos: React.FC<RequestHitosProps> = ({ hitos, role }) => {
  return (
    <div>
      <div className="font-bold mb-2">Hitos del trabajo</div>
      <ul className="divide-y">
        {hitos.map((hito, idx) => (
          <li key={idx} className="py-2 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-semibold">{hito.nombre}</div>
              <div className="text-gray-600 text-sm">{hito.descripcion}</div>
            </div>
            <div>
              {hito.foto ? (
                <img src={hito.foto} alt={hito.nombre} className="w-16 h-16 object-cover rounded border" />
              ) : (
                <span className="text-gray-400 text-xs">Sin foto</span>
              )}
            </div>
            <div>
              <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">{hito.estado}</span>
              {role === 'trabajador' && hito.estado !== 'completado' && (
                <button className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition">
                  Marcar como completado
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RequestHitos; 