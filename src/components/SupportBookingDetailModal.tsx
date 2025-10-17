import React, { useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';

// SupportBooking interface matching your data structure
interface SupportBooking {
  id: string;
  description: string;
  email: string;
  fileURL?: string;
  fullName: string;
  issueType: string;
  phoneNumber: string;
  timestamp: Timestamp | { toDate: () => Date } | null;
  status?: 'pending' | 'in-progress' | 'resolved';
}

interface SupportBookingDetailModalProps {
  booking: SupportBooking;
  onClose: () => void;
  onStatusUpdate: (id: string, status: 'pending' | 'in-progress' | 'resolved') => void;
}

const SupportBookingDetailModal: React.FC<SupportBookingDetailModalProps> = ({ 
  booking, 
  onClose,
  onStatusUpdate 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-all"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Support Booking Details</h3>
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
          <div className="flex flex-col gap-6">
            {/* Booking Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Current Status</p>
                  <p className="text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === 'resolved' ? 'bg-green-200 text-green-700' : 
                      booking.status === 'in-progress' ? 'bg-blue-200 text-blue-700' :
                      'bg-yellow-200 text-yellow-700'
                    }`}>
                      {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStatusUpdate(booking.id, 'pending')}
                    className={`px-3 py-1 text-xs rounded ${
                      booking.status === 'pending' 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => onStatusUpdate(booking.id, 'in-progress')}
                    className={`px-3 py-1 text-xs rounded ${
                      booking.status === 'in-progress' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => onStatusUpdate(booking.id, 'resolved')}
                    className={`px-3 py-1 text-xs rounded ${
                      booking.status === 'resolved' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium">{booking.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{booking.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-sm font-medium">{booking.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date Submitted</p>
                    <p className="text-sm font-medium">
                      {booking.timestamp 
                        ? new Date(booking.timestamp.toDate()).toLocaleString() 
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Consultation Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Consultation Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Issue Type</p>
                  <p className="text-sm font-medium">{booking.issueType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{booking.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
            
            {/* Attached Files (if any) */}
            {booking.fileURL && booking.fileURL !== "" && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Attached Files</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg 
                      className="h-5 w-5 text-gray-400 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
                      />
                    </svg>
                    <a 
                      href={booking.fileURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View Attached File
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-500 text-base font-light text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportBookingDetailModal;