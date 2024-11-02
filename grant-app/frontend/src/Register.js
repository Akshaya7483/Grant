import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [dob, setDob] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0); // Cooldown timer for OTP button
    const [otpAttempts, setOtpAttempts] = useState(0); // Track number of OTP attempts
    const [isOtpRequestInProgress, setIsOtpRequestInProgress] = useState(false); // Prevent rapid clicks
    const navigate = useNavigate();

    // Countdown effect for OTP cooldown
    useEffect(() => {
        if (otpCooldown > 0) {
            const timer = setInterval(() => {
                setOtpCooldown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer); // Clear timer on component unmount or cooldown change
        }
    }, [otpCooldown]);

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function handleGetOtp() {
        if (!email) {
            alert("Please enter your email.");
            return;
        }

        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (otpCooldown > 0 || otpAttempts >= 3 || isOtpRequestInProgress) return;

        setIsOtpRequestInProgress(true); // Prevent further clicks

        // Check if user is already registered
        axios.post('http://localhost:8081/check-email', { email })
            .then(res => {
                if (res.data.exists) {
                    alert("This email is already registered. Please use a different email.");
                    setIsOtpRequestInProgress(false);
                } else {
                    // If the email is not registered, proceed to get OTP
                    axios.post('http://localhost:8081/get-otp', { email, type: "register" })
                        .then(res => {
                            alert(res.data.message);
                            setOtpAttempts(prev => prev + 1); // Increment OTP attempts

                            // Set cooldown period based on attempts
                            if (otpAttempts === 0) {
                                setOtpCooldown(30); // 30 seconds for the first attempt
                            } else if (otpAttempts === 1) {
                                setOtpCooldown(60); // 1 minute for the second attempt
                            } else if (otpAttempts === 2) {
                                setOtpCooldown(-1); // Hide button after the third attempt
                            }
                        })
                        .catch(err => {
                            const message = err.response?.data?.message || "Failed to send OTP. Please try again.";
                            alert(message);
                        })
                        .finally(() => {
                            setIsOtpRequestInProgress(false); // Re-enable button after request completes
                        });
                }
            })
            .catch(err => {
                alert("Failed to check email. Please try again.");
                setIsOtpRequestInProgress(false);
            });
    }

    function handleSubmit(e) {
        e.preventDefault();

        if (password.length < 4) {
            alert("Password must be at least 4 characters long!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        axios.post('http://localhost:8081/register', {
            name,
            email,
            otp,
            dob,
            password,
            confirmPassword
        })
        .then(res => {
            if (res.data.success) {
                alert(res.data.message);
                navigate('/login'); // Redirect to login page on successful registration
            } else {
                alert(res.data.message || "Registration failed. Please try again.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Registration failed. Please try again.");
        });
    }

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        placeholder="Enter Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                {otpAttempts < 3 && (
                    <button
                        type="button"
                        onClick={handleGetOtp}
                        disabled={otpCooldown > 0 || isOtpRequestInProgress}
                    >
                        {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : otpAttempts > 0 ? "Resend OTP" : "Get OTP"}
                    </button>
                )}
                <div>
                    <label htmlFor="otp">Enter OTP</label>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="dob">Date of Birth</label>
                    <input
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default Register;
