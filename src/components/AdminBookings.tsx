import React, { useState } from 'react';
import { 
  BookOpen, 
  User, 
  Mail, 
  Phone, 
  MessageCircle, 
  CalendarIcon, 
  XIcon, 
  CheckIcon, 
  ClockIcon, 
  FileTextIcon,
  TagIcon
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Define types for the Booking and AdminBookings component props
interface Booking {
  id: string;
  topic: string;
  selectedSlot: Date;
  status: boolean;
  name: string;
  email: string;
  phone: string;
  description: string;
}

interface AdminBookingsProps {
  userBookings: Booking[];
  onApproveBooking?: (bookingId: string) => void;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({ userBookings, onApproveBooking }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleApprove = async () => {
    if (selectedBooking) {
      try {
        // Validate required fields for notification
        if (!selectedBooking.email || !selectedBooking.phone) {
          console.error('Cannot send notification - missing required fields:', {
            email: selectedBooking.email,
            phone: selectedBooking.phone,
            name: selectedBooking.name
          });
          toast.error('Cannot send notification: Missing email or phone number', {
            className: 'bg-red-200 text-red-800',
          });
          // Still allow approval to proceed
        }

        // Get the reference to the document we want to update
        const bookingRef = doc(db, 'consultancy_bookings', selectedBooking.id);

        // Update the booking status to 'Pending Payment'
        await updateDoc(bookingRef, {
          status: 'Pending Payment',
        });

        // Only send notification if we have required fields
        if (selectedBooking.email && selectedBooking.phone && selectedBooking.name) {
          // Prepare notification data to send to user - matching Consultancy.tsx structure exactly
          const bookingData = {
            clientsname: selectedBooking.name,
            clientsnumber: selectedBooking.phone,
            clientEmail: selectedBooking.email,
            userMessage: `Your Pro - Service appointment has been approved and is now pending payment. Please proceed with payment to confirm your booking.`,
            adminMessage: `Booking approved: ${selectedBooking.name}'s booking (${selectedBooking.phone}) has been moved to Pending Payment status.`,
            header: "Pro Services Booking Approval"
          };

          console.log('Sending notification with data:', bookingData);

          // Send notification to user (non-blocking - don't fail approval if this fails)
          try {
            const response = await axios.post(
              'https://us-central1-airstatefinder.cloudfunctions.net/notifyAdminAndUser',
              bookingData,
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            console.log('Notification response status:', response.status);
            console.log('Notification response data:', response.data);
            
            if (response.status === 200) {
              console.log('✅ Notification sent successfully');
              toast.success('Notification sent to user', {
                className: 'bg-green-200 text-green-800',
              });
            } else {
              console.warn('⚠️ Notification API returned non-200 status:', response.status);
              toast.error(`Booking approved but notification returned status ${response.status}`, {
                className: 'bg-yellow-200 text-yellow-800',
              });
            }
          } catch (notificationError) {
            // Log notification error but don't affect approval success
            console.error('❌ Failed to send notification:', notificationError);
            if (axios.isAxiosError(notificationError)) {
              console.error('Error status:', notificationError.response?.status);
              console.error('Error data:', notificationError.response?.data);
              console.error('Error message:', notificationError.message);
              console.error('Full error:', notificationError);
            }
            toast.error('Booking approved but notification failed. Check console for details.', {
              className: 'bg-yellow-200 text-yellow-800',
            });
          }
        } else {
          console.warn('Skipping notification - missing required fields');
        }

        // Close the modal after the update
        closeModal();

        // You can also call the `onApproveBooking` prop if needed
        if (onApproveBooking) {
          onApproveBooking(selectedBooking.id);
        }

        // Optionally, display a success toast message
        toast.success('Booking approved successfully!', {
          className: 'bg-green-200 text-green-800',
        });
      } catch (error) {
        console.error('Error updating booking status:', error);
        toast.error('Failed to approve the booking', {
          className: 'bg-red-200 text-red-800',
        });
      }
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden">
      <div className="bg-red-500 text-white px-6 py-4">
        <h2 className="text-2xl font-bold">Consultancy Bookings</h2>
        <p className="text-red-100 mt-1">Review scheduled consultations</p>
      </div>

      <div className="p-6">
        {userBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="mx-auto h-16 w-16 text-green-300 mb-4" />
            <p className="text-lg">No consultancy bookings yet</p>
            <p className="text-sm">Book your first consultation to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <TagIcon className="mr-2 h-5 w-5 text-red-400" />
                      {booking.topic}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-green-500" />
                      {booking.selectedSlot.toLocaleString('default', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                      booking.status === false 
                      ? 'bg-red-100 text-red-800' 
                      : booking.status === true
                      ? 'bg-green-100 text-green-800'
                      : booking.status === true 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 flex items-center">
                        <User className="mr-2 h-4 w-4 text-red-400" />
                        Name
                      </p>
                      <p className="font-medium">{booking.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-red-400" />
                        Email
                      </p>
                      <p className="font-medium">{booking.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-red-400" />
                        Phone
                      </p>
                      <p className="font-medium">{booking.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center">
                        <MessageCircle className="mr-2 h-4 w-4 text-red-400" />
                        Description
                      </p>
                      <p className="font-medium">{booking.description}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openModal(booking)}
                  className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FileTextIcon className="mr-2 h-4 w-4" /> View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-red-400 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center">
                <ClockIcon className="mr-3 h-6 w-6" /> Booking Details
              </h3>
              <button 
                onClick={closeModal} 
                className="text-white hover:bg-blue-600 rounded-full p-1 transition-colors"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <TagIcon className="h-5 w-5 text-red-400" />
                <p className="text-lg font-semibold text-gray-800">{selectedBooking.topic}</p>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-green-500" />
                <p className="text-gray-700">
                  {selectedBooking.selectedSlot.toLocaleString('default', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="flex items-center mb-1">
                    <User className="mr-2 h-4 w-4 text-red-400" />
                    <p className="text-xs text-gray-500">Name</p>
                  </div>
                  <p className="font-medium">{selectedBooking.name}</p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <Mail className="mr-2 h-4 w-4 text-red-400" />
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                  <p className="font-medium">{selectedBooking.email}</p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <Phone className="mr-2 h-4 w-4 text-red-400" />
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                  <p className="font-medium">{selectedBooking.phone}</p>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <MessageCircle className="mr-2 h-4 w-4 text-red-400" />
                    <p className="text-xs text-gray-500">Description</p>
                  </div>
                  <p className="font-medium">{selectedBooking.description}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                >
                  <XIcon className="mr-2 h-4 w-4" /> Close
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                >
                  <CheckIcon className="mr-2 h-4 w-4" /> Approveeee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
