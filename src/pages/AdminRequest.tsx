import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import RequestDetailModal from '../components/RequestDetailModal';
import { Request } from '../types';
import noDataImage from '../assets/noData.svg';
import { CheckCircle } from 'lucide-react';

const AdminRequest = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const rowsPerPage = 15;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, 'requests');
        const q = query(requestsRef); // Fetching all requests
        const querySnapshot = await getDocs(q);
        const fetchedRequests = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          documentId: doc.id,
        })) as Request[];

        // Filter only the requests where paymentStatus is 'Paid'
        const paidRequests = fetchedRequests.filter((request) => request.paymentStatus === true);
        
        // Sort requests by creation date (newest first) for consistent table ordering
        const sortedRequests = paidRequests.sort((a, b) => {
          const dateA = a.createdAt.toDate();
          const dateB = b.createdAt.toDate();
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });
        
        setRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, []);

  const renderTableRows = (data: Request[]) => {
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return paginatedData.map((item) => (
      <tr 
        key={item.documentId} 
        className="hover:bg-gray-50 border-b border-gray-100 text-opacity-50 transition-colors cursor-pointer"
        onClick={() => setSelectedRequest(item)}
      >
        <td className="p-3 align-middle">{item.name}</td>
        <td className="p-3 align-middle">{item.serviceType}</td>
        <td className="p-3 align-middle">{item.address}</td>
        <td className="p-3 align-middle">
          {new Date(item.createdAt.toDate()).toLocaleDateString()}
        </td>
        <td className="p-3 align-middle">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              item.paymentStatus === true
                ? 'bg-green-200 text-green-700'
                : 'bg-yellow-200 text-yellow-700'
            }`}
          >
            {item.paymentStatus ? 'Paid' : 'Pending'}
          </span>
        </td>
        <td className="p-3 align-middle">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                item.status === true
                  ? 'bg-green-200 text-green-700'
                  : 'bg-yellow-200 text-yellow-700'
              }`}
            >
              {item.status ? 'Complete' : 'Under Review'}
            </span>
            {item.resultsUrl && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                <CheckCircle size={12} className="mr-1" />
                Results
              </span>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  const totalPages = Math.ceil(requests.length / rowsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  return (
    <div className="h-full flex flex-col md:justify-between md:items-center">
      <div className="bg-white w-full rounded-lg overflow-hidden shadow-md px-4 pt-4 pb-2">
        <div className="mb-4 flex space-x-4">
          <button className="px-4 py-2 text-sm font-light border-b-2 border-red-500">
            Request History
          </button>
        </div>
        <div className="overflow-y-auto h-[680px]">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <img src={noDataImage} alt="No Data Available" className="w-24 h-24 object-contain" />
              <p className="text-black text-opacity-50 mt-4">No paid service requests available.</p>
            </div>
          ) : (
            <table className="w-full border-collapse rounded-t-lg overflow-hidden font-light">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="p-3 text-left text-sm font-normal text-gray-700 border-b border-gray-200">
                  <th className="p-3 text-left font-normal rounded-tl-lg">Name</th>
                  <th className="p-3 text-left font-normal">Service Type</th>
                  <th className="p-3 text-left font-normal">Address</th>
                  <th className="p-3 text-left font-normal">Date</th>
                  <th className="p-3 text-left font-normal">Payment Status</th>
                  <th className="p-3 text-left font-normal rounded-tr-lg">Request Status</th>
                </tr>
              </thead>
              <tbody className="font-light text-[14px]">
                {renderTableRows(requests)}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center justify-end mt-2 space-x-4 border-t border-gray-200 pt-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="p-2 rounded-md bg-gray-200 disabled:opacity-50"
          >
            &lt;
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-md bg-gray-200 disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Import and use the modal */}
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
};

export default AdminRequest;
