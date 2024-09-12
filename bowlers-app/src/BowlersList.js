import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore"; // Importing functions with Firestore
import { db } from "./firebase"; // Importing the Firestore database
import { Link } from "react-router-dom"; // Import the Link component

/**
 * This component will render each bowler in a Bootstrap card, displaying their name, average,
 * and a button to navigate to their detailed page.
 */
function BowlersList() {
  const [bowlers, setBowlers] = useState([]); // State to store the list of bowlers
  const [searchTerm, setSearchTerm] = useState(""); // State for search term input

  useEffect(() => {
    const fetchBowlers = async () => {
      const querySnapshot = await getDocs(collection(db, "bowlers")); // Fetch bowlers from Firestore
      const bowlerData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })); // Extracting ID and data
      bowlerData.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name alphabetically
      setBowlers(bowlerData); // Set the fetched data into state
    };

    fetchBowlers(); // Call the async function to fetch data
  }, []);

  // Filter bowlers based on the search term
  const filteredBowlers = bowlers.filter(
    (bowler) => bowler.name.toLowerCase().includes(searchTerm.toLowerCase()) // Simple search functionality
  );

  return (
    <>
      <nav class="navbar bg-body-tertiary">
        <div class="container-fluid">
          <a class="navbar-brand" href="/">
            The Bowling Club at Virginia Tech
          </a>
          <span class="navbar-text">Fall 2024</span>
        </div>
      </nav>

      <div className="card-group">
        {filteredBowlers.map((bowler) => (
          <div className="card mb-3" key={bowler.id} style={{ minWidth: "18rem" }}>
            {/* Card for each bowler */}
            <div className="card-body">
              <h5 className="card-title">{bowler.name}</h5>
              {/* Display bowler's name */}
              <p className="card-text">Average: {bowler.average}</p>
              {/* Display bowler's average */}
              <Link to={`/bowler/${bowler.id}`} className="btn btn-primary">
                View Details
              </Link>
              {/* Button linking to detailed bowler page */}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default BowlersList;
