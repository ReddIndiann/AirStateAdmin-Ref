import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
 
  MdChevronLeft, 
  MdChevronRight, 
  MdInsights,
  MdPendingActions,
  MdAccessTime,
  MdCheckCircle,
  MdOutlineInbox
} from "react-icons/md";

import EditRequestModal from '../components/EditRequestModal';
import {  Request, Consultancy } from '../types';

import LoadingSpinner from '../components/LoadingSpinner';
import { fetchRequests, fetchConsultancy } from '../lib/newHomeUtils';
import RequestDetailModal from '../components/RequestDetailModal';

export default function Home() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [consultancy, setConsultancy] = useState<Consultancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

 
  const rowsPerPage = 4;

  
  const getTotalPending = () => {
    return requests.filter(req => req.paymentStatus === false).length;
  };

  const getTotalCompleted = () => {
    return requests.filter(req => req.status === true).length;
  };

  const getTotalInReview = () => {
    return requests.filter(req => req.isDocumentValid === false).length;
  };
  
  const getTotalRequests = () => {
    return requests.length;
  };
  const getTotalConsultancy = () => {
    return consultancy.length;
  };

  const getAwaitingAdminResponse = () => {
    return consultancy.filter(consult => consult.status === 'Awaiting Admin Response').length;
  };

  const getPendingPayment = () => {
    return consultancy.filter(consult => consult.status === 'Pending Payment').length;
  };

  const getBookingApproved = () => {
    return consultancy.filter(consult => consult.status === 'Booking Approved').length;
  };

  // Fetch requests from Firebase
  useEffect(() => {
    const loadRequestsData = async () => {
      try {
        const fetchedRequests = await fetchRequests();
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadConsultancyData = async () => {
      try {
        const fetchedConsultancy = await fetchConsultancy();
        setConsultancy(fetchedConsultancy);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRequestsData();
    loadConsultancyData();
  }, []);

  // Pagination handlers
  const paginatedRequests = requests.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  const totalPages = Math.ceil(requests.length / rowsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const renderRequestsTable = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-60">
          <LoadingSpinner 
            borderColor="#AE1729"
            width="50px"
            height="50px"
          />
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="bg-gray-100 rounded-full p-6 mb-4">
            <MdOutlineInbox className="text-gray-400" size={48} />
          </div>
          <p className="text-gray-500 font-light">No service requests available.</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 first:rounded-tl-lg">Service Type</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Wallet Number</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Payment Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 last:rounded-tr-lg">Request Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((request) => (
                <tr
                  key={request.documentId}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="py-3 px-4 text-sm font-light text-gray-800 align-middle">
                    {request.serviceType}
                  </td>
                  <td className="py-3 px-4 text-sm font-light text-gray-600 align-middle">
                    {new Date(request.createdAt.toDate()).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm font-light text-gray-600 align-middle">
                    {request.paymentInfo?.walletnumber || '-'}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        request.paymentStatus
                          ? 'bg-green-200 text-green-700'
                          : 'bg-yellow-200 text-yellow-700'
                      }`}
                    >
                      {request.paymentStatus ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          !request.isDocumentValid
                            ? 'bg-orange-200 text-orange-700'
                            : request.status
                            ? 'bg-green-200 text-green-700'
                            : 'bg-[#F5EBF1] text-[#AE1729]'
                        }`}
                      >
                        {!request.isDocumentValid 
                          ? 'Action Needed' 
                          : request.status 
                          ? 'Review Complete' 
                          : 'Under Review'}
                      </span>
                      {request.resultsUrl && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          <MdCheckCircle size={12} className="mr-1" />
                          Results
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-gray-100 mt-2 py-3 px-4">
          <div className="text-sm text-gray-600">
            {requests.length > 0 ? 
              `${Math.min(requests.length, currentPage * rowsPerPage + 1)}-${Math.min(requests.length, (currentPage + 1) * rowsPerPage)} of ${requests.length}` : 
              '0 entries'}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 0}
              className="p-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 disabled:text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <MdChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600 px-2">
              {totalPages > 0 ? `${currentPage + 1}/${totalPages}` : '0/0'}
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages - 1 || totalPages === 0}
              className="p-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 disabled:text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <MdChevronRight size={18} />
            </button>
          </div>
        </div>
      </>
    );
  };

  // Stats card data
  const statsCards = [
    {
      title: "Submitted Applications",
      value: getTotalRequests(),
      description: "Total Requests",
      icon: <MdInsights size={20} />,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      onClick: () => navigate('/request?tab=allRequests')
    },
    {
      title: "Unpaid Bills",
      value: getTotalPending(),
      description: "Payment Pending",
      icon: <MdPendingActions size={20} />,
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
      onClick: () => navigate('/request?tab=unpaidRequests')
    },
    {
      title: "Queried Applications",
      value: getTotalInReview(),
      description: "Images Not Clear",
      icon: <MdAccessTime size={20} />,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      onClick: () => navigate('/request?tab=queriedRequests')
    },
    {
      title: "Paid Bills",
      value: getTotalCompleted(),
      description: "Payment Completed",
      icon: <MdCheckCircle size={20} />,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      onClick: () => navigate('/request?tab=paidRequests')
    },
    {
      title: "Total Consultancy",
      value: getTotalConsultancy(),
      description: "Finished requests",
      icon: <MdCheckCircle size={20} />,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      onClick: () => navigate('/consultancy')
    },
    {
      title: "Awaiting Admin",
      value: getAwaitingAdminResponse(),
      description: "Consultancy requests",
      icon: <MdAccessTime size={20} />,
      bgColor: "bg-[#F5EBF1]",
      textColor: "text-[#AE1729]",
      onClick: () => navigate('/consultancy')
    },
    {
      title: "Pending Payment",
      value: getPendingPayment(),
      description: "Consultancy requests",
      icon: <MdPendingActions size={20} />,
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
      onClick: () => navigate('/consultancy')
    },
    {
      title: "Booking Approved",
      value: getBookingApproved(),
      description: "Consultancy requests",
      icon: <MdCheckCircle size={20} />,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      onClick: () => navigate('/consultancy')
    }
  ];

  return (
    <div className="min-h-full bg-gray-100">
      {/* <Helmet>
        <title>Dashboard - AirState Real Estate Solutions</title>
        <meta name="description" content="Access your dashboard to view service requests, track payments, and manage your real estate solutions." />
        <link rel="canonical" href="/home" />
      </Helmet> */}
      <div>
        <div className="w-full mx-auto">
          {/* Responsive Stats Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {statsCards.map((card, index) => (
              <div 
                key={index} 
                className="bg-white p-3 sm:p-4 rounded-lg shadow-sm flex items-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={card.onClick}
              >
                <div className={`${card.bgColor} p-2 sm:p-3 rounded-full flex items-center justify-center`}>
                  <div className={`${card.textColor}`}>
                    {card.icon}
                  </div>
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-gray-500 text-xs sm:text-sm truncate">{card.title}</p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">{card.value}</h3>
                  <p className="text-xs text-gray-500 truncate">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:w-full">
            {/* Services Section - 3/4 width on large screens */}
            <div className="lg:col-span-3 space-y-3">
              {/* Services Cards */}
         
              
              {/* Service Requests Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden flex-grow">
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100">
                  <h2 className="text-md font-light text-gray-800 flex items-center">
                    <span className="w-1 h-5 bg-[#AE1729] rounded-full mr-2"></span>
                    Service Requests
                  </h2>
                </div>
                <div className="p-4">
                  {renderRequestsTable()}
                </div>
              </div>
            </div>
            
            {/* Sidebar - 1/4 width on large screens */}
            <div className="lg:col-span-1 flex flex-col h-full gap-3">
        
            </div>
          </div>
        </div>
      </div>
      
      {isEditModalOpen && selectedRequest && (
        <EditRequestModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          request={selectedRequest}
          onUpdateRequest={(updatedRequest) => {
            setRequests((prevRequests) =>
              prevRequests.map((req) =>
                req.documentId === updatedRequest.documentId ? updatedRequest : req
              ) as Request[]
            );
          }}
        />
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}