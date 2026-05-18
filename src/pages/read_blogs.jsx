import React, { useEffect, useState } from "react"
import api from "../api"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { VscArrowLeft, VscCalendar, VscAccount } from 'react-icons/vsc'
import './read_blog.css'

const ReadMore = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [blog, setBlog] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const res = await api.get(`/read/${id}`)
                setBlog(res.data)
            } catch (err) {
                toast.error("Failed to load blog")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchBlog()
    }, [id])

    // Must be called before any early returns (Rules of Hooks)
    useEffect(() => {
        if (blog?.title) {
            document.title = `Blogify - ${blog.title}`
        }
        return () => {
            document.title = 'Blogify'
        }
    }, [blog])

    if (loading) return (
        <div className="read-loading">
            <div className="spinner" />
            <h3>Loading blog...</h3>
        </div>
    )

    if (!blog) return (
        <div className="read-loading">
            <h3>Blog not found</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>
                Go Home
            </button>
        </div>
    )

    return (
        <>
            <div className="read-blog-container fade-in">
                <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '2rem' }}>
                    <VscArrowLeft /> Back
                </button>

                <article className="read-blog-header">
                    {blog.image?.url && (
                        <img
                            className="read-blog-img"
                            src={blog.image.url}
                            alt={blog.title}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                        />
                    )}

                    <div className="read-blog-meta">
                        <span className="badge badge-accent">Featured Story</span>
                        <h1>{blog.title}</h1>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                            <span className="read-blog-author">
                                <VscAccount style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                {blog.author}
                            </span>
                            <span className="read-blog-date">
                                <VscCalendar style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                {new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', { 
                                    month: 'long', day: 'numeric', year: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                </article>

                <div
                    className="read-blog-content glass-card"
                    style={{ padding: '2rem', borderLeft: 'none' }}
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                <div className="read-action-bar">
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Liked this story? Share it with your friends!</span>
                </div>
            </div>
        </>
    )
}

export default ReadMore