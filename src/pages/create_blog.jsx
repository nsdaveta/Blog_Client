import React, { useState, useEffect } from 'react'
import axios from 'axios'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './blog-form.css'

const Create_blog = () => {

  const navigate = useNavigate()

  const storedUser = JSON.parse(localStorage.getItem('userdata') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to create a post.');
      navigate('/login');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: storedUser.name || ''
  })

  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {

    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

  }

  const handleImageChange = (e) => {

    const file = e.target.files[0]

    if (!file) return

    setImageFile(file)

    const imagePreview = URL.createObjectURL(file)

    setPreview(imagePreview)

  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!imageFile) {
      toast.error("Cover image is required!")
      return
    }

    setSubmitting(true)

    const form = new FormData()

    form.append('title', formData.title)
    form.append('content', formData.content)
    form.append('author', formData.author)

    if (imageFile) {
      form.append('image', imageFile)
    }

    try {

      await api.post('/create', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setFormData({
        title: '',
        content: '',
        author: storedUser.name || ''
      })

      toast.success("Blog created successfully! 🎉")

      navigate('/dashboard')

    } catch (err) {

      toast.error(err.response?.data?.message || "Failed to create blog")

    } finally {

      setSubmitting(false)

    }

  }

  return (
    <>
      <title>Blogify-Create Blog</title>
      <div className="blog-form-wrapper">

        <div className="blog-form-header fade-in-up">
          <h1>✍️ Create a New Post</h1>
          <p>Share your thoughts with the world</p>
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

            <label>Cover Image</label>

            <div className="upload-area">

              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              <label htmlFor="image" style={{ cursor: 'pointer' }}>
                📷 Click to upload image
              </label>

              <p>
                {imageFile ? imageFile.name : 'PNG, JPG, WEBP up to 10MB'}
              </p>

            </div>

            {preview && (

              <div className="image-preview">

                <img src={preview} alt="Preview" />

              </div>

            )}

          </div>

          <div className="blog-form-actions">

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >

              {submitting ? 'Publishing...' : '🚀 Publish Post'}

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

export default Create_blog