import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserContextType } from '../types';

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define expiration time (1 hour in milliseconds)
const EXPIRATION_TIME = 60 * 60 * 1000; 

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const expiration = localStorage.getItem('expiration');

    if (storedUser && expiration) {
      const currentTime = new Date().getTime();
      if (currentTime < parseInt(expiration, 10)) {
        setUser(JSON.parse(storedUser));
      } else {
        // Clear user data if expired
        logout();
      }
    }
  }, []);

  // Login function that saves user data to state and localStorage with expiration
  const login = (userData: User) => {
    const expirationDate = new Date().getTime() + EXPIRATION_TIME; // Set expiration time
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Persist user to localStorage
    localStorage.setItem('expiration', expirationDate.toString()); // Store expiration time
  };

  // Logout function that clears user data
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Remove from localStorage on logout
    localStorage.removeItem('expiration'); // Remove expiration time
  };

  const isAuthenticated = !!user; // Check if user is logged in

  return (
    <UserContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
