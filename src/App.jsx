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
import ReadBlog from './pages/read_blogs'
import ReadMore from './pages/read_blogs'
import UsersPage from './pages/users'

function App() {
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
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<Create_blog />} />
        <Route path="/read/:id" element={<ReadMore />} />
        <Route path="/update/:id" element={<Update_blog />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </div>
  )
}

export default App
