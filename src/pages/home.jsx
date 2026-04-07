import React, { useEffect, useState } from 'react'
import api from '../api'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import './home.css'

// Decode userId from the stored JWT
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).id || null;
  } catch (e) {
    console.error("JWT Decode Error:", e);
    return null;
  }
}

// Sum all per-user counts from an action array
const totalCount = (arr = []) => arr.reduce((sum, e) => sum + (e.count || 0), 0)

// Find current user's count from an action array
const myCount = (arr = [], userId) =>
  arr.find(e => e.userId === userId || e.userId?._id === userId)?.count || 0

// ── Adaptive Share Modal (Fallback for Legacy Desktop/Linux) ─────────────
const ShareModal = ({ blog, onClose, onShareRecorded }) => {
  const shareUrl = `https://blog-server-7c1i.onrender.com/blog/preview/${blog._id}`
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  const socialLinks = [
    { name: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent(blog.title + ': ' + shareUrl)}` },
    { name: 'Telegram', icon: '✈️', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(blog.title)}` },
    { name: 'Twitter (X)', icon: '𝕏', url: `https://x.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}` },
    { name: 'Facebook', icon: '🫂', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'Instagram', icon: '📸', url: `https://www.instagram.com/` }
  ]

  const onSocialClick = (url) => {
    window.open(url, '_blank', 'width=600,height=500')
    onShareRecorded()
  }

  return (
    <div className="share-overlay active">
      <div className="share-overlay-backdrop" onClick={onClose} />
      <div className="share-modal-content">
        <div className="share-header">
          <h3><span>🚀</span> Share this Story</h3>
          <button className="share-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="share-url-container">
          <input readOnly value={shareUrl} className="share-url-input" />
          <button onClick={handleCopy} className={`share-copy-btn ${copied ? 'copied' : ''}`}>
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
        </div>

        <div className="share-social-grid">
          {socialLinks.map(s => (
            <button key={s.name} className="share-social-item" onClick={() => onSocialClick(s.url)}>
              <span className="share-social-icon">{s.icon}</span>
              <span className="share-social-name">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Individual blog card
const BlogCard = ({ blog, index }) => {
  const currentUserId = getCurrentUserId()
  const isLoggedIn = !!currentUserId

  const [likes, setLikes] = useState(totalCount(blog.likes))
  const [dislikes, setDislikes] = useState(totalCount(blog.dislikes))
  const [shares, setShares] = useState(totalCount(blog.shares))
  const [comments, setComments] = useState(blog.comments ?? [])
  const [myLikes, setMyLikes] = useState(myCount(blog.likes, currentUserId))
  const [myDislikes, setMyDislikes] = useState(myCount(blog.dislikes, currentUserId))
  const [myShares, setMyShares] = useState(myCount(blog.shares, currentUserId))
  const [showComments, setShowComments] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Like ──────────────────────────────────────────────────
  const handleLike = async () => {
    if (!isLoggedIn) { toast.info('Please log in to like posts'); return }
    const storedUser = JSON.parse(localStorage.getItem('userdata') || '{}');
    if (blog.author === storedUser.name) {
      toast.error("Author cannot like their own post");
      return;
    }
    try {
      const res = await api.post(`/like/${blog._id}`)
      setLikes(res.data.total)
      setMyLikes(res.data.userCount)
      // Clear dislike locally if server removed it
      if (res.data.dislikesTotal !== undefined) {
        setDislikes(res.data.dislikesTotal)
        setMyDislikes(0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not like post')
    }
  }

  // ── Share ────────────────────────────────────────────────
  const handleShare = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!isLoggedIn) { toast.info('Please log in to share posts'); return }

    const shareUrl = `https://blog-server-7c1i.onrender.com/blog/preview/${blog._id}`
    const shareData = {
      title: blog.title || 'Blog Post',
      text: `Check out this blog: ${blog.title}`,
      url: shareUrl
    }
    // ── ADAPTIVE SHARE FLOW (Native Priority) ──
    try {
      let shareHandled = false;

      // 1. Attempt Native Web Share ONLY if available (now stable via app:// protocol)
      if (navigator.share && typeof navigator.share === 'function') {
        try {
          await navigator.share(shareData);
          shareHandled = true;
          recordShare();
        } catch (err) {
          // If aborted by user, we're done. Otherwise, show fallback modal.
          if (err.name !== 'AbortError') {
             setShowShareModal(true);
          }
        }
      } 
      
      // 2. Fallback to custom modal if not handled
      if (!shareHandled) {
        setShowShareModal(true);
        recordShare();
      }
    } catch (err) {
      console.error('Critical Share System Failure:', err);
      setShowShareModal(true);
    }
  }

  const recordShare = async () => {
    try {
      if (!blog || !blog._id) return;
      const res = await api.post(`/share/${blog._id}`)
      setShares(res.data.total)
      setMyShares(res.data.userCount)
    } catch (err) {
      console.error('Share record failed:', err)
      toast.error('Please login to share posts')
    }
  }

  // ── Dislike ───────────────────────────────────────────────
  const handleDislike = async () => {
    if (!isLoggedIn) { toast.info('Please log in to dislike posts'); return }
    const storedUser = JSON.parse(localStorage.getItem('userdata') || '{}');
    if (blog.author === storedUser.name) {
      toast.error("The same user who has created the blog can't dislike the post");
      return;
    }
    try {
      const res = await api.post(`/dislike/${blog._id}`)
      setDislikes(res.data.total)
      setMyDislikes(res.data.userCount)
      // Clear like locally if server removed it
      if (res.data.likesTotal !== undefined) {
        setLikes(res.data.likesTotal)
        setMyLikes(0)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not dislike post')
    }
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
      {/* ── Adaptive Share Modal Fallback ── */}
      {showShareModal && (
        <ShareModal
          blog={blog}
          onClose={() => setShowShareModal(false)}
          onShareRecorded={recordShare}
        />
      )}
    </article>
  )
}

// Main home component
const Home = () => {
  const [blogs, setBlogs] = useState([])
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
