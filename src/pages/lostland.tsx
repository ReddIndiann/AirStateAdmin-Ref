import React, { useState } from 'react';
import { storage, db } from '../firebase/config'; // Assuming firebase is setup
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getAuth } from 'firebase/auth';

export default function DueDiligence() {
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !image || !phone || !address) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting upload...');
      const storageRef = ref(storage, `lostLandsDocuments/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error('Error during upload:', error);
          toast.error('Error uploading image');
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const auth = getAuth();
          const userId = auth.currentUser?.uid;

          await addDoc(collection(db, 'Lostlands'), {
            name,
            image: downloadURL,
            phone,
            address,
            reviewStatus: 'pending',
            paymentStatus: 'unpaid',
            seenStatus: 'unseen',
            userId,
            createdAt: serverTimestamp(),
          });

          toast.success('Lost Land submitted successfully!');
          console.log('Document created successfully in Firestore');
          setLoading(false);

          // Reset the form after submission
          setName('');
          setImage(null);
          setImagePreview(null); // Reset preview
          setPhone('');
          setAddress('');
          setUploadProgress(null);
        }
      );
    } catch (error) {
      console.error('Error submitting due diligence:', error);
      toast.error('Failed to submit due diligence');
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile)); // Create a preview URL
    }
  };

  return (
    <div className="h-[100vh] flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-md w-[90%] md:w-[50%]">
        <h1 className="text-xl font-bold mb-4">Submit Due Diligence</h1>

        <label className="block mb-2">Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full mb-4"
          placeholder="Enter your name"
        />

        <label className="block mb-2">Image of Lost Land Document</label>
        <input 
          type="file" 
          onChange={handleImageChange}
          className="p-2 border border-gray-300 outline-[#AE1729] rounded w-full mb-4"
          accept="image/*"
        />

        {imagePreview && (
          <div className="mb-4">
            <img src={imagePreview} alt="Image Preview" className="w-full h-auto rounded-md" />
          </div>
        )}

        {uploadProgress !== null && (
          <div className="mb-4">
            <p>Upload Progress: {uploadProgress.toFixed(2)}%</p>
          </div>
        )}

        <label className="block mb-2">Phone Number</label>
        <input 
          type="text" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="p-2 border border-gray-300 outline-[#AE1729] rounded w-full mb-4"
          placeholder="Enter your phone number"
        />

        <label className="block mb-2">Address</label>
        <input 
          type="text" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="p-2 border border-gray-300 outline-[#AE1729] rounded w-full mb-4"
          placeholder="Enter your address"
        />

        <button 
          type="submit" 
          className="w-full p-2 bg-[#AE1729] text-white rounded-md"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
