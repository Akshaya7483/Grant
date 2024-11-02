const db = require('../db');
const { exec } = require('child_process');
const crypto = require('crypto');


exports.getOtp = (req, res) => {
    const { email, type } = req.body;
    console.log(`Received OTP request for email: ${email} with type: ${type}`);

    // Check if the OTP request is for "forgot-password"
    if (type === "forgot-password") {
        const userQuery = `SELECT * FROM users WHERE email = ?`;
        db.get(userQuery, [email], (err, user) => {
            if (err) {
                console.error("Error checking user existence:", err.message);
                return res.status(500).json({ success: false, message: "Server error. Please try again later." });
            }
            if (!user) {
                return res.status(400).json({ success: false, message: "Invalid username" });
            }

            // Generate and send OTP since user exists
            sendOtp(email, res);
        });
    } else if (type === "register") {
        // Directly generate OTP for registration without checking user existence
        sendOtp(email, res);
    } else {
        res.status(400).json({ success: false, message: "Invalid request type" });
    }
};

// Helper function to generate, store, and send OTP
function sendOtp(email, res) {
    // Generate a 6-digit OTP using Math.random
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a random number between 100000 and 999999
    console.log(`Generated OTP for ${email}: ${otp}`);

    const sql = `INSERT INTO otp_requests (email, otp, created_at) VALUES (?, ?, datetime('now'))`;
    db.run(sql, [email, otp], function (err) {
        if (err) {
            console.error("Failed to store OTP:", err.message);
            return res.status(500).json({ success: false, message: "Failed to store OTP" });
        }

        // Execute Python script to send OTP email
        exec(`python send_email.py ${email} ${otp}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error.message}`);
                return res.status(500).json({ success: false, message: "Failed to send OTP email" });
            }
            console.log(`OTP email sent to ${email}: ${stdout}`);
            res.json({ success: true, message: "OTP sent to your email" });
        });
    });
}


exports.register = (req, res) => {
    const { email, otp, password, confirmPassword, name } = req.body;

    const otpQuery = `SELECT * FROM otp_requests WHERE email = ? AND otp = ?`;
    db.get(otpQuery, [email, otp], (err, otpRecord) => {
        if (err) {
            console.error("Failed to verify OTP:", err.message);
            return res.status(500).json({ success: false, message: "Failed to verify OTP" });
        }
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (password.length < 4) {
            return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        const userQuery = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
        db.run(userQuery, [name, email, password], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, message: "User already exists with this email" });
                }
                console.error("Failed to save user details:", err.message);
                return res.status(500).json({ success: false, message: "Failed to save user details" });
            }

            res.json({ success: true, message: "Registration successful. Redirecting to login page..." });
        });
    });
};

exports.checkEmail = (req, res) => {
    const { email } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
        if (err) {
            console.error("Error checking email:", err.message);
            return res.status(500).json({ success: false, message: "Server error" });
        }
        if (row) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    });
};



exports.login = (req, res) => {
    const { email, password } = req.body;
    console.log("Attempting login with:", email, password);

    const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
    db.get(sql, [email, password], (err, user) => {
        if (err) {
            console.error("Login failed:", err.message);
            return res.status(500).json({ success: false, message: "Login failed" });
        }
        if (user) {
            console.log("User found:", user);
            res.json({ success: true, message: "Login successful" });
        } else {
            console.log("No user found with provided credentials.");
            res.json({ success: false, message: "Invalid credentials " });
        }
    });
};


exports.resetPassword = (req, res) => {
    const { email, otp, newPassword } = req.body;

    const otpQuery = `SELECT * FROM otp_requests WHERE email = ? AND otp = ?`;
    db.get(otpQuery, [email, otp], (err, otpRecord) => {
        if (err || !otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        const updatePasswordQuery = `UPDATE users SET password = ? WHERE email = ?`;
        db.run(updatePasswordQuery, [newPassword, email], function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: "Failed to reset password" });
            }
            res.json({ success: true, message: "Password reset successfully" });
        });
    });
};
