const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to log every incoming request
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
});

// Define routes
app.post('/get-otp', authController.getOtp);
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/reset-password', authController.resetPassword);
app.post('/check-email', authController.checkEmail);



app.listen(8081, () => {
    console.log("Server running on http://localhost:8081/");
});
