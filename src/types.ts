export interface Request {
  documentId: string;
  address: string;
  createdAt: any;
  documentURL: string;
  isDocumentValid: boolean;
  paymentStatus: boolean;
  resultsUrl?: string;
  serviceType: string;
  status: boolean;
  imageUrl: string;
  walletNumber: string;
  userId: string;
  paymentInfo: {
    walletnumber: string;
    userId: string;
  };



  name: string;
  phoneNumber: string;

  // Add other request-specific fields as needed
}

export interface Consultancy {
  documentId: string;
  createdAt: any;
  status: 'Awaiting Admin Response' | 'Pending Payment' | 'Booking Approved';
  // Add other consultancy-specific fields as needed
}

export interface UserBooking {
  id: string;
  selectedSlot: Date;
  status: string;
  paymentStatus: boolean;
  AdminCancelled: boolean;
  createdAt: any;
  [key: string]: any;
}

export interface ConsultFormData {
  name: string;
  email: string;
  phone: string;
  consultationType: string;
  description: string;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: 'admin' | 'user';
  [key: string]: any;
}

export interface GoogleAuthProps {
  type: 'signIn' | 'signUp';
  onClick: () => void;
}


export interface ProtectedRouteProps {
  children: React.ReactNode;
}

  export interface UserContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: any;
  paymentMethod: string;
  userId: string;
  paymentId: string;
  paymentStatus: boolean;
  paymentUrl: string;
  documentId: string;
  transactionid: string;
  recipientNumber: string;
  paymentFor: string;
  clientEmail: string;
  walletnumber: string;
}

export interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  imageUrl: string;
  uuid: string;
  provider: string;
  location: string;
  createdAt: string;
}

