import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import OtpInput from '../components/OtpInput';
import './auth.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
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
            const res = await api.post('/reset-password', { email, otp, newPassword });
            toast.success(res.data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <div className="auth-icon">🔒</div>
                    <h1>Forgot Password</h1>
                    <p>{step === 1 ? 'Enter your email to receive a reset code' : 'Enter the OTP and your new password'}</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={requestReset} className="auth-form">
                        <div className="input-group">
                            <label>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Send Reset Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={resetPassword} className="auth-form">
                        <div className="input-group">
                            <label>ENTER 6-DIGIT OTP</label>
                            <OtpInput length={6} onComplete={(code) => setOtp(code)} />
                        </div>
                        <div className="input-group" style={{ marginTop: '1.5rem' }}>
                            <label>NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter a strong password"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-link">
                    <button onClick={() => navigate('/login')} className="text-button">
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
