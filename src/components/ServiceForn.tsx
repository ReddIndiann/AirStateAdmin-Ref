import React from 'react';
import { BsPlusCircleDotted } from 'react-icons/bs';
import LoadingSpinner from './LoadingSpinner';

interface ServiceRequestFormProps {
  formData: {
    name: string;
    number: string;
    address: string;
    document: File | null;
    documentPreview: string | null;
  };
  loading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  formData,
  loading,
  onInputChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Full Name Field */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-light block">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={onInputChange}
          className="p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none md:w-[60%] w-full"
        />
      </div>

      {/* Phone Number Field */}
      <div className="space-y-2">
        <label htmlFor="number" className="text-sm font-light block">
          Phone Number
        </label>
        <div className="flex md:w-[60%]">
          <div className="border border-black p-2 flex items-center space-x-2 bg-white">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NDAgNDgwIj48cGF0aCBmaWxsPSIjMDA2YjNmIiBkPSJNMCAwaDY0MHY0ODBIMHoiLz48cGF0aCBmaWxsPSIjZmNkMTE2IiBkPSJNMCAwaDY0MHYzMjBIMHoiLz48cGF0aCBmaWxsPSIjY2UxMTI2IiBkPSJNMCAwaDY0MHYxNjBIMHoiLz48cGF0aCBkPSJNMzIwIDIzMS40bC01Mi44IDM4LjMgMjAuMi02Mi4xLTUyLjctMzguNCA2NS4yLS4yIDIwLjEtNjIuMSAyMC4yIDYyaDY1LjJMMzUyLjYgMjA3bDIwLjIgNjIuMS01Mi44LTM4LjN6IiBmaWxsPSIjMDAwIi8+PC9zdmc+"
              alt="Ghana flag"
              className="w-6 h-4"
            />
            <span className="text-gray-600 hidden sm:inline">+233</span>
          </div>
          <input
            id="number"
            type="tel"
            name="number"
            value={formData.number}
            onChange={onInputChange}
            placeholder="Enter your phone number"
            className="flex-1 p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none ml-2"
          />
        </div>
      </div>

      {/* Address Field */}
      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-light block">
          Address
        </label>
        <input
          id="address"
          type="text"
          name="address"
          placeholder="Enter your address"
          value={formData.address}
          onChange={onInputChange}
          className="p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none md:w-[60%] w-full"
        />
      </div>

      {/* Document Upload */}
      <div className="space-y-2">
        <label htmlFor="supportFile" className="text-sm font-light block">
          Upload Site Plan Document
        </label>
        <div className="mt-6">
          <input
            type="file"
            id="supportFile"
            name="document"
            onChange={onInputChange}
            className="hidden"
          />
          <label
            htmlFor="supportFile"
            className="border-dashed border md:w-[80%] border-black h-32 mt-2 flex flex-col items-center text-center justify-center cursor-pointer"
          >
            <BsPlusCircleDotted size={32} className="text-black font-light" />
            <span className="text-gray-400 font-light">
              {formData.document ? formData.document.name : 'Upload document'}
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`md:w-[80%] h-12 w-full bg-[#AE1729] text-white py-2 flex items-center justify-center space-x-2 ${
          loading ? 'cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
           <LoadingSpinner borderColor="#FFFFFF" width='20px' height='20px'/>
        ) : (
          <>
            <span className="text-lg">Submit</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transform rotate-45"
            >
              <path
                d="M7 17L17 7M17 7H7M17 7V17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
};

export default ServiceRequestForm;
