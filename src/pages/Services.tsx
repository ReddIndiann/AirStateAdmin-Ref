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
  FileText,
  MoreVertical,
  CheckCircle,
  RefreshCw,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PriceRange,
  normalizePriceRanges,
  startingPriceFromRanges,
  validatePriceRanges,
} from '../lib/pricing';

// TypeScript interfaces
interface Service {
  id: string;
  service_name: string;
  price: string | number;
  land_size: string | number;
  description: string;
  priceRanges?: PriceRange[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface RangeFormRow {
  minAcres: string;
  maxAcres: string;
  price: string;
}

interface ServiceFormData {
  service_name: string;
  description: string;
  priceRanges: RangeFormRow[];
}

const emptyRangeRow = (): RangeFormRow => ({ minAcres: '', maxAcres: '', price: '' });

const rangesToFormRows = (service?: Service | null): RangeFormRow[] => {
  const existing = normalizePriceRanges(service?.priceRanges);
  if (existing.length) {
    return existing.map((range) => ({
      minAcres: String(range.minAcres),
      maxAcres: String(range.maxAcres),
      price: String(range.price),
    }));
  }

  const price = service?.price !== undefined && service.price !== '' ? String(service.price) : '';
  const landSize = String(service?.land_size ?? '');
  const acreMatch = landSize.match(/(\d+(?:\.\d+)?)/);
  return [{
    minAcres: '0',
    maxAcres: acreMatch?.[1] || '1',
    price,
  }];
};

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
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm hover:shadow-md placeholder:text-gray-400 text-gray-900"
        placeholder="Search services by name or description..."
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

  const handleRangeChange = useCallback((
    index: number,
    field: keyof RangeFormRow,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      priceRanges: prev.priceRanges.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  }, []);

  const handleAddRange = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      priceRanges: [...prev.priceRanges, emptyRangeRow()],
    }));
  }, []);

  const handleRemoveRange = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      priceRanges: prev.priceRanges.length === 1
        ? prev.priceRanges
        : prev.priceRanges.filter((_, rowIndex) => rowIndex !== index),
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Service Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="service_name"
            value={formData.service_name}
            onChange={handleChange}
            className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all shadow-sm"
            placeholder="Enter service name"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-gray-700">
            Acre price ranges <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleAddRange}
            className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add range
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Example: 0–1 acres = GHC 1500, 1–5 acres = GHC 2500. The customer enters acres and we charge the matching range.
        </p>
        <div className="space-y-3">
          {formData.priceRanges.map((range, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <label className="text-xs font-medium text-gray-500">Min acres</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={range.minAcres}
                  onChange={(e) => handleRangeChange(index, 'minAcres', e.target.value)}
                  className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white"
                  placeholder="0"
                  required
                />
              </div>
              <div className="col-span-4 space-y-1">
                <label className="text-xs font-medium text-gray-500">Max acres</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={range.maxAcres}
                  onChange={(e) => handleRangeChange(index, 'maxAcres', e.target.value)}
                  className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white"
                  placeholder="1"
                  required
                />
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-xs font-medium text-gray-500">Price (GHC)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={range.price}
                  onChange={(e) => handleRangeChange(index, 'price', e.target.value)}
                  className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white"
                  placeholder="1500"
                  required
                />
              </div>
              <div className="col-span-1 pb-1">
                <button
                  type="button"
                  onClick={() => handleRemoveRange(index)}
                  disabled={formData.priceRanges.length === 1}
                  className="p-2.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded-xl hover:bg-red-50"
                  aria-label="Remove range"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute top-3 left-4 pointer-events-none">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none"
            placeholder="Describe the service in detail..."
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
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
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-red-200 relative">
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-rose-600"></div>
      
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <Package className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 group-hover:text-red-600 transition-colors">
                {service.service_name}
              </h3>
            </div>
          </div>
          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <div 
              className={`absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 transition-all ${
                isDropdownOpen ? 'block opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-2'
              }`}
            >
              <button 
                onClick={handleEdit}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
              >
                <Pencil className="w-4 h-4" /> Edit Service
              </button>
              <button 
                onClick={handleDelete}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Service
              </button>
            </div>
          </div>
        </div>
        
        <div className="mb-5 flex-grow">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{service.description}</p>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-col w-full pr-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Price ranges</span>
              {normalizePriceRanges(service.priceRanges).length ? (
                <div className="space-y-1">
                  {normalizePriceRanges(service.priceRanges).map((range) => (
                    <div key={`${range.minAcres}-${range.maxAcres}-${range.price}`} className="flex items-baseline justify-between gap-3">
                      <span className="text-xs text-gray-500">{range.minAcres}–{range.maxAcres} acres</span>
                      <span className="text-sm font-semibold text-gray-900">GHC {range.price}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">GHC {service.price}</span>
                  <span className="text-sm text-gray-500">/ {service.land_size}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm hover:shadow-md"
                aria-label="Edit service"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm hover:shadow-md"
                aria-label="Delete service"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} mx-4 p-8 transform transition-all`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        {title && (
          <div className="mb-6 pr-8">
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
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
    const priceRanges = formData.priceRanges.map((row) => ({
      minAcres: Number(row.minAcres),
      maxAcres: Number(row.maxAcres),
      price: Number(row.price),
    }));
    const rangeError = validatePriceRanges(priceRanges);
    if (rangeError) {
      toast.error(rangeError);
      return;
    }

    const payload = {
      service_name: formData.service_name.trim(),
      description: formData.description.trim(),
      priceRanges,
      price: startingPriceFromRanges(priceRanges),
      land_size: 'acres',
    };

    setLoading(true);
    try {
      if (selectedService) {
        const serviceRef = doc(db, 'ServiceList', selectedService.id);
        await updateDoc(serviceRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast.success('Service updated successfully');
      } else {
        await addDoc(collection(db, 'ServiceList'), {
          ...payload,
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
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50"></div>
        <div className="relative p-6 bg-white rounded-full shadow-lg">
          <Package className="w-16 h-16 text-red-500" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No services found</h3>
      <p className="text-gray-600 text-center max-w-md mb-8 text-lg">
        Get started by creating your first service. Services you create will appear here.
      </p>
      <button
        onClick={handleAddNew}
        className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> Add New Service
      </button>
    </div>
  ));

  EmptyState.displayName = 'EmptyState';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Service Management</h1>
              <p className="mt-1 text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                Manage services and acre price ranges
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Top Bar with Actions */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <SearchInput 
                    value={searchTerm} 
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">
                    {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className={`p-3 text-white hover:bg-white/20 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${isRefreshing ? 'animate-spin' : ''}`}
                  disabled={isRefreshing}
                  aria-label="Refresh services"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddNew}
                  className="px-6 py-3 text-sm font-semibold text-red-600 bg-white rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add New Service
                </button>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center items-center py-20">
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
        description="Set acre ranges and a price for each band."
        size="xl"
      >
        <ServiceForm
          key={selectedService?.id || 'edit'}
          onSubmit={handleServiceSubmit}
          isEdit={true}
          initialData={{
            service_name: selectedService?.service_name || '',
            description: selectedService?.description || '',
            priceRanges: rangesToFormRows(selectedService),
          }}
          onCancel={handleCloseModals}
        />
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        title="Add New Service"
        description="Set acre ranges and a price for each band."
        size="xl"
      >
        <ServiceForm
          key="new"
          onSubmit={handleServiceSubmit}
          isEdit={false}
          initialData={{
            service_name: '',
            description: '',
            priceRanges: [emptyRangeRow()],
          }}
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
        <div className="py-4 px-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                This action cannot be undone. The service will be permanently removed from the system.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 text-lg mb-2">
          Are you sure you want to delete <span className="font-bold text-gray-900">{selectedService?.service_name}</span>?
        </p>
        
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleCloseModals}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Service
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminServiceManagement;