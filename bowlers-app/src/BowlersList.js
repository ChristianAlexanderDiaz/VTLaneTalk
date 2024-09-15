import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore"; // Importing functions with Firestore
import { db } from "./firebase"; // Importing the Firestore database
import { Link } from "react-router-dom"; // Import the Link component

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
  const filteredBowlers = bowlers.filter((bowler) =>
    bowler.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            The Bowling Club at Virginia Tech
          </a>
          <span className="navbar-text">Fall 2024</span>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="container mt-3">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search bowlers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bowlers List */}
      <div className="container mt-4">
        <div className="row">
          {filteredBowlers.map((bowler) => (
            <div key={bowler.id} className="col-12 col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                {/* If you have an image URL in your data, you can use it here */}
                {/* <img src={bowler.imageUrl} className="card-img-top" alt={bowler.name} /> */}
                <div className="card-body d-flex flex-column text-center">
                  <h5 className="card-title">{bowler.name}</h5>
                  {/* Display bowler's name */}
                  <p className="card-text">Average: {bowler.average}</p>
                  {/* Display bowler's average */}
                  <div className="mt-auto d-flex justify-content-center">
                    <Link to={`/bowler/${bowler.id}`} className="btn btn-primary">
                      View Details
                    </Link>
                  </div>
                  {/* Button linking to detailed bowler page */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default BowlersList;