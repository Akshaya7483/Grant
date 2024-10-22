const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const userController = require('./controllers/userControllers');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Parse JSON requests

// Enable CORS with credentials
app.use(cors({
  origin: 'http://localhost:3000', // Your React frontend URL
  credentials: true,
}));

// Session middleware
app.use(session({
  secret: 'secret', // Replace with a stronger secret
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60000 } // Optional: Set session expiration
}));

// Static files (if needed for EJS or other static assets)
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (if using EJS for templating)
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index');
});
app.get('/Homepage', (req, res) => {
  res.render('Homepage');
});

app.get('/register', userController.registerForm);
app.post('/register', userController.register);
app.get('/login', userController.loginForm);
app.post('/login', userController.login);

// Route to check if the user is authenticated
app.get('/check-auth', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout route to destroy session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.redirect('/login'); // Redirect to login page
  });
});

const port = 7003;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`http://localhost:${port}`);
});
