import React, { useEffect, useState } from 'react'
import api from '../api'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import './home.css'

const Home = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/').then(res => {
      setBlogs(res.data);
      setLoading(false);
      if (res.data.length > 0) toast.success("Blogs loaded!", { autoClose: 1500 });
    }).catch(error => {
      console.error('Error fetching blogs:', error);
      toast.error("Failed to fetch blogs!");
      setLoading(false);
    });
  }, []);

  return (
    <>
      <title>Blogify-Home</title>
      <div className="page-wrapper">
        {/* Hero */}
        <div className="home-hero fade-in-up">
          <h1 className="gradient-text">Stories Worth Reading</h1>
          <p>Discover insightful articles, tutorials, and ideas from our community of writers.</p>
        </div>

        {/* Section Title */}
        <h2 className="section-title">Latest Posts</h2>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Be the first to publish something great!</p>
          </div>
        )}

        {/* Blog Grid */}
        {!loading && blogs.length > 0 && (
          <div className="blog-grid">
            {blogs.map((blog, i) => (
              <article
                className="blog-card fade-in-up"
                key={blog._id}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <img
                  className="blog-card-img"
                  src={blog.image?.url}
                  alt={blog.title}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="blog-card-body">
                  <span className="badge badge-accent">Article</span>
                  <h3>{blog.title}</h3>
                  <p>{blog.content.slice(0, 100)}...</p>
                </div>
                <div className="blog-card-footer">
                  <span className="blog-card-author">By {blog.author}</span>
                  <Link
                    to={`/read/${blog._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Home
