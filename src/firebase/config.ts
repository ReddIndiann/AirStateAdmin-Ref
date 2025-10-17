// firebaseConfig.js or firebaseConfig.ts
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJ6DvHuRJkdZHg0QObUNk5x4ONoVyENlg",
  authDomain: "airstatefinder.firebaseapp.com",
  projectId: "airstatefinder",
  storageBucket: "airstatefinder.appspot.com",
  messagingSenderId: "45314895036",
  appId: "1:45314895036:web:58519614d6ecd24f0b74b9",
  measurementId: "G-ZGVRGQ42Y7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db ,storage};
