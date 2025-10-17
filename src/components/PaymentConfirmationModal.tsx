import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Loader } from 'lucide-react';
import axios from 'axios';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;

  paymentDetails: {
    reason: string;
    status: boolean;
    serviceType: string;
    transactionId: string;
    documentId: string;
    paymentId: string;
    recipientNumber?: string;
    clientName?: string;
    verifyType?: string;
    userId?: string;
  } | null;

  onVerificationComplete?: (success: boolean, message: string) => void;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  paymentDetails,
  onVerificationComplete,
}) => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  if (!isOpen || !paymentDetails) return null;

  const isSuccessful = paymentDetails.status === true;

  async function verifyPayment() {
    if (!paymentDetails) return;

    setIsVerifying(true);
    setVerificationError(null);
    const userRef = doc(db, 'users', paymentDetails.userId as string);

    try {
      const userDoc = await getDoc(userRef);

      // Check if the user document exists
      if (!userDoc.exists()) {
        console.log('User not found.');
        return;
      }

      const userEmail = userDoc.data()?.email;
      console.log(userEmail);

      if (!userEmail) {
        console.log('User email not found.');
        return;
      }

      const response = await axios.post(
        'https://checktransactionandupdate-qrtfyfyudq-uc.a.run.app',
        {
          documentId: paymentDetails.documentId,
          transactionid: paymentDetails.transactionId.toString(),
          paymentId: paymentDetails.paymentId,
          clientsnumber: paymentDetails.recipientNumber || '',
          clientsname: paymentDetails.clientName || '',
          paymentFor: paymentDetails.verifyType || '',
          clientEmail: userEmail,
        }
      );

      if (response.data.status === 'success') {
        // Update Firestore document
        const paymentDocRef = doc(db, 'payments', paymentDetails.documentId);
        await updateDoc(paymentDocRef, {
          status: true,
          statusdate: new Date().toISOString(),
        });

        onVerificationComplete?.(true, response.data.message);
        navigate('/history');
      } else {
        setVerificationError(response.data.message || 'Verification failed');
        onVerificationComplete?.(false, response.data.message);
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : 'An unexpected error occurred';

      console.error('Payment verification error:', errorMessage);
      setVerificationError(`Error during payment verification: ${errorMessage}`);
      onVerificationComplete?.(false, errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 flex items-center ${isSuccessful ? 'bg-[#AE1729]' : 'bg-[#AE1729]/20'}`}>
        {isSuccessful ? (
          <CheckCircle className="text-white w-10 h-10" />
        ) : (
          <XCircle className="text-white w-10 h-10" />
        )}
        <h2 className={`text-xl font-normal ml-3 ${isSuccessful ? 'text-white' : 'text-[#AE1729]'}`}>
          Payment {paymentDetails.status ? 'Successful' : 'Pending'}
        </h2>
      </div>
  
      {/* Details */}
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <FileText className="text-[#AE1729] w-6 h-6" />
          <div>
            <p className="text-gray-600">Service Type</p>
            <p className="font-semibold">{paymentDetails.serviceType}</p>
          </div>
        </div>
  
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-[#AE1729]/20 rounded-full flex items-center justify-center">
            <span className="text-[#AE1729] text-sm">#</span>
          </div>
          <div>
            <p className="text-gray-600">Transaction ID</p>
            <p className="font-normal">{paymentDetails.transactionId}</p>
          </div>
        </div>
  
        <div className="flex items-center space-x-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isSuccessful ? 'bg-[#AE1729]/30' : 'bg-[#AE1729]/10'
            }`}
          >
            {isSuccessful ? '✓' : '✗'}
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className={`font-semibold ${isSuccessful ? 'text-[#AE1729]' : 'text-gray-700'}`}>
              {isSuccessful ? 'Verified' : 'Pending Verification'}
            </p>
          </div>
        </div>
  
        {paymentDetails.reason && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <p className="text-gray-600 text-sm mb-1">Additional Information</p>
            <p className="text-gray-800">{paymentDetails.reason}</p>
          </div>
        )}
  
        {verificationError && (
          <div className="bg-[#AE1729]/10 p-3 rounded-md border border-[#AE1729]/20">
            <p className="text-[#AE1729] text-sm">{verificationError}</p>
          </div>
        )}
      </div>
  
      {/* Actions */}
      <div className="p-6 pt-0 flex space-x-4">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={isVerifying}
        >
          Close
        </button>
        {!isSuccessful && (
          <button
          onClick={verifyPayment}
          disabled={isVerifying}
          className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-all duration-200 bg-[#AE1729] text-white 
            hover:bg-[#AE1729]/80 disabled:bg-[#AE1729]/40 focus:outline-none focus:ring-4 focus:ring-[#AE1729]/50 
            active:scale-95 ${isVerifying ? 'cursor-wait' : 'cursor-pointer'}`}
        >
          {isVerifying ? (
            <>
              <Loader size={20} className="animate-spin mr-2" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Payment</span>
          )}
        </button>        
        )}
      </div>
    </div>
  </div>
  
  );
};

export default PaymentConfirmationModal;
