// components/TimeSlotSelector.tsx
import React from 'react';
import { Clock } from 'lucide-react';

// Define the types for the props
interface TimeSlotSelectorProps {
  selectedDate: Date; // selectedDate is a Date object
  bookedSlots: Date[]; // bookedSlots is an array of Date objects
  onTimeSelect: (slot: Date) => void; // onTimeSelect is a function that takes a Date as an argument
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedDate,
  bookedSlots,
  onTimeSelect,
}) => {
  // Function to generate time slots from 8:00 AM to 5:00 PM
  const generateTimeSlots = () => {
    const slots: Date[] = [];
    for (let hour = 8; hour < 17; hour++) {
      const time = new Date(selectedDate);
      time.setHours(hour, 0, 0, 0);
      slots.push(time);
    }
    return slots;
  };

  // Function to check if a time slot is booked
  const isSlotBooked = (slot: Date) => {
    return bookedSlots.some(
      (bookedSlot) => bookedSlot.getTime() === slot.getTime()
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
      {selectedDate &&
        generateTimeSlots().map((slot, index) => (
          <button
            key={index}
            onClick={() => onTimeSelect(slot)}
            disabled={isSlotBooked(slot)}
            className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center text-sm ${
              isSlotBooked(slot)
                ? 'bg-red-200 text-red-800 cursor-not-allowed'
                : 'bg-gray-50 text-gray-600 hover:bg-blue-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
            }`}
          >
            <Clock className="mr-2 w-4 h-4" />
            {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </button>
        ))}
    </div>
  );
};

export default TimeSlotSelector;
