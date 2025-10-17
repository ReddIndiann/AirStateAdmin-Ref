import React, { ChangeEvent, FormEvent, ReactNode } from 'react';
import { User, Mail, Phone, MessageCircle, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import CustomDatePicker from '../components/Calender';
import TimeSlotSelector from '../components/TimeSlotSelecter';
import { ConsultFormData } from '../types';




interface BookingFormProps {
  formData: ConsultFormData;
  selectedDate: Date | null;
  selectedTime: Date | null;
  bookedSlots: Date[];
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (event: FormEvent) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: Date | null) => void;

}

interface FormInputProps {
  type?: 'text' | 'email' | 'select' | 'textarea';
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder: string;
  required?: boolean;
  children?: ReactNode; 
}

const FormInput = ({
  type = "text",
  icon: Icon,
  children,
  ...props
}: FormInputProps) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    )}
    {type === "textarea" ? (
      <textarea
        {...props}
        className="w-full pl-10 p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#AE1729] min-h-[100px] font-light"
      />
    ) : type === "select" ? (
      <select
        {...props}
        className="w-full pl-10 p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#AE1729] bg-white font-light"
      >
        {children}
      </select>
    ) : (
      <input
        type={type}
        {...props}
        className="w-full pl-10 p-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#AE1729] font-light"
      />
    )}
  </div>
);

const BookingForm = ({
  formData,
  selectedDate,
  selectedTime,
  bookedSlots,
  handleInputChange,
  handleSubmit,
  setSelectedDate,
  setSelectedTime,

}: BookingFormProps) => {
  const consultationTypes = [
    { value: "general", label: "General Consultancy" },
    { value: "survey", label: "Site/Land Survey" },
    { value: "registration", label: "Property Registration" }
  ];

  const onSubmit = (event: FormEvent) => {
    handleSubmit(event); 
  
  };

  return (
    <div className="max-w-2xl w-full mx-auto bg-white text-black rounded-xl overflow-hidden">
      <form onSubmit={onSubmit} className="space-y-6 p-1">
        <div>
          <h3 className="text-lg font-normal mb-4 flex items-center">
            <CalendarIcon className="mr-2 text-[#AE1729]" />
            Select Date & Time
          </h3>

          <CustomDatePicker 
            onDateSelect={setSelectedDate} 
            bookedSlots={bookedSlots.map(slot => new Date(slot))}
          />

          {selectedDate && (
            <div className="mt-4">
              <h4 className="text-md font-normal mb-2 flex items-center">
                <Clock className="mr-2 text-black" />
                Available Time Slots
              </h4>
              <TimeSlotSelector
                selectedDate={selectedDate}
                bookedSlots={bookedSlots}
                onTimeSelect={setSelectedTime}
              />
            </div>
          )}

          {selectedTime && (
            <div className="mt-4 p-3 bg-[#AE1729]/20 text-[#AE1729] rounded-md">
              <p className="font-normal flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Selected: {selectedTime.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              icon={User}
              required
            />
            <FormInput
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleInputChange}
              icon={Mail}
              required
            />
          </div>

          <FormInput
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            icon={Phone}
        
          />

          <FormInput
            type="select"
            name="consultationType"
            placeholder=""
            value={formData.consultationType}
            onChange={handleInputChange}
            icon={BookOpen}
        
          >
            <option value="">Select Consultation Type</option>
            {consultationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormInput>

          <FormInput
            type="textarea"
            name="description"
            placeholder="Brief description of what you'd like to discuss..."
            value={formData.description}
            onChange={handleInputChange}
            icon={MessageCircle}
            required
          />

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#AE1729] text-white font-medium rounded-md hover:bg-[#920f20] transition-colors focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
          >
            Book Consultation
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
