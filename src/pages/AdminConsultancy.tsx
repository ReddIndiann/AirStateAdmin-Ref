import  { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import BookingForm from '../components/BookingForms';
import AdminBookings from '../components/AdminBookings';

type ConsultationType = 'general' | 'survey' | 'registration';

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  consultationType: ConsultationType;
  description: string;
}

interface UserBooking {
  id: string;
  selectedSlot: Date;
  name: string;
  email: string;
  phone: string;
  consultationType: string;
  description: string;
  status: boolean;
  paymentStatus: boolean;
  createdAt: Date;
  topic: string; // Added topic field
}

export const AdminConsultancyPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Date[]>([]); // Changed to Date[]
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]); // Type as UserBooking[]
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    consultationType: 'general',
    description: ''
  });

  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      toast.error('Please sign in to book a consultation');
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        const bookingsRef = collection(db, 'consultancy_bookings');
        const bookingsSnap = await getDocs(bookingsRef);
        const slots = bookingsSnap.docs
          .map(doc => {
            const selectedSlot = doc.data().selectedSlot;
            // Check if selectedSlot is a valid Firebase Timestamp
            if (selectedSlot && selectedSlot.toDate) {
              return selectedSlot.toDate();
            }
            return null; // Return null for invalid slots
          })
          .filter(slot => slot !== null); // Remove invalid slots
    
        setBookedSlots(slots as Date[]); // Cast the filtered slots as Date[]
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        toast.error('Failed to load available slots');
      }
    };
    
    const userBookingsQuery = query(
      collection(db, 'consultancy_bookings'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(userBookingsQuery, 
      (snapshot) => {
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            selectedSlot: data.selectedSlot.toDate(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            consultationType: data.consultationType,
            description: data.description,
            status: data.status,
            paymentStatus: data.paymentStatus,
            createdAt: data.createdAt,
            topic: data.topic, // Ensure topic is included
          };
        });

        setUserBookings(bookings.sort((a, b) => b.selectedSlot.getTime() - a.selectedSlot.getTime()));
      },
      (error) => {
        console.error('Error fetching user bookings:', error);
        toast.error('Failed to load your bookings');
      }
    );

    fetchBookedSlots();
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    if (!formData.consultationType) {
      toast.error('Please select a consultation type');
      return;
    }

    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      await addDoc(collection(db, 'consultancy_bookings'), {
        ...formData,
        userId,
        selectedSlot: selectedTime,
        status: false,
        paymentStatus: false,
        createdAt: serverTimestamp()
      });

      toast.success('Consultation booked successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        consultationType: 'general',
        description: ''
      });
      setSelectedDate(null);
      setSelectedTime(null);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book consultation');
    }
  };

  return (
    <div className="min-h-screen bg-red-50 p-8">
      <Toaster position="top-right" />
      <div className="container mx-auto grid md:grid-cols-2 gap-8">
        <BookingForm 
          formData={formData}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          bookedSlots={bookedSlots}  // Now correctly passing Date[]
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          setSelectedDate={setSelectedDate}
          setSelectedTime={setSelectedTime}
        />
        <AdminBookings userBookings={userBookings} />
      </div>
    </div>
  );
};

export default AdminConsultancyPage;
