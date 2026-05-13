import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import OtpInput from './components/OtpInput';
import './auth.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const requestReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/forgot-password', { email });
            toast.success(res.data.message);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request password reset');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        if (otp.length < 6) return toast.warn("Please enter complete OTP");
        if (newPassword.length < 8) return toast.warn("Password must be at least 8 characters");

        setLoading(true);
        try {
            const res = await api.post('/reset-password', { email, otp, newPassword, allowReuse: true });
            toast.success(res.data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'Blogify - Forgot Password';
    }, []);

    return (
        <>

        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">🔒</div>
                    <h2>Forgot Password</h2>
                    <p>{step === 1 ? 'Enter your email to receive a reset code' : 'Enter the OTP and your new password'}</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={requestReset}>
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
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Send Reset Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={resetPassword}>
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
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default ForgotPassword;
