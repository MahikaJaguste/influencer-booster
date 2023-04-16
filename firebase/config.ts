import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAoaNLMLah0b4aJga2u_aSIHsML6VPePf4",
  authDomain: "consent-attest.firebaseapp.com",
  projectId: "consent-attest",
  storageBucket: "consent-attest.appspot.com",
  messagingSenderId: "556489540916",
  appId: "1:556489540916:web:ec7c403c8358c8d3fa5161",
  measurementId: "G-VQP6TEDNJE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); // Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export default db;