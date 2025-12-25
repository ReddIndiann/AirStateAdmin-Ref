import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { 
  UserPlus, 
  Users, 
  Mail, 
  User, 
  Phone, 
  Shield, 
  X, 
  CheckCircle,
 
  Search,
  Edit2,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Admin {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'admin';
  createdAt: Timestamp | { toDate: () => Date } | null;
  provider?: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAdmins(admins);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = admins.filter(admin => 
        admin.name?.toLowerCase().includes(lowercasedSearch) ||
        admin.email?.toLowerCase().includes(lowercasedSearch) ||
        admin.phoneNumber?.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredAdmins(filtered);
    }
  }, [searchTerm, admins]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const snapshot = await getDocs(adminsQuery);
      const adminsData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Admin[];
      
      // Sort by creation date (newest first)
      const sortedAdmins = adminsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : (a.createdAt as any).toDate();
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : (b.createdAt as any).toDate();
        return dateB.getTime() - dateA.getTime();
      });
      
      setAdmins(sortedAdmins);
      setFilteredAdmins(sortedAdmins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new admins');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingAdmin) {
        // Update existing admin
        const adminRef = doc(db, 'users', editingAdmin.uid);
        await updateDoc(adminRef, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim() || '',
          updatedAt: new Date()
        });
        
        toast.success('Admin updated successfully!');
      } else {
        // Create new admin
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );
        
        const newAdmin = {
          uid: userCredential.user.uid,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim() || '',
          role: 'admin' as const,
          createdAt: Timestamp.now(),
          provider: 'email'
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), newAdmin);
        
        toast.success('Admin created successfully!');
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
      });
      setEditingAdmin(null);
      setIsModalOpen(false);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating/updating admin:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error(error.message || 'Failed to create/update admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      phoneNumber: admin.phoneNumber || '',
      password: '',
      confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleDelete = async (admin: Admin) => {
    if (!window.confirm(`Are you sure you want to remove ${admin.name} as an admin?`)) {
      return;
    }

    setLoading(true);
    try {
      // Update role to 'user' instead of deleting
      const adminRef = doc(db, 'users', admin.uid);
      await updateDoc(adminRef, {
        role: 'user',
        updatedAt: new Date()
      });
      
      toast.success('Admin removed successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    } finally {
      setLoading(false);
    }
  };

  if (loading && admins.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Admin Management
              </h1>
              <p className="text-gray-600 mt-1">Manage admin accounts and permissions</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add New Admin
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search admins by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No admins found matching your search' : 'No admins found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => {
                    const createdDate = admin.createdAt 
                      ? (admin.createdAt instanceof Timestamp 
                          ? admin.createdAt.toDate() 
                          : (admin.createdAt as any).toDate())
                      : null;
                    
                    return (
                      <tr key={admin.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{admin.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {admin.phoneNumber || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {createdDate 
                              ? createdDate.toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(admin)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                              title="Edit Admin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(admin)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                              title="Remove Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-red-500 text-white p-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingAdmin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="admin@example.com"
                />
                {editingAdmin && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0241234567"
                />
              </div>

              {!editingAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingAdmin}
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={!editingAdmin}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Re-enter password"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <LoadingSpinner borderColor="#ffffff" width="20px" height="20px" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingAdmin ? 'Update Admin' : 'Create Admin'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;









