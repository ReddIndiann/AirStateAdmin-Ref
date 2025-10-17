import React, { useState } from 'react';
import background from '../assets/background.svg';
import logo from '../assets/logo.svg';
import { Divider, GoogleAuth } from '../components';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from '../firebase/config';
import { useUser } from '../Context/AuthContext';
import { doc, getDoc } from "firebase/firestore";
import LoadingSpinner from '../components/LoadingSpinner';
import { User } from '../types';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate(); // Navigation after login
  const { login } = useUser();
  const [loading, setLoading] = useState(false);

  // Handler for Email/Password login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validate input fields
    if (!email) {
      toast.error('Please enter your Email.');
      return;
    }
  console.log(name)
    if (!password) {
      toast.error('Please enter your Password.');
      return;
    }

    setLoading(true);
  
    try {
      // Firebase authentication with Email/Password
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
  
     
     
  
      const getUsername = async (uid: string) => {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role || 'user'; // Default to 'user' if role is not set
            
            if (role !== 'admin') {
              toast.error('Access denied. Admin privileges required.');
              await auth.signOut();
              return null;
            }
            toast.success('Logged in successfully!');
            return {
              id: uid,
              uid: uid,
              email: userData.email,
              name: userData.name || "Anonymous",
              phoneNumber: userData.phoneNumber || "",
              role: role
            };
          } else {
            console.error("No such user!");
            return null;
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          return null;
        }
      };
  
      // Fetch the user's name and then log them in
      const userData = await getUsername(user.uid);
      if (userData) {
        setName(userData.name); // Optionally set state
        login(userData as User); // Store user data in global state and localStorage
      }
  
      // Redirect to homepage or dashboard after successful login
      navigate('/home');  // Adjust the path as per your app structure
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  // Handler for Google Sign-In
 // Handler for Google Sign-In
const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    // Firebase authentication with Google
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Fetch user details from Firestore
    const getUsername = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || 'user';
          
          if (role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            await auth.signOut();
            return null;
          }

          return {
            id: uid,
            uid: uid,
            email: userData.email,
            name: userData.name || "Anonymous",
            phoneNumber: userData.phoneNumber || "",
            role: role
          };
        } else {
          console.error("No such user document!");
          return null;
        }
      } catch (error) {
        console.error("Error fetching user from Firestore:", error);
        return null;
      }
    };

    // Fetch the user's Firestore data and store it in global state and/or local storage
    const userData = await getUsername(user.uid);
    if (userData) {
      setName(userData.name); // Optionally set state
      login(userData); // Store user data in global state and local storage
      toast.success('Logged in with Google successfully!');

      // Redirect to homepage or dashboard after successful login
      navigate('/home'); // Adjust the path as per your app structure
    } else {
      // If user data doesn't exist in Firestore, handle accordingly
      console.error("User data not found in Firestore.");
      toast.error('Google sign-in failed. Please try again.');
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    toast.error('Google sign-in failed. Please try again.');
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
        <h1 className='font-light text-2xl text-center'>Welcome back, explore solutions</h1>
        <small className='text-center md:text-[15px] font-light opacity-50'>
          Sign in to access a suite of professional real estate solutions
        </small>

        {/* Google Sign-In */}
        <div className='w-[95%] md:w-[85%]'>
            <GoogleAuth type='signIn' onClick={handleGoogleSignIn} />
            <Divider />
        </div>

        {/* Sign-In Form for Email/Password */}
        <form onSubmit={handleSignIn} className=' w-[95%] md:w-[85%] flex flex-col h-[60%]'>
          <label htmlFor="email" className='text-sm mb-2'>Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className='p-3  outline-[#AE1729] border border-black mb-6'
            type="text"
          />

          <label htmlFor="password" className='text-sm mt-6 mb-2'>Password</label>
          <input
            id="password"
            placeholder='Enter your password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='p-3  outline-[#AE1729] border border-black mb-6'
            type="password"
          />

          <button 
            className='p-3 h-12 bg-[#AE1729] rounded-sm text-white mt-8 flex justify-center items-center'
            disabled={loading}
          >
            {loading ? <LoadingSpinner borderColor="#FFFFFF" width='20px' height='20px'/> : 'Sign In'}
          </button>

          <NavLink to='/forgotpassword' className='text-right mt-7 hover:underline'>
            Forgot Password?
          </NavLink>

          <NavLink to='/signup'>
          <h3 className='text-md font-light mt-10 text-center'>
            Don't have an account? <span className='text-[#AE1729] font-medium'>Sign Up</span>
          </h3>
        </NavLink>
        </form>
      </div>
    </div>
  );
}
