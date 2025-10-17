import React from 'react';

interface GifModalProps {
  isOpen: boolean;
  onClose: () => void;
  gifSrc: string;
}

const GifModal: React.FC<GifModalProps> = ({ isOpen, onClose}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white border border-[#AE1729] rounded-lg w-full max-w-lg p-4 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-black hover:text-[#AE1729] transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-center text-[#AE1729] font-medium text-xl mb-1">
          Sample Image Preview
        </h2>

        {/* Warning Message */}
        <p className="text-center text-sm text-gray-600 mb-4 font-light">
          Ensure this format matches your Image
        </p>

        {/* GIF/Video Content */}
        <video
          src="/tut.MP4"
          autoPlay
          loop
          muted
          className="w-full max-h-[70vh] shadow-md"
        />
      </div>
    </div>
  );
};

export default GifModal;
