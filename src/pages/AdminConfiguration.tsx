import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../firebase/config';
import { collection, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { 
  Eye, EyeOff, Edit2, X, Save, Settings, FileText, 
  DollarSign, Mail, Phone, Key, User, MessageSquare, MapPin, Image, Upload, Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// Define TypeScript interfaces
interface SystemConfigData {
  ConsultancyAmount: number;
  ContactEmail: string;
  contactNumber: string;
  eMailServiceUser: string;
  emailServicePass: string;
  mNotifyApikey: string;
  mNotifySenderId: string;
}

interface AdvertData {
  advertImageUrl: string;
  contactAddress: string;
  contactEmail: string;
  contactHeading: string;
  description: string;
  headline: string;
}

type SystemConfigKey = keyof SystemConfigData;
type AdvertDataKey = keyof AdvertData;
type AllConfigKeys = SystemConfigKey | AdvertDataKey;

interface VisiblePasswordsState {
  emailServicePass: boolean;
  mNotifyApikey: boolean;
}

type InputValuesType = {
  config: Partial<SystemConfigData>;
  advert: Partial<AdvertData>;
};

interface ConfigFieldProps {
  label: string;
  name: AllConfigKeys;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea';
  value: string | number;
  dataType: keyof InputValuesType;
  placeholder?: string;
  icon?: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, dataType: keyof InputValuesType) => void;
  isEditing: boolean;
  visiblePasswords: VisiblePasswordsState;
  togglePasswordVisibility: (field: string) => void;
  inputValues: InputValuesType;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const initialSystemConfig: SystemConfigData = {
  ConsultancyAmount: 0,
  ContactEmail: '',
  contactNumber: '',
  eMailServiceUser: '',
  emailServicePass: '',
  mNotifyApikey: '',
  mNotifySenderId: '',
};

const initialAdvertData: AdvertData = {
  advertImageUrl: '',
  contactAddress: '',
  contactEmail: '',
  contactHeading: '',
  description: '',
  headline: '',
};

const ConfigField: React.FC<ConfigFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  dataType,
  placeholder = '',
  icon,
  onChange,
  isEditing,
  visiblePasswords,
  togglePasswordVisibility,
  inputValues
}) => {
  const isPassword = type === 'password';
  const isMultiline = type === 'textarea';
  const displayType = isPassword && !visiblePasswords[name as keyof VisiblePasswordsState] ? 'password' : 'text';
  
  const inputValue = isEditing
    ? (inputValues[dataType][name as keyof (typeof inputValues)[typeof dataType]] ?? value)
    : value;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md group">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-1 text-red-500">
          {icon}
        </div>
        <div className="flex-grow">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            {label}
          </label>
          <div className="relative">
            {isEditing ? (
              <>
                {isMultiline ? (
                  <textarea
                    name={name}
                    value={inputValue as string}
                    onChange={(e) => onChange(e, dataType)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none min-h-24 transition-all"
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    rows={4}
                    autoComplete="off"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={displayType}
                      name={name}
                      value={inputValue}
                      onChange={(e) => onChange(e, dataType)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                      step={type === 'number' ? '0.01' : undefined}
                      min={type === 'number' ? '0' : undefined}
                      autoComplete="off"
                    />
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(name)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                        aria-label={visiblePasswords[name as keyof VisiblePasswordsState] ? "Hide password" : "Show password"}
                      >
                        {visiblePasswords[name as keyof VisiblePasswordsState] ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center bg-gray-50 px-4 py-3 rounded-xl">
                {isPassword ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-gray-800">
                      {visiblePasswords[name as keyof VisiblePasswordsState] ? value : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(name)}
                      className="ml-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                      aria-label={visiblePasswords[name as keyof VisiblePasswordsState] ? "Hide password" : "Show password"}
                    >
                      {visiblePasswords[name as keyof VisiblePasswordsState] ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className={`${!value ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                    {value || 'Not set'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm transition-all">
      <div 
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const AdminConfiguration: React.FC = () => {
  const [inputValues, setInputValues] = useState<InputValuesType>({
    config: {},
    advert: {}
  });
  const [activeTab, setActiveTab] = useState<'system' | 'advert'>('system');
  const [configData, setConfigData] = useState<SystemConfigData>(initialSystemConfig);
  const [advertData, setAdvertData] = useState<AdvertData>(initialAdvertData);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [visiblePasswords, setVisiblePasswords] = useState<VisiblePasswordsState>({
    emailServicePass: false,
    mNotifyApikey: false,
  });
  const [advertImageFile, setAdvertImageFile] = useState<File | null>(null);
  const [advertImagePreview, setAdvertImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Set preview from existing URL when data is loaded
    if (advertData.advertImageUrl && !advertImagePreview && !advertImageFile) {
      setAdvertImagePreview(advertData.advertImageUrl);
    }
  }, [advertData.advertImageUrl]);

  useEffect(() => {
    if (isEditing) {
      setInputValues({
        config: {...configData},
        advert: {...advertData}
      });
    }
  }, [isEditing, configData, advertData]);

  const fetchAllData = async (): Promise<void> => {
    setLoading(true);
    try {
      const configSnapshot = await getDocs(query(collection(db, 'AdminConfig')));
      if (!configSnapshot.empty) {
        const firstDoc = configSnapshot.docs[0];
        const data = firstDoc.data() as SystemConfigData;
        setConfigData(data);
      }

      const advertSnapshot = await getDocs(query(collection(db, 'AdvertandContact')));
      if (!advertSnapshot.empty) {
        const firstDoc = advertSnapshot.docs[0];
        const data = firstDoc.data() as AdvertData;
        setAdvertData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    dataType: keyof InputValuesType): void => {
      const { name, value, type } = e.target;
      const processedValue = type === 'number' ? Number(value) : value;
      
      setInputValues(prev => ({
        ...prev,
        [dataType]: {
          ...prev[dataType],
          [name]: processedValue
        }
      }));
    }, 
    []
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setAdvertImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdvertImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAdvertImageFile(null);
    setAdvertImagePreview(null);
    // Also clear from input values
    setInputValues(prev => ({
      ...prev,
      advert: {
        ...prev.advert,
        advertImageUrl: ''
      }
    }));
  };

  const handleSave = async (): Promise<void> => {
    setLoading(true);
    try {
      const updatedConfigData = {
        ...configData,
        ...inputValues.config
      };
      
      let updatedAdvertData = {
        ...advertData,
        ...inputValues.advert
      };

      // Handle image upload if a new image was selected
      if (advertImageFile && activeTab === 'advert') {
        setUploadingImage(true);
        try {
          const imageRef = ref(storage, `advertisements/advert-${Date.now()}.${advertImageFile.name.split('.').pop()}`);
          await uploadBytes(imageRef, advertImageFile);
          const downloadURL = await getDownloadURL(imageRef);
          updatedAdvertData.advertImageUrl = downloadURL;
          setAdvertImagePreview(downloadURL);
          setAdvertImageFile(null);
          toast.success('Image uploaded successfully');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image');
          setLoading(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }
      
      if (activeTab === 'system') {
        const configSnapshot = await getDocs(query(collection(db, 'AdminConfig')));
        if (!configSnapshot.empty) {
          const firstDoc = configSnapshot.docs[0];
          await updateDoc(doc(db, 'AdminConfig', firstDoc.id), updatedConfigData);
          setConfigData(updatedConfigData);
        }
      } else {
        const advertSnapshot = await getDocs(query(collection(db, 'AdvertandContact')));
        if (!advertSnapshot.empty) {
          const firstDoc = advertSnapshot.docs[0];
          await updateDoc(doc(db, 'AdvertandContact', firstDoc.id), updatedAdvertData);
          setAdvertData(updatedAdvertData);
        }
      }
      setIsEditing(false);
      toast.success('Configuration updated successfully');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const togglePasswordVisibility = useCallback((field: string): void => {
    setVisiblePasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof VisiblePasswordsState]
    }));
  }, []);

  const handleCancel = useCallback((): void => {
    setIsEditing(false);
    setInputValues({
      config: {},
      advert: {}
    });
    toast.success('Edits cancelled');
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-red-50 to-indigo-50 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-red-600" />
                System Configuration
              </h1>
              <div className="flex items-center gap-3">
                {isEditing && (
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isEditing) {
                      setShowConfirmModal(true);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm ${isEditing 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" /> Edit Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-all ${
                  activeTab === 'system' 
                    ? 'bg-white text-red-600 shadow-sm border-t border-l border-r border-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                }`}
              >
                <Settings className="w-5 h-5" />
                System Settings
              </button>
              <button
                onClick={() => setActiveTab('advert')}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-all ${
                  activeTab === 'advert' 
                    ? 'bg-white text-red-600 shadow-sm border-t border-l border-r border-gray-100' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                }`}
              >
                <FileText className="w-5 h-5" />
                Marketing & Contact
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'system' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConfigField
                  label="Consultancy Amount"
                  name="ConsultancyAmount"
                  type="number"
                  value={configData.ConsultancyAmount}
                  dataType="config"
                  placeholder="Enter amount in currency units"
                  icon={<DollarSign className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="Contact Email"
                  name="ContactEmail"
                  type="email"
                  value={configData.ContactEmail}
                  dataType="config"
                  placeholder="name@example.com"
                  icon={<Mail className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="Contact Number"
                  name="contactNumber"
                  value={configData.contactNumber}
                  dataType="config"
                  placeholder="+123 456 7890"
                  icon={<Phone className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="Email Service User"
                  name="eMailServiceUser"
                  type="email"
                  value={configData.eMailServiceUser}
                  dataType="config"
                  placeholder="service@example.com"
                  icon={<User className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="Email Service Password"
                  name="emailServicePass"
                  type="password"
                  value={configData.emailServicePass}
                  dataType="config"
                  placeholder="Enter your secure password"
                  icon={<Key className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="mNotify API Key"
                  name="mNotifyApikey"
                  type="password"
                  value={configData.mNotifyApikey}
                  dataType="config"
                  placeholder="Enter your API key"
                  icon={<Key className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="mNotify Sender ID"
                  name="mNotifySenderId"
                  value={configData.mNotifySenderId}
                  dataType="config"
                  placeholder="Enter sender ID"
                  icon={<MessageSquare className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1 text-red-500">
                        <Image className="w-5 h-5" />
                      </div>
                      <div className="flex-grow">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Advertisement Image
                        </label>
                        
                        {isEditing ? (
                          <div className="space-y-3">
                            {advertImagePreview && (
                              <div className="relative inline-block">
                                <img
                                  src={advertImagePreview}
                                  alt="Advertisement preview"
                                  className="max-w-full h-48 object-contain rounded-lg border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <div className="relative">
                              <input
                                type="file"
                                id="advertImageUpload"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <label
                                htmlFor="advertImageUpload"
                                className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                              >
                                <Upload className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-700">
                                  {advertImageFile ? 'Change Image' : advertImagePreview ? 'Replace Image' : 'Upload Image'}
                                </span>
                              </label>
                              {uploadingImage && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                  <LoadingSpinner borderColor="#AE1729" width="16px" height="16px" />
                                  <span>Uploading image...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center bg-gray-50 px-4 py-3 rounded-xl">
                            {advertData.advertImageUrl ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={advertData.advertImageUrl}
                                  alt="Advertisement"
                                  className="h-24 w-auto object-contain rounded border border-gray-200"
                                />
                                <a
                                  href={advertData.advertImageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View Image
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No image uploaded</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <ConfigField
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={advertData.contactEmail}
                  dataType="advert"
                  placeholder="contact@example.com"
                  icon={<Mail className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <ConfigField
                  label="Contact Heading"
                  name="contactHeading"
                  value={advertData.contactHeading}
                  dataType="advert"
                  placeholder="Get in touch with us"
                  icon={<MessageSquare className="w-5 h-5" />}
                  onChange={handleInputChange}
                  isEditing={isEditing}
                  visiblePasswords={visiblePasswords}
                  togglePasswordVisibility={togglePasswordVisibility}
                  inputValues={inputValues}
                />
                <div className="md:col-span-2">
                  <ConfigField
                    label="Contact Address"
                    name="contactAddress"
                    type="textarea"
                    value={advertData.contactAddress}
                    dataType="advert"
                    placeholder="Enter full address"
                    icon={<MapPin className="w-5 h-5" />}
                    onChange={handleInputChange}
                    isEditing={isEditing}
                    visiblePasswords={visiblePasswords}
                    togglePasswordVisibility={togglePasswordVisibility}
                    inputValues={inputValues}
                  />
                </div>
                <div className="md:col-span-2">
                  <ConfigField
                    label="Headline"
                    name="headline"
                    value={advertData.headline}
                    dataType="advert"
                    placeholder="Your main headline"
                    icon={<FileText className="w-5 h-5" />}
                    onChange={handleInputChange}
                    isEditing={isEditing}
                    visiblePasswords={visiblePasswords}
                    togglePasswordVisibility={togglePasswordVisibility}
                    inputValues={inputValues}
                  />
                </div>
                <div className="md:col-span-2">
                  <ConfigField
                    label="Description"
                    name="description"
                    type="textarea"
                    value={advertData.description}
                    dataType="advert"
                    placeholder="Enter detailed description"
                    icon={<FileText className="w-5 h-5" />}
                    onChange={handleInputChange}
                    isEditing={isEditing}
                    visiblePasswords={visiblePasswords}
                    togglePasswordVisibility={togglePasswordVisibility}
                    inputValues={inputValues}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Save className="w-5 h-5 text-red-600" />
              Confirm Changes
            </h3>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="py-2 px-3 bg-red-50 border-l-4 border-red-500 rounded text-red-800 my-4">
            This action will update your system configuration settings.
          </div>
          <p className="text-gray-600">
            Are you sure you want to save these changes? This will affect how your system operates.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Confirm Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminConfiguration;