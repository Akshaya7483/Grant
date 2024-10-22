// client/src/components/LoginPage.js

import React, { useState } from 'react';
import axios from 'axios';

function LoginPage(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // You might also want to handle error messages
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post('/login', { username, password }, { withCredentials: true })
      .then(response => {
        console.log('Login successful:', response.data);
        // Redirect to the homepage after successful login
        props.history.push('/');
      })
      .catch(error => {
        console.error('Error logging in:', error.response.data);
        setError('Invalid username or password');
        // Display error message to the user if needed
      });
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
