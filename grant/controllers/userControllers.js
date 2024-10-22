const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

module.exports = {
  registerForm: (req, res) => {
    res.render('register');
  },
  register: (req, res) => {
    const { username, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      User.createUser(username, email, hashedPassword, (err, userId) => {
        if (err) {
          res.status(500).send(err.message);
          return;
        }
        res.redirect('/login');
      });
    });
  },
  loginForm: (req, res) => {
    res.render('login');
  },
  login: (req, res) => {
    const { username, password } = req.body;
    User.getUserByUsername(username, (err, user) => {
      if (err) {
        res.status(500).send('An error occurred');
        return;
      }
      if (!user) {
        res.status(404).send('User not found');
        return;
      }
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          res.status(500).send('Error comparing passwords');
          return;
        }
        if (result) {
          req.session.userId = user.id; // Store user ID in session
          res.redirect('/Homepage'); // Redirect to homepage after login
        } else {
          res.status(401).send('Incorrect password');
        }
      });
    });
  }
};
