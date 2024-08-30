import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore"; // Importing functions with Firestore
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

  // Filter bowlers based on the search term
  const filteredBowlers = bowlers.filter(bowler =>
    bowler.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Nicknames</th>
            <th scope="col">Games</th>
            <th scope="col">Average</th>
            <th scope="col">Scores</th>
          </tr>
        </thead>
        <tbody>
          {filteredBowlers.map((bowler, index) => (
            <tr key={bowler.id}>
              <th scope="row">{index + 1}</th>
              <td>{bowler.name}</td>
              <td>{bowler.nicknames}</td>
              <td>{bowler.scores.length}</td>
              <td>{bowler.average}</td>
              <td>{bowler.scores.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BowlersList;