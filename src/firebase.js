import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAppBa_R2XjGWlmREveL7CA2Ai0oxIiDyA",
  authDomain: "nicefootwaresystem.firebaseapp.com",
  projectId: "nicefootwaresystem",
  storageBucket: "nicefootwaresystem.firebasestorage.app",
  messagingSenderId: "60421437635",
  appId: "1:60421437635:web:c137b855bd0be027bfca76"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
