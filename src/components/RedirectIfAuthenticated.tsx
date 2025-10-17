import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../Context/AuthContext'; // Import the UserContext to get authentication state
import { RedirectIfAuthenticatedProps } from '../types';
const RedirectIfAuthenticated: React.FC<RedirectIfAuthenticatedProps> = ({ children }) => {
  const { isAuthenticated } = useUser(); // Check if user is authenticated

  if (isAuthenticated) {
    // If the user is authenticated, redirect them to the home page (or any other route)
    return <Navigate to="/home" replace />;
  }

  // If the user is not authenticated, render the children (login/signup page)
  return children;
};

export default RedirectIfAuthenticated;
