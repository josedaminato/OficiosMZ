import React, { useState } from 'react';

const AvailabilityToggle: React.FC = () => {
  const [available, setAvailable] = useState(true);
  return (
    <button
      className={`px-4 py-2 rounded font-bold ${available ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
      onClick={() => setAvailable((a) => !a)}
    >
      {available ? 'Disponible' : 'No disponible'}
    </button>
  );
};

export default AvailabilityToggle; 