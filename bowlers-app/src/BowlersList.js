import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from './firebase';

function BowlersList() {
  const [bowlers, setBowlers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBowlers = async () => {
      const querySnapshot = await getDocs(collection(db, "bowlers"));
      const bowlerData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBowlers(bowlerData);
    };

    fetchBowlers();
  }, []);

  const filteredBowlers = bowlers.filter(bowler =>
    bowler.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Bowlers Scores</h1>
      <input
        type="text"
        placeholder="Search by name"
        className="form-control mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul className="list-group">
        {filteredBowlers.map((bowler) => (
          <li key={bowler.id} className="list-group-item">
            <strong>{bowler.name}</strong>: {bowler.scores.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BowlersList;