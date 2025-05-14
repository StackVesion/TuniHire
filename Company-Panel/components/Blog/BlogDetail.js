import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import { createAuthAxios } from '../../utils/authUtils';

export default function BlogDetail({ blogId }) {
  const router = useRouter();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const authAxios = createAuthAxios();

  useEffect(() => {
    if (blogId) {
      fetchBlog();
      fetchCurrentUser();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/api/blogs/${blogId}`);
      setBlog(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch blog details');
      console.error('Error fetching blog details:', error);
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await authAxios.get(`/api/users/me`);
      setCurrentUserId(response.data._id);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await authAxios.delete(`/api/blogs/${blogId}`);
        toast.success('Blog deleted successfully');
        router.push('/blogs');
      } catch (error) {
        toast.error('Failed to delete blog');
        console.error('Error deleting blog:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="section-content">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-12">
              <div className="mt-50 mb-30">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="section-content">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-12">
              <h2 className="mt-50 mb-30">Blog not found</h2>
              <Link href="/blogs" className="btn btn-default">
                Back to Blogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = currentUserId && blog.author && blog.author._id === currentUserId;

  return (
    <div className="section-content">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="single-article">
              {/* Blog header */}
              <div className="text-center mb-40">
                <h1 className="mb-15">{blog.title}</h1>
                <div className="blog-meta">
                  <span className="mr-20">
                    <i className="fi-rr-user mr-5"></i>
                    {blog.author ? `${blog.author.firstName} ${blog.author.lastName}` : 'Unknown Author'}
                  </span>
                  <span className="mr-20">
                    <i className="fi-rr-calendar mr-5"></i>
                    {moment(blog.createdAt).format('MMMM D, YYYY')}
                  </span>
                  <span>
                    <i className="fi-rr-tag mr-5"></i>
                    {blog.category}
                  </span>
                </div>
              </div>

              {/* Featured image */}
              {blog.image && (
                <div className="mb-30">
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="img-fluid rounded" 
                    style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} 
                  />
                </div>
              )}

              {/* Blog content */}
              <div className="blog-content mb-50">
                <div dangerouslySetInnerHTML={{ __html: blog.content }} />
              </div>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="blog-tags mb-40">
                  <strong className="mr-10">Tags:</strong>
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="badge bg-light text-dark mr-5 mb-5">{tag}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="blog-actions">
                <Link href="/blogs" className="btn btn-default">
                  Back to Blogs
                </Link>

                {isAuthor && (
                  <>
                    <Link href={`/blog/edit/${blog._id}`} className="btn btn-primary ml-10">
                      Edit
                    </Link>
                    <button 
                      onClick={handleDelete} 
                      className="btn btn-danger ml-10"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 