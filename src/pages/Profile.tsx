import { useState, useEffect, useRef } from 'react';
import { auth, storage, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import Flag from '../assets/Ghana.png';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { BiEdit } from "react-icons/bi";
import { toast } from 'react-hot-toast';
import { ProfileData } from '../types';
import {  CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const user = auth.currentUser;
  const uid = user?.uid;

  const [isLoading, setIsLoading] = useState(false);

  // State management
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phoneNumber: "",
    uuid: "",
    provider: "",
    location: "",
    createdAt: "",
    imageUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Ref to prevent duplicate toast messages
  const hasShownToast = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return;
      setLoading(true);

      try {
        const userDoc = doc(db, "users", uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setProfileData(docSnap.data() as ProfileData);
          if (!hasShownToast.current) {
            toast.success("Profile data loaded successfully.", {
              icon: <CheckCircle color="#00ff00" />,
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              }
            });
            hasShownToast.current = true;
          }
        } else {
          toast.error("No profile data found.");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(`Error loading profile data: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    const loadProfilePicture = async () => {
      try {
        if (user?.providerData[0]?.providerId === 'google.com') {
          setImagePreview(user.photoURL); // Google profile picture
        } else {
          const profileRef = ref(storage, `profile/${uid}/profile.png`);
          const url = await getDownloadURL(profileRef);
          setImagePreview(url); // Profile pic from Firebase Storage
        }
      } catch {
        console.log("No profile picture found.");
      }
    };

    if (uid) {
      fetchProfile();
      loadProfilePicture();
    }
  }, [uid, user?.providerData, user?.photoURL]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uid) {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL); // Show preview

      const storageRef = ref(storage, `profile/${uid}/profile.png`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setImagePreview(downloadURL);
        toast.success("Profile picture uploaded successfully.");
      } catch {
        toast.error("Error uploading profile picture.");
      }
    }
  };

  // Update profile information in Firestore
  const handleSaveChanges = async () => {
    if (!uid) return;

    try {
      const userDoc = doc(db, "users", uid);
      await updateDoc(userDoc, profileData as Partial<ProfileData>);
      toast.success("Profile updated successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Error updating profile: ${error.message}`);
      }
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}
      >
        <div
          style={{
            border: "4px solid #AE1729",
            borderTop: "4px solid transparent",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite"
          }}
        ></div>
      </div>
    );
  }

  return (
<div className="h-full">
  <div className="bg-white flex flex-col min-h-full mb-4">
    <div className="py-3 px-6 border-b border-stone-100 mb-4">
      <h2 className="text-sm font-normal">Settings - Profile</h2>
    </div>

    <h3 className="text-lg font-normal px-6">Profile Details</h3>
    <small className="text-gray-600 px-6 font-light">
      Reach out to us on any issues you are facing and we will respond with the help needed.
    </small>
    <small className="text-gray-600 px-6 font-light">Please fill out the form below.</small>

    {/* Profile Picture Section */}
    <div className="flex flex-row mt-10 px-6">
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
        {imagePreview ? (
          <img src={imagePreview} alt="Profile" className="w-16 h-16 rounded-full" />
        ) : (
          <CameraAltIcon className="text-white" />
        )}
      </div>
      <div className="ml-4">
        <div className="flex flex-row cursor-pointer">
          <label htmlFor="profileImageUpload" className="text-[#AE1729] cursor-pointer">
            <BiEdit />
          </label>
          <input
            type="file"
            id="profileImageUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <small className="text-[#AE1729] font-bold">Add profile Photo</small>
        </div>
        <small className="text-xs text-gray-400 font-light">66 x 66 pixels</small>
      </div>
    </div>

    {/* Profile Fields */}
    <div className="mt-10 px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:w-4/5">
      <div className="flex flex-col">
        <label htmlFor="name" className="text-sm font-light mb-2">Full Name</label>
        <input
          type="text"
          id="name"
          value={profileData.name || ""}
          placeholder="Please add your name"
          className="p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none"
          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="email" className="text-sm font-light mb-2">Email</label>
        <input
          type="email"
          id="email"
          value={profileData.email || ""}
          placeholder="Please add your email"
          className="p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none"
          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="phoneNumber" className="text-sm font-light mb-2">Phone Number</label>
        <div className="flex items-center justify-evenly">
          <div className="w-[25%] h-full flex items-center border border-black mr-2 px-2 lg:justify-start justify-center">
            <img src={Flag} alt="Ghana Flag" className="w-5 h-5" />
            <span className="text-sm opacity-60 ml-1 font-light hidden sm:inline">+233</span>
          </div>
          <input
            type="tel"
            id="phoneNumber"
            value={profileData.phoneNumber || ""}
            placeholder="Please add your phone number"
            className="p-2 border border-black w-full font-light focus:border-[#AE1729] focus:outline-none"
            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label htmlFor="location" className="text-sm font-light mb-2">Location</label>
        <input
          type="text"
          id="location"
          value={profileData.location || ""}
          placeholder="Please add your location"
          className="p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none"
          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="password" className="text-sm font-light mb-2">Password</label>
        <input
          type="password"
          id="password"
          placeholder="*********"
          className="p-2 border border-black font-light focus:border-[#AE1729] focus:outline-none"
        />
        <button className="text-xs self-end underline text-gray-400 mt-3 font-light"></button>
      </div>
    </div>

    {/* Save Changes Button */}
    <div className="flex flex-row justify-start"> 
      <button
        onClick={handleSaveChanges}
        className="w-full bg-[#AE1729] text-white p-3 md:w-[37.5%] h-12 my-6 mx-6 font-semibold flex items-center justify-center"
        disabled={isLoading}
      >
        {loading ? <LoadingSpinner borderColor="#FFFFFF" width='20px' height='20px'/> : 'Save Changes    →'}
      </button>
    </div>
  </div>
</div>

  );
}
