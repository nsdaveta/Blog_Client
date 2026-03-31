import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import OtpInput from './components/OtpInput';
import './auth.css';
import './buttons.css';

const Spinner = () => <div className="spinner"></div>;

const VerifyOtp = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    // Auto-fire OTP logic when arriving from login page with an email preset
    useEffect(() => {
        if (location.state && location.state.email) {
            const passedEmail = location.state.email.trim();
            setEmail(passedEmail);
            
            if (location.state.message) {
                setSuccessMessage(location.state.message);
            } else {
                // If they just navigated here with an email (from login link), auto-send the OTP
                if (passedEmail) {
                    setIsLoading(true);
                    api.post('/resend-otp', { email: passedEmail, type: 'initial' })
                        .then(res => {
                            setSuccessMessage(res.data.message || 'OTP automatically sent to your email.');
                            setResendCooldown(60);
                        })
                        .catch(err => {
                            setError(err.response?.data?.message || 'Failed to auto-send OTP.');
                        })
                        .finally(() => {
                            setIsLoading(false);
                        });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.post('/verify-otp', { 
                email: email.trim(), 
                otp: otp.trim() 
            });
            setSuccessMessage(response.data.message + ' Redirecting to login...');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred during OTP verification.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.post('/resend-otp', { email: email.trim() });
            setSuccessMessage(response.data.message);
            setResendCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <title>Blogify - Verify OTP</title>
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Verify OTP</h2>
                    <p>Enter the 6-digit OTP sent to <strong>{email || 'your email'}</strong></p>
                </div>
                
                <form onSubmit={handleVerifySubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading || !!location.state?.email}
                        />
                    </div>
                    
                    <div className="form-group otp-group">
                        <label htmlFor="otp">6-Digit OTP</label>
                        <OtpInput value={otp} onChange={setOtp} />
                        
                        {/* Red Error Box strictly positioned right under the OTP Field */}
                        {error && (
                            <div style={{ 
                                marginTop: '0.75rem', 
                                padding: '0.75rem', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid #ef4444', 
                                color: '#ef4444', 
                                borderRadius: '8px', 
                                fontSize: '0.9rem' 
                            }}>
                                🚨 {error}
                            </div>
                        )}
                        
                        {/* Green Success Box strictly positioned right under the OTP Field */}
                        {successMessage && (
                            <div style={{ 
                                marginTop: '0.75rem', 
                                padding: '0.75rem', 
                                background: 'rgba(74, 222, 128, 0.1)', 
                                border: '1px solid #4ade80', 
                                color: '#4ade80', 
                                borderRadius: '8px', 
                                fontSize: '0.9rem' 
                            }}>
                                ✅ {successMessage}
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={isLoading || otp.length !== 6} className="btn-primary" style={{ marginTop: '1rem' }}>
                        {isLoading ? <Spinner /> : 'Verify Email'}
                    </button>
                    
                    <div className="resend-container" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button 
                            type="button" 
                            onClick={handleResendOtp} 
                            disabled={isLoading || resendCooldown > 0} 
                            className="btn-secondary" 
                            style={{ width: '100%', cursor: (isLoading || resendCooldown > 0) ? 'not-allowed' : 'pointer' }}
                        >
                            {resendCooldown > 0 ? `Resend Available in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                    </div>
                </form>
                
                <p className="auth-footer" style={{ marginTop: "1.5rem" }}>
                    Back to <span onClick={() => navigate('/login')} style={{cursor: 'pointer', color: 'var(--accent)'}}>Login</span>
                </p>
            </div>
        </div>
        </>
    );
};

export default VerifyOtp;
