import { collection, query, where, getDocs, Query, DocumentData, FirestoreError } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Payment, Request } from '../types';

// Define a more specific error type
type FetchError = FirestoreError | Error | unknown;

export const fetchPayments = async (
  filterByStatus?: boolean,
  onError?: (error: FetchError) => void
): Promise<Payment[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const paymentsRef = collection(db, 'payments');
    let q: Query<DocumentData> = paymentsRef;
    
    if (filterByStatus !== undefined) {
      q = query(paymentsRef, where('status', '==', filterByStatus));
    }
    
    const querySnapshot = await getDocs(q);
    const payments = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      paymentId: doc.id,
    })) as Payment[];

    // Sort payments by creation date (newest first) for consistent table ordering
    return payments.sort((a, b) => {
      const dateA = a.createdAt.toDate();
      const dateB = b.createdAt.toDate();
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    if (onError) onError(error);
    return [];
  }
};

export const fetchRequests = async (
  filters?: {
    paymentStatus?: boolean;
    status?: boolean;
  },
  onError?: (error: FetchError) => void
): Promise<Request[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const requestsRef = collection(db, 'requests');
    let q: Query<DocumentData> = requestsRef;
    
    // Build query with multiple    conditions if needed
    if (filters) {
      const conditions = [];   
      
      if (filters.paymentStatus !== undefined) {
        conditions.push(where('paymentStatus', '==', filters.paymentStatus));
      }
      
      if (filters.status !== undefined) {
        conditions.push(where('status', '==', filters.status));
      }
      
      if (conditions.length === 1) {
        // Single condition query
        q = query(requestsRef, conditions[0]);
      } else if (conditions.length > 1) {
        // Multiple conditions query
        q = query(requestsRef, ...conditions);
      }
    }
    
    // Fetch all requests
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      documentId: doc.id,
    })) as Request[];
    
    // Get all unique document IDs (foreign keys) to fetch related payment data
    const documentIds = [...new Set(requests.map(req => req.documentId))];
    
    // Fetch all related payments data
    const paymentsData: { [key: string]: { 
      walletnumber?: string;
      transactionid?: number;
      clienttransid?: string;
      userId: string;
    }} = {};
    
    // Load payment data in batches to avoid "IN" clause limit of 30 values
    if (documentIds.length > 0) {
      try {
        const paymentsRef = collection(db, 'payments');
        
        // Process in batches of 30 (Firestore's limit for 'in' queries)
        const batchSize = 30;
        for (let i = 0; i < documentIds.length; i += batchSize) {
          const batch = documentIds.slice(i, i + batchSize);
          
          if (batch.length > 0) {
            const paymentsQuery = query(paymentsRef, where('documentId', 'in', batch));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            
            paymentsSnapshot.forEach(doc => {
              const paymentData = doc.data();
              if (paymentData.documentId) {
                paymentsData[paymentData.documentId] = {
                  walletnumber: paymentData.walletnumber,
                  transactionid: paymentData.transactionid,
                  clienttransid: paymentData.clienttransid,
                  userId: paymentData.userId || user.uid
                };
              }
            });
          }
        }
      } catch (paymentError: unknown) {
        console.error('Error fetching related payment data:', paymentError);
      }
    }
    
    // Enhance requests with payment data
    const enhancedRequests = requests.map(req => ({
      ...req,
      paymentInfo: {
        ...paymentsData[req.documentId] || {},
        userId: user.uid,
        walletnumber: paymentsData[req.documentId]?.walletnumber || ""
      }
    }));

    // Sort requests by creation date (newest first) for consistent table ordering
    return enhancedRequests.sort((a, b) => {
      const dateA = a.createdAt.toDate();
      const dateB = b.createdAt.toDate();
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    if (onError) onError(error);
    return [];
  }
};