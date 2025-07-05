import React from 'react';

interface Review {
  id: string;
  reviewerType: 'client' | 'worker';
  reviewerName: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewListProps {
  reviews: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(2) : '0.00';
  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <div className="mb-4 font-bold text-lg">Promedio: <span className="text-yellow-500">★</span> {avg} ({reviews.length} reseñas)</div>
      <ul className="divide-y">
        {reviews.map((r) => (
          <li key={r.id} className="py-3">
            <div className="flex items-center mb-1">
              <span className="text-yellow-500 mr-1">{'★'.repeat(r.rating)}</span>
              <span className="font-semibold mr-2">{r.reviewerName}</span>
              <span className="text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <div className="text-gray-700">{r.comment}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewList; 