import React, { useState } from 'react';

// Define the types for the props
interface CustomDatePickerProps {
  onDateSelect: (date: Date) => void; // Function that accepts a Date and returns void
  bookedSlots: Date[]; // Array of booked Date objects
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ onDateSelect, bookedSlots }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date()); // Current month as a Date object

  // Generate the days for the calendar grid
  const generateCalendarDays = (): (Date | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    
    // Add nulls for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add actual dates
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    return days;
  };

  // Check if the date is selectable
  const isDateSelectable = (date: Date | null): boolean => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight for comparison

    // Check if the date is after today
    if (date < today) return false;

    // Generate time slots for this date
    const dateSlots: Date[] = [];
    for (let hour = 8; hour < 17; hour++) {
      const time = new Date(date);
      time.setHours(hour, 0, 0, 0);
      dateSlots.push(time);
    }

    // Check if all slots are booked for this date
    const allBooked = dateSlots.every((slot) =>
      bookedSlots.some((bookedSlot) => bookedSlot.getTime() === slot.getTime())
    );

    // Return true if date is not fully booked
    return !allBooked;
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
          }
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-normal text-gray-800">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
          }
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="font-medium text-xs text-gray-500 uppercase">
            {day}
          </div>
        ))}
        {generateCalendarDays().map((date, index) => (
          <button
            key={index}
            onClick={() => date && onDateSelect(date)} // Trigger the onDateSelect callback
            disabled={!isDateSelectable(date)} // Disable if not selectable
            className={`p-2 rounded-md transition-all duration-200 ${
              !date
                ? 'bg-transparent'
                : isDateSelectable(date)
                ? 'text-red-800 hover:bg-red-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-800'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            {date ? date.getDate() : ''}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomDatePicker;
