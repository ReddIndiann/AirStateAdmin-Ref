import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../Context/AuthContext'; // Import your UserContext
import { ProtectedRouteProps } from '../types';
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useUser(); // Check if the user is authenticated

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the children (protected content)
  return children;
};

export default ProtectedRoute;
