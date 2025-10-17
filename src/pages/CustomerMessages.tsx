import React, { useState, ReactNode, FormEvent, ChangeEvent, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  AtSign,
  Wallet,
 
} from 'lucide-react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

interface AlertProps {
  variant?: 'success' | 'error';
  children: ReactNode;
  className?: string;
}

interface RequestInfo {
  name: string;
  phoneNumber: string;
  userId: string;
  paymentInfo?: {
    walletnumber?: string;
  };
}

interface ClientMessagingProps {
  requestInfo?: RequestInfo;
}

const Alert: React.FC<AlertProps> = ({ variant = 'success', children, className }) => {
  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  } as const;

  return (
    <div className={`flex items-center gap-2 p-4 rounded-lg border ${styles[variant]} ${className || ''}`}>
      {children}
    </div>
  );
};

interface FormData {
  clientName: string;
  clientNumber: string;
  clientEmail: string;
  message: string;
  sendSMS: boolean;
  sendEmail: boolean;
}

interface UserSuggestion {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

const ClientMessaging: React.FC<ClientMessagingProps> = ({ requestInfo }) => {
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientNumber: '',
    clientEmail: '',
    message: '',
    sendSMS: true,
    sendEmail: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contactOptions, setContactOptions] = useState<{
    requestPhone?: string;
    walletNumber?: string;
    userEmail?: string;
  }>({});
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch user email from userId when component mounts
  useEffect(() => {
    if (requestInfo) {
      // Set name from request info
      setFormData(prev => ({
        ...prev,
        clientName: requestInfo.name || prev.clientName
      }));

      // Set contact options
      const options = {
        requestPhone: requestInfo.phoneNumber,
        walletNumber: requestInfo.paymentInfo?.walletnumber
      };
      
      // Get the email from user collection
      const fetchUserEmail = async () => {
        if (requestInfo.userId) {
          try {
            const userRef = doc(db, 'users', requestInfo.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.email) {
                setContactOptions(prev => ({
                  ...prev,
                  userEmail: userData.email
                }));
                
                // Set email in form data if available
                setFormData(prev => ({
                  ...prev,
                  clientEmail: userData.email
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching user email:", error);
          }
        }
      };
      
      setContactOptions(options);
      
      // Set initial selected phone if available
      if (options.requestPhone) {
        setSelectedPhone('requestPhone');
        setFormData(prev => ({
          ...prev,
          clientNumber: options.requestPhone || ''
        }));
      } else if (options.walletNumber) {
        setSelectedPhone('walletNumber');
        setFormData(prev => ({
          ...prev,
          clientNumber: options.walletNumber || ''
        }));
      }
      
      fetchUserEmail();
    }
  }, [requestInfo]);

  // Handle phone selection change
  const handlePhoneSelect = (type: string) => {
    setSelectedPhone(type);
    
    if (type === 'requestPhone' && contactOptions.requestPhone) {
      setFormData(prev => ({
        ...prev,
        clientNumber: contactOptions.requestPhone || ''
      }));
    } else if (type === 'walletNumber' && contactOptions.walletNumber) {
      setFormData(prev => ({
        ...prev,
        clientNumber: contactOptions.walletNumber || ''
      }));
    } else if (type === 'custom') {
      setFormData(prev => ({
        ...prev,
        clientNumber: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.clientName.trim()) {
      setError('Client name is required');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Message is required');
      return false;
    }
    if (!formData.sendEmail && !formData.sendSMS) {
      setError('Please select at least one sending method (Email or SMS)');
      return false;
    }
    if (formData.sendEmail && !formData.clientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.sendSMS && !formData.clientNumber.match(/^\d{9,12}$/)) {
      setError('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('https://us-central1-airstatefinder.cloudfunctions.net/notifyUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSuccess('Message sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      // Convert search term to lowercase for case-insensitive search
      const searchLower = searchTerm.toLowerCase();
      
      // Filter users in memory for more flexible matching
      const suggestions = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          email: doc.data().email || '',
          phoneNumber: doc.data().phoneNumber || ''
        } as UserSuggestion))
        .filter(user => {
          const userName = user.name.toLowerCase();
          // Check if the search term appears anywhere in the name
          return userName.includes(searchLower);
        })
        .sort((a, b) => {
          // Sort by how close the match is to the beginning of the name
          const aIndex = a.name.toLowerCase().indexOf(searchLower);
          const bIndex = b.name.toLowerCase().indexOf(searchLower);
          return aIndex - bIndex;
        })
        .slice(0, 10); // Limit to 10 results
      
      setUserSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleNameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      clientName: value
    }));
    setError('');

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchUsers(value);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleUserSelect = (user: UserSuggestion) => {
    setFormData(prev => ({
      ...prev,
      clientName: user.name,
      clientEmail: user.email,
      clientNumber: user.phoneNumber || ''
    }));
    setUserSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-red-600" />
          Send Client Message
        </h1>

        {error && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleNameInputChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Search for client..."
                autoComplete="off"
              />
            </div>
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {userSuggestions.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleUserSelect(user)}
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              
              {/* Phone number selection options */}
              {(contactOptions.requestPhone || contactOptions.walletNumber) && (
                <div className="mb-2 space-y-2">
                  {contactOptions.requestPhone && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="phoneSource"
                        checked={selectedPhone === 'requestPhone'}
                        onChange={() => handlePhoneSelect('requestPhone')}
                        className="w-4 h-4 text-red-600 rounded-full focus:ring-red-500"
                      />
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Request Phone: {contactOptions.requestPhone}</span>
                    </label>
                  )}
                  
                  {contactOptions.walletNumber && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="phoneSource"
                        checked={selectedPhone === 'walletNumber'}
                        onChange={() => handlePhoneSelect('walletNumber')}
                        className="w-4 h-4 text-red-600 rounded-full focus:ring-red-500"
                      />
                      <Wallet className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Wallet Number: {contactOptions.walletNumber}</span>
                    </label>
                  )}
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="phoneSource"
                      checked={selectedPhone === 'custom'}
                      onChange={() => handlePhoneSelect('custom')}
                      className="w-4 h-4 text-red-600 rounded-full focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Use Custom Number</span>
                  </label>
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="clientNumber"
                  value={formData.clientNumber}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., 0273421234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              
              {/* Email selection options */}
              {contactOptions.userEmail && (
                <div className="mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.clientEmail === contactOptions.userEmail}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          clientEmail: prev.clientEmail === contactOptions.userEmail ? '' : contactOptions.userEmail || ''
                        }));
                      }}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Use Client Email: {contactOptions.userEmail}</span>
                  </label>
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="client@example.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your message here..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sendSMS"
                checked={formData.sendSMS}
                onChange={handleInputChange}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Send SMS</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sendEmail"
                checked={formData.sendEmail}
                onChange={handleInputChange}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <Mail className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Send Email</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientMessaging;