import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-transparent rounded-lg p-8 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent" />
        {message && <p className="mt-4 text-white">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay;