import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />         {/* Default route */}
          <Route path="/login" element={<Login />} />    {/* Login page */}
          <Route path="/register" element={<Register />} /> {/* Register page */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
