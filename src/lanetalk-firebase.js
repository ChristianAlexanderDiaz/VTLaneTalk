// Import Firebase SDK and Firestore services
import { initializeApp } from "firebase/app"; // Import function to initialize the app
import { getFirestore, collection, addDoc } from "firebase/firestore"; // Import Firestore services

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8DIsJawpSnsoQHzqbwhILcBlwLmQpLK4",
  authDomain: "vtlanetalk-61fad.firebaseapp.com",
  projectId: "vtlanetalk-61fad",
  storageBucket: "vtlanetalk-61fad.appspot.com",
  messagingSenderId: "208251209615",
  measurementId: "G-7KXPGPRSRJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Intialize Firestore database instance
const db = getFirestore(app);

// Function to add a bowler to the Firestore database
async function addBowler(name, scores) {
    try {
      // Add a new document with a generated ID to the 'bowlers' collection
      const docRef = await addDoc(collection(db, "bowlers"), {
        name: name, // Add the name of the bowler
        scores: scores // Add the array of scores
      });
      console.log("Bowler added with ID: ", docRef.id); // Log the document ID
    } catch (e) {
      console.error("Error adding bowler: ", e); // Log any errors
    }
}

// Example usage: Adding a bowler with a name and scores
addBowler("Christian", [264, 236, 245, 237, 202, 266, null, null, 268, 237]);

// Function to give two null scores to a specific bowler in the database by name
// async function giveTwoNullScoresToAbsentBowlers(name) {
//   const normalizedBowlerName = normalizeName(name); // Normalize the name to match the format in the database
//   let bowlers = await getCompleteBowlerList(); // Get the complete list of bowlers

//   // Find the bowler by name
//   const bowler = bowlers.find(b => b.name === normalizedBowlerName);

//   if (bowler) {
//     // Add two null scores
//     const updatedScores = [...bowler.scores, null, null];
    
//     // Update the bowler's scores in the database
//     await updateBowlerScores(bowler.id, updatedScores);
//     console.log(`Added two null scores to ${bowler.name}.`);
//   } else {
//     console.log(`Bowler ${name} not found in the database.`);
//   }
// }

// // Checking whether the score receieved is in the bounds of today's meeting
// function isLaneValid(laneNumber, validLanes) {
//   return validLanes.includes(laneNumber);
// }
  