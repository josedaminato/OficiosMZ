import React from 'react';
import DashboardLayout from './DashboardLayout';
import ProfileSummary from './ProfileSummary';
import FavoritesList from './FavoritesList';
import RequestHistory from './RequestHistory';
import ReviewForm from '../Reviews/ReviewForm';

const ClientDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <ProfileSummary userType="client" />
      <div className="my-6">
        <FavoritesList />
      </div>
      <div className="my-6">
        <RequestHistory />
      </div>
      <div className="my-6">
        <ReviewForm reviewerType="client" targetId="" onSubmit={() => {}} />
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard; 