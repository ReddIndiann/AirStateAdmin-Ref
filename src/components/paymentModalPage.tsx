import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, Smartphone, Wallet, FileText, X, CheckCircle, Loader } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentDetails: PaymentDetails) => Promise<void>;
  initialAmount: number;
  name: string;
  serviceType: string;
  recipientNumber: string;
}

interface PaymentDetails {
  amount: number;
  paymentoption: string;
  walletnumber: string;
  description: string;
  service: string;
  recipientNumber: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialAmount,
  serviceType,
  recipientNumber
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: initialAmount,
    paymentoption: 'MTN',
    walletnumber: '',
    description: '',
    service: serviceType,
    recipientNumber: recipientNumber
  });

  const [loading, setLoading] = useState(false); // Added loading state

  useEffect(() => {
    setPaymentDetails((prev) => ({
      ...prev,
      amount: initialAmount,
    }));
  }, [initialAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentDetails.walletnumber) {
      toast.error('Please enter a wallet number', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
      return;
    }

    setLoading(true);

    try {
      await onSubmit(paymentDetails);
      toast.success('Payment submitted successfully!', {
        icon: <CheckCircle color="#00ff00" />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error('Payment failed. Please try again.', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-md shadow-2xl w-full max-w-md border-2 border-gray-100 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex items-center mb-6">
          <CreditCard size={32} className="mr-3 text-[#AE1729]" />
          <h2 className="text-xl font-normal text-gray-800">Payment Details</h2>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <label className=" mb-1 flex items-center font-light">
              <Wallet size={20} className="mr-2 text-[#AE1729] font-light" />
              Amount
            </label>
            <input
              type="number"
              value={paymentDetails.amount}
              onChange={(e) => setPaymentDetails({ 
                ...paymentDetails, 
                amount: parseFloat(e.target.value) 
              })}
              className="p-3 border border-gray-300 font-light w-full focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
              disabled
            />
          </div>

          <div>
            <label className="mb-1 flex items-center font-light">
              <Smartphone size={20} className="mr-2 text-[#AE1729]" />
              Payment Option
            </label>
            <select
              value={paymentDetails.paymentoption}
              onChange={(e) => setPaymentDetails({ 
                ...paymentDetails, 
                paymentoption: e.target.value 
              })}
              className="p-3 border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
              disabled={loading}
            >
              <option value="MTN">MTN</option>
              <option value="AIRTEL">AIRTEL</option>
              <option value="VODAFONE">VODAFONE</option>
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center font-light">
              <Wallet size={20} className="mr-2 text-[#AE1729]" />
              Wallet Number
            </label>
            <input
              type="text"
              value={paymentDetails.walletnumber}
              onChange={(e) => setPaymentDetails({ 
                ...paymentDetails, 
                walletnumber: e.target.value 
              })}
              className="p-3 border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#AE1729] font-light"
              placeholder="Enter your wallet number"
              required
              disabled={loading} 
            />
          </div>

          <div>
            <label className="mb-1 flex items-center font-light">
              <FileText size={20} className="mr-2 text-[#AE1729]" />
              Description
            </label>
            <input
              type="text"
              value={paymentDetails.description}
              onChange={(e) => setPaymentDetails({ 
                ...paymentDetails, 
                description: e.target.value 
              })}
              className="p-3 border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#AE1729] font-light"
              placeholder="Enter description"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center"
              disabled={loading} 
            >
              <X size={20} className="mr-2" /> Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#AE1729] text-white rounded-md hover:bg-[#8F1222] transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <Loader size={20} className="animate-spin mr-2" />
              ) : (
                <CheckCircle size={20} className="mr-2" />
              )}
              {loading ? 'Processing...' : 'Pay'}
            </button>
          </div>
        </form>
      </div>
    </div>

  );
};
