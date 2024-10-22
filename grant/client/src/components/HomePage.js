import React, { useEffect } from 'react';
import axios from 'axios';

function HomePage(props) {
  useEffect(() => {
    axios.get('/check-auth', { withCredentials: true })
      .then(response => {
        if (!response.data.authenticated) {
          props.history.push('/login');
        }
      })
      .catch(error => {
        console.error('Error checking authentication:', error);
        props.history.push('/login');
      });
  }, [props.history]);

  const handleLogout = () => {
    axios.get('/logout', { withCredentials: true })
      .then(response => {
        props.history.push('/login');
      })
      .catch(error => {
        console.error('Error logging out:', error);
      });
  };

  return (
    <div>
      <h1>Welcome to the Homepage</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default HomePage;
