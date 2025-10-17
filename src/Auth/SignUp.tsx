import React, { useState } from 'react';
import background from '../assets/background.svg';
import logo from '../assets/logo.svg';
import { Divider, GoogleAuth } from '../components';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../Context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {  getDoc } from "firebase/firestore";
export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useUser();
  const [loading, setLoading] = useState(false);
  // Function to generate a random password (for Google sign-up)


  // Handle Google Sign-Up and automatically link with Email/Password
  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Sign in with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      if (!user.email) {
        throw new Error("Email is missing from Google account");
      }
  
      // Check if the user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
  
      if (!userSnapshot.exists()) {
        // If the user does not exist, create the document
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          email: user.email,
          createdAt: new Date(),
          provider: "google",
          imageUrl: "",
          role: "user"
        });
      }
  
      // Fetch the user details from Firestore
      const userData = await getDoc(userRef);
  
      if (userData.exists()) {
        const data = userData.data();
        login({
          id: data.uid,
          uid: data.uid,
          email: data.email,
          name: data.name,
          phoneNumber: data.phoneNumber || "",
          role: data.role || "user"
        }); // Store user data in global state and local storage
  
        toast.success("Google account registered successfully!");
        navigate("/home");
      } else {
        throw new Error("Failed to fetch user data after registration.");
      }
    } catch (error) {
      console.error("Error with Google Sign-Up:", error);
      toast.error("Error signing up with Google. Please try again.");
    }
  };
  

  // Handle Email/Password Sign-Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Please enter your Full name');
      return;
    }
    if (!email) {
      toast.error('Please enter your Email.');
      return;
    }
    if (!password) {
      toast.error('Please enter your Password.');
      return;
    }

    setLoading(true);

    try {
      // Create the user with Email/Password
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: user.email,
        createdAt: new Date(),
        provider: "email",
        imageUrl: "",
        role: "user"
      });

      toast.success('Account created successfully!');
   
      // Store user data in global state and localStorage
      login({ 
        id: user.uid,
        uid: user.uid, 
        email, 
        name,
        phoneNumber: "",
        role: "user"
      });

      navigate('/home')
    } catch (error) {
      console.error("Error with Email/Password Sign-Up:", error);
      toast.error('Error signing up with Email/Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100vh] flex justify-center items-center my-10 md:my-0 md:flex-row md:justify-around md:p-12 md:px-16">
       <div className="h-full w-[45%] relative hidden lg:block">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={background}
            alt=""
          />
        </div>
        <div className="flex flex-col items-center justify-center h-[99%] w-[80%] lg:w-[40%]">
        <img className="w-44 sm:w-44 md:w-72 max-w-72" src={logo} alt="" />
        <h1 className='font-light text-2xl text-center'>Register for our services</h1>
        <small className='text-center md:text-[15px] font-light opacity-50'>Sign up to access a suite of professional real estate solutions</small>

        {/* Google Sign-Up Button */}
        <div className='w-[95%] md:w-[85%]'>
        <GoogleAuth type='signUp' onClick={handleGoogleSignUp} />
        <Divider />
        </div>

        {/* Sign-Up Form for Email/Password */}
        <form onSubmit={handleEmailSignUp} className=' w-[95%] md:w-[85%] flex flex-col h-[60%]'>
          <label htmlFor="" className='text-sm mb-2'>Full Name</label>
          <input
            placeholder='Enter your full name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='p-3  outline-[#AE1729] border border-black mb-6'
            type="text"
          />
          <label htmlFor="" className='text-sm mb-2'>Email</label>
          <input
            placeholder='Enter your email address'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='p-3 outline-[#AE1729] border border-black mb-6'
            type="email"
          />
          <label htmlFor="" className='text-sm mb-2'>Password</label>
          <input
            placeholder='Enter your password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='p-3 outline-[#AE1729] border border-black mb-14'
            type="password"
          />
          <button 
            className='p-3 h-12 bg-[#AE1729] rounded-sm text-white mb-4 flex justify-center items-center'
            disabled={loading}
          >
            {loading ? <LoadingSpinner borderColor="#FFFFFF" width='20px' height='20px'/> : 'Create account'}
          </button>

          {/* Navigation to Login */}
        <NavLink to='/'>
          <h3 className='text-md font-light mt-3 text-center'>Already have an account? <span className='text-[#AE1729] font-medium'>Sign In</span></h3>
        </NavLink>
        </form>
      </div>
    </div>
  );
}
