import React, { useState } from 'react';
import { X, Edit, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Define the Request type (adjust based on your actual data structure)
interface Request {
  documentId: string;
  name: string;
  phoneNumber: string;
  address: string;
  serviceType: string;
  imageUrl?: string | null;
  isDocumentValid?: boolean;
}

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
  onUpdateRequest: (updatedRequest: Request) => void;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  request, 
  onUpdateRequest 
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(request.imageUrl || null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSubmit = async () => {
    if (!imageFile) return;

    try {
      // Create a reference to the image in Firebase Storage
      const imageRef = ref(storage, `request-images/${request.documentId}`);
      
      // Upload the image
      const snapshot = await uploadBytes(imageRef, imageFile);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore document with image URL and set isDocumentValid to "Approved"
      const requestDocRef = doc(db, 'requests', request.documentId);
      await updateDoc(requestDocRef, {
        imageUrl: downloadURL,
        isDocumentValid: true, // Updating the isDocumentValid field
      });

      // Update local state
      onUpdateRequest({ 
        ...request, 
        imageUrl: downloadURL,
        isDocumentValid: true, // Update local request state as well
      });

      // Reset image state
      setImageFile(null);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Edit className="mr-2 w-5 h-5" /> Service Request Details
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Service Image
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Service Request" 
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <button 
                    onClick={removeImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-md">
                  <ImageIcon className="text-gray-400" />
                </div>
              )}
              <div>
                <input 
                  type="file" 
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="imageUpload" 
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md cursor-pointer hover:bg-blue-100"
                >
                  <Upload className="mr-2 w-4 h-4" /> Upload Image
                </label>
                {imageFile && (
                  <button 
                    onClick={handleImageSubmit}
                    className="mt-2 flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                  >
                    Save Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-md">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{request.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{request.phoneNumber}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{request.address}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="font-medium">{request.serviceType}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequestModal;
