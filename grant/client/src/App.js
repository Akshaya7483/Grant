// client/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';

function App() {
  return (
    <Router>
      <Switch>
        {/* Route for the homepage */}
        <Route path="/" exact component={HomePage} />
        {/* Route for the registration page */}
        <Route path="/register" component={RegisterPage} />
        {/* Route for the login page */}
        <Route path="/login" component={LoginPage} />
      </Switch>
    </Router>
  );
}

export default App;
