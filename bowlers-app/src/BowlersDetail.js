import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To access the bowler ID in the URL
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Import your Firestore configuration

function BowlerDetail() {
  const { id } = useParams(); // Get the bowler ID from the URL
  const [bowler, setBowler] = useState(null); // State to store the specific bowler data

  useEffect(() => {
    const fetchBowler = async () => {
      const docRef = doc(db, "bowlers", id); // Reference to the specific bowler document
      const docSnap = await getDoc(docRef); // Fetch the document

      if (docSnap.exists()) {
        setBowler({ id: docSnap.id, ...docSnap.data() }); // Set the bowler data into state
      } else {
        console.log("No such bowler!");
      }
    };

    fetchBowler(); // Fetch the data when the component mounts
  }, [id]);

  if (!bowler) {
    return <p>Loading...</p>; // Render loading while fetching the data
  }

  const validScores = bowler.scores.filter((score) => score !== null); // Filter out invalid scores

  const handicap = Math.floor(220 - bowler.average); // Calculate the handicap

  return (
    <>
      <div className="container">
        <h1>{bowler.name}</h1>
        {/* Customize the page with bowler details */}
        <p>Average: {bowler.average}</p>
        <p>Games Played: {validScores.length}</p>
        <p>Handicap: {handicap}</p>
        <a href="/">Back to Bowlers List</a>
      </div>
    </>
  );
}

export default BowlerDetail;
