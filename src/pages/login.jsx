import React, { useContext, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import api from '../api'
import { toast } from 'react-toastify'
import UserContext from './components/UserContext/usercontext'
import './auth.css'
import './buttons.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    api.post('/login', { email, password })
      .then(res => {
        toast.success(`Welcome back, ${res.data.user.name}! 🎉`, { autoClose: 2000 });
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userdata', JSON.stringify(res.data.user));
        navigate('/dashboard');
      })
      .catch(error => {
        console.error('Login error:', error);
        if (error.response?.data?.message === 'Please verify your email first!') {
            toast.warn('Please verify your email first! Check your inbox for the OTP sent during registration.');
            return;
        }
        toast.error(error.response?.data?.message || "Login failed! Check your credentials.");
      })
      .finally(() => setLoading(false));
  }

  return (
    <>
    <title>Blogify-Login</title>
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
          <div style={{ marginTop: "1.5rem" }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/verify-otp', { state: { email } })}
                style={{ width: "100%", marginBottom: "0.75rem" }}
              >
                Verify OTP
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/reset-password', { state: { email } })}
                style={{ width: "100%" }}
              >
                Password Reset
              </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Login
