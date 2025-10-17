import React, { useState, useRef, useEffect } from 'react';
import background from '../assets/top-background.png';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function OtpScreen() {
  const [otp, setOtp] = useState(['', '', '', '']); // 6 digit OTP
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation(); // To retrieve the email from the previous screen

  const email = location.state?.email; // Access the email passed via navigate

  // Ensure email is present, otherwise redirect or handle the error
  useEffect(() => {
    if (!email) {
      navigate('/forgotpassword'); // Redirect if no email is found
    }
  }, [email, navigate]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to the next input if the value is entered and it's not the last input
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];

      // Clear current input
      if (otp[index]) {
        newOtp[index] = '';
      } else if (index > 0) {
        // Focus previous input if current is empty
        inputRefs.current[index - 1]?.focus();
        newOtp[index - 1] = '';
      }

      setOtp(newOtp);
    }
  };

  const handleConfirm = async () => {
    const filledOtp = otp.join('');
    if (filledOtp.length < 4) {
      toast.error('Please enter the complete OTP.');
      return;
    }

    try {
      // Call the API to verify the OTP
      const response = await axios.post('https://us-central1-airstatefinder.cloudfunctions.net/verifyOtp', {
        email,
        otp: filledOtp,
      });

      // Log the response
   
      if (response.status === 200) {
        setModalMessage('OTP verified successfully!');
        setIsModalOpen(true);

        // Passing userId to the next page
        setTimeout(() => {
          navigate('/resetpassword', { state: { userId: response.data.userId, email } });
        }, 2000);
      } else {
        setModalMessage('Invalid OTP. Please try again.');
        setIsModalOpen(true);
      }
    } catch (error) {
      setModalMessage('Error verifying OTP. Please try again.');
      setIsModalOpen(true);
      console.error(error);
    }
  };

  const handleResendOtp = async () => {
    try {
      // Call the API to resend the OTP
      const response = await axios.post('https://us-central1-airstatefinder.cloudfunctions.net/sendOtpEmail', {
        email,
      });

      if (response.status === 200) {
        setModalMessage('OTP has been resent!');
        setIsModalOpen(true);
      } else {
        setModalMessage('Failed to resend OTP.');
        setIsModalOpen(true);
      }
    } catch (error) {
      setModalMessage('Error resending OTP. Please try again.');
      setIsModalOpen(true);
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

      {/* Heading and Instructions */}
      <div className="relative flex flex-col items-center mt-[20rem] w-[90%] md:w-[40%]">
        <h1 className="text-xl md:text-2xl font-normal">Enter One-Time Code</h1>
        <p className="text-sm md:text-base text-gray-500 mt-2 text-center">
          Please enter the 4 digit code sent to your email
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-4 mt-6 mb-10">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              maxLength={1}
              className="w-16 h-16 sm:w-20 sm:h-20 text-center text-2xl border border-black focus:outline-none focus:ring-2 focus:ring-[#AE1729]"
              type="text"
            />
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={handleConfirm}
          className="mt-6 py-3 px-6 bg-[#AE1729] text-white w-80 md:w-96 hover:bg-[#8E1221] transition-colors mb-4"
        >
          Confirm OTP
        </button>

        <button
          onClick={handleResendOtp}
          className="mt-3 text-[#AE1729] underline w-full md:w-52 text-center"
        >
          Resend OTP
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-md flex flex-col justify-center items-center shadow-lg w-[90%] sm:w-[40%]">
            <h2 className="text-xl font-semibold">{modalMessage}</h2>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {modalMessage === 'OTP verified successfully!' 
                ? 'You will be redirected shortly.' 
                : 'Please try again or contact support.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
