import React from 'react';
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProps } from '../types';

const GoogleAuth: React.FC<GoogleAuthProps> = ({ type, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full justify-center mt-10 font-light text-[18px] px-4 py-3 bg-white border border-black shadow-sm hover:bg-gray-100"
    >
      <FcGoogle className="mr-2" size={30} />
      {type === "signIn" ? "Sign in with Google" : "Sign up with Google"}
    </button>
  );
};

export default GoogleAuth;
