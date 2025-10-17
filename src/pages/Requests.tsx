import { useState, useEffect } from 'react';
// import { updateDoc, doc } from 'firebase/firestore';
// import { db } from '../firebase/config';
import ResponseModal from '../components/ResponseModal';
import RequestDetailModal from '../components/RequestDetailModal';
// import noDataImage from '../assets/noData.svg';
import { Payment, Request } from '../types';

// Imported components and utilities
import PaginatedTable from '../components/ReusableTable';
import LoadingOverlay from '../components/LoadingOverlay';
import { verifyPayment } from '../lib/paymentUtil';
import { fetchPayments, fetchRequests } from '../lib/datafetch';
import { CheckCircle, ArrowUpDown, Calendar, Filter } from 'lucide-react';

const History = () => {
  const [selectedTab, setSelectedTab] = useState<
    'requestHistory' | 
    'transactionHistory' | 
    'completedRequests' | 
    'allRequests' |
    'queriedRequests' |
    'unpaidRequests' |
    'paidRequests'
  >('allRequests');
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [completedRequests, setCompletedRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [queriedRequests, setQueriedRequests] = useState<Request[]>([]);
  const [unpaidRequests, setUnpaidRequests] = useState<Request[]>([]);
  const [paidRequests, setPaidRequests] = useState<Request[]>([]);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // New state for sorting and filtering
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Set rows per page based on selected tab
  const rowsPerPage = 12;

  useEffect(() => {
    // Check for URL parameters to set the initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['requestHistory', 'transactionHistory', 'completedRequests', 'allRequests', 'queriedRequests', 'unpaidRequests', 'paidRequests'].includes(tabParam)) {
      setSelectedTab(tabParam as any);
    }

    const loadData = async () => {
      // Load payments with payment status true
      const fetchedPayments = await fetchPayments(true);
      setPayments(fetchedPayments);
      
      // Load all requests first
      const fetchedAllRequests = await fetchRequests();
      setAllRequests(fetchedAllRequests);
      
      // Filter requests by payment status
      const paidRequests = fetchedAllRequests.filter(req => req.paymentStatus === true);
      const unpaidRequests = fetchedAllRequests.filter(req => req.paymentStatus === false);
      setPaidRequests(paidRequests);
      setUnpaidRequests(unpaidRequests);
      
      // Filter requests by completion status (these are separate from payment status)
      const completedRequests = fetchedAllRequests.filter(req => req.status === true);
      setCompletedRequests(completedRequests);
      
      // For backward compatibility, keep the old "requestHistory" as paid requests
      setRequests(paidRequests);
      
      // Load queried requests (requests with unclear images)
      const queried = fetchedAllRequests.filter(req => req.isDocumentValid === false);
      setQueriedRequests(queried);
    };

    loadData();
  }, []);

  // Function to sort requests by date
  const sortRequests = (requests: Request[]) => {
    return [...requests].sort((a, b) => {
      const dateA = new Date(a.createdAt.toDate());
      const dateB = new Date(b.createdAt.toDate());
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  };

  // Function to filter requests by date range
  const filterRequestsByDate = (requests: Request[]) => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return requests;
    }

    return requests.filter(request => {
      const requestDate = new Date(request.createdAt.toDate());
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate && endDate) {
        return requestDate >= startDate && requestDate <= endDate;
      } else if (startDate) {
        return requestDate >= startDate;
      } else if (endDate) {
        return requestDate <= endDate;
      }
      return true;
    });
  };

  // Function to get processed data for current tab
  const getProcessedData = () => {
    let data: Request[] = [];
    
    switch (selectedTab) {
      case 'allRequests':
        data = allRequests;
        break;
      case 'paidRequests':
        data = paidRequests;
        break;
      case 'unpaidRequests':
        data = unpaidRequests;
        break;
      case 'completedRequests':
        data = completedRequests;
        break;
      case 'queriedRequests':
        data = queriedRequests;
        break;
      case 'requestHistory':
        data = requests;
        break;
      default:
        data = allRequests;
    }

    // Apply date filtering
    const filteredData = filterRequestsByDate(data);
    
    // Apply sorting
    return sortRequests(filteredData);
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSortOrder('desc');
  };

  const handleVerifyPayment = async (payment: Payment) => {
    const success = await verifyPayment(
      payment,
      requests,
      setLoading,
      (message) => {
        setResponseMessage(message);
        setResponseModalOpen(true);
      },
      (errorMessage) => {
        setResponseMessage(errorMessage);
        setResponseModalOpen(true);
      }
    );

    if (success) {
      // Update the local state to reflect the change
      setPayments((prevPayments) =>
        prevPayments.map((p) =>
          p.documentId === payment.documentId ? { ...p, status: true } as unknown as Payment : p
        )
      );
    }
  };

  // Request history table columns
  const requestColumns = [
    { header: 'Service Type', accessor: 'serviceType' as keyof Request, isRounded: 'left' as const },
    { 
      header: 'Date', 
      accessor: (item: Request) => new Date(item.createdAt.toDate()).toLocaleDateString() 
    },
    {
      header: 'Wallet Number',
      accessor: (item: Request) => item.paymentInfo?.walletnumber || '-'
    },
    { 
      header: 'Payment Status', 
      accessor: (item: Request) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.paymentStatus
              ? 'bg-green-200 text-green-700'
              : 'bg-yellow-200 text-yellow-700'
          }`}
        >
          {item.paymentStatus ? 'Completed' : 'Pending'}
        </span>
      )
    },
    { 
      header: 'Request Status', 
      accessor: (item: Request) => (
        <div className="flex items-center space-x-2">
          <span className={item.status ? 'text-green-700' : 'text-[#AE1729]'}>
            {item.status ? 'Review Complete' : 'Under Review'}
          </span>
          {item.resultsUrl && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
              <CheckCircle size={12} className="mr-1" />
              Results
            </span>
          )}
        </div>
      ),
      isRounded: 'right' as const
    }
  ];

  // Transaction history table columns
  const paymentColumns = [
    { header: 'Wallet Number', accessor: 'walletnumber' as keyof Payment, isRounded: 'left' as const },
    { 
      header: 'Date', 
      accessor: (item: Payment) => new Date(item.createdAt.toDate()).toLocaleDateString() 
    },
    { 
      header: 'Payment Status', 
      accessor: (item: Payment) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.status
              ? 'bg-green-200 text-green-700'
              : 'bg-yellow-200 text-yellow-700'
          }`}
        >
          {item.status ? 'Completed' : 'Pending'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (item: Payment) => (
        !item.status && (
          <button
            onClick={() => handleVerifyPayment(item)}
            className="text-red-800 bg-red-200 rounded-full px-2 py-1 font-light transition-colors text-[10px]"
          >
            Verify Payment
          </button>
        )
      ),
      isRounded: 'right' as const
    }
  ];

  return (
    <div className="h-full flex flex-col md:justify-between md:items-center">
      <div className="bg-white w-full min-h-full overflow-hidden shadow-md px-4 pt-4 pb-2 flex flex-col justify-between">
        {/* Tabs */}
        <div className="mb-4 flex space-x-4 overflow-x-auto">
          <button
            onClick={() => {
              setSelectedTab('allRequests');
              setCurrentPage(0); // Reset to first page when switching tabs
            }}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap ${
              selectedTab === 'allRequests' ? 'border-b-2 border-red-500' : ''
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => {
              setSelectedTab('paidRequests');
              setCurrentPage(0); // Reset to first page when switching tabs
            }}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap ${
              selectedTab === 'paidRequests' ? 'border-b-2 border-red-500' : ''
            }`}
          >
            Paid Requests
          </button>
          <button
            onClick={() => {
              setSelectedTab('unpaidRequests');
              setCurrentPage(0); // Reset to first page when switching tabs
            }}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap ${
              selectedTab === 'unpaidRequests' ? 'border-b-2 border-red-500' : ''
            }`}
          >
            Unpaid Requests
          </button>
          <button
            onClick={() => {
              setSelectedTab('completedRequests');
              setCurrentPage(0); // Reset to first page when switching tabs
            }}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap ${
              selectedTab === 'completedRequests' ? 'border-b-2 border-red-500' : ''
            }`}
          >
            Completed Requests
          </button>
          <button
            onClick={() => {
              setSelectedTab('queriedRequests');
              setCurrentPage(0); // Reset to first page when switching tabs
            }}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap ${
              selectedTab === 'queriedRequests' ? 'border-b-2 border-red-500' : ''
            }`}
          >
            Queried Requests
          </button>
          <button
            onClick={() => {
              setSelectedTab('transactionHistory');
              setCurrentPage(0); // Reset to first page when switching tabs
            }}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap ${
              selectedTab === 'transactionHistory' ? 'border-b-2 border-red-500' : ''
            }`}
          >
            Transaction History
          </button>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-4">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Date Range Filter:</span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-y-auto flex-grow h-[680px]">
          {selectedTab !== 'transactionHistory' && (
            <PaginatedTable<Request>
              data={getProcessedData()}
              columns={requestColumns}
              emptyStateMessage={`No ${selectedTab.replace('Requests', '').toLowerCase()} requests available.`}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onRowClick={(request) => setSelectedRequest(request)}
            />
          )}

          {selectedTab === 'transactionHistory' && (
            <PaginatedTable<Payment>
              data={payments}
              columns={paymentColumns}
              emptyStateMessage="No transaction history available."
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Modals and Loading Overlay */}
      {responseModalOpen && (
        <ResponseModal
          isOpen={responseModalOpen}
          onClose={() => setResponseModalOpen(false)}
          message={responseMessage}
        />
      )}
      
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
      
      {loading && <LoadingOverlay />}
    </div>
  );
};

export default History;