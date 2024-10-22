// client/src/components/RegisterPage.js

import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage(props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post('/register', { username, email, password })
      .then(response => {
        console.log('Registration successful:', response.data);
        // Redirect to the login page after successful registration
        props.history.push('/login');
      })
      .catch(error => {
        console.error('Error registering user:', error.response.data);
        // Display error message to the user if needed
      });
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        /><br /><br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterPage;
