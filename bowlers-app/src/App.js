import './App.css';
import React from 'react';
import BowlersList from './BowlersList';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BowlersDetail from "./BowlersDetail";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BowlersList />} />
        <Route path="/bowler/:id" element={<BowlersDetail />} />
        {/* Route for detailed bowler page */}
      </Routes>
    </Router>
  );
}

export default App;
