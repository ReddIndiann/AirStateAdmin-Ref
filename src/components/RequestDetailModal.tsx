import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Phone, 
  MapPin, 
  User, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Info,
  Wallet,
  MessageSquare,
  Mail
} from 'lucide-react';
import { db, storage } from '../firebase/config';  // Ensure to import your Firebase config
import { doc, updateDoc, getDoc } from 'firebase/firestore';  // Import Firestore functions
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Import Firebase Storage functions
import { ClientMessaging } from '../pages';
import axios from 'axios';
import { generateQueryMessage, generateCompletionMessage } from '../lib/deepLinkUtil';

import { Request } from '../types';

interface RequestDetailModalProps {
  request: Request | null;
  onClose: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose }) => {
  const [isImageNotClear, setIsNotImageClear] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [walletNumber, setWalletNumber] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'messaging'>('details');
  const [sendSMS, setSendSMS] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Set initial state of the checkbox based on isDocumentValid
  useEffect(() => {
    if (request?.isDocumentValid === false) {
      setIsNotImageClear(true); // If document is pending, check the box
    } else {
      setIsNotImageClear(false); // If document is approved, uncheck the box
    }

    // Fetch wallet number if not already available in the request
    const fetchWalletNumber = async () => {
      if (request && !request.paymentInfo?.walletnumber) {
        try {
          // Try to get payment information from payments collection
          const paymentsRef = doc(db, 'payments', request.documentId);
          const paymentDoc = await getDoc(paymentsRef);
          
          if (paymentDoc.exists()) {
            const paymentData = paymentDoc.data();
            if (paymentData.walletnumber) {
              setWalletNumber(paymentData.walletnumber);
            }
          }
        } catch (error) {
          console.error('Error fetching payment info:', error);
        }
      } else if (request?.paymentInfo?.walletnumber) {
        setWalletNumber(request.paymentInfo.walletnumber);
      }
    };

    // Fetch user email
    const fetchUserEmail = async () => {
      if (request?.userId) {
        try {
          const userRef = doc(db, 'users', request.userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.email) {
              setUserEmail(userData.email);
            }
          }
        } catch (error) {
          console.error('Error fetching user email:', error);
        }
      }
    };

    fetchWalletNumber();
    fetchUserEmail();
  }, [request]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const sendNotification = async (
    clientName: string,
    clientNumber: string,
    clientEmail: string,
    message: string,
    sendSMS: boolean,
    sendEmail: boolean
  ) => {
    try {
      const notificationData = {
        clientName,
        clientNumber,
        clientEmail,
        message,
        sendSMS,
        sendEmail
      };

      const response = await axios.post(
        'https://us-central1-airstatefinder.cloudfunctions.net/notifyUser',
        notificationData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to send notification');
      }

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const handleSubmit = async () => {
    try {
      // Confirmation modal logic
      if (isImageNotClear) {
        setConfirmationMessage('By clicking OK, you are notifying the user to resend a clearer version of the image.');
        setIsConfirmationOpen(true); // Open confirmation modal for image clarity
      } else if (!isImageNotClear && file) {
        setConfirmationMessage('By pressing OK, you will send the results to the user.');
        setIsConfirmationOpen(true); // Open confirmation modal to send results
      }
    } catch (error) {
      console.error('Error submitting request details:', error);
      // Add error handling, maybe notify the user of the failure
    }
  };

  const handleConfirmation = async (confirm: boolean) => {
    if (!confirm) {
      // If user cancels, just close the confirmation modal
      setIsConfirmationOpen(false);
      setErrorMessage('');
      return;
    }

    if (request) {
      try {
        setErrorMessage('');
        const requestDocRef = doc(db, 'requests', request.documentId);

        // If the checkbox is checked, update isDocumentValid to 'pending'
        if (isImageNotClear) {
          await updateDoc(requestDocRef, {
            isDocumentValid: false,
          });

          // Generate messages for SMS and Email separately if both are selected
          // SMS needs proper URL formatting to be clickable
          const smsMessage = sendSMS ? generateQueryMessage(
            request.documentId,
            "Your document image is not clear. Please resend a clearer version.",
            true // isSMS = true
          ) : '';
          
          const emailMessage = sendEmail ? generateQueryMessage(
            request.documentId,
            "Your document image is not clear. Please resend a clearer version.",
            false // isSMS = false
          ) : '';
          
          // Use the appropriate message based on what's being sent
          // If both are selected, use SMS format (shorter, more SMS-friendly)
          const messageToSend = sendSMS ? smsMessage : emailMessage;
          
          // Validate that at least one notification method is selected
          if (!sendSMS && !sendEmail) {
            setErrorMessage('Please select at least one notification method (SMS or Email)');
            return;
          }

          // Validate email if email is selected
          if (sendEmail && !userEmail) {
            setErrorMessage('Email is required when sending email notification');
            return;
          }

          // Validate phone number if SMS is selected
          if (sendSMS && !request.phoneNumber) {
            setErrorMessage('Phone number is required when sending SMS notification');
            return;
          }
          
          await sendNotification(
            request.name,
            request.phoneNumber || '',
            userEmail || '',
            messageToSend,
            sendSMS,
            sendEmail
          );
        } else if (!isImageNotClear && file) {
          // Upload file to Firebase Storage
          const userId = request.userId;
          const storageRef = ref(storage, `uploads/${userId}/${file.name}`);
          await uploadBytes(storageRef, file);

          // Get the download URL for the uploaded file
          const fileURL = await getDownloadURL(storageRef);

          // Update Firestore document with new document URL and status
          await updateDoc(requestDocRef, {
            resultsUrl: fileURL,   // Set the new document URL
            status: true,   // Set the status to 'Approved'
            isDocumentValid: true
          });

          // Generate messages for SMS and Email separately if both are selected
          // SMS needs proper URL formatting to be clickable
          const smsMessage = sendSMS ? generateCompletionMessage(
            request.documentId,
            "Your results are ready! Please check your request details.",
            true // isSMS = true
          ) : '';
          
          const emailMessage = sendEmail ? generateCompletionMessage(
            request.documentId,
            "Your results are ready! Please check your request details.",
            false // isSMS = false
          ) : '';
          
          // Use the appropriate message based on what's being sent
          // If both are selected, use SMS format (shorter, more SMS-friendly)
          const messageToSend = sendSMS ? smsMessage : emailMessage;
          
          // Validate that at least one notification method is selected
          if (!sendSMS && !sendEmail) {
            setErrorMessage('Please select at least one notification method (SMS or Email)');
            return;
          }

          // Validate email if email is selected
          if (sendEmail && !userEmail) {
            setErrorMessage('Email is required when sending email notification');
            return;
          }

          // Validate phone number if SMS is selected
          if (sendSMS && !request.phoneNumber) {
            setErrorMessage('Phone number is required when sending SMS notification');
            return;
          }
          
          await sendNotification(
            request.name,
            request.phoneNumber || '',
            userEmail || '',
            messageToSend,
            sendSMS,
            sendEmail
          );
        }

        // Close the modal after confirmation
        setIsConfirmationOpen(false);
        setErrorMessage('');
        onClose();
      } catch (error) {
        console.error('Error in handleConfirmation:', error);
        if (axios.isAxiosError(error)) {
          setErrorMessage(error.response?.data?.error || error.message || 'Failed to send notification');
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('An unexpected error occurred');
        }
      }
    }
  };

  if (!request) return null;


  const renderDetailsTab = () => (
    <div className="p-4 space-y-3">
      {/* Basic Request Information */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <User className="text-red-400" size={16} />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Name</p>
            <p className="text-gray-600 text-sm">{request.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="text-red-400" size={16} />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Phone</p>
            <p className="text-gray-600 text-sm">{request.phoneNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="text-red-400" size={16} />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Address</p>
            <p className="text-gray-600 text-sm">{request.address}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="text-red-400" size={16} />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Service Type</p>
            <p className="text-gray-600 text-sm">{request.serviceType}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Wallet className="text-red-400" size={16} />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Wallet Number</p>
            <p className="text-gray-600 text-sm">{walletNumber || 'Not available'}</p>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-2">Request Status</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              request.paymentStatus ? 'bg-green-500' : 'bg-yellow-500'
            }`}></span>
            <span className="text-xs text-gray-600">
              {request.paymentStatus ? 'Paid' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              request.status ? 'bg-green-500' : 'bg-yellow-500'
            }`}></span>
            <span className="text-xs text-gray-600">
              {request.status ? 'Complete' : 'Review'}
            </span>
          </div>
          {request.resultsUrl && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs text-green-600 font-medium">
                Results ✓
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Document and Results Links */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="text-red-400" size={16} />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Document</p>
            <a
              href={request.documentURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:underline text-sm"
            >
              View Document
            </a>
          </div>
        </div>

        {request.resultsUrl && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-500" size={16} />
            <div>
              <p className="font-semibold text-gray-700 text-sm">Results</p>
              <a
                href={request.resultsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline text-sm"
              >
                View Results
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Compact Results Status */}
      {request.resultsUrl ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-500" size={16} />
            <span className="text-sm text-green-700 font-medium">Results are ready and available for viewing</span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <Info className="text-blue-500" size={16} />
            <span className="text-sm text-blue-700">Results will appear here once uploaded</span>
          </div>
        </div>
      )}

      {/* Image Clarity Checkbox */}
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="isImageClear"
          checked={isImageNotClear}
          onChange={(e) => setIsNotImageClear(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="isImageClear" className="text-sm text-gray-700">
          Image is not clear
        </label>
      </div>

      {/* Notification Method Selection */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Notification Method</p>
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
              className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
              disabled={!request.phoneNumber}
            />
            <MessageSquare className="text-gray-500" size={16} />
            <span className="text-sm text-gray-700">
              Send SMS {!request.phoneNumber && '(Phone number not available)'}
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
              disabled={!userEmail}
            />
            <Mail className="text-gray-500" size={16} />
            <span className="text-sm text-gray-700">
              Send Email {!userEmail && '(Email not available)'}
            </span>
          </label>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-gray-100 rounded-lg p-3 mb-4">
        <label htmlFor="uploadResults" className="flex items-center space-x-2 cursor-pointer">
          <Upload className="text-red-400" size={16} />
          <span className="text-sm text-gray-600">Upload Results</span>
        </label>
        <input
          type="file"
          id="uploadResults"
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isImageNotClear}
        />
        {file && (
          <div className="mt-2 text-sm text-gray-600 flex items-center space-x-2">
            <XCircle className="text-gray-400" size={14} />
            <span className="text-xs">{file.name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition flex items-center space-x-2 text-sm"
        >
          <CheckCircle size={16} />
          <span>Submit</span>
        </button>
      </div>
    </div>
  );

  const renderMessagingTab = () => (
    <div className="px-4 pb-4">
      <ClientMessaging 
        requestInfo={{
          name: request.name,
          phoneNumber: request.phoneNumber,
          userId: request.userId,
          paymentInfo: {
            walletnumber: walletNumber
          }
        }} 
      />
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden">
        <div className="bg-red-400 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText size={24} />
            <div>
              <h2 className="text-xl font-bold">Request Details</h2>
              {request.resultsUrl && (
                <div className="flex items-center space-x-1 mt-1">
                  <CheckCircle size={14} className="text-green-300" />
                  <span className="text-xs text-green-300">Results Available</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1 rounded-md transition text-sm ${
                activeTab === 'details' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-red-500'
              }`}
            >
              <span className="flex items-center gap-1">
                <FileText size={14} />
                Details
              </span>
            </button>
            <button
              onClick={() => setActiveTab('messaging')}
              className={`px-3 py-1 rounded-md transition text-sm ${
                activeTab === 'messaging' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-red-500'
              }`}
            >
              <span className="flex items-center gap-1">
                <MessageSquare size={14} />
                Message Client
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'details' ? renderDetailsTab() : renderMessagingTab()}
      </div>

      {/* Confirmation Modal */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <p className="text-lg font-semibold text-gray-700">{confirmationMessage}</p>
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => handleConfirmation(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailModal;