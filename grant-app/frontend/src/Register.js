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
    const [otpCooldown, setOtpCooldown] = useState(0); 
    const [otpAttempts, setOtpAttempts] = useState(0); 
    const [isOtpRequestInProgress, setIsOtpRequestInProgress] = useState(false); 
    const navigate = useNavigate();

    useEffect(() => {
        if (otpCooldown > 0) {
            const timer = setInterval(() => {
                setOtpCooldown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
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

        setIsOtpRequestInProgress(true);

        axios.post('https://YOUR_NGROK_URL/check-email', { email })
            .then(res => {
                if (res.data.exists) {
                    alert("This email is already registered. Please use a different email.");
                    setIsOtpRequestInProgress(false);
                } else {
                    axios.post('https://YOUR_NGROK_URL/get-otp', { email, type: "register" })
                        .then(res => {
                            alert(res.data.message);
                            setOtpAttempts(prev => prev + 1); 

                            if (otpAttempts === 0) {
                                setOtpCooldown(30); 
                            } else if (otpAttempts === 1) {
                                setOtpCooldown(60); 
                            } else if (otpAttempts === 2) {
                                setOtpCooldown(-1); 
                            }
                        })
                        .catch(err => {
                            const message = err.response?.data?.message || "Failed to send OTP. Please try again.";
                            alert(message);
                        })
                        .finally(() => {
                            setIsOtpRequestInProgress(false);
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

        axios.post('https://YOUR_NGROK_URL/register', {
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
                navigate('/login');
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
