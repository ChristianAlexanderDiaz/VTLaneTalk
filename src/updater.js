import { initializeApp } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8DIsJawpSnsoQHzqbwhILcBlwLmQpLK4",
  authDomain: "vtlanetalk-61fad.firebaseapp.com",
  projectId: "vtlanetalk-61fad",
  storageBucket: "vtlanetalk-61fad.appspot.com",
  messagingSenderId: "208251209615",
  measurementId: "G-7KXPGPRSRJ"
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Calculates the average from an array of scores.
 * 
 * @param scores - An array of integers representing the scores.
 * @returns The average score as a float, or 0 if the array is empty.
 */
function calculateAverage(scores) {
    if (scores.length === 0) {
        return 0.0;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);
    return total / scores.length;
}

/**
 * Updates the average for each bowler in the Firestore database.
 */
async function updateBowlerAverages() {
    const querySnapshot = await getDocs(collection(db, "bowlers")); // Fetch bowlers from Firestore
    for (const docSnapshot of querySnapshot.docs) {
        const bowlerData = docSnapshot.data();
        const scores = bowlerData.scores;
        const average = calculateAverage(scores);

        // Update the bowler's average in Firestore
        const bowlerRef = doc(db, "bowlers", docSnapshot.id);
        await updateDoc(bowlerRef, { average: average });

        console.log(`Updated ${bowlerData.firstName} ${bowlerData.lastName}'s average to ${average.toFixed(2)}`);
    }
}

async function main() {
    console.log("Updating bowler averages...");
    await updateBowlerAverages();
    console.log("Bowler averages updated successfully!");
}

main().catch(error => {
    console.error("Error updating bowler averages:", error);
})