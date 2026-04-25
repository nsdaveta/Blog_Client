import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import UserContext from './UserContext/usercontext';
import { useDialog } from './Dialog/DialogContext';
import { VscHome, VscDashboard, VscAdd, VscAccount, VscSignOut, VscMenu } from 'react-icons/vsc';
import './sidebar.css';

const Sidebar = () => {
    const { user, setUser } = useContext(UserContext);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const { ask } = useDialog();

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
        navigate('/');
    };

    return (
        <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-top">
                <div className="menu-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <VscMenu />
                </div>
            </div>
            
            <div className="sidebar-links">
                <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
                    <VscHome className="nav-icon" />
                    {!isCollapsed && <span>Home</span>}
                </NavLink>
                
                {user && (
                    <>
                        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <VscDashboard className="nav-icon" />
                            {!isCollapsed && <span>Dashboard</span>}
                        </NavLink>
                        <NavLink to="/create" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                            <VscAdd className="nav-icon" />
                            {!isCollapsed && <span>New Post</span>}
                        </NavLink>
                    </>
                )}
            </div>

            {user ? (
                <div className="sidebar-footer">
                    <div className={`user-profile ${isCollapsed ? 'collapsed' : ''}`}>
                        <div className="user-avatar">
                            <VscAccount />
                        </div>
                        {!isCollapsed && (
                            <div className="user-details">
                                <span className="username">{user.name || 'User'}</span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className={`nav-item logout-btn ${isCollapsed ? 'collapsed' : ''}`}
                        title="Logout"
                    >
                        <VscSignOut className="nav-icon" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            ) : (
                <div className="sidebar-footer">
                    <NavLink to="/login" className="nav-item">
                        <VscAccount className="nav-icon" />
                        {!isCollapsed && <span>Sign In</span>}
                    </NavLink>
                    <NavLink to="/register" className="nav-item">
                        <VscAccount className="nav-icon" />
                        {!isCollapsed && <span>Sign Up</span>}
                    </NavLink>
                </div>
            )}
        </nav>
    );
};

export default Sidebar;
