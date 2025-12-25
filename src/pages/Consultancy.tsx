import React, { useState, useEffect, useMemo } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import {collection,query,orderBy,onSnapshot,addDoc,where,serverTimestamp, getDocs, updateDoc, doc} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import UserBookings from '../components/UserBookings';
import { Calendar, Clock, Trash2, Plus, Check, X, List, ArrowUp, ArrowDown } from 'lucide-react';

import { UserBooking } from '../types';

const Consultancy: React.FC = () => {
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [consultancyAmount, setConsultancyAmount] = useState<number>(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  
  // New state for slot cancellation system
  const [selectedSlots, setSelectedSlots] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState({ start: '09:00', end: '17:00' });
  const [patternType, setPatternType] = useState<'daily' | 'weekdays' | 'weekends'>('daily');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for admin-cancelled slots
  const [adminCancelledSlots, setAdminCancelledSlots] = useState<UserBooking[]>([]);
  
  // State for booking sorting
  const [sortBy, setSortBy] = useState<'created' | 'booked' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const upcomingAdminCancelledSlots = useMemo(() => {
    const now = Date.now();

    return adminCancelledSlots.filter((slot) => {
      if (slot.deleted) return false;

      return slot.selectedSlot.getTime() >= now;
    });
  }, [adminCancelledSlots]);

  // Sort user bookings based on selected sort option
  const sortedUserBookings = useMemo(() => {
    let sorted = [...userBookings];

    if (sortBy === 'created') {
      sorted.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return sortOrder === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'booked') {
      sorted.sort((a, b) => {
        const dateA = a.selectedSlot.getTime();
        const dateB = b.selectedSlot.getTime();
        return sortOrder === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      });
    }

    return sorted;
  }, [userBookings, sortBy, sortOrder]);

  const handleSortToggle = (type: 'created' | 'booked') => {
    if (sortBy === type) {
      // Toggle order if same type
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort type with default descending order
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error('Please sign in to manage consultations');
      return;
    }

    // User bookings listener - fetch all bookings and filter out admin-cancelled ones client-side
    const userBookingsQuery = query(
      collection(db, 'consultancy_bookings'),
      orderBy('createdAt', 'desc')
    );

    const userBookingsUnsubscribe = onSnapshot(
      userBookingsQuery,
      (snapshot) => {
        const bookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          selectedSlot: doc.data().selectedSlot.toDate(),
        })) as UserBooking[];

        setUserBookings(
          bookings
            .filter((booking) => booking.AdminCancelled !== true)
            .sort((a, b) => b.selectedSlot.getTime() - a.selectedSlot.getTime())
        );
      },
      (error) => {
        console.error('Error fetching user bookings:', error);
        toast.error('Failed to load bookings');
      }
    );

    // Admin cancelled slots listener - show admin-cancelled slots
    const adminCancelledQuery = query(
      collection(db, 'consultancy_bookings'),
      where('AdminCancelled', '==', true),
      orderBy('createdAt', 'desc')
    );

    
    const adminCancelledUnsubscribe = onSnapshot(
      adminCancelledQuery,
      (snapshot) => {
        const cancelledSlots = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          selectedSlot: doc.data().selectedSlot.toDate(),
        })) as UserBooking[];

        setAdminCancelledSlots(
          cancelledSlots.sort(
            (a, b) => b.selectedSlot.getTime() - a.selectedSlot.getTime()
          )
        );
      },
      (error) => {
        console.error('Error fetching admin cancelled slots:', error);
        toast.error('Failed to load cancelled slots');
      }
    );

    return () => {
      userBookingsUnsubscribe();
      adminCancelledUnsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchConsultancyAmount = async () => {
      try {
        const configSnapshot = await getDocs(query(collection(db, 'AdminConfig')));
        if (!configSnapshot.empty) {
          const firstDoc = configSnapshot.docs[0];
          setConsultancyAmount(firstDoc.data().ConsultancyAmount || 0);
        }
      } catch (error) {
        console.error('Error fetching consultancy amount:', error);
        toast.error('Failed to load consultancy amount');
      }
    };

    fetchConsultancyAmount();
  }, []);

  const handleUpdateConsultancyAmount = async () => {
    try {
      const configSnapshot = await getDocs(query(collection(db, 'AdminConfig')));
      if (!configSnapshot.empty) {
        const firstDoc = configSnapshot.docs[0];
        await updateDoc(doc(db, 'AdminConfig', firstDoc.id), {
          ConsultancyAmount: consultancyAmount
        });
        toast.success('Consultancy amount updated successfully');
        setIsEditingAmount(false);
      }
    } catch (error) {
      console.error('Error updating consultancy amount:', error);
      toast.error('Failed to update consultancy amount');
    }
  };

  // Generate time slots based on selected range and pattern
  const generateTimeSlots = () => {
    const slots: Date[] = [];
    const [startHour, startMin] = selectedTimeRange.start.split(':').map(Number);
    const [endHour, endMin] = selectedTimeRange.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Generate slots for each day in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      
      // Check pattern constraints
      if (patternType === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
      if (patternType === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) continue;
      
      // Generate hourly slots
      for (let time = startTime; time < endTime; time += 60) {
        const slotDate = new Date(d);
        slotDate.setHours(Math.floor(time / 60), time % 60, 0, 0);
        slots.push(slotDate);
      }
    }
    
    return slots;
  };

  const handleBulkSlotCancellation = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Please select time slots to cancel');
      return;
    }

    setIsProcessing(true);
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      // Create admin cancellation records for each selected slot
      const promises = selectedSlots.map(slot =>
        addDoc(collection(db, 'consultancy_bookings'), {
          userId,
          selectedSlot: slot,
          status: 'Admin Cancelled Slot',
          paymentStatus: false,
          AdminCancelled: true,
          isSlotCancellation: true,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(promises);
      
      toast.success(`Successfully cancelled ${selectedSlots.length} time slot(s)`);
      setSelectedSlots([]);
    } catch (error) {
      console.error('Error cancelling slots:', error);
      toast.error('Failed to cancel time slots');
    } finally {
      setIsProcessing(false);
    }
  };

  const addGeneratedSlots = () => {
    const newSlots = generateTimeSlots();
    setSelectedSlots(prev => {
      const combined = [...prev, ...newSlots];
      // Remove duplicates
      return combined.filter((slot, index, self) => 
        index === self.findIndex(s => s.getTime() === slot.getTime())
      );
    });
  };

  const removeSlot = (slotToRemove: Date) => {
    setSelectedSlots(prev => prev.filter(slot => slot.getTime() !== slotToRemove.getTime()));
  };

  const clearAllSlots = () => {
    setSelectedSlots([]);
  };

  const restoreCancelledSlot = async (slotId: string) => {
    try {
      await updateDoc(doc(db, 'consultancy_bookings', slotId), {
        AdminCancelled: false,
        status: 'Available'
      });
      toast.success('Slot restored successfully');
    } catch (error) {
      console.error('Error restoring slot:', error);
      toast.error('Failed to restore slot');
    }
  };

  const deleteCancelledSlot = async (slotId: string) => {
    try {
      await updateDoc(doc(db, 'consultancy_bookings', slotId), {
        deleted: true
      });
      toast.success('Slot deleted successfully');
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete slot');
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-3 px-6 border-b border-stone-100 bg-white">
        <h2 className="text-sm font-normal">Professional Services - Slot Management</h2>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Toaster position="top-right" />

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Consultation Slot Management</h1>
              <p className="text-gray-600 mt-2">Mark time slots as unavailable to prevent user bookings</p>
            </div>
            <Link
              to="/consultancy-list"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <List className="w-4 h-4 mr-2" />
              View All Bookings
            </Link>
          </div>
          
          {/* Consultancy Amount */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Consultancy Amount:</span>
              {isEditingAmount ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={consultancyAmount}
                    onChange={(e) => setConsultancyAmount(Number(e.target.value))}
                    className="border rounded px-3 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
                  />
                  <button
                    onClick={handleUpdateConsultancyAmount}
                    className="px-3 py-1 bg-[#AE1729] text-white rounded hover:bg-[#8E1321] text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingAmount(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-lg">GHS {consultancyAmount}</span>
                  <button
                    onClick={() => setIsEditingAmount(true)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Slot Configuration Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Configure Unavailable Slots
            </h2>

            {/* Date Range Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
                  />
                </div>
              </div>
            </div>

            {/* Time Range Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Time Range (Hourly Slots)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={selectedTimeRange.start}
                    onChange={(e) => setSelectedTimeRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={selectedTimeRange.end}
                    onChange={(e) => setSelectedTimeRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
                  />
                </div>
              </div>
            </div>

            {/* Pattern Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Apply Pattern</label>
              <select
                value={patternType}
                onChange={(e) => setPatternType(e.target.value as 'daily' | 'weekdays' | 'weekends')}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
              >
                <option value="daily">Daily (All Days)</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={addGeneratedSlots}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Slots
              </button>
              <button
                onClick={clearAllSlots}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>

          {/* Selected Slots Panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Selected Slots ({selectedSlots.length})
            </h2>

            {selectedSlots.length > 0 ? (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {selectedSlots
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {slot.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {slot.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSlot(slot)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={handleBulkSlotCancellation}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center px-4 py-3 bg-[#AE1729] text-white rounded hover:bg-[#8E1321] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Cancel {selectedSlots.length} Slot{selectedSlots.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No slots selected</p>
                <p className="text-sm">Configure and add time slots to mark as unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Bookings Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Active User Bookings</h2>
              <p className="text-sm text-gray-600 mt-1">
                {sortedUserBookings.length} booking{sortedUserBookings.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          {/* Sort Toggles */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sort By</h3>
            
            <div className="flex flex-wrap gap-3">
              {/* Date Created Sort Toggle */}
              <button
                onClick={() => handleSortToggle('created')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  sortBy === 'created'
                    ? 'bg-[#AE1729] text-white border-[#AE1729]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Date Created</span>
                {sortBy === 'created' && (
                  sortOrder === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                )}
              </button>

              {/* Date Booked For Sort Toggle */}
              <button
                onClick={() => handleSortToggle('booked')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  sortBy === 'booked'
                    ? 'bg-[#AE1729] text-white border-[#AE1729]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Date Booked For</span>
                {sortBy === 'booked' && (
                  sortOrder === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )
                )}
              </button>

              {/* Clear Sort Button */}
              {sortBy && (
                <button
                  onClick={() => {
                    setSortBy(null);
                    setSortOrder('desc');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear Sort</span>
                </button>
              )}
            </div>

            {sortBy && (
              <p className="text-xs text-gray-500 mt-3">
                Sorting by <span className="font-medium">{sortBy === 'created' ? 'Date Created' : 'Date Booked For'}</span> in{' '}
                <span className="font-medium">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span> order
              </p>
            )}
          </div>

          <div className="overflow-auto">
            <UserBookings userBookings={sortedUserBookings} />
          </div>
        </div>

        {/* Admin Cancelled Slots Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-500" />
            Admin Cancelled Time Slots ({upcomingAdminCancelledSlots.length})
          </h2>
          <p className="text-sm text-gray-600 mb-6">Time slots that have been marked as unavailable by admin</p>
          
          {upcomingAdminCancelledSlots.length > 0 ? (
            <div className="overflow-auto max-h-96">
              <div className="grid gap-3">
                {upcomingAdminCancelledSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="w-5 h-5 text-red-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {slot.selectedSlot.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {slot.selectedSlot.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            Cancelled: {slot.createdAt?.toDate ? slot.createdAt.toDate().toLocaleString() : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => restoreCancelledSlot(slot.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => deleteCancelledSlot(slot.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming cancelled time slots</p>
              <p className="text-sm">All upcoming time slots are currently available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consultancy;