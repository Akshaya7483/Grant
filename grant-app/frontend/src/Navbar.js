import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-menu">
        <span className="menu-icon">☰</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/" className="nav-link" activeClassName="active">Home</NavLink>
        <NavLink to="/grantai" className="nav-link" activeClassName="active">GrantAI</NavLink>
        <NavLink to="/history" className="nav-link" activeClassName="active">History</NavLink>
        <NavLink to="/profile" className="nav-link" activeClassName="active">Profile</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
