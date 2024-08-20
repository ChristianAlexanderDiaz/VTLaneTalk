import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB8DIsJawpSnsoQHzqbwhILcBlwLmQpLK4",
    authDomain: "vtlanetalk-61fad.firebaseapp.com",
    projectId: "vtlanetalk-61fad",
    storageBucket: "vtlanetalk-61fad.appspot.com",
    messagingSenderId: "208251209615",
    measurementId: "G-7KXPGPRSRJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }