import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from './firebase';

function BowlersList() {
  const [bowlers, setBowlers] = useState([]);

  useEffect(() => {
    const fetchBowlers = async () => {
      const querySnapshot = await getDocs(collection(db, "bowlers"));
      const bowlerData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBowlers(bowlerData);
    };

    fetchBowlers();
  }, []);

  return (
    <div>
      <h1>Bowlers Scores</h1>
      <ul>
        {bowlers.map((bowler) => (
          <li key={bowler.id}>
            <strong>{bowler.name}</strong>: {bowler.scores.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BowlersList;