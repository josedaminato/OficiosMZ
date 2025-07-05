import React from 'react';

interface ReviewFormProps {
  reviewerType: 'client' | 'worker';
  targetId: string; // worker_id o client_id
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ reviewerType, targetId, onSubmit }) => {
  // Estructura general, sin lógica detallada
  return (
    <form className="bg-white rounded shadow p-4 flex flex-col gap-3 max-w-md mx-auto">
      <label className="font-semibold">Calificación</label>
      <select className="border rounded p-2 w-32">
        {[1,2,3,4,5].map((star) => (
          <option key={star} value={star}>{star} estrella{star > 1 ? 's' : ''}</option>
        ))}
      </select>
      <label className="font-semibold">Comentario</label>
      <textarea className="border rounded p-2" rows={3} placeholder="Escribe tu comentario..." />
      <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-2">Enviar</button>
    </form>
  );
};

export default ReviewForm; 