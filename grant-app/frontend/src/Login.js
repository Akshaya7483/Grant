import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const navigate = useNavigate();

    function handleForgotPassword() {
        setIsResetPassword(true);
    }

    function handleGetOtp() {
        axios.post('http://localhost:8081/get-otp', { email, type: "forgot-password" })
        .then(res => {
            alert(res.data.message);
        })
        .catch(err => {
            const message = err.response?.data?.message || "Failed to send OTP. Please try again.";
            alert(message);
        });
    }
    
    function handleResetPassword(e) {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            alert("Passwords do not match!");
            return;
        }

        axios.post('http://localhost:8081/reset-password', { email, otp, newPassword })
            .then(res => {
                alert(res.data.message);
                if (res.data.success) {
                    setIsResetPassword(false);
                    navigate('/login');
                }
            })
            .catch(err => alert("Failed to reset password. Please try again."));
    }

    function handleSubmit(e) {
        e.preventDefault();
        axios.post('http://localhost:8081/login', { email, password })
            .then(res => {
                if (res.data.success) {
                    navigate('/dashboard');
                } else {
                    alert("Invalid credentials.");
                }
            })
            .catch(err => alert("Login failed. Please try again."));
    }

    function handleRegister() {
        navigate('/register'); // Redirect to register page
    }

    return (
        <div>
            <h2>{isResetPassword ? "Reset Password" : "Login"}</h2>
            <form onSubmit={isResetPassword ? handleResetPassword : handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                {isResetPassword ? (
                    <>
                        <button type="button" onClick={handleGetOtp}>Get OTP</button>
                        <div>
                            <label>Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={e => setConfirmNewPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit">Reset Password</button>
                    </>
                ) : (
                    <>
                        <div>
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit">Login</button>
                        <button type="button" onClick={handleForgotPassword}>Forgot Password?</button>
                        <button type="button" onClick={handleRegister}>Register</button> {/* Register button */}
                    </>
                )}
            </form>
        </div>
    );
}

export default Login;
