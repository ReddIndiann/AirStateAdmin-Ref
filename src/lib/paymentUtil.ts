import axios from 'axios';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Payment, Request } from '../types';

export const verifyPayment = async (
  payment: Payment, 
  requests: Request[], 
  setLoading: (loading: boolean) => void,
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
) => {
  setLoading(true);

  const requestName = requests.length > 0 ? requests[0].name : '';
  const endpoint = 'https://checktransactionandupdate-qrtfyfyudq-uc.a.run.app';
  const userRef = doc(db, 'users', payment.userId as string);

  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const errorMessage = 'User not found.';
      if (onError) onError(errorMessage);
      return;
    }

    const userEmail = userDoc.data()?.email;
    
    if (!userEmail) {
      const errorMessage = 'User email not found.';
      if (onError) onError(errorMessage);
      return;
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

    if (onSuccess) onSuccess(data.message);

    if (data.status === 'success') {
      const paymentDocRef = doc(db, 'payments', payment.documentId);
      await updateDoc(paymentDocRef, { 
        status: true, 
        statusdate: new Date().toISOString() 
      });
      return true;
    }
    
    return false;
  } catch (error) {
    let errorMessage = 'An unexpected error occurred';
    
    if (axios.isAxiosError(error)) {
      errorMessage = 'Error during payment verification: ' + 
        (error.response?.data || error.message);
      console.error('Error during payment verification:', 
        error.response?.data || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    
    if (onError) onError(errorMessage);
    return false;
  } finally {
    setLoading(false);
  }
};