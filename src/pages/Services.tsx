import React, { useState, useEffect, useCallback, memo } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  // DocumentData,
  // QueryDocumentSnapshot
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  Search,
  Package,
  AlertTriangle,
  DollarSign,
  FileText,
  MoreVertical,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// TypeScript interfaces
interface Service {
  id: string;
  service_name: string;
  price: string | number;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ServiceFormData {
  service_name: string;
  price: string;
  description: string;
}

// Memoized Components
const SearchInput = memo(({ value, onChange }: { 
  value: string; 
  onChange: (value: string) => void; 
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        placeholder="Search services..."
        value={value}
        onChange={handleChange}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

const ServiceForm = memo(({ 
  onSubmit, 
  isEdit, 
  initialData, 
  onCancel 
}: { 
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isEdit: boolean;
  initialData: ServiceFormData;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Service Name
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            name="service_name"
            value={formData.service_name}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter service name"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Price (GHC)
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Describe the service..."
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm flex items-center gap-2"
        >
          {isEdit ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Update Service
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Service
            </>
          )}
        </button>
      </div>
    </form>
  );
});

ServiceForm.displayName = 'ServiceForm';

const ServiceCard = memo(({ 
  service, 
  onEdit, 
  onDelete 
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleEdit = useCallback(() => {
    onEdit(service);
  }, [service, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(service);
  }, [service, onDelete]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900">{service.service_name}</h3>
          <div className="relative">
            <button
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <div 
              className={`absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 ${
                isDropdownOpen ? 'block' : 'hidden'
              }`}
            >
              <button 
                onClick={handleEdit}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
        
        <div className="mb-4 flex-grow">
          <p className="text-sm text-gray-600">{service.description}</p>
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <span className="text-lg font-medium text-gray-900">GHC {service.price}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Edit service"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Delete service"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ServiceCard.displayName = 'ServiceCard';

const Modal = memo(({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  description,
  size = 'md'
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm transition-all">
      <div className="fixed inset-0" onClick={onClose} />
      <div 
        className={`relative bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} mx-4 p-6 transform transition-all`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        {title && (
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-1.5 text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

// Main Component
const AdminServiceManagement: React.FC = () => {
  // State
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Constants
  const emptyFormData: ServiceFormData = {
    service_name: '',
    price: '',
    description: '',
  };

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(query(collection(db, 'ServiceList')));
      const servicesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Service));
      
      setServices(servicesList);
      setFilteredServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Search effect
  useEffect(() => {
    const filtered = services.filter(service => 
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleServiceSubmit = useCallback(async (formData: ServiceFormData) => {
    setLoading(true);
    try {
      if (selectedService) {
        const serviceRef = doc(db, 'ServiceList', selectedService.id);
        await updateDoc(serviceRef, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        toast.success('Service updated successfully');
      } else {
        await addDoc(collection(db, 'ServiceList'), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        toast.success('Service added successfully');
      }
      handleCloseModals();
      fetchServices();
    } catch (error) {
      console.error('Error submitting service:', error);
      toast.error('Failed to submit service');
    } finally {
      setLoading(false);
    }
  }, [selectedService, fetchServices]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchServices();
    setIsRefreshing(false);
    toast.success('Services refreshed');
  }, [fetchServices]);

  const handleEditClick = useCallback((service: Service) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((service: Service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedService) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'ServiceList', selectedService.id));
      toast.success('Service deleted successfully');
      handleCloseModals();
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } finally {
      setLoading(false);
    }
  }, [selectedService, fetchServices]);

  const handleCloseModals = useCallback(() => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedService(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // EmptyState component
  const EmptyState = memo(() => (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <Package className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        Get started by creating your first service. Services you create will appear here.
      </p>
      <button
        onClick={handleAddNew}
        className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add New Service
      </button>
    </div>
  ));

  EmptyState.displayName = 'EmptyState';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Service Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your services, prices, and descriptions
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className={`p-2.5 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${isRefreshing ? 'animate-spin' : ''}`}
                  disabled={isRefreshing}
                  aria-label="Refresh services"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Service
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <SearchInput 
                  value={searchTerm} 
                  onChange={handleSearchChange}
                />
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <LoadingSpinner />
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        title="Edit Service"
        description="Update the service details below."
      >
        <ServiceForm 
          onSubmit={handleServiceSubmit}
          isEdit={true}
          initialData={{
            service_name: selectedService?.service_name || '',
            price: selectedService?.price.toString() || '',
            description: selectedService?.description || '',
          }}
          onCancel={handleCloseModals}
        />
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        title="Add New Service"
        description="Enter the details for the new service."
      >
        <ServiceForm 
          onSubmit={handleServiceSubmit}
          isEdit={false}
          initialData={emptyFormData}
          onCancel={handleCloseModals}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="py-3 px-4 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-800 mb-5">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This action cannot be undone. The service will be permanently removed from the system.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700">
          Are you sure you want to delete <span className="font-semibold">{selectedService?.service_name}</span>?
        </p>
        
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleCloseModals}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Service
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminServiceManagement;