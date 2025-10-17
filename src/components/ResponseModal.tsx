import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

interface ResponseModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
}

const ResponseModal: React.FC<ResponseModalProps> = ({ 
  isOpen, 
  message, 
  onClose, 
  type = 'info' 
}) => {
  const modalConfig = {
    success: {
      icon: CheckCircle2,
      title: 'Success',
    },
    error: {
      icon: XCircle,
      title: 'Error',
    },
    warning: {
      icon: AlertTriangle,
      title: 'Warning',
    },
    info: {
      icon: Info,
      title: 'Information',
    },
  };

  const { 
    icon: IconComponent, 
    title 
  } = modalConfig[type];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="relative w-full max-w-md bg-white border border-[#AE1729] rounded-lg shadow-lg p-6 text-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <IconComponent 
            className="text-[#AE1729] w-16 h-16" 
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-3 text-[#AE1729]">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed font-light">
          {message}
        </p>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-full py-3 bg-[#AE1729] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ResponseModal;
