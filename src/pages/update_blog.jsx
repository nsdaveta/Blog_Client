import React, { useState, useEffect } from 'react'
import axios from 'axios'
import api from '../api'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './blog-form.css'

const Update_blog = () => {

  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    image: { url: '', public_id: '' }
  })

  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to update a post.');
      navigate('/login');
      return;
    }

    api.get(`/read/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
      }
    )
      .then(res => {

        setFormData(res.data)

      })
      .catch(() => {
        setError("Failed to load blog data. Please try refreshing the page.")
      })

  }, [id, navigate])

  const handleChange = (e) => {

    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (error) setError('')

  }

  const handleImageChange = (e) => {

    const file = e.target.files[0]

    if (!file) return

    setImageFile(file)

    const previewImage = URL.createObjectURL(file)

    setPreview(previewImage)

    if (error) setError('')

  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setSubmitting(true)

    const form = new FormData()

    form.append('title', formData.title)
    form.append('content', formData.content)
    form.append('author', formData.author)

    if (imageFile) {
      form.append('image', imageFile)
    }

    try {

      const res = await api.put(
        `/update/${id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      toast.success(res.data.message)

      navigate('/dashboard')

    } catch (err) {
      setError(err.response?.data?.message || "Update failed. Please try again.")
    } finally {
      setSubmitting(false)
    }

  }

  return (
    <>
      <title>Blogify-Update Blog</title>
      <div className="blog-form-wrapper">

        <div className="blog-form-header fade-in-up">
          <h1>📝 Update Post</h1>
          <p>Edit your blog content</p>
        </div>

        <form className="blog-form" onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="title">Post Title</label>

            <input
              id="title"
              type="text"
              name="title"
              placeholder="An engaging headline..."
              value={formData.title}
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="author">Author Name</label>

            <input
              id="author"
              type="text"
              name="author"
              placeholder="Your name"
              value={formData.author}
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="content">Content</label>

            <textarea
              id="content"
              name="content"
              placeholder="Write your story here..."
              value={formData.content}
              onChange={handleChange}
              rows="10"
              required
            />

          </div>

          <div className="form-group">

            <label>Replace Image</label>

            <div className="upload-area">

              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              <label htmlFor="image" style={{ cursor: 'pointer' }}>
                📷 Click to select new image
              </label>

              <p>
                {imageFile ? imageFile.name : 'PNG, JPG, WEBP up to 10MB'}
              </p>

            </div>

            {preview ? (

              <div className="image-preview">

                <img src={preview} alt="Preview" />

              </div>

            ) : formData.image?.url ? (

              <div className="image-preview">

                <img 
                  src={formData.image.url} 
                  alt="Current blog" 
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />

              </div>

            ) : null}

            {error && (
              <div className="error-box fade-in" style={{ 
                marginTop: '1rem', 
                padding: '0.85rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid #ef4444', 
                color: '#ef4444', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>🚨</span> {error}
              </div>
            )}

          </div>

          <div className="blog-form-actions">

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >

              {submitting ? 'Updating...' : '💾 Update Post'}

            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/dashboard')}
            >

              Cancel

            </button>

          </div>

        </form>

      </div>
    </>

  )

}

export default Update_blog