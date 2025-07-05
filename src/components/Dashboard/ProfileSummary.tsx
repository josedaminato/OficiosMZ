import React from 'react';
import ReviewSummary from '../Reviews/ReviewSummary';

interface ProfileSummaryProps {
  userType: 'worker' | 'client';
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ userType }) => {
  // Simular datos
  const name = userType === 'worker' ? 'Juan Pérez' : 'María Cliente';
  const avatar = userType === 'worker'
    ? 'https://randomuser.me/api/portraits/men/1.jpg'
    : 'https://randomuser.me/api/portraits/women/2.jpg';
  const avgRating = 4.8;
  const totalReviews = 32;
  const available = true;

  return (
    <div className="bg-white rounded shadow p-4 flex items-center gap-6 mb-6">
      <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover border" />
      <div>
        <div className="text-xl font-bold mb-1">{name}</div>
        {userType === 'worker' && (
          <>
            <ReviewSummary avgRating={avgRating} totalReviews={totalReviews} />
            <div className="mt-1 text-sm text-gray-600">
              Disponibilidad: <span className={available ? 'text-green-600' : 'text-red-600'}>{available ? 'Disponible' : 'No disponible'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSummary; 