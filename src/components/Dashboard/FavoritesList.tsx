import React from 'react';

const FavoritesList: React.FC = () => {
  // Simular favoritos
  const favorites = [
    { id: 1, nombre: 'Juan Pérez', oficio: 'Albañil' },
    { id: 2, nombre: 'Ana Torres', oficio: 'Electricista' },
  ];
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="font-bold mb-2">Favoritos</div>
      <ul className="divide-y">
        {favorites.map((f) => (
          <li key={f.id} className="py-2 flex justify-between">
            <span>{f.nombre}</span>
            <span className="text-sm text-gray-600">{f.oficio}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FavoritesList; 