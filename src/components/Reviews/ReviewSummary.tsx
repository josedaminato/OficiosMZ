import React from 'react';

interface ReviewSummaryProps {
  avgRating: number;
  totalReviews: number;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ avgRating, totalReviews }) => (
  <div className="flex items-center gap-2">
    <span className="text-yellow-500 text-xl">★</span>
    <span className="font-bold text-lg">{avgRating.toFixed(2)}</span>
    <span className="text-gray-600">({totalReviews} reseñas)</span>
  </div>
);

export default ReviewSummary; 