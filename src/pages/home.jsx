import React, { useEffect, useState } from 'react'
import api from '../api'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import './home.css'

// Decode userId from the stored JWT
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    return JSON.parse(atob(token.split('.')[1])).id || null
  } catch {
    return null
  }
}

// Sum all per-user counts from an action array
const totalCount = (arr = []) => arr.reduce((sum, e) => sum + (e.count || 0), 0)

// Find current user's count from an action array
const myCount = (arr = [], userId) =>
  arr.find(e => e.userId === userId || e.userId?._id === userId)?.count || 0

// Individual blog card — owns its own per-user state
const BlogCard = ({ blog, index }) => {
  const currentUserId = getCurrentUserId()
  const isLoggedIn    = !!currentUserId

  const [likes,        setLikes      ] = useState(totalCount(blog.likes))
  const [dislikes,     setDislikes   ] = useState(totalCount(blog.dislikes))
  const [shares,       setShares     ] = useState(totalCount(blog.shares))
  const [comments,     setComments   ] = useState(blog.comments ?? [])
  const [myLikes,      setMyLikes    ] = useState(myCount(blog.likes,    currentUserId))
  const [myDislikes,   setMyDislikes ] = useState(myCount(blog.dislikes, currentUserId))
  const [myShares,     setMyShares   ] = useState(myCount(blog.shares,   currentUserId))
  const [showComments, setShowComments] = useState(false)
  const [commentText,  setCommentText ] = useState('')
  const [submitting,   setSubmitting  ] = useState(false)

  // ── Like ──────────────────────────────────────────────────
  const handleLike = async () => {
    if (!isLoggedIn) { toast.info('Please log in to like posts'); return }
    try {
      const res = await api.post(`/like/${blog._id}`)
      setLikes(res.data.total)
      setMyLikes(res.data.userCount)
    } catch {
      toast.error('Could not like post')
    }
  }

  // ── Dislike ───────────────────────────────────────────────
  const handleDislike = async () => {
    if (!isLoggedIn) { toast.info('Please log in to rate posts'); return }
    try {
      const res = await api.post(`/dislike/${blog._id}`)
      setDislikes(res.data.total)
      setMyDislikes(res.data.userCount)
    } catch {
      toast.error('Could not dislike post')
    }
  }

  // ── Share ─────────────────────────────────────────────────
  const handleShare = async () => {
    if (!isLoggedIn) { toast.info('Please log in to share posts'); return }
    const url = `${window.location.origin}/read/${blog._id}`
    if (navigator.share) {
      try { await navigator.share({ title: blog.title, url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
      } catch {
        toast.error('Could not copy link')
      }
    }
    // Record share server-side
    try {
      const res = await api.post(`/share/${blog._id}`)
      setShares(res.data.total)
      setMyShares(res.data.userCount)
    } catch {}
  }

  // ── Comment ───────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) { toast.info('Please log in to comment'); return }
    if (!commentText.trim()) { toast.warn('Please enter a comment'); return }
    setSubmitting(true)
    try {
      const res = await api.post(`/comment/${blog._id}`, { text: commentText.trim() })
      setComments(prev => [...prev, res.data.comment])
      setCommentText('')
      toast.success('Comment posted!')
    } catch {
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article
      className="blog-card fade-in-up"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <img
        className="blog-card-img"
        src={blog.image?.url}
        alt={blog.title || 'Blog Post'}
        onError={(e) => { e.target.style.display = 'none' }}
      />

      <div className="blog-card-body">
        <span className="badge badge-accent">Article</span>
        <h3>{blog.title || 'Untitled'}</h3>
        <p>{(blog.content || '').slice(0, 100)}...</p>
      </div>

      <div className="blog-card-footer">
        <span className="blog-card-author">By {blog.author || 'Unknown'}</span>
        <Link to={`/read/${blog._id}`} className="btn btn-outline btn-sm">
          Read More →
        </Link>
      </div>

      {/* ── Action bar ── */}
      <div className="blog-card-actions">

        <button
          id={`btn-like-${blog._id}`}
          className="card-action-btn"
          onClick={handleLike}
          title={isLoggedIn ? `You liked ${myLikes}×` : 'Like'}
        >
          👍
          <span className="action-total">{likes}</span>
          {isLoggedIn && myLikes > 0 && (
            <span className="action-mine">you: {myLikes}</span>
          )}
        </button>

        <button
          id={`btn-dislike-${blog._id}`}
          className="card-action-btn"
          onClick={handleDislike}
          title={isLoggedIn ? `You disliked ${myDislikes}×` : 'Dislike'}
        >
          👎
          <span className="action-total">{dislikes}</span>
          {isLoggedIn && myDislikes > 0 && (
            <span className="action-mine">you: {myDislikes}</span>
          )}
        </button>

        <button
          id={`btn-comment-${blog._id}`}
          className={`card-action-btn ${showComments ? 'card-action-btn--active' : ''}`}
          onClick={() => setShowComments(s => !s)}
          title="Comment"
        >
          💬
          <span className="action-total">{comments.length}</span>
        </button>

        <button
          id={`btn-share-${blog._id}`}
          className="card-action-btn"
          onClick={handleShare}
          title={isLoggedIn ? `You shared ${myShares}×` : 'Share'}
        >
          🔗
          <span className="action-total">{shares}</span>
          {isLoggedIn && myShares > 0 && (
            <span className="action-mine">you: {myShares}</span>
          )}
        </button>

      </div>

      {/* ── Inline comment panel ── */}
      {showComments && (
        <div className="card-comments-panel">

          <form className="card-comment-form" onSubmit={handleComment}>
            <textarea
              id={`comment-text-${blog._id}`}
              className="card-comment-input card-comment-textarea"
              rows={2}
              placeholder={isLoggedIn ? 'Write a comment…' : 'Log in to comment'}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={!isLoggedIn || submitting}
              maxLength={500}
            />
            <button
              id={`btn-submit-comment-${blog._id}`}
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!isLoggedIn || submitting}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="card-no-comments">No comments yet — be the first!</p>
          ) : (
            <ul className="card-comment-list">
              {comments.slice().reverse().map(c => (
                <li key={c._id} className="card-comment-item">
                  <div className="card-comment-avatar">{(c.name || 'U')[0].toUpperCase()}</div>
                  <div>
                    <strong className="card-comment-name">{c.name}</strong>
                    <p className="card-comment-text">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

        </div>
      )}
    </article>
  )
}

// Main home component
const Home = () => {
  const [blogs,   setBlogs  ] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/').then(res => {
      if (Array.isArray(res.data)) {
        setBlogs(res.data)
        if (res.data.length > 0) toast.success('Blogs loaded!', { autoClose: 1500 })
      } else {
        toast.error('Failed to load blog data')
      }
      setLoading(false)
    }).catch(() => {
      toast.error('Failed to fetch blogs!')
      setLoading(false)
    })
  }, [])

  return (
    <>
      <title>Blogify-Home</title>
      <div className="page-wrapper">

        <div className="home-hero fade-in-up">
          <h1 className="gradient-text">Stories Worth Reading</h1>
          <p>Discover insightful articles, tutorials, and ideas from our community of writers.</p>
        </div>

        <h2 className="section-title">Latest Posts</h2>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && blogs.length === 0 && (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Be the first to publish something great!</p>
          </div>
        )}

        {!loading && blogs.length > 0 && (
          <div className="blog-grid">
            {blogs.map((blog, i) => (
              <BlogCard key={blog._id || i} blog={blog} index={i} />
            ))}
          </div>
        )}

      </div>
    </>
  )
}

export default Home
