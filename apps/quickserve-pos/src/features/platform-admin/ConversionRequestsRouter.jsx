import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ConversionRequestDetail from './ConversionRequestDetail';
import { ConversionRequests } from './ConversionRequests';

export const ConversionRequestsRouter = () => {
  const { user, role } = useAuth();

  return (
    <Routes>
      <Route index element={<ConversionRequests />} />
      <Route 
        path=":id" 
        element={<ConversionRequestDetail userId={user?.id} userRole={role} />} 
      />
    </Routes>
  );
};
