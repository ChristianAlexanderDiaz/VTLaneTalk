import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore"; // Importing functions with firestore
import { db } from './firebase'; // Importing the Firestore database

/**
 * This page will handle showing all the bowlers in a list with various cards.
 */
function BowlersList() {
  const [bowlers, setBowlers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBowlers = async () => {
      const querySnapshot = await getDocs(collection(db, "bowlers")); // Fetch bowlers from Firestore
      const bowlerData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Map the data to include document ID and data
      bowlerData.sort((a, b) => a.name.localeCompare(b.name)); // Sorting bowlers alphabetically by their name
      setBowlers(bowlerData); // Update the state with fetched and sorted data
    };

    fetchBowlers();
  }, []);

  const filteredBowlers = bowlers.filter(bowler =>
    bowler.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      {/* Search bar for filtering bowlers by name */}
      <input 
        type="text"
        placeholder="Search bowlers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="form-control mb-3"
      />

      <div className="row">
        {filteredBowlers.map((bowler) => (
          <div className="col-md-4" key={bowler.id}>
            <div className="card mb-4">
              {/* Placeholder for bowler's image */}
              <img src="..." className="card-img-top" alt="" />
              <div className="card-body">
                {/* Bowler's name */}
                <h5 className="card-title">{bowler.name}</h5>
                {/* Bowler's average */}
                <p className="card-text">Avg: </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BowlersList;