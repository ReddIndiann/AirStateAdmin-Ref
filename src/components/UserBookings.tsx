import React, { useState, useEffect } from 'react';
import {  XIcon, 
  CheckIcon, 
  ClockIcon, 
  FileTextIcon,
  TagIcon, BookOpen, User, Mail, Phone, MessageCircle, CalendarIcon, Clipboard  } from 'lucide-react';

import { PaymentModal } from './paymentModalPage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import PaymentConfirmationModal from '../components/PaymentConfirmationModal'; 
import { toast } from 'react-hot-toast';
import { UserBooking } from '../types';
import axios from 'axios';



// Type definitions

interface UserBookingsProps {
  userBookings: UserBooking[];
  onApproveBooking?: (bookingId: string) => void;
}


const CustomSpinner: React.FC = () => (
  <div className="flex justify-center items-center space-x-2">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-solid"></div>
  </div>
);

export const UserBookings: React.FC<UserBookingsProps> = ({ userBookings,onApproveBooking }) => {
  // const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [consultancyAmount, setConsultancyAmount] = useState<number>(0);
    const [isModalDetailsOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    paymentDetails: PaymentDetails | null;
  }>({
    isOpen: false,
    paymentDetails: null, // Initially null
  });

  const openModal = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedBooking(null);
  };


    const handleApprove = async () => {
      if (selectedBooking) {
        try {
          // Get the reference to the document we want to update
          const bookingRef = doc(db, 'consultancy_bookings', selectedBooking.id);
  
          // Update the booking status to 'Approved'
          await updateDoc(bookingRef, {
            status: 'Pending Payment',
          });
  
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
  interface PaymentDetails {
    reason: string;
    status: boolean; // or a more specific type if you know the possible values
    serviceType: string;
    transactionId: string;
    documentId:string;
    paymentId:string;
    verifyType:string;
    userId:string;
  }
  const handleCloseModal = (): void => {
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = async (paymentDetails: {
    amount: number;
    paymentoption: string;
    walletnumber: string;
    description: string;
  }) => {
    if (!selectedBooking) {
      toast.error('Consultancy details are missing');
      return;
    }

    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      const payload = {
        amount: Number(consultancyAmount || 0),
        appid: "1685",
        clientreference: `REF-${Date.now()}`,
        clienttransid: `TRANS-${Date.now()}`,
        description: paymentDetails.description || "Service Payment",
        nickname: selectedBooking.name,
        paymentoption: paymentDetails.paymentoption,
        walletnumber: paymentDetails.walletnumber,
        documentId: selectedBooking.id,
        userId: userId,
        recipientNumber: selectedBooking.phone,
        service: "",
        paymentFor: "consultancy",
      };

      const response = await axios.post(
        'https://processpayment-qrtfyfyudq-uc.a.run.app',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const { data } = response.data;
      setConfirmationModal({
        isOpen: true,
        paymentDetails: {
          reason: data.reason,
          status: data.status,
          serviceType: data.serviceType,
          documentId: selectedBooking.id,
          transactionId: data.transactionid,
          verifyType: data.paymentFor,
          paymentId: data.id,
          userId: data.userId,
        }
      });

      toast.success('Payment submitted successfully!');
      setIsModalOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.details?.reason 
          || error.response?.data?.message 
          || error.message 
          || 'Payment processing failed';
        
        console.error('Payment Error Details:', {
          message: errorMessage,
          status: error.response?.status,
          data: error.response?.data
        });

        toast.error(errorMessage);
      } else {
        console.error('Unexpected Payment Error:', error);
        toast.error('An unexpected error occurred during payment');
      }
    }
  };

  useEffect(() => {
    const fetchConsultancyAmount = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const adminConfigRef = collection(db, 'AdminConfig');
        const q = query(adminConfigRef, limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const adminConfig = querySnapshot.docs[0].data();
          setConsultancyAmount(adminConfig.ConsultancyAmount || 0);
        } else {
          setError("Could not fetch consultancy amount");
        }
      } catch (err) {
        setError("Error fetching consultancy amount");
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultancyAmount();
  }, []);

  if (isLoading) {
    return <CustomSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="py-4">
    {userBookings.length === 0 ? (
      <div className="text-center py-12 text-black/70">
        <BookOpen className="mx-auto h-16 w-16 text-[#AE1729] mb-4" />
        <p className="text-lg">No consultancy bookings yet</p>
        <p className="text-sm">Book your first consultation to get started!</p>
      </div>
    ) : (
      <div className="flex overflow-x-auto gap-4 py-4 snap-x scrollbar-hide">
        {userBookings.map((booking) => (
          <div 
            key={booking.id} 
            className="w-72 flex-shrink-0 snap-center bg-white border border-black/10 rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-black line-clamp-1">
                  {booking.topic}
                </h3>
                <span 
                  className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                    booking.status === "Awaiting Admin Response" 
                      ? 'bg-red-100 text-red-800' 
                      : booking.status === "Pending Payment"
                      ? 'bg-yellow-100 text-yellow-800'
                      : booking.status === "Booking Approved"
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {String(booking.status)}
                </span>
              </div>

              <p className="flex items-center text-sm text-black/70 mb-4">
                <CalendarIcon className="mr-2 h-4 w-4 text-[#AE1729]" />
                {new Date(booking.selectedSlot).toLocaleString('default', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <User className="mr-2 h-4 w-4 text-[#AE1729]" />
                  <span className="text-black mr-2">Name:</span>
                  <span className="font-light text-gray-400 truncate">{booking.name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-[#AE1729]" />
                  <span className="text-black mr-2">Phone:</span>
                  <span className="font-light text-gray-400 truncate">{booking.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-[#AE1729]" />
                  <span className="text-black mr-2">Email:</span>
                  <span className="font-light text-gray-400 truncate">{booking.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MessageCircle className="mr-2 h-4 w-4 text-[#AE1729]" />
                  <span className="text-black mr-2">Type:</span>
                  <span className="font-light text-gray-400 truncate">{booking.consultationType}</span>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <div className="flex items-center text-sm text-black">
                  <Clipboard className="mr-2 h-4 w-4 text-[#AE1729]" />
                  Description
                </div>
                <p className="text-sm text-gray-400 font-light line-clamp-2">{booking.description}</p>
              </div>

              <button
                              onClick={() => openModal(booking)}
                              className="mt-4 flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                              <FileTextIcon className="mr-2 h-4 w-4" /> View Details
                            </button>
            </div>
             
          </div>
        ))}
      </div>
    )}
  </div>
  {isModalOpen && selectedBooking && (
        <PaymentModal
          name=""
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handlePaymentSubmit}
          initialAmount={consultancyAmount}
          serviceType={selectedBooking.topic}
          recipientNumber={selectedBooking.phone}
        />
      )}
  {isModalDetailsOpen && selectedBooking && (
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
                  <CheckIcon className="mr-2 h-4 w-4" /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <PaymentConfirmationModal 
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        paymentDetails={confirmationModal.paymentDetails}
      />
    </div>
  );
};

export default UserBookings;
