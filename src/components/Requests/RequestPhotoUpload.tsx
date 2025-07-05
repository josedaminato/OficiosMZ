import React from 'react';

interface RequestPhotoUploadProps {
  tipo: 'inicio' | 'final';
}

const labelMap = {
  inicio: 'Foto de inicio',
  final: 'Foto final',
};

const RequestPhotoUpload: React.FC<RequestPhotoUploadProps> = ({ tipo }) => {
  return (
    <div className="mb-2">
      <label className="font-semibold block mb-1">{labelMap[tipo]}</label>
      <input type="file" accept="image/*" className="border rounded p-2" />
    </div>
  );
};

export default RequestPhotoUpload; 