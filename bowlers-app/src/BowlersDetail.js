import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";

function BowlerDetail() {
  const { id } = useParams();
  const [bowler, setBowler] = useState(null);

  useEffect(() => {
    const fetchBowler = async () => {
      const docRef = doc(db, "bowlers", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setBowler({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such bowler!");
      }
    };

    fetchBowler();
  }, [id]);

  if (!bowler) {
    return <p>Loading...</p>;
  }

  // Use the original scores array including nulls
  const scores = bowler.scores;
  const reversedScores = [...scores].reverse();

  // Calculate the handicap: 100% of 220 minus the average, rounded down
  const handicap = Math.floor(220 - bowler.average);

  // Function to calculate total days ago based on gameDayIndex
  function getTotalDays(gameDayIndex) {
    let totalDays = 0;
    for (let i = 1; i <= gameDayIndex; i++) {
      if (i % 2 === 1) {
        // From Thursday to previous Tuesday: subtract 2 days
        totalDays += 2;
      } else {
        // From Tuesday to previous Thursday: subtract 5 days
        totalDays += 5;
      }
    }
    return totalDays;
  }

  // Assume today's date is September 14th, 2024
  const today = new Date("2024-09-14");

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-primary text-white text-center">
              <h2>{bowler.name}</h2>
              {bowler.nicknames && bowler.nicknames.length > 0 && (
                <h5>
                  <span className="badge bg-light text-dark">
                    Nicknames: {bowler.nicknames.join(", ")}
                  </span>
                </h5>
              )}
            </div>
            <div className="card-body">
              <ul className="list-group">
                <li className="list-group-item">
                  <strong>Average: </strong>
                  {bowler.average}
                </li>
                <li className="list-group-item">
                  <strong>Handicap: </strong>
                  {handicap}
                </li>
                <li className="list-group-item">
                  <strong>Games Played: </strong>
                  {scores.filter((score) => score !== null).length} / {scores.length}
                </li>
                <li className="list-group-item">
                  <strong>Scores:</strong>
                  <ul className="list-group mt-2">
                    {reversedScores.length > 0 ? (
                      reversedScores.map((score, index) => {
                        const gameNumber = scores.length - index;
                        const gameDayIndex = Math.floor(index / 2);
                        const totalDays = getTotalDays(gameDayIndex);

                        const gameDate = new Date("2024-09-12");
                        gameDate.setDate(gameDate.getDate() - totalDays);

                        const diffTime = Math.abs(today - gameDate);
                        const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        return (
                          <li
                            className="list-group-item d-flex justify-content-between"
                            key={index}
                          >
                            <span>
                              Game {gameNumber}: {score !== null ? score : "Absent"}
                            </span>
                            <span>
                              {daysAgo} day{daysAgo !== 1 ? "s" : ""} ago
                            </span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="list-group-item text-muted">
                        No games played yet.
                      </li>
                    )}
                  </ul>
                </li>
              </ul>
            </div>
            <div className="card-footer text-center">
              <Link to="/VTLaneTalk" className="btn btn-secondary">
                Back to Bowlers List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BowlerDetail;