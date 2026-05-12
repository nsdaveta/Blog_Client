import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import OtpInput from './components/OtpInput';
import './auth.css';

const Spinner = () => <div className="spinner"></div>;

const Register = () => {
    // State for form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    // State to manage UI flow and feedback
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const [isEmailDomainValid, setIsEmailDomainValid] = useState(false);
    const [isCheckingDomain, setIsCheckingDomain] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Check if we were redirected here to verify OTP
    useEffect(() => {
        if (location.state && location.state.email && location.state.showOtp) {
            setEmail(location.state.email);
            setIsRegistered(true);
        }
    }, [location.state]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Real-time DNS verification for email domain
    useEffect(() => {
        // Reset valid state immediately as soon as user types
        setIsEmailDomainValid(false);

        const verifyDomain = async () => {
            const domainParts = email.split('@');
            if (domainParts.length === 2 && domainParts[1]) {
                const domain = domainParts[1];
                if (domain.includes('.') && domain.split('.')[1]?.length >= 2) {
                    setIsCheckingDomain(true);
                    try {
                        const response = await api.post('/validate-email-domain', { email });
                        setIsEmailDomainValid(response.data.valid);
                    } catch (err) {
                        setIsEmailDomainValid(false);
                    } finally {
                        setIsCheckingDomain(false);
                    }
                    return;
                }
            }
        };

        const debounceTimer = setTimeout(verifyDomain, 800);
        return () => clearTimeout(debounceTimer);
    }, [email]);

    // Handles the initial registration form submission
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation check
        const isNameValid = nameRequirements.every(req => isRequirementMet(req, name));
        const isEmailValid = emailRequirements.every(req => isRequirementMet(req, email));
        const isPasswordValid = passwordRequirements.every(req => isRequirementMet(req, password));

        if (!isNameValid || !isEmailValid || !isPasswordValid) {
            setError('Please fulfill all field requirements highlighted above before proceeding.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.post('/register', {
                name,
                email: email.trim(),
                password
            });
            setSuccessMessage(response.data.message);
            setIsRegistered(true); // Move to OTP verification step
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handles the OTP verification form submission
    const handleOtpSubmit = async (e) => {
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

            // Redirect to login page after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred during OTP verification.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handles the OTP resend
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.post('/resend-otp', { email: email.trim() });
            setSuccessMessage(response.data.message);
            setResendCooldown(60); // Start 60-second cooldown
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    // Field requirement checks
    const nameRequirements = [
        { label: 'At least 3 characters long', regex: /.{3,}/ },
    ];

    const emailRequirements = [
        { label: 'Must be a real, existing email domain (e.g., gmail.com)', regex: /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, isDomainCheck: true },
    ];

    const passwordRequirements = [
        { label: 'At least 8 characters long', regex: /.{8,}/ },
        { label: 'At least one lowercase letter', regex: /[a-z]/ },
        { label: 'At least one uppercase letter', regex: /[A-Z]/ },
        { label: 'At least one number', regex: /[0-9]/ },
        { label: 'At least one special character (@$!%*?&)', regex: /[@$!%*?&]/ },
    ];

    const isRequirementMet = (req, value) => {
        if (req.isDomainCheck) {
            return req.regex.test(value) && isEmailDomainValid;
        }
        return req.regex.test(value);
    };

    // Renders the initial registration form
    const renderRegisterForm = () => (
        <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                    }}
                    required
                    disabled={isLoading}
                />
                <ul className="field-requirements">
                    {nameRequirements.map((req, index) => (
                        <li key={index} className={`requirement-item ${isRequirementMet(req, name) ? 'met' : ''}`}>
                            <span className="requirement-icon">
                                {isRequirementMet(req, name) ? '●' : '○'}
                            </span>
                            {req.label}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setIsEmailDomainValid(false);
                        setIsCheckingDomain(false);
                        if (error) setError('');
                    }}
                    required
                    disabled={isLoading}
                />
                <ul className="field-requirements">
                    {emailRequirements.map((req, index) => (
                        <li key={index} className={`requirement-item ${isRequirementMet(req, email) ? 'met' : ''}`}>
                            <span className="requirement-icon">
                                {isRequirementMet(req, email) ? '●' : '○'}
                            </span>
                            {req.label}
                            {isCheckingDomain && <span className="checking-domain" style={{marginLeft: '0.5rem', color: 'var(--text-muted)'}}> (Checking...)</span>}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError('');
                        }}
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                <ul className="field-requirements">
                    {passwordRequirements.map((req, index) => (
                        <li key={index} className={`requirement-item ${isRequirementMet(req, password) ? 'met' : ''}`}>
                            <span className="requirement-icon">
                                {isRequirementMet(req, password) ? '●' : '○'}
                            </span>
                            {req.label}
                        </li>
                    ))}
                </ul>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? <Spinner /> : 'Create Account →'}
            </button>
            <p className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
            </p>
        </form>
    );

    // Renders the OTP verification form
    const renderOtpForm = () => (
        <form onSubmit={handleOtpSubmit}>
            <div className="form-group otp-group">
                <label htmlFor="otp">6-Digit OTP requested for <strong>{email}</strong></label>
                <OtpInput value={otp} onChange={setOtp} />
            </div>
            <button type="submit" disabled={isLoading || otp.length !== 6} className="btn-primary" style={{marginTop:'1.5rem', width: '100%'}}>
                {isLoading ? <Spinner /> : 'Verify Email'}
            </button>

            <div className="resend-container" style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button type="button" onClick={handleResendOtp} disabled={isLoading || resendCooldown > 0} className="btn-secondary" style={{
                    background: 'transparent',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: (isLoading || resendCooldown > 0) ? 'not-allowed' : 'pointer'
                }}>
                    {resendCooldown > 0 ? `Resend Available in ${resendCooldown}s` : 'Resend OTP'}
                </button>
            </div>
        </form>
    );

    useEffect(() => {
        document.title = 'Blogify - Register';
    }, []);

    return (
        <>

            <div className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">🚀</div>
                        <h2>{isRegistered ? 'Verify OTP' : 'Create Account'}</h2>
                        <p>{isRegistered ? 'Final step to secure your account' : 'Join and start sharing your stories!'}</p>
                    </div>

                    {!isRegistered ? renderRegisterForm() : renderOtpForm()}

                    <div className="message-container" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        {error && (
                          <div className="error-box fade-in" style={{ 
                            padding: '0.85rem', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid #ef4444', 
                            color: '#ef4444', 
                            borderRadius: 'var(--radius-sm)', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textAlign: 'left'
                          }}>
                            <span>🚨</span> {error}
                          </div>
                        )}
                        {successMessage && <p className="success-message" style={{ color: 'var(--success, lightgreen)', marginTop: '1rem' }}>{successMessage}</p>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
