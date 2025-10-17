import React, { useEffect, useRef, useState } from 'react';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// User interface matching your data structure
interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  location?: string;
  provider?: string;
  passwordReset?: boolean;
  createdAt: Timestamp | { toDate: () => Date } | null;
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onPasswordReset?: (userId: string) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onPasswordReset }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [resetInProgress, setResetInProgress] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleResetPassword = async () => {
    setResetInProgress(true);
    try {
      // Update user document with passwordReset field
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        passwordReset: true
        // In a real application, you would handle the actual password reset mechanism here
        // This might involve calling a function or API to reset the password
      });
      
      setResetSuccess(true);
      if (onPasswordReset) {
        onPasswordReset(user.uid);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setResetInProgress(false);
    }
  };

  const isEmailProvider = user.provider === 'email';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-all"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* User Avatar */}
            <div className="flex flex-col items-center">
              {user?.imageUrl && user.imageUrl !== "" ? (
                <img 
                  src={user.imageUrl} 
                  alt={`${user.name}'s profile`} 
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl text-gray-500">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500">
                User ID: {user.uid.substring(0, 8)}...
              </p>
            </div>
            
            {/* User Details */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="text-sm font-medium">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="text-sm font-medium">{user.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium">{user.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Authentication Provider</p>
                <p className="text-sm font-medium capitalize">{user.provider || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Created</p>
                <p className="text-sm font-medium">
                  {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleString() : 'N/A'}
                </p>
              </div>
              {isEmailProvider && (
                <div>
                  <p className="text-xs text-gray-500">Password Status</p>
                  <p className="text-sm font-medium">
                    {user.passwordReset ? 'Reset to Default' : 'Normal'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Account Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">UID</p>
                  <p className="text-sm font-medium break-all">{user.uid}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="text-sm font-medium capitalize">{user.provider === 'email' ? 'Email/Password' : user.provider}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Reset Password Section (only for email provider) */}
          {isEmailProvider && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Account Actions</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col">
                  <p className="text-sm mb-2">
                    Reset this user's password to the default password.
                  </p>
                  {resetSuccess ? (
                    <div className="text-green-600 text-sm py-2">
                      Password has been reset successfully!
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-light text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-auto text-sm disabled:bg-blue-300"
                      onClick={handleResetPassword}
                      disabled={resetInProgress}
                    >
                      {resetInProgress ? 'Resetting...' : 'Reset Password'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-500 text-base font-light text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;