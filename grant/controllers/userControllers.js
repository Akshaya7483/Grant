const session = require('express-session');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

module.exports = {
    registerForm: (req, res) => {
        res.render('register');
    },
    register: (req, res) => {
        const { username, email, password } = req.body;
        // Hash the password before saving it
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                res.status(500).send(err.message);
                console.log("error here")
                return;
            }
            User.createUser(username, email, hashedPassword, (err, userId) => {
                if (err) {
                    res.status(500).send(err.message);
                    console.log("error there")
                    return;
                }  
                res.redirect(`/`);
             
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
                console.error("Error retrieving user:", err.message);
                res.status(500).send("An error occurred while retrieving user information");
                return;
            }
            if (!user) {
                console.error("User not found for username:", username);
                res.status(404).send('User not found');
                return;
            }
            // Check if passwords match
          
            bcrypt.compare(password, user.password, (err, result) => {
                
                if (err) {
                    console.error("Error comparing passwords:", err.message);
                    res.status(500).send("An error occurred while comparing passwords");
                    return;
                }
                if (result) {
                    req.session.userId = user.id;
                    userId=user.id
                    res.redirect(`/Homepage`);
                } else {
                    console.error("Incorrect password for username:", username);
                    res.status(401).send('Incorrect password');
                }
            });
        });
    },
    
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.redirect('/');
        });
    }
};