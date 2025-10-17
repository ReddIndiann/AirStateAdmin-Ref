import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import background from '../assets/top-background.png';
import { toast } from 'react-hot-toast';
import check from '../assets/check-svg.svg';
import axios from 'axios';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve userId and email from the previous screen
  const { userId } = location.state || {};

  // Ensure userId is passed, otherwise redirect
  useEffect(() => {
    if (!userId) {
      navigate('/forgotpassword'); // Redirect if no userId is found
    }
  }, [userId, navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (!password) {
      toast.error('Please enter a new password.');
      return;
    }

    if (!confirmPassword) {
      toast.error('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error("The passwords don't match.");
      return;
    }

    try {
      // Make the API call to reset the password
      const response = await axios.post('https://us-central1-airstatefinder.cloudfunctions.net/resetPassword', {
        userId,
        newPassword: password,
      });

      if (response.status === 200) {
        setIsModalOpen(true); // Show success modal
        setTimeout(() => {
          navigate('/'); // Redirect to login after success
        }, 5000); // Redirect after 5 seconds
      } else {
        toast.error('Failed to reset the password. Please try again.');
      }
    } catch (error) {
      toast.error('Error resetting password. Please try again.');
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
        <small className="text-sm md:text-base text-gray-500 mt-2">
          Please enter and confirm your new password.
        </small>

        <form 
          onSubmit={handleReset} 
          className="h-auto mt-6 flex flex-col gap-4"
        >
          <label htmlFor="password" className="text-sm">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 outline-[#AE1729] border border-black mb-6"
            placeholder="Enter your new password"
            type="password"
            id="password"
          />
          <label htmlFor="confirmPassword" className="text-sm mt-2">Confirm Password</label>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 outline-[#AE1729] border border-black mb-6"
            placeholder="Confirm your password"
            type="password"
            id="confirmPassword"
          />
          <button 
            type="submit" 
            className="self-end py-3 px-6 bg-[#AE1729] mt-4 text-white w-full md:w-52 hover:bg-[#8E1221] transition-colors"
          >
            Confirm
          </button>
        </form>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-md flex flex-col justify-center items-center shadow-lg h-[50%] md:w-[50%] w-[95%]">
            <img src={check} alt="Success" />
            <h2 className="text-xl font-semibold">Password reset successful</h2>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Your password has been changed. Please log in with your new password.
              <br className='md:hidden'/>
              You will be redirected to the login page soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
