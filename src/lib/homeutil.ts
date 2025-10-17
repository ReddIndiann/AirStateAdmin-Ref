import { collection, getDocs,query,where } from 'firebase/firestore';
import { db } from '../firebase/config';
export const fetchTotalUsers = async () => {
  try {
    const usersCollection = collection(db, 'users'); // 'users' is the name of the collection
    const snapshot = await getDocs(usersCollection);
    const users = snapshot.docs.map((doc) => doc.data());
    return users.length; // Returns the total number of users
  } catch (error) {
    console.error('Error fetching users:', error);
    return 0; // In case of an error, return 0 users
  }
};

export const fetchTotalPendingRequest = async () => {
    try {
      // Create a query to filter requests where status is false and paymentStatus is true
      const pendingRequestQuery = query(
        collection(db, 'requests'), 
        where('status', '==', false), // Filter where status is false
        where('paymentStatus', '==', true) // Filter where paymentStatus is true
      );
  
      // Execute the query
      const snapshot = await getDocs(pendingRequestQuery);
      const requests = snapshot.docs.map((doc) => doc.data());
      
      // Return the count of filtered requests
      return requests.length;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return 0; 
    }
  };


  
  export const fetchTotalAwaitingBookings = async () => {
    try {
      // Create a query to filter requests where status is false and paymentStatus is true
      const pendingBookingQuery = query(
        collection(db, 'consultancy_bookings'), 
        where('status', '==', "Awaiting Admin Response"), // Filter where status is false
     
      );
      

      // Execute the query
      const snapshot = await getDocs(pendingBookingQuery);
      const bookings = snapshot.docs.map((doc) => doc.data());
      
      // Return the count of filtered requests
      return bookings.length;
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      return 0; 
    }
  };



  export const fetchTotalPendingRequestData = async () => {
    try {
      // Create a query to filter requests where status is false and paymentStatus is true
      const pendingRequestQuery = query(
        collection(db, 'requests'), 
        where('status', '==', false), // Filter where status is false
    
      );
  
      // Execute the query
      const snapshot = await getDocs(pendingRequestQuery);
      const requests = snapshot.docs.map((doc) => doc.data());
      
      // Return the count of filtered requests
      return requests;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return 0; 
    }
  };


  export const fetchTotalCompleteRequestData = async () => {
    try {
      // Create a query to filter requests where status is false and paymentStatus is true
      const    completeRequestQuery = query(
        collection(db, 'requests'), 
        where('status', '==', true), // Filter where status is false

      );
  
      // Execute the query
      const snapshot = await getDocs(completeRequestQuery);
      const requests = snapshot.docs.map((doc) => doc.data());
      
      // Return the count of filtered requests
      return requests;
    } catch (error) {
      console.error('Error fetching complete requests:', error);
      return 0; 
    }
  };

