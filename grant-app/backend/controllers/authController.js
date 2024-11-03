const db = require('../db');
const { exec } = require('child_process');

// Function to generate OTP and store it in the database
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Helper function to generate, store, and send OTP
function sendOtp(email, res) {
    const otp = generateOtp();
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

// Endpoint to request OTP for registration or password reset
exports.getOtp = (req, res) => {
    const { email, type } = req.body;
    console.log(`Received OTP request for email: ${email} with type: ${type}`);

    if (type === "forgot-password") {
        const userQuery = `SELECT * FROM users WHERE email = ?`;
        db.get(userQuery, [email], (err, user) => {
            if (err) {
                console.error("Error checking user existence:", err.message);
                return res.status(500).json({ success: false, message: "Server error. Please try again later." });
            }
            if (!user) {
                return res.status(400).json({ success: false, message: "Invalid email. User not found." });
            }
            sendOtp(email, res);
        });
    } else if (type === "register") {
        sendOtp(email, res);
    } else {
        res.status(400).json({ success: false, message: "Invalid request type" });
    }
};

// Endpoint to verify OTP and register user
exports.register = (req, res) => {
    const { email, otp, password, confirmPassword, name } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const otpQuery = `SELECT * FROM otp_requests WHERE email = ? AND otp = ?`;
    db.get(otpQuery, [email, otp], (err, otpRecord) => {
        if (err || !otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
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

// Endpoint to check if an email is already registered
exports.checkEmail = (req, res) => {
    const { email } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
        if (err) {
            console.error("Error checking email:", err.message);
            return res.status(500).json({ success: false, message: "Server error" });
        }
        res.json({ exists: Boolean(row) });
    });
};

// Endpoint for user login
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
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
};

// Endpoint to reset password
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
                console.error("Failed to reset password:", err.message);
                return res.status(500).json({ success: false, message: "Failed to reset password" });
            }
            res.json({ success: true, message: "Password reset successfully" });
        });
    });
};
