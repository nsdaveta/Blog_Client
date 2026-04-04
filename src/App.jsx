import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/home'
import Login from './pages/login'
import Register from './pages/register'
import Dashboard from './pages/dashboard'
import Create_blog from './pages/create_blog'
import Update_blog from './pages/update_blog'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReadMore from './pages/read_blogs'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/forgot_password'
import ResetPassword from './pages/reset_password'
import { useBackButton } from './hooks/useBackButton'

function App() {
  // Handle Android back button
  useBackButton()
  return (
    <div>
      <ToastContainer
        position="top-right"
        theme="dark"
        toastStyle={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          borderRadius: '12px',
        }}
        hideProgressBar={true}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<Create_blog />} />
        <Route path="/read/:id" element={<ReadMore />} />
        <Route path="/update/:id" element={<Update_blog />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  )
}

export default App
