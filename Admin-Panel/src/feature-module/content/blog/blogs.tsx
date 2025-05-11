import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CommonSelect from '../../../core/common/commonSelect';
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";

import PredefinedDateRanges from "../../../core/common/datePicker";
import CommonTagsInput from "../../../core/common/Taginput";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { fetchBlogs, Blog, BlogsResponse, createBlog, updateBlog, deleteBlog } from "../../../core/services/blogService";
import { toast } from "react-toastify";
import moment from "moment";

const socialInteractionStyles = `
  .social-interaction-wrapper {
    padding-top: 15px;
    margin-top: 12px;
    border-top: 1px solid #e9e9e9;
  }
  
  .social-item {
    display: flex;
    align-items: center;
    font-size: 13px;
    transition: all 0.3s ease;
    padding: 5px 8px;
    border-radius: 6px;
  }
  
  .social-item:hover {
    background-color: #f8f9fa;
  }
  
  .social-item i {
    font-size: 16px;
    margin-right: 5px;
  }
  
  .border-primary {
    border-width: 2px !important;
  }
  
  .text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .blog-summary {
    min-height: 48px;
  }
  
  .category-badges {
    z-index: 1;
  }
  
  .featured-tag {
    z-index: 2;
  }
  
  .card:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .blog-title {
    min-height: 48px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const Blogs = () => {
  const [tags, setTags] = useState<string[]>(["HRMS", "Recruitment", "HRTech"]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [newBlogData, setNewBlogData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'Select',
    tags: [] as string[],
    status: 'Active'
  });
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const categoryChoose = [
    { value: "Select", label: "Select" },
    { value: "Evlovution", label: "Evlovution" },
    { value: "Guide", label: "Guide" },
    { value: "Security", label: "Security" },
  ];
  const status = [
    { value: "Select", label: "Select" },
    { value: "Active", label: "Public" },
    { value: "Inactive", label: "Private" },
  ];

  useEffect(() => {
    loadBlogs();
  }, [currentPage]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetchBlogs(currentPage, 10);
      setBlogs(response.blogs);
      setTotalPages(response.totalPages);
      setTotalBlogs(response.totalBlogs);
      setLoading(false);
    } catch (error) {
      console.error("Error loading blogs:", error);
      toast.error("Failed to load blogs. Please try again.");
      setLoading(false);
    }
  };

  const handleAddBlog = async () => {
    try {
      if (!newBlogData.title || !newBlogData.content || !newBlogData.summary || newBlogData.category === "Select") {
        toast.error("Please fill in all required fields");
        return;
      }

      await createBlog({
        title: newBlogData.title,
        content: newBlogData.content,
        summary: newBlogData.summary,
        category: newBlogData.category,
        tags: newBlogData.tags as string[],
        published: newBlogData.status === "Active"
      });

      toast.success("Blog created successfully");
      // Reset form and reload blogs
      setNewBlogData({
        title: '',
        content: '',
        summary: '',
        category: 'Select',
        tags: [] as string[],
        status: 'Active'
      });
      loadBlogs();
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Failed to create blog. Please try again.");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    try {
      await deleteBlog(id);
      toast.success("Blog deleted successfully");
      loadBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog. Please try again.");
    }
  };

  const handleUpdateBlog = async () => {
    if (!selectedBlog) return;

    try {
      await updateBlog(selectedBlog._id, {
        title: newBlogData.title,
        content: newBlogData.content,
        summary: newBlogData.summary,
        category: newBlogData.category,
        tags: newBlogData.tags as string[],
        published: newBlogData.status === "Active"
      });

      toast.success("Blog updated successfully");
      loadBlogs();
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.error("Failed to update blog. Please try again.");
    }
  };

  const prepareForEdit = (blog: Blog) => {
    setSelectedBlog(blog);
    setNewBlogData({
      title: blog.title,
      content: blog.content,
      summary: blog.summary,
      category: blog.category,
      tags: blog.tags as string[],
      status: blog.published ? "Active" : "Inactive"
    });
  };

  // Filter blogs by category or tag
  const filterBlogs = (filterType: string) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };
  
  // Function to sort blogs with Remote Work at the top
  const sortedBlogs = [...blogs].sort((a, b) => {
    if (a.title.includes('Remote Work') && !b.title.includes('Remote Work')) {
      return -1;
    }
    if (!a.title.includes('Remote Work') && b.title.includes('Remote Work')) {
      return 1;
    }
    return 0;
  });

  // Function to filter blogs based on active filter
  const filteredBlogs = sortedBlogs.filter(blog => {
    if (!activeFilter) return true;
    
    if (activeFilter === 'Remote Work') {
      return blog.title.toLowerCase().includes('remote work') || 
             blog.tags.some(tag => tag.toLowerCase().includes('remote'));
    }
    
    if (activeFilter === 'Guide') {
      return blog.category === 'Guide' || 
             blog.tags.some(tag => tag.toLowerCase().includes('guide'));
    }
    
    if (activeFilter === 'Featured') {
      return blog.viewCount > 100 || blog.likes?.length > 10;
    }
    
    return true;
  });

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Blogs</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Content</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Blogs
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal" data-inert={true}
                  data-bs-target="#add_blog"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Blog
                </Link>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5>Blogs ({totalBlogs})</h5>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                  <div className="me-3">
                    <div className="input-icon-end position-relative">
                      <PredefinedDateRanges />
                      <span className="input-icon-addon">
                        <i className="ti ti-chevron-down" />
                      </span>
                    </div>
                  </div>
                  <div className="me-3 d-flex">
                    <button 
                      className={`btn ${activeFilter === 'Remote Work' ? 'btn-primary' : 'btn-outline-primary'} d-inline-flex align-items-center me-2`}
                      onClick={() => filterBlogs('Remote Work')}
                    >
                      <i className="ti ti-world me-1" /> Remote Work
                    </button>
                    <button 
                      className={`btn ${activeFilter === 'Guide' ? 'btn-success' : 'btn-outline-success'} d-inline-flex align-items-center me-2`}
                      onClick={() => filterBlogs('Guide')}
                    >
                      <i className="ti ti-book me-1" /> Guides
                    </button>
                    <button 
                      className={`btn ${activeFilter === 'Featured' ? 'btn-warning' : 'btn-outline-warning'} d-inline-flex align-items-center`}
                      onClick={() => filterBlogs('Featured')}
                    >
                      <i className="ti ti-star me-1" /> Featured
                    </button>
                  </div>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Sort By : Last 7 Days
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Recently Added
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Ascending
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Desending
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Last Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Last 7 Days
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="row justify-content-center">
              <div className="col-md-6 text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="row justify-content-center">
              <div className="col-md-6 text-center p-5">
                <div className="empty-state">
                  <ImageWithBasePath src="img/icons/no-data.svg" alt="No Data" width={120} />
                  <h4 className="mt-3">No blogs found</h4>
                  <p>Create your first blog by clicking the "Add Blog" button above.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="row justify-content-center">
              {filteredBlogs.length === 0 ? (
                <div className="col-md-6 text-center p-5">
                  <div className="empty-state">
                    <ImageWithBasePath src="img/icons/no-data.svg" alt="No Data" width={120} />
                    <h4 className="mt-3">No blogs found with this filter</h4>
                    <p>Try another filter or browse all blogs.</p>
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={() => setActiveFilter(null)}
                    >
                      Show All Blogs
                    </button>
                  </div>
                </div>
              ) : (
                filteredBlogs.map((blog) => (
                  <div className="col-xxl-4 col-md-6" key={blog._id}>
                    <div className={`card ${blog.title.includes('Remote Work') ? 'border-primary shadow-sm' : ''}`}>
                      <div className="card-body">
                        {blog.title.includes('Remote Work') && (
                          <div className="featured-tag position-absolute end-0 top-0 mt-2 me-2">
                            <span className="badge bg-primary text-white px-3 py-2 rounded-pill">
                              <i className="ti ti-star me-1"></i> Featured
                            </span>
                          </div>
                        )}
                        <div className="img-sec w-100 position-relative mb-3">
                          <Link to={`${all_routes.blogCategories}?id=${blog._id}`}>
                            <ImageWithBasePath
                              src={blog.image || "img/blogs/blog-01.jpg"}
                              className="img-fluid rounded w-100"
                              alt={blog.title}
                              height={200}
                            />
                          </Link>
                          <div className="category-badges position-absolute bottom-0 start-0 mb-2 ms-2">
                            <span className="trend-tag badge bg-info-transparent fs-10 fw-medium">
                              {blog.category}
                            </span>
                          </div>
                        </div>
                        <h5 className={`blog-title mb-2 ${blog.title.includes('Remote Work') ? 'text-primary' : ''}`}>
                          <Link to={`${all_routes.blogCategories}?id=${blog._id}`} className={blog.title.includes('Remote Work') ? 'text-primary' : ''}>
                            {blog.title}
                          </Link>
                        </h5>
                        <p className="text-truncate-2 mb-3 blog-summary">
                          {blog.summary}
                        </p>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center">
                            <span className="me-2 d-flex align-items-center">
                              <i className="ti ti-calendar me-1" /> {moment(blog.createdAt).format('DD/MM/YYYY')}
                            </span>
                            <Link
                              to="#"
                              className="border-start link-default fs-14 fw-normal ps-2 me-2 text-truncate"
                            >
                              <img
                                src={blog.author?.profilePicture || "img/users/user-02.jpg"}
                                className="avatar avatar-xs rounded-circle me-2 flex-shrink-0"
                                alt="User"
                              />
                              {blog.author?.firstName} {blog.author?.lastName}
                            </Link>
                          </div>
                          <div className="d-flex align-items-center">
                            <Link
                              to="#"
                              className="link-default me-2"
                              data-bs-toggle="modal"
                              data-bs-target="#edit_blog"
                              onClick={() => prepareForEdit(blog)}
                            >
                              <i className="ti ti-edit" />
                            </Link>
                            <Link
                              to="#"
                              className="link-default"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                              onClick={() => setSelectedBlog(blog)}
                            >
                              <i className="ti ti-trash" />
                            </Link>
                          </div>
                        </div>
                        <div className="social-interaction-wrapper">
                          <div className="d-flex align-items-center flex-wrap">
                            <div className="social-item me-3">
                              <i className="ti ti-eye me-1 text-muted"></i>
                              <span className="text-muted">{blog.viewCount || 0} views</span>
                            </div>
                            <div className="social-item me-3">
                              <i className="ti ti-heart me-1 text-danger"></i>
                              <span>{blog.likes?.length || 0} likes</span>
                            </div>
                            <div className="social-item me-3">
                              <i className="ti ti-message-dots me-1 text-info"></i>
                              <span>{blog.comments?.length || 0} comments</span>
                            </div>
                            <div className="social-item">
                              <i className="ti ti-share me-1 text-success"></i>
                              <span>{blog.shares?.length || 0} shares</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            {blog.tags?.map((tag, index) => (
                              <span key={index} className={`badge me-1 ${
                                tag.toLowerCase().includes('remote') ? 'bg-primary-transparent' : 
                                tag.toLowerCase().includes('work') ? 'bg-success-transparent' : 
                                tag.toLowerCase().includes('future') ? 'bg-warning-transparent' : 
                                'badge-light'
                              }`}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="row">
              <div className="col-md-12">
                <div className="pagination-tab d-flex justify-content-center">
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <a className="page-link" href="#" onClick={() => setCurrentPage(currentPage - 1)}>
                        <i className="ti ti-chevron-left" />
                      </a>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                      <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                        <a className="page-link" href="#" onClick={() => setCurrentPage(index + 1)}>
                          {index + 1}
                        </a>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <a className="page-link" href="#" onClick={() => setCurrentPage(currentPage + 1)}>
                        <i className="ti ti-chevron-right" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Blog Modal */}
      <div className="modal fade" id="add_blog" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
              <h5 className="modal-title">Add Blog</h5>
                <button
                  type="button"
                className="btn-close close-modal"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
            <div className="modal-body">
              <form>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Blog Title <span className="text-danger"> *</span>
                        </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newBlogData.title}
                        onChange={(e) => setNewBlogData({...newBlogData, title: e.target.value})}
                      />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Category <span className="text-danger"> *</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={categoryChoose}
                        defaultValue={categoryChoose.find(c => c.value === newBlogData.category)}
                        onChange={(option) => setNewBlogData({...newBlogData, category: option?.value || 'Select'})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Tags <span className="text-danger"> *</span>
                        </label>
                        <CommonTagsInput
                        value={newBlogData.tags}
                        onChange={(tags) => setNewBlogData({...newBlogData, tags: tags as string[]})}
                          placeholder="Add new"
                        className="form-control"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3 ">
                        <label className="form-label text-muted">
                          <small>Visibility</small>
                        </label>
                        <CommonSelect
                          className="select form-select-sm"
                          options={status}
                          defaultValue={status.find(s => s.value === newBlogData.status)}
                          onChange={(option) => setNewBlogData({...newBlogData, status: option?.value || 'Active'})}
                        />
                      </div>
                    </div>
                  <div className="col-md-12">
                      <div className="mb-3">
                      <label className="form-label">
                        Summary <span className="text-danger"> *</span>
                      </label>
                      <textarea 
                        className="form-control" 
                        rows={3}
                        value={newBlogData.summary}
                        onChange={(e) => setNewBlogData({...newBlogData, summary: e.target.value})}
                      ></textarea>
                        </div>
                      </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Content <span className="text-danger"> *</span>
                      </label>
                      <textarea 
                        className="form-control" 
                        rows={5}
                        value={newBlogData.content}
                        onChange={(e) => setNewBlogData({...newBlogData, content: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Upload Image</label>
                      <div className="file-upload position-relative">
                        <div className="input-form">
                          <input type="file" className="upload form-control" />
                        </div>
                        <div className="file-upload-img">
                          <ImageWithBasePath
                            src="img/icons/file-upload.svg"
                            alt="file upload"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light-danger"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleAddBlog}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Blog Modal */}
      <div className="modal fade" id="edit_blog" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
              <h5 className="modal-title">Edit Blog</h5>
                <button
                  type="button"
                className="btn-close close-modal"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
            <div className="modal-body">
              <form>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Blog Title <span className="text-danger"> *</span>
                        </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newBlogData.title}
                        onChange={(e) => setNewBlogData({...newBlogData, title: e.target.value})}
                      />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Category <span className="text-danger"> *</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={categoryChoose}
                        defaultValue={categoryChoose.find(c => c.value === newBlogData.category)}
                        onChange={(option) => setNewBlogData({...newBlogData, category: option?.value || 'Select'})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Tags <span className="text-danger"> *</span>
                        </label>
                        <CommonTagsInput
                        value={newBlogData.tags}
                        onChange={(tags) => setNewBlogData({...newBlogData, tags: tags as string[]})}
                          placeholder="Add new"
                        className="form-control"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3 ">
                        <label className="form-label text-muted">
                          <small>Visibility</small>
                        </label>
                        <CommonSelect
                          className="select form-select-sm"
                          options={status}
                          defaultValue={status.find(s => s.value === newBlogData.status)}
                          onChange={(option) => setNewBlogData({...newBlogData, status: option?.value || 'Active'})}
                        />
                      </div>
                    </div>
                  <div className="col-md-12">
                      <div className="mb-3">
                      <label className="form-label">
                        Summary <span className="text-danger"> *</span>
                      </label>
                      <textarea 
                        className="form-control" 
                        rows={3}
                        value={newBlogData.summary}
                        onChange={(e) => setNewBlogData({...newBlogData, summary: e.target.value})}
                      ></textarea>
                        </div>
                      </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Content <span className="text-danger"> *</span>
                      </label>
                      <textarea 
                        className="form-control" 
                        rows={5}
                        value={newBlogData.content}
                        onChange={(e) => setNewBlogData({...newBlogData, content: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Upload Image</label>
                      <div className="file-upload position-relative">
                        <div className="input-form">
                          <input type="file" className="upload form-control" />
                        </div>
                        <div className="file-upload-img">
                          <ImageWithBasePath
                            src="img/icons/file-upload.svg"
                            alt="file upload"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light-danger"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleUpdateBlog}
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Modal */}
      <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body p-4 text-center">
              <div className="prompt-image mx-auto mb-3">
                <ImageWithBasePath
                  src="img/icons/bin.svg"
                  alt="img"
                />
              </div>
              <div className="prompt-message">
                <h5 className="mb-2">Are you sure?</h5>
                <p>Do you really want to delete this blog? This process cannot be undone.</p>
              </div>
              <div className="mt-4">
                <button type="button" className="btn btn-light-danger me-3" data-bs-dismiss="modal">Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  data-bs-dismiss="modal"
                  onClick={() => selectedBlog && handleDeleteBlog(selectedBlog._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blogs;
