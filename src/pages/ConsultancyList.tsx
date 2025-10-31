import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Calendar, Clock, ArrowUpDown, Filter, Eye, X, Settings } from 'lucide-react';
import { UserBooking } from '../types';

const ConsultancyList: React.FC = () => {
  const [consultancyBookings, setConsultancyBookings] = useState<UserBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<UserBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filter and sort state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const rowsPerPage = 12;

  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error('Please sign in to view consultancy bookings');
      return;
    }

    // Listen to all consultancy bookings (both active and cancelled)
    const bookingsQuery = query(
      collection(db, 'consultancy_bookings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const bookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          selectedSlot: doc.data().selectedSlot.toDate(),
        })) as UserBooking[];

        setConsultancyBookings(bookings);
      },
      (error) => {
        console.error('Error fetching consultancy bookings:', error);
        toast.error('Failed to load consultancy bookings');
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and sort data
  useEffect(() => {
    let filtered = [...consultancyBookings];

    // Exclude past days (only show days that haven't passed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter((booking) => {
      const bookingDay = new Date(booking.selectedSlot);
      bookingDay.setHours(0, 0, 0, 0);
      return bookingDay.getTime() >= today.getTime();
    });

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(booking => !booking.AdminCancelled);
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter(booking => booking.AdminCancelled);
    }

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.selectedSlot);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (startDate && endDate) {
          return bookingDate >= startDate && bookingDate <= endDate;
        } else if (startDate) {
          return bookingDate >= startDate;
        } else if (endDate) {
          return bookingDate <= endDate;
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.selectedSlot);
      const dateB = new Date(b.selectedSlot);
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });

    setFilteredBookings(filtered);
    setCurrentPage(0); // Reset to first page when filters change
  }, [consultancyBookings, sortOrder, dateRange, statusFilter]);

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setStatusFilter('all');
    setSortOrder('desc');
  };

  const restoreCancelledSlot = async (slotId: string) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'consultancy_bookings', slotId), {
        AdminCancelled: false,
        status: 'Available'
      });
      toast.success('Consultation slot restored successfully');
    } catch (error) {
      console.error('Error restoring slot:', error);
      toast.error('Failed to restore consultation slot');
    } finally {
      setLoading(false);
    }
  };

  const cancelActiveSlot = async (slotId: string) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'consultancy_bookings', slotId), {
        AdminCancelled: true,
        status: 'Admin Cancelled Slot'
      });
      toast.success('Consultation slot cancelled successfully');
    } catch (error) {
      console.error('Error cancelling slot:', error);
      toast.error('Failed to cancel consultation slot');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = filteredBookings.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  const getStatusBadge = (booking: UserBooking) => {
    if (booking.AdminCancelled) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
          Cancelled
        </span>
      );
    } else if (booking.status === 'Awaiting Admin Response') {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
          Pending
        </span>
      );
    } else if (booking.paymentStatus) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
          Confirmed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
          Unpaid
        </span>
      );
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-3 px-6 border-b border-stone-100 bg-white">
        <h2 className="text-sm font-normal">Consultancy Bookings - List View</h2>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Toaster position="top-right" />

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Consultancy Bookings Management</h1>
              <p className="text-gray-600 mt-2">View and manage all consultancy bookings in a detailed list format</p>
            </div>
            <Link
              to="/consultancy"
              className="flex items-center px-4 py-2 bg-[#AE1729] text-white rounded-lg hover:bg-[#8E1321] transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Availability
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {consultancyBookings.length} bookings
            </div>
            <div className="text-sm text-gray-600">
              Active: {consultancyBookings.filter(b => !b.AdminCancelled).length} | 
              Cancelled: {consultancyBookings.filter(b => b.AdminCancelled).length}
            </div>
          </div>
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

          {(dateRange.startDate || dateRange.endDate || statusFilter !== 'all') && (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'cancelled')}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Bookings</option>
                  <option value="active">Active Only</option>
                  <option value="cancelled">Cancelled Only</option>
                </select>
              </div>
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

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultation Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBookings.length > 0 ? (
                  paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.selectedSlot.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.selectedSlot.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {booking.consultationType || 'General Consultation'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.AdminCancelled ? (
                            <button
                              onClick={() => restoreCancelledSlot(booking.id)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => cancelActiveSlot(booking.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No consultancy bookings found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{currentPage * rowsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min((currentPage + 1) * rowsPerPage, filteredBookings.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredBookings.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i
                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Consultation Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Consultation Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {selectedBooking.consultationType || 'General Consultation'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.selectedSlot.toLocaleString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBooking)}
                  </div>
                </div>
              </div>
              {selectedBooking.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
              {selectedBooking.AdminCancelled ? (
                <button
                  onClick={() => {
                    restoreCancelledSlot(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                >
                  Restore Slot
                </button>
              ) : (
                <button
                  onClick={() => {
                    cancelActiveSlot(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel Slot
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultancyList;
