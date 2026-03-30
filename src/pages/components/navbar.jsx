import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import UserContext from './UserContext/usercontext'
import './navbar.css'

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('userdata');
    if (storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }
  }, [user, setUser]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setUser(null);
      localStorage.removeItem('userdata');
      localStorage.removeItem('token');
      toast.success('Logged out successfully!', { autoClose: 2000 });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">✍ Blogify</span>
        <ul className="navbar-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          {!user && <li><NavLink to="/register">Register</NavLink></li>}
          <li>
            {user ? (
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <NavLink to="/login">Login</NavLink>
            )}
          </li>
          {user && (
            <>
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/create">+ New Post</NavLink></li>
              <li><NavLink to="/users">Users</NavLink></li>
            </>

          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
