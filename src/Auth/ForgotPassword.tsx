import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import background from '../assets/top-background.png';
import { toast } from 'react-hot-toast';
import check from '../assets/check-svg.svg';
import axios from 'axios'; // You can also use fetch if preferred

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isError, setIsError] = useState(false); // To handle errors
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input fields
    if (!email) {
      toast.error('Please Enter Your Email.');
      return;
    }

    // Simple email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error('Please Enter a Valid Email Address.');
      return;
    }

    try {
      // Send a POST request to the API endpoint
      const response = await axios.post('https://us-central1-airstatefinder.cloudfunctions.net/sendOtpEmail', { email });

      if (response.status === 200) {
        // Show success modal and response message
        setIsModalOpen(true);
        setResponseMessage(`A one-time OTP code has been sent to ${email}`);
        setIsError(false);

        // Navigate to the OTP page after the modal is closed
        setTimeout(() => {
          setIsModalOpen(false);
          navigate('/otp', { state: { email } }); // Pass email to next page
        }, 3000); // 3-second delay before navigating
      } else {
        throw new Error('Failed to send OTP code');
      }
    } catch (error) {
      setIsModalOpen(true);
      setResponseMessage('An error occurred while sending the OTP code. Please try again.');
      setIsError(true);
      console.error(error);
    }
  };

  return (
    <div className="h-[100vh] flex flex-col items-center relative">
      {/* Background Image */}
      <img className="h-48 w-full absolute top-0" src={background} alt="Background" />

      {/* Positioned Div */}
      <div 
        className="bg-[#AE1729] z-10 h-20 w-[90%] md:w-[65%] flex flex-row items-center justify-between px-8 md:px-12"
        style={{ position: 'absolute', top: '12rem', transform: 'translateY(-50%)' }}
      >
        <h1 className="text-white text-lg md:text-xl">Forgot Password</h1>
        <h5 className="text-white text-sm md:text-base">Airstate</h5>
      </div>

      {/* Form Container */}
      <div className="relative md:w-[46%] md:h-[45%] h-[40%] w-[90%] mt-[18rem] flex flex-col">
        <h1 className="text-xl md:text-2xl font-normal">Password Recovery</h1>
        <small className="text-black opacity-50 text-sm md:text-[14px] font-light">
          Please enter your email to receive a code for your password reset
        </small>

        <form 
          onSubmit={handleSendCode} 
          className="h-[70%] mt-[5%] flex flex-col"
        >
          <label htmlFor="email" className="text-sm mb-2">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 outline-[#AE1729] border border-black mb-6"
            placeholder="Enter your Email"
            type="email"
          />
          <button 
            className="self-end py-3 px-6 bg-[#AE1729] mt-4 text-white w-full md:w-52 hover:bg-[#8E1221] transition-colors"
          >
            Confirm
          </button>
        </form>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-md flex flex-col justify-center items-center shadow-lg h-[50%] md:w-[50%] w-[95%] animate__animated animate__fadeIn">
            <img src={check} alt="Check" className="w-12 h-12" />
            <h2 className="text-xl font-semibold">{isError ? 'Error' : 'Recovery Code Sent'}</h2>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {responseMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
