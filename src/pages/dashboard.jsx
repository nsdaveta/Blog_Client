import React from 'react'
import api from '../api'
import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import UserContext from './components/UserContext/usercontext'

import { useDialog } from './components/Dialog/DialogContext'
import './dashboard.css'

const DashboardBlogItem = ({ blog, navigate, onDelete }) => {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight } = textRef.current
        setIsOverflowing(scrollHeight > clientHeight + 2)
      }
    }
    checkOverflow()
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkOverflow)
    })
    if (textRef.current) resizeObserver.observe(textRef.current)
    return () => resizeObserver.disconnect()
  }, [blog.content])

  return (
    <div className="dashboard-blog-item">
      <img
        className="dashboard-blog-thumb"
        src={blog.image?.url}
        alt={blog.title}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={(e) => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.display = 'flex'; }}
      />
      <div className="dashboard-blog-info">
        <h3 style={{ WebkitBoxOrient: 'vertical' }}>{blog.title || 'Untitled'}</h3>
        <div ref={textRef} className="dashboard-blog-preview-text" style={{ WebkitBoxOrient: 'vertical' }}>{blog.content || ""}</div>
        {isOverflowing && (
          <Link to={`/read/${blog._id}`} style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '500', textDecoration: 'none', display: 'inline-block', marginTop: '0.2rem' }}>
            Read more
          </Link>
        )}
        <div className="dashboard-blog-author" style={{ marginTop: '0.4rem' }}>By {blog.author || 'Unknown'}</div>
      </div>
      <div className="dashboard-blog-actions">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate(`/update/${blog._id}`)}
        >
          ✏️ Edit
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(blog._id, blog.image?.public_id)}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}


const Dashboard = () => {
  const navigate = useNavigate()
  const { user, setUser } = React.useContext(UserContext)
  const { ask } = useDialog()
  const [loading, setLoading] = useState(true)
  const [blogData, setBlogData] = useState([])
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search')?.toLowerCase() || ''

  const headers = {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  };
  useEffect(() => {
    api.get('/dashboard', headers)
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        navigate('/');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = searchQuery
      ? `Blogify - Dashboard - Search: "${searchQuery}"`
      : 'Blogify - Dashboard';
  }, [searchQuery]);

  // Listen for spontaneous logout events on an active dashboard session
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userdata') || '{}');
    api.get('/', headers).then(res => {
      if (Array.isArray(res.data)) {
        const myBlogs = res.data.filter(blog => blog.author === storedUser.name);
        setBlogData(myBlogs);
      } else {
        console.error("Dashboard API returned non-array data:", res.data);
      }
    }).catch(err => console.log(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const HandleDelete = async (blogId, publicId) => {
    const confirmation = await ask('Delete this post permanently?', {
      title: 'Blogify',
      kind: 'warning',
    });
    if (!confirmation) return;
    api.delete('/delete/' + blogId, {
      params: { public_id: publicId },
      ...headers
    }).then(() => {
      setBlogData(prev => prev.filter(b => b._id !== blogId));
    }).catch(() => console.error('Failed to delete blog post'));
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  // Get first letter of user's name for avatar
  const avatarLetter = user?.name ? user.name[0].toUpperCase() : '?';



  return (
    <>
      <div className="page-wrapper">
        {/* Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-avatar">{avatarLetter}</div>
          <div className="dash-welcome-text">
            <h3>Welcome back, {user?.name || 'Author'}!</h3>
            <p>Manage your blog posts from here</p>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/create')}
          >
            + New Post
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{blogData.length}</div>
            <div className="stat-label">Total Posts</div>
          </div>
        </div>

        {/* Blog List */}
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="section-title">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Your Blog Posts'}
          </h1>
          {searchQuery && (
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>←</span> Back to Dashboard
            </button>
          )}
        </div>

        {blogData.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Create your first blog post to get started!</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/create')}>
              Write Your First Post
            </button>
          </div>
        ) : (
          <div className="dashboard-blog-list">
            {blogData
              .filter(blog => 
                blog.title?.toLowerCase().includes(searchQuery) || 
                blog.content?.toLowerCase().includes(searchQuery)
              )
              .map(blog => (
                <DashboardBlogItem 
                  key={blog._id} 
                  blog={blog} 
                  navigate={navigate} 
                  onDelete={HandleDelete} 
                />
              ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
