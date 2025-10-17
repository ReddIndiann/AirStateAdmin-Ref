// lib/historyUtils.ts
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import axios from 'axios';
import { Payment,Request } from '../types';
export const fetchPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      paymentId: doc.id,
    })) as Payment[];
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const fetchRequests = async (userId: string): Promise<Request[]> => {
  try {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      documentId: doc.id,
    })) as Request[];
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

export const verifyPayment = async (
  payment: Payment,
  requestName: string,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
) => {
  const endpoint = 'https://checktransactionandupdate-qrtfyfyudq-uc.a.run.app';
  const userRef = doc(db, 'users', payment.userId as string);

  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found.');
    }

    const userEmail = userDoc.data()?.email;
    
    if (!userEmail) {
      throw new Error('User email not found.');
    }

    const requestBody = {
      documentId: payment.documentId,
      transactionid: payment.transactionid.toString(),
      paymentId: payment.paymentId,
      clientsnumber: payment.recipientNumber || '',
      clientsname: requestName,
      paymentFor: payment.paymentFor,
      clientEmail: userEmail,
    };

    const { data } = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    

    onSuccess(data.message);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = 'Error during payment verification: ' + 
        (error.response?.data || error.message);
      onError(errorMessage);
    } else {
      onError('Unexpected error during verification');
    }
    throw error;
  }
};