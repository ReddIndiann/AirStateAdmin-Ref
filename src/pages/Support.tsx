import  { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import PaginatedTable from '../components/ReusableTable';
import LoadingOverlay from '../components/LoadingOverlay';
import ResponseModal from '../components/ResponseModal';
import SupportBookingDetailModal from '../components/SupportBookingDetailModal';

// Define the SupportBooking interface based on the provided structure
interface SupportBooking {
  id: string;
  description: string;
  email: string;
  fileURL?: string;
  fullName: string;
  issueType: string;
  phoneNumber: string;
  timestamp: Timestamp | { toDate: () => Date } | null;
  status?: 'pending' | 'in-progress' | 'resolved'; // You might want to add this field
}

const SupportBookings = () => {
  const [bookings, setBookings] = useState<SupportBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<SupportBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  
  const rowsPerPage = 12;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const bookingsCollection = collection(db, 'support');
      const snapshot = await getDocs(bookingsCollection);
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportBooking[];
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching support bookings:', error);
      showResponseMessage('Failed to load support bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    setBookingToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    setLoading(true);
    try {
      const bookingRef = doc(db, 'support', bookingToDelete);
      await deleteDoc(bookingRef);
      
      // Update local state
      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingToDelete));
      showResponseMessage('Support booking deleted successfully.');
    } catch (error) {
      console.error('Error deleting support booking:', error);
      showResponseMessage('Failed to delete support booking. Please try again.');
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setBookingToDelete(null);
    }
  };

  const updateBookingStatus = async (id: string, status: 'pending' | 'in-progress' | 'resolved') => {
    setLoading(true);
    try {
      const bookingRef = doc(db, 'support', id);
      await updateDoc(bookingRef, { status });
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === id ? { ...booking, status } : booking
        )
      );
      
      showResponseMessage(`Booking status updated to ${status}.`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      showResponseMessage('Failed to update booking status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showResponseMessage = (message: string) => {
    setResponseMessage(message);
    setResponseModalOpen(true);
  };

  // Booking table columns
  const bookingColumns = [
    { 
      header: 'Full Name', 
      accessor: 'fullName' as keyof SupportBooking, 
      isRounded: 'left' as const 
    },
    { 
      header: 'Issue Type', 
      accessor: 'issueType' as keyof SupportBooking 
    },
    { 
      header: 'Email', 
      accessor: 'email' as keyof SupportBooking 
    },
    { 
      header: 'Phone Number', 
      accessor: 'phoneNumber' as keyof SupportBooking 
    },
    { 
      header: 'Status', 
      accessor: (item: SupportBooking) => {
        const status = item.status || 'pending';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'resolved' ? 'bg-green-200 text-green-700' : 
            status === 'in-progress' ? 'bg-blue-200 text-blue-700' :
            'bg-yellow-200 text-yellow-700'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    { 
      header: 'Date', 
      accessor: (item: SupportBooking) => {
        if (!item.timestamp) return 'N/A';
        return new Date(item.timestamp.toDate()).toLocaleDateString();
      }
    },
    { 
      header: 'Actions', 
      accessor: (item: SupportBooking) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedBooking(item)}
            className="text-blue-500 hover:underline text-sm"
          >
            View
          </button>
          <button
            onClick={() => handleDeleteBooking(item.id)}
            className="text-red-500 hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      ),
      isRounded: 'right' as const
    }
  ];

  return (
    <div className="h-full flex flex-col md:justify-between md:items-center">
      <div className="bg-white w-full min-h-full overflow-hidden shadow-md px-4 pt-4 pb-2 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">COMPLAINS/SUGGESTIONS</h2>
          <button 
            onClick={fetchBookings}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-grow h-[680px]">
          <PaginatedTable<SupportBooking>
            data={bookings}
            columns={bookingColumns}
            emptyStateMessage="No consultancy bookings yet. Book your first consultation to get started!"
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {/* Support Booking Detail Modal */}
      {selectedBooking && (
        <SupportBookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={updateBookingStatus}
        />
      )}

      {/* Confirmation Dialog */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this support booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBooking}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {responseModalOpen && (
        <ResponseModal
          isOpen={responseModalOpen}
          onClose={() => setResponseModalOpen(false)}
          message={responseMessage}
        />
      )}
      
      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}
    </div>
  );
};

export default SupportBookings;