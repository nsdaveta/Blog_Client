import React, { useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserContext from './UserContext/usercontext';
import { useDialog } from './Dialog/DialogContext';
import { VscHome, VscDashboard, VscAdd, VscAccount, VscSignOut, VscSearch } from 'react-icons/vsc';
import './top-navbar.css';

const Navbar = () => {
    const { user, setUser } = useContext(UserContext);
    const { ask } = useDialog();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = React.useState('');
    const searchInputRef = React.useRef(null);

    const disabledPaths = ['/login', '/register', '/create', '/verify-otp', '/forgot-password', '/reset-password'];
    const isUpdatePage = location.pathname.startsWith('/update/');
    const isReadPage = location.pathname.startsWith('/read/');
    const isSearchDisabled = disabledPaths.includes(location.pathname) || isUpdatePage || isReadPage;

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
            const isDashboard = location.pathname === '/dashboard';
            const targetPath = isDashboard ? '/dashboard' : '/';
            navigate(`${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            // Clear focus from search input/button to remove focus-within highlights
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
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

            <div className="nav-bottom-row">
                <div className={`nav-search-section ${isSearchDisabled ? 'disabled' : ''}`}>
                    <div className="search-wrapper">
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder={isSearchDisabled ? "Search disabled" : "Search blogs..."} 
                            className="nav-search-input-minimal" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            disabled={isSearchDisabled}
                        />
                        <button 
                            className="search-submit-btn" 
                            disabled={isSearchDisabled}
                            onClick={(e) => {
                                handleSearchSubmit();
                                window.getSelection()?.removeAllRanges();
                                e.currentTarget.blur();
                            }}
                            onMouseUp={(e) => {
                                window.getSelection()?.removeAllRanges();
                                setTimeout(() => e.currentTarget.blur(), 0);
                            }}
                            onTouchEnd={(e) => {
                                window.getSelection()?.removeAllRanges();
                                setTimeout(() => e.currentTarget.blur(), 0);
                            }}
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
                                        Logout                
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
