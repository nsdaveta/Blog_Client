import React, { useContext, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserContext from './UserContext/usercontext';
import { useDialog } from './Dialog/DialogContext';
import { VscHome, VscDashboard, VscAdd, VscAccount, VscSignOut } from 'react-icons/vsc';
import './top-navbar.css';

const Navbar = () => {
    const { user, setUser } = useContext(UserContext);
    const { ask } = useDialog();
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('userdata');
        if (storedUser && !user) {
            setUser(JSON.parse(storedUser));
        }
    }, [user, setUser]);

    const handleLogout = async () => {
        const confirmed = await ask('Are you sure you want to logout?', {
            title: 'Logout',
            kind: 'info'
        });
        
        if (!confirmed) return;

        setUser(null);
        localStorage.removeItem('userdata');
        localStorage.removeItem('token');
        toast.success('Logged out successfully!', { autoClose: 2000 });
        navigate('/');
    };

    return (
        <nav className="top-navbar glass-panel">
            <div className="nav-container">
                <div className="nav-top-row">
                    <div className="nav-left">
                        <NavLink to="/" className="nav-brand">
                            <img src="/favicon.svg" alt="logo" className="nav-logo" />
                            <span>Blogify</span>
                        </NavLink>
                    </div>

                    <div className="nav-links-section">
                        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>
                            <VscHome /> <span>Home</span>
                        </NavLink>
                        {user && (
                            <>
                                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                    <VscDashboard /> <span>Dashboard</span>
                                </NavLink>
                                <NavLink to="/create" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                                    <VscAdd /> <span>New Post</span>
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>

                <div className="nav-bottom-row">
                    {user ? (
                        <div className="user-section">
                            <div className="user-info">
                                <VscAccount className="user-icon" />
                                <span className="username-display">
                                    <span className="welcome-text">Hello, </span>{user.name || 'User'}
                                </span>
                            </div>
                            <button onClick={handleLogout} className="top-logout-btn" title="Logout">
                                <VscSignOut /> <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="auth-links">
                            <NavLink to="/login" className="nav-link">Login</NavLink>
                            <NavLink to="/register" className="nav-link auth-btn">Sign Up</NavLink>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
