import { useState, useEffect } from 'react';
import axios from 'axios';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Payment } from '../types';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import noDataImage from '../assets/noData.svg';
const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-transparent rounded-lg p-8 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent" />
        {/* <p className="mt-4 text-gray-700">Verifying payment...</p> */}
      </div>
    </div>
  );
};
const TransactionHistoryPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 12;

  useEffect(() => {
    const fetchPayments = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const paymentsRef = collection(db, 'payments');
        const q = query(paymentsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedPayments = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          paymentId: doc.id,
        })) as Payment[];

        // Sort payments by creation date (newest first) for consistent table ordering
        const sortedPayments = fetchedPayments.sort((a, b) => {
          const dateA = a.createdAt.toDate();
          const dateB = b.createdAt.toDate();
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });

        setPayments(sortedPayments);
      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };

    fetchPayments();
  }, []);

  const renderTableRows = () => {
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = payments.slice(startIndex, endIndex);

    return paginatedData.map((payment) => (
      <tr key={payment.paymentId} className="hover:bg-gray-50 border-b border-gray-100 text-opacity-50 text-sm transition-colors">
        <td className="p-3 align-middle">{payment.walletnumber}</td>
        <td className="p-3 align-middle">{new Date(payment.createdAt.toDate()).toLocaleDateString()}</td>
        <td className="p-3 align-middle">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              payment.status ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'
            }`}
          >
            {payment.status ? 'Completed' : 'Pending'}
          </span>
        </td>
        <td className="p-3 align-middle">
          {!payment.status && (
            <button
              onClick={() => handleVerifyPayment(payment)}
              className="text-red-800 bg-red-200 rounded-full px-2 py-1 font-light transition-colors text-[10px]"
            >
              Verify Payment
            </button>
          )}
        </td>
      </tr>
    ));
  };

  const handleVerifyPayment = async (payment: Payment) => {
    try {
      setLoading(true);
      
      const endpoint = 'https://checktransactionandupdate-qrtfyfyudq-uc.a.run.app';
  
      const response = await axios.post(endpoint, {
        paymentId: payment.paymentId,
        transactionid: String(payment.transactionid), // Ensure it's a string
      });
  
      if (response.status === 200) {
        console.log('Payment verified successfully:', response.data);
        // Handle success (e.g., show a success message, update UI)
      } else {
        console.error('Unexpected response:', response);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error:', (error as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };
  

  const totalPages = Math.ceil(payments.length / rowsPerPage);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));

  return (
    <div className="overflow-y-auto">
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <img src={noDataImage} alt="No Data Available" className="w-24 h-24 object-contain" />
          <p className="text-black text-opacity-50 mt-4">No transaction history available.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full border-collapse rounded-t-lg font-light">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="p-3 text-left text-sm font-normal text-gray-700 border-b border-gray-200">
                <th className="p-3 text-left font-normal rounded-tl-lg">Wallet Number</th>
                <th className="p-3 text-left font-normal">Date</th>
                <th className="p-3 text-left font-normal">Payment Status</th>
                <th className="p-3 text-left font-normal rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>{renderTableRows()}</tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-4 mt-2">
          <button onClick={handlePrevPage} disabled={currentPage === 0} className="p-2 rounded-md">
            <MdChevronLeft size={20} />
          </button>
          <p className="text-gray-600 text-sm font-light">
            Page {currentPage + 1} of {totalPages}
          </p>
          <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="p-2 rounded-md">
            <MdChevronRight size={20} />
          </button>
        </div>
      )}

      {loading && <LoadingOverlay />}
    </div>
  );
};

export default TransactionHistoryPage;
