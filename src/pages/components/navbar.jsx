import React, { useContext, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserContext from './UserContext/usercontext';
import { useDialog } from './Dialog/DialogContext';
import { VscHome, VscDashboard, VscAdd, VscAccount, VscSignOut, VscSearch } from 'react-icons/vsc';
import './top-navbar.css';

const Navbar = () => {
    const { user, setUser } = useContext(UserContext);
    const { ask } = useDialog();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = React.useState('');
    const searchInputRef = React.useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('userdata');
        if (storedUser && !user) {
            setUser(JSON.parse(storedUser));
        }

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [user, setUser]);

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

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
    <nav className="top-navbar">
        <div className="nav-container">
            {/* Top Row: Brand and Links */}
            <div className="nav-top-row">
                <div className="nav-left">
                    <NavLink to="/" className="nav-brand">
                        <img src="/favicon.svg" alt="logo" className="nav-logo" />
                        <span>Blogify</span>
                    </NavLink>
                </div>

                <div className="nav-links-section">
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link-secondary active' : 'nav-link-secondary')} end>
                        <VscHome /> <span>Home</span>
                    </NavLink>
                    {user && (
                        <>
                            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link-secondary active' : 'nav-link-secondary')}>
                                <VscDashboard /> <span>Dashboard</span>
                            </NavLink>
                            <NavLink to="/create" className={({ isActive }) => (isActive ? 'nav-link-secondary active' : 'nav-link-secondary')}>
                                <VscAdd /> <span>New Post</span>
                            </NavLink>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Row: Search and Auth */}
            <div className="nav-bottom-row">
                <div className="nav-search-section">
                    <div className="search-wrapper">
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Search stories..." 
                            className="nav-search-input-minimal" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                        <button 
                            className="search-submit-btn" 
                            onClick={handleSearchSubmit}
                            title="Search"
                        >
                            <VscSearch />
                        </button>
                        <div className="search-hint">{navigator.platform.indexOf('Mac') > -1 ? '⌘K' : 'Ctrl+K'}</div>
                    </div>
                </div>

                <div className="nav-right">
                    <div className="nav-auth-section">
                        {user ? (
                            <div className="user-profile">
                                <div className="user-info">
                                    <VscAccount className="user-icon" />
                                    <span className="username-display">{user.name || 'User'}</span>
                                </div>
                                <button onClick={handleLogout} className="logout-btn-minimal" title="Logout">
                                    <VscSignOut />
                                </button>
                            </div>
                        ) : (
                            <div className="auth-group">
                                <NavLink to="/login" className="nav-link-minimal">Login</NavLink>
                                <NavLink to="/register" className="signup-btn">Sign Up</NavLink>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </nav>
    );
};


export default Navbar;
