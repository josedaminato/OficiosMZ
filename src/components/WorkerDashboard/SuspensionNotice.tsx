import React from 'react';

interface SuspensionNoticeProps {
  isSuspended: boolean;
}

const SuspensionNotice: React.FC<SuspensionNoticeProps> = ({ isSuspended }) => {
  if (!isSuspended) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center font-bold">
      Tu cuenta ha sido suspendida por recibir múltiples calificaciones bajas. Por favor, contacta al soporte para más información.
    </div>
  );
};

export default SuspensionNotice; 