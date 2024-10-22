// client/src/components/HomePage.js

import React, { useEffect } from 'react';
import axios from 'axios';

function HomePage(props) {
  // useEffect runs when the component is mounted
  useEffect(() => {
    // Make a request to the backend to check if the user is authenticated
    axios.get('/check-auth', { withCredentials: true })
      .then(response => {
        // If the user is not authenticated, redirect them to the login page
        if (!response.data.authenticated) {
          props.history.push('/login');
        }
      })
      .catch(error => {
        // Handle any errors and redirect to login
        console.error('Error checking authentication:', error);
        props.history.push('/login');
      });
  }, [props.history]); // Runs every time props.history changes

  return (
    <div>
      <h1>Welcome to the Homepage</h1>
      {/* Protected content */}
    </div>
  );
}

export default HomePage;
