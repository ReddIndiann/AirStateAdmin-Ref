import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import PaginatedTable from '../components/ReusableTable';
import LoadingOverlay from '../components/LoadingOverlay';
import ResponseModal from '../components/ResponseModal';
import UserDetailModal from '../components/UserDetailComponent';

// Define the User interface based on the provided structure
interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  location?: string;
  provider?: string;
  passwordReset?: boolean;
  createdAt: Timestamp | { toDate: () => Date } | null;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  const rowsPerPage = 12;

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search term or users change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(lowercasedSearch) ||
        user.email?.toLowerCase().includes(lowercasedSearch) ||
        user.phoneNumber?.toLowerCase().includes(lowercasedSearch) ||
        user.location?.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredUsers(filtered);
      // Reset to first page when filtering
      setCurrentPage(0);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as User[];
      
      // Sort users by creation date (newest first) for consistent table ordering
      const sortedUsers = usersData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });
      
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showResponseMessage('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (userId: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        passwordReset: true
      });
      
      // Update local state
      setUsers(prevUsers => prevUsers.map(user => 
        user.uid === userId ? { ...user, passwordReset: true } : user
      ));
      setFilteredUsers(prevUsers => prevUsers.map(user => 
        user.uid === userId ? { ...user, passwordReset: true } : user
      ));
      
      showResponseMessage('Password reset successfully to default.');
    } catch (error) {
      console.error('Error resetting password:', error);
      showResponseMessage('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showResponseMessage = (message: string) => {
    setResponseMessage(message);
    setResponseModalOpen(true);
  };

  // User table columns
  const userColumns = [
    { 
      header: 'Name', 
      accessor: 'name' as keyof User, 
      isRounded: 'left' as const 
    },
    { 
      header: 'Email', 
      accessor: 'email' as keyof User 
    },
    { 
      header: 'Phone Number', 
      accessor: 'phoneNumber' as keyof User 
    },
    { 
      header: 'Location', 
      accessor: 'location' as keyof User 
    },
    { 
      header: 'Provider', 
      accessor: 'provider' as keyof User 
    },
    { 
      header: 'Joined Date', 
      accessor: (item: User) => {
        if (!item.createdAt) return 'N/A';
        return new Date(item.createdAt.toDate()).toLocaleDateString();
      }
    },
    {
      header: 'Password Status',
      accessor: (item: User) => {
        if (item.provider !== 'email') return 'N/A';
        return item.passwordReset ? 'Reset' : 'Normal';
      },
      isRounded: 'right' as const
    }
  ];

  return (
    <div className="h-full flex flex-col md:justify-between md:items-center">
      <div className="bg-white w-full min-h-full overflow-hidden shadow-md px-4 pt-4 pb-2 flex flex-col justify-between">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
          <h2 className="text-lg font-medium">Users Management</h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <button 
              onClick={fetchUsers}
              className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-grow h-[680px]">
          <PaginatedTable<User>
            data={filteredUsers}
            columns={userColumns}
            emptyStateMessage={searchTerm ? "No users match your search." : "No users available."}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onRowClick={(user) => setSelectedUser(user)}
          />
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onPasswordReset={handlePasswordReset}
        />
      )}

      {/* Response Modal */}
      {responseModalOpen && (
        <ResponseModal
          isOpen={responseModalOpen}
          onClose={() => setResponseModalOpen(false)}
          message={responseMessage}
        />
      )}
      
      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}
    </div>
  );
};

export default UsersManagement;