import React from 'react'
import api from '../api'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import UserContext from './components/UserContext/usercontext'
import './dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, setUser } = React.useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [blogData, setBlogData] = useState([])

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
        toast.error('Failed to load dashboard. Please log in.');
        navigate('/login');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userdata') || '{}');
    api.get('/', headers).then(res => {
      const myBlogs = res.data.filter(blog => blog.author === storedUser.name);
      setBlogData(myBlogs);
    }).catch(err => console.log(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const HandleDelete = (blogId, publicId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    api.delete('/blogs/' + blogId, {
      params: { public_id: publicId },
      ...headers
    }).then(() => {
      toast.success('Blog deleted successfully!');
      setBlogData(prev => prev.filter(b => b._id !== blogId));
    }).catch(() => toast.error('Failed to delete blog post'));
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
      <title>Blogify-Dashboard</title>
      <div className="page-wrapper">
        {/* Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-avatar">{avatarLetter}</div>
          <div className="welcome-text">
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
        <div className="dashboard-header">
          <h1 className="section-title">Your Posts</h1>
        </div>

        {blogData.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Create your first blog post to get started!</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/create')}>
              Write First Post
            </button>
          </div>
        ) : (
          <div className="dashboard-blog-list">
            {blogData.map(blog => (
              <div className="dashboard-blog-item" key={blog._id}>
                <img
                  className="dashboard-blog-thumb"
                  src={blog.image?.url}
                  alt={blog.title}
                  onError={(e) => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.display = 'flex'; }}
                />
                <div className="dashboard-blog-info">
                  <h3>{blog.title}</h3>
                  <p>{blog.content.slice(0, 100)}... <Link to={`/read/${blog._id}`}>Read more</Link></p>
                  <p>By {blog.author}</p>
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
                    onClick={() => HandleDelete(blog._id, blog.image?.public_id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
