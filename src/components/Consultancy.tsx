
// import React, { useState, useEffect } from 'react';
// import { toast, Toaster } from 'react-hot-toast';
// import { db } from '../firebase/config';
// import { 
//   collection, 
//   addDoc, 
//   serverTimestamp, 
//   query, 
//   where, 
//   getDocs, 
//   onSnapshot 
// } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';
// import { 
//   Calendar as CalendarIcon, 
//   Clock, 
//   User, 
//   Mail, 
//   Phone, 
//   MessageCircle, 
//   BookOpen, 
//   CheckCircle,
//   XCircle
// } from 'lucide-react';

// const TimeSlotSelector = ({ selectedDate, bookedSlots, onTimeSelect }) => {
//   const generateTimeSlots = () => {
//     const slots = [];
//     for (let hour = 8; hour < 17; hour++) {
//       const time = new Date(selectedDate);
//       time.setHours(hour, 0, 0, 0);
//       slots.push(time);
//     }
//     return slots;
//   };

//   const isSlotBooked = (slot) => {
//     return bookedSlots.some((bookedSlot) => bookedSlot.getTime() === slot.getTime());
//   };

//   return (
//     <div className="grid grid-cols-4 gap-2 mt-4">
//       {selectedDate &&
//         generateTimeSlots().map((slot, index) => (
//           <button
//             key={index}
//             onClick={() => onTimeSelect(slot)}
//             disabled={isSlotBooked(slot)}
//             className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center ${
//               isSlotBooked(slot)
//                 ? 'bg-red-200 text-red-800 cursor-not-allowed opacity-50'
//                 : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
//             }`}
//           >
//             <Clock className="mr-2 w-4 h-4" />
//             {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//           </button>
//         ))}
//     </div>
//   );
// };

// const CustomDatePicker = ({ onDateSelect, bookedSlots }) => {
//   const [currentMonth, setCurrentMonth] = useState(new Date());

//   const generateCalendarDays = () => {
//     const year = currentMonth.getFullYear();
//     const month = currentMonth.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);

//     const days = [];
//     for (let i = 0; i < firstDay.getDay(); i++) {
//       days.push(null);
//     }
//     for (let day = 1; day <= lastDay.getDate(); day++) {
//       const date = new Date(year, month, day);
//       days.push(date);
//     }
//     return days;
//   };

//   const isDateSelectable = (date) => {
//     if (!date) return false;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const dateSlots = [];
//     for (let hour = 8; hour < 17; hour++) {
//       const time = new Date(date);
//       time.setHours(hour, 0, 0, 0);
//       dateSlots.push(time);
//     }

//     const allBooked = dateSlots.every((slot) =>
//       bookedSlots.some((bookedSlot) => bookedSlot.getTime() === slot.getTime())
//     );

//     return date >= today && !allBooked;
//   };

//   return (
//     <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
//       <div className="flex justify-between items-center mb-4">
//         <button
//           onClick={() =>
//             setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
//           }
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//         </button>
//         <h2 className="text-xl font-semibold text-gray-800">
//           {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
//         </h2>
//         <button
//           onClick={() =>
//             setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
//           }
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//           </svg>
//         </button>
//       </div>
//       <div className="grid grid-cols-7 gap-1 text-center">
//         {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//           <div key={day} className="font-medium text-xs text-gray-500 uppercase">
//             {day}
//           </div>
//         ))}
//         {generateCalendarDays().map((date, index) => (
//           <button
//             key={index}
//             onClick={() => date && onDateSelect(date)}
//             disabled={!isDateSelectable(date)}
//             className={`p-2 rounded-md transition-all duration-200 ${
//               !date
//                 ? 'bg-transparent'
//                 : isDateSelectable(date)
//                 ? 'text-blue-600 hover:bg-blue-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
//                 : 'text-gray-300 cursor-not-allowed'
//             }`}
//           >
//             {date ? date.getDate() : ''}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export const ConsultancyPage = () => {
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedTime, setSelectedTime] = useState(null);
//   const [bookedSlots, setBookedSlots] = useState([]);
//   const [userBookings, setUserBookings] = useState([]);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     topic: '',
//     description: ''
//   });

//   useEffect(() => {
//     const auth = getAuth();
//     const userId = auth.currentUser?.uid;

//     if (!userId) {
//       toast.error('Please log in to view bookings', {
//         className: 'bg-red-200 text-red-800',
//       });
//       return;
//     }

//     // Fetch booked slots
//     const fetchBookedSlots = async () => {
//       try {
//         const q = query(
//           collection(db, 'consultancy_bookings'),
//           where('status', '==', 'pending')
//         );
//         const querySnapshot = await getDocs(q);
//         const slots = querySnapshot.docs
//           .map((doc) => doc.data().selectedSlot.toDate())
//           .filter((slot) => slot instanceof Date);
//         setBookedSlots(slots);
//       } catch (error) {
//         console.error('Error fetching booked slots:', error);
//         toast.error('Failed to load available slots', {
//           className: 'bg-red-200 text-red-800',
//         });
//       }
//     };

//     // Real-time listener for user's consultancy bookings
//     const userBookingsQuery = query(
//       collection(db, 'consultancy_bookings'),
//       where('userId', '==', userId)
//     );

//     const unsubscribe = onSnapshot(userBookingsQuery, (snapshot) => {
//       const bookings = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         selectedSlot: doc.data().selectedSlot.toDate()
//       }));
      
//       // Sort bookings by selected slot date
//       const sortedBookings = bookings.sort((a, b) => a.selectedSlot - b.selectedSlot);
      
//       setUserBookings(sortedBookings);
//     }, (error) => {
//       console.error('Error fetching user bookings:', error);
//       toast.error('Failed to load your bookings', {
//         className: 'bg-red-200 text-red-800',
//       });
//     });

//     fetchBookedSlots();

//     // Cleanup subscription
//     return () => unsubscribe();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!selectedDate || !selectedTime) {
//       toast.error('Please select both date and time', {
//         className: 'bg-red-200 text-red-800',
//       });
//       return;
//     }

//     try {
//       const auth = getAuth();
//       const userId = auth.currentUser?.uid;

//       await addDoc(collection(db, 'consultancy_bookings'), {
//         ...formData,
//         userId,
//         selectedSlot: selectedTime,
//         status: 'pending',
//         createdAt: serverTimestamp()
//       });

//       toast.success('Consultancy booking submitted successfully!');

//       // Reset form and selections
//       setFormData({
//         name: '',
//         email: '',
//         phone: '',
//         topic: '',
//         description: ''
//       });
//       setSelectedDate(null);
//       setSelectedTime(null);
//     } catch (error) {
//       console.error('Booking error:', error);
//       toast.error('Failed to book consultancy', {
//         className: 'bg-red-200 text-red-800',
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-red-50 p-8">
//       <Toaster position="top-right" />
//       <div className="container mx-auto grid md:grid-cols-2 gap-8">
//         {/* Booking Form Column */}
//         <div className="bg-white shadow-xl rounded-xl overflow-hidden">
//         <div className="bg-red-500 text-white px-6 py-4">
//             <h2 className="text-2xl font-bold">Book Your Consultation</h2>
//             <p className="text-red-100 mt-1">Select your preferred date and time</p>
//           </div>
          
//           <div className="p-6 space-y-6">
//             <div>
//               <h3 className="text-lg font-semibold mb-4 flex items-center">
//                 <CalendarIcon className="mr-2 text-blue-600" /> Select Consultation Date
//               </h3>
//               <CustomDatePicker onDateSelect={setSelectedDate} bookedSlots={bookedSlots} />

//               {selectedDate && (
//                 <>
//                   <h3 className="text-lg font-semibold mt-6 mb-4 flex items-center">
//                     <Clock className="mr-2 text-blue-600" /> Select Time Slot
//                   </h3>
//                   <TimeSlotSelector
//                     selectedDate={selectedDate}
//                     bookedSlots={bookedSlots}
//                     onTimeSelect={setSelectedTime}
//                   />
//                 </>
//               )}

//               {selectedTime && (
//                 <p className="mt-4 text-green-600 font-medium flex items-center">
//                   <CheckCircle className="h-5 w-5 mr-2" />
//                   Selected Slot: {selectedTime.toLocaleString()}
//                 </p>
//               )}
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div className="relative">
//                   <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="text"
//                     name="name"
//                     placeholder="Your Name"
//                     value={formData.name}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Your Email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//               </div>
              
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div className="relative">
//                   <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="tel"
//                     name="phone"
//                     placeholder="Your Phone"
//                     value={formData.phone}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//                 <div className="relative">
//                   <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="text"
//                     name="topic"
//                     placeholder="Consultation Topic"
//                     value={formData.topic}
//                     onChange={handleInputChange}
//                     className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//               </div>

//               <textarea
//                 name="description"
//                 placeholder="Provide additional details about your consultation"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />

// <button
//             type="submit"
//             className="w-full p-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors duration-300 ease-in-out flex items-center justify-center"
//           >
//             <CheckCircle className="h-5 w-5 mr-2" />
//             Book Consultation
//           </button>
//             </form>
//           </div>
//         </div>

//         {/* User Bookings Column */}
//         <div className="bg-white shadow-xl rounded-xl overflow-hidden">
//             <div className="bg-red-500 text-white px-6 py-4">
//               <h2 className="text-2xl font-bold">Your Consultancy Bookings</h2>
//               <p className="text-red-100 mt-1">Review your scheduled consultations</p>
//             </div>

//           <div className="p-6">
//             {userBookings.length === 0 ? (
//               <div className="text-center py-12 text-gray-500">
//                 <BookOpen className="mx-auto h-16 w-16 text-green-300 mb-4" />
//                 <p className="text-lg">No consultancy bookings yet</p>
//                 <p className="text-sm">Book your first consultation to get started!</p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {userBookings.map((booking) => (
//                   <div 
//                     key={booking.id} 
//                     className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
//                   >
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <h3 className="text-lg font-semibold text-gray-800">
//                           {booking.topic}
//                         </h3>
//                         <p className="text-sm text-gray-600 flex items-center">
//                           <CalendarIcon className="mr-2 h-4 w-4 text-green-500" />
//                           {booking.selectedSlot.toLocaleString('default', {
//                             weekday: 'long',
//                             year: 'numeric',
//                             month: 'long',
//                             day: 'numeric',
//                             hour: '2-digit',
//                             minute: '2-digit'
//                           })}
//                         </p>
//                       </div>
//                       <span 
//               className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
//                 booking.status === 'pending' 
//                   ? 'bg-red-100 text-red-800' 
//                   : booking.status === 'confirmed'
//                   ? 'bg-green-100 text-green-800'
//                   : 'bg-red-200 text-red-800'
//               }`}
//             >
//               {booking.status}
//             </span>
//                     </div>

//                     <div className="border-t border-gray-200 pt-3 mt-3">
//                       <div className="grid grid-cols-2 gap-2 text-sm">
//                         <div>
//                           <p className="text-gray-500 flex items-center">
//                             <User className="mr-2 h-4 w-4 text-blue-500" />
//                             Name
//                           </p>
//                           <p className="font-medium">{booking.name}</p>
//                         </div>
//                         <div>
//                           <p className="text-gray-500 flex items-center">
//                             <Mail className="mr-2 h-4 w-4 text-blue-500" />
//                             Email
//                           </p>
//                           <p className="font-medium">{booking.email}</p>
//                         </div>
//                         <div>
//                           <p className="text-gray-500 flex items-center">
//                             <Phone className="mr-2 h-4 w-4 text-blue-500" />
//                             Phone
//                           </p>
//                           <p className="font-medium">{booking.phone}</p>
//                         </div>
//                         <div>
//                           <p className="text-gray-500 flex items-center">
//                             <MessageCircle                            className="mr-2 h-4 w-4 text-blue-500" />
//                             Description
//                           </p>
//                           <p className="font-medium">{booking.description}</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
