import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAy2JYFcg3djKksgc1bf7Qoo5pS1nWSLmk",
    authDomain: "influencer-booster.firebaseapp.com",
    projectId: "influencer-booster",
    storageBucket: "influencer-booster.appspot.com",
    messagingSenderId: "697387259125",
    appId: "1:697387259125:web:dfc22d958c34ead7e461bc",
    measurementId: "G-N2HQPL3TWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); // Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export default db;