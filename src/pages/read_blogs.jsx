import React, { useEffect, useState } from "react"
import api from "../api"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"

const ReadMore = () => {
  const { id } = useParams()
  const [blog,    setBlog   ] = useState(null)
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

  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <h3>Loading blog...</h3>
    </div>
  )

  if (!blog) return (
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <h3>Blog not found</h3>
    </div>
  )

  return (
    <>
      <title>Blogify — {blog.title}</title>

      <div className="read-blog-container">
        <h1>{blog.title}</h1>

        <p><strong>Author:</strong> {blog.author}</p>

        {blog.image?.url && (
          <img
            src={blog.image.url}
            alt={blog.title}
            style={{
              width: "100%",
              maxWidth: "600px",
              marginTop: "20px",
              borderRadius: "10px"
            }}
          />
        )}

        <p style={{ marginTop: "30px", lineHeight: "1.7" }}>
          {blog.content}
        </p>
      </div>
    </>
  )
}

export default ReadMore