import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserContext from './UserContext/usercontext';
import { useDialog } from './Dialog/DialogContext';
import { VscHome, VscDashboard, VscAdd, VscAccount, VscSignOut, VscMenu, VscFlame, VscLayers, VscSearch } from 'react-icons/vsc';
import './sidebar.css';

const Sidebar = () => {
    const { user, setUser } = useContext(UserContext);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { ask } = useDialog();
    const [searchQuery, setSearchQuery] = useState('');
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
    }, [user, setUser]);

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            const isDashboard = location.pathname === '/dashboard';
            const targetPath = isDashboard ? '/dashboard' : '/';
            navigate(`${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
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
        <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-top">
                <div className="menu-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <VscMenu />
                </div>
                {!isCollapsed && <span className="nav-brand">Blogify</span>}
            </div>

            <div className={`sidebar-search ${isCollapsed ? 'collapsed' : ''} ${isSearchDisabled ? 'disabled' : ''}`}>
                <div className="search-wrapper">
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder={isSearchDisabled ? "Disabled" : "Search stories..."} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        disabled={isSearchDisabled || isCollapsed}
                    />
                    <button 
                        onClick={(e) => {
                            if (isCollapsed) {
                                setIsCollapsed(false);
                                setTimeout(() => searchInputRef.current?.focus(), 200);
                            } else {
                                handleSearchSubmit();
                                e.currentTarget.blur();
                            }
                        }}
                        disabled={isSearchDisabled}
                    >
                        <VscSearch />
                    </button>
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

                <NavLink to="/trending" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <VscFlame className="nav-icon" />
                    {!isCollapsed && <span>Trending</span>}
                </NavLink>

                <NavLink to="/latest" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <VscLayers className="nav-icon" />
                    {!isCollapsed && <span>Latest</span>}
                </NavLink>
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
