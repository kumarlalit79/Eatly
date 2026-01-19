// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "eatly-8b91f.firebaseapp.com",
  projectId: "eatly-8b91f",
  storageBucket: "eatly-8b91f.firebasestorage.app",
  messagingSenderId: "1007599413914",
  appId: "1:1007599413914:web:c7834dadd27264c6dc8d23",
  measurementId: "G-4RX314K4S4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app)

export {app,auth}