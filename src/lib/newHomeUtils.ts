import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Request, Consultancy, User } from '../types';

export const fetchRequests = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const fetchedRequests = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      documentId: doc.id,
    })) as Request[];

    return fetchedRequests;
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
};

export const fetchConsultancy = async (): Promise<Consultancy[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const consultancyRef = collection(db, 'consultancy_bookings');
    const q = query(
      consultancyRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const fetchedConsultancy = querySnapshot.docs.map((doc) => ({
      documentId: doc.id,
      createdAt: doc.data().createdAt,
      ...doc.data()
    })) as Consultancy[];

    return fetchedConsultancy;
  } catch (error) {
    console.error('Error fetching consultancy:', error);
    return [];
  }
};

export const fetchUsers = async (searchTerm: string = ''): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef);
    
    if (searchTerm) {
      q = query(usersRef, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
    }

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
