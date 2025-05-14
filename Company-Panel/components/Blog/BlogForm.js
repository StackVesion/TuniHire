import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { createAuthAxios } from '../../utils/authUtils';

// Import the rich text editor dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function BlogForm({ blogId }) {
  const router = useRouter();
  const isEditing = !!blogId;
  const authAxios = createAuthAxios();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: '',
    tags: [],
    image: '',
    published: true
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Categories for the dropdown
  const categories = [
    'Career Advice',
    'Industry Insights',
    'Job Market Trends',
    'Company Culture',
    'Interviews',
    'Skills Development',
    'Technology',
    'HR & Recruitment',
    'Workplace Tips',
    'Other'
  ];
  
  useEffect(() => {
    if (isEditing) {
      fetchBlogData();
    }
  }, [blogId]);
  
  const fetchBlogData = async () => {
    try {
      const response = await authAxios.get(`/api/blogs/${blogId}`);
      
      const blog = response.data;
      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        summary: blog.summary || '',
        category: blog.category || '',
        tags: blog.tags || [],
        image: blog.image || '',
        published: blog.published !== undefined ? blog.published : true
      });
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch blog data');
      console.error('Error fetching blog data:', error);
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content
    });
  };
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.summary || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditing) {
        // Update existing blog
        await authAxios.put(
          `/api/blogs/${blogId}`,
          formData
        );
        toast.success('Blog updated successfully');
      } else {
        // Create new blog
        await authAxios.post(
          `/api/blogs`,
          formData
        );
        toast.success('Blog created successfully');
      }
      
      // Redirect to blogs page
      router.push('/blogs');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update blog' : 'Failed to create blog');
      console.error('Error submitting blog:', error);
      setSubmitting(false);
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
  
  return (
    <div className="section-content">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="form-group-wrap">
              <h2 className="mb-40">{isEditing ? 'Edit Blog' : 'Create New Blog'}</h2>
              
              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="form-group mb-30">
                  <label className="font-sm color-text-mutted mb-10">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                
                {/* Summary */}
                <div className="form-group mb-30">
                  <label className="font-sm color-text-mutted mb-10">Summary *</label>
                  <textarea
                    className="form-control"
                    name="summary"
                    value={formData.summary}
                    onChange={handleChange}
                    placeholder="Enter a brief summary of your blog"
                    rows="3"
                    required
                  ></textarea>
                </div>
                
                {/* Category */}
                <div className="form-group mb-30">
                  <label className="font-sm color-text-mutted mb-10">Category *</label>
                  <select
                    className="form-control"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                {/* Content */}
                <div className="form-group mb-30">
                  <label className="font-sm color-text-mutted mb-10">Content *</label>
                  <div style={{ height: '300px', marginBottom: '40px' }}>
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={handleContentChange}
                      style={{ height: '250px' }}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                </div>
                
                {/* Tags */}
                <div className="form-group mb-30">
                  <label className="font-sm color-text-mutted mb-10">Tags</label>
                  <div className="d-flex">
                    <input
                      type="text"
                      className="form-control"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      className="btn btn-default ml-10"
                      onClick={handleAddTag}
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Display tags */}
                  {formData.tags.length > 0 && (
                    <div className="mt-15">
                      {formData.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="badge bg-light text-dark mr-5 mb-5 p-2"
                          style={{ fontSize: '14px' }}
                        >
                          {tag}
                          <button
                            type="button"
                            className="btn-sm text-danger ml-5"
                            style={{ background: 'none', border: 'none', padding: '0 5px' }}
                            onClick={() => handleRemoveTag(tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Image URL */}
                <div className="form-group mb-30">
                  <label className="font-sm color-text-mutted mb-10">Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="Enter image URL"
                  />
                  
                  {/* Image preview */}
                  {formData.image && (
                    <div className="mt-15">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="img-fluid rounded" 
                        style={{ maxHeight: '200px' }} 
                      />
                    </div>
                  )}
                </div>
                
                {/* Published status */}
                <div className="form-group mb-30">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="published"
                      id="publishedCheck"
                      checked={formData.published}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="publishedCheck">
                      Publish this blog
                    </label>
                  </div>
                </div>
                
                {/* Submit button */}
                <div className="form-group mb-30">
                  <button
                    type="submit"
                    className="btn btn-default mr-15"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-5" role="status" aria-hidden="true"></span>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEditing ? 'Update Blog' : 'Create Blog'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => router.push('/blogs')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 