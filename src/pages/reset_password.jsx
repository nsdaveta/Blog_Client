import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import OtpInput from './components/OtpInput';
import './auth.css';
import './buttons.css';

const ResetPassword = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setFieldError('');
        if (!email) return toast.warn("Please enter your email");
        if (otp.length < 6) return toast.warn("Please enter complete OTP");
        if (newPassword.length < 8) return toast.warn("Password must be at least 8 characters");

        setLoading(true);
        try {
            const res = await api.post('/reset-password', { email, otp, newPassword });
            toast.success(res.data.message);
            navigate('/login');
        } catch (error) {
            const errorMsg = error.response?.data?.message;
            if (errorMsg === "You can't use an old password here") {
                setFieldError(errorMsg);
            } else {
                toast.error(errorMsg || 'Failed to reset password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <title>Blogify-Reset Password</title>
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">🔐</div>
                    <h2>Reset Password</h2>
                    <p>Enter your authorization code to assign a new password</p>
                </div>

                <form onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div className="form-group otp-group">
                        <label>Enter 6-digit OTP</label>
                        <OtpInput value={otp} onChange={setOtp} />
                    </div>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label>New Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter a strong password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {fieldError && (
                            <div style={{ 
                                marginTop: '0.75rem', 
                                padding: '0.75rem', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid #ef4444', 
                                color: '#ef4444', 
                                borderRadius: '8px', 
                                fontSize: '0.9rem' 
                            }}>
                                🚨 {fieldError}
                            </div>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? <span className="spinner"></span> : 'Set New Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default ResetPassword;
