import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';
import { createAuthAxios } from '../../utils/authUtils';

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const authAxios = createAuthAxios();

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/api/blogs`, {
        params: {
          page: currentPage,
          limit: 10
        }
      });
      
      setBlogs(response.data.blogs);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await authAxios.delete(`/api/blogs/${id}`);
        toast.success('Blog deleted successfully');
        fetchBlogs();
      } catch (error) {
        toast.error('Failed to delete blog');
        console.error('Error deleting blog:', error);
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  return (
    <div className="section-content">
      <div className="container">
        <div className="row mb-30">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <h2 className="section-title">Company Blogs</h2>
            <Link href="/blog/create">
              Create New Blog
            </Link>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <p className="font-md color-text-paragraph mt-30">No blogs found. Create your first blog post!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="row">
              {blogs.map((blog) => (
                <div key={blog._id} className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                  <div className="card-grid-2 hover-up">
                    <div className="card-grid-2-image-left">
                      {blog.image ? (
                        <div className="image-box">
                          <img src={blog.image} alt={blog.title} />
                        </div>
                      ) : (
                        <div className="image-box bg-light">
                          <span className="display-4 text-muted">📝</span>
                        </div>
                      )}
                    </div>
                    <div className="card-block-info">
                      <h6>
                        <Link href={`/blog/${blog._id}`}>
                          {blog.title}
                        </Link>
                      </h6>
                      <div className="mt-5">
                        <span className="card-briefcase">{blog.category}</span>
                        <span className="card-time">
                          <span>{moment(blog.createdAt).fromNow()}</span>
                        </span>
                      </div>
                      <p className="font-sm color-text-paragraph mt-15">{blog.summary}</p>
                      <div className="mt-30">
                        <Link href={`/blog/${blog._id}`} className="btn btn-grey-small mr-5">
                          View
                        </Link>
                        <Link href={`/blog/edit/${blog._id}`} className="btn btn-grey-small mr-5">
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(blog._id)} 
                          className="btn btn-grey-small btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="row">
                <div className="col-lg-12 text-center mt-30">
                  <div className="paginations">
                    <ul className="pager">
                      <li>
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={`pager-prev ${currentPage === 1 ? 'disabled' : ''}`}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(totalPages).keys()].map((page) => (
                        <li key={page + 1}>
                          <button
                            onClick={() => handlePageChange(page + 1)}
                            className={`pager-item ${currentPage === page + 1 ? 'active' : ''}`}
                          >
                            {page + 1}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={`pager-next ${currentPage === totalPages ? 'disabled' : ''}`}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 