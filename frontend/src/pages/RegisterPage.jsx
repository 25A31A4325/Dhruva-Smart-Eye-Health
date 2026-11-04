import React from 'react';
import { Navigate } from 'react-router-dom';

export const RegisterPage = () => {
  // Directly redirect to the unified Start experience
  return <Navigate to="/login" replace />;
};
