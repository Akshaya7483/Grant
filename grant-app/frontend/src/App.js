import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Homepage from './Homepage';
import GrantAI from './GrantAI';
import HistoryTracking from './HistoryTracking';
import Profile from './Profile';
import Navbar from './Navbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div>
        {isAuthenticated && <Navbar />} {/* Show navbar if authenticated */}
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Homepage /> : <Navigate to="/login" replace />}
          />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/grantai"
            element={isAuthenticated ? <GrantAI /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/history"
            element={isAuthenticated ? <HistoryTracking /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
          />
          {/* Default route to Homepage after login */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
