import React, { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { createAuthAxios } from '../utils/authUtils'
import withAuth from '../utils/withAuth'
import ApplicationDialog from '../components/jobs/ApplicationDialog'

function ApplyForJobs({ user }) {
  const router = useRouter()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    workplaceType: '',
    sortBy: 'newest'
  })
  const [authAxios] = useState(() => createAuthAxios())
  const [showJobDetail, setShowJobDetail] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [hrContact, setHrContact] = useState(null)
  const [loadingHrContact, setLoadingHrContact] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    if (selectedJob && selectedJob.companyId) {
      fetchHrContact(selectedJob.companyId);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const response = await authAxios.get('/api/jobs')
      console.log('Jobs fetched:', response.data)
      setJobs(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Failed to load jobs. Please try again later.')
      toast.error('Failed to load jobs. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHrContact = async (companyId) => {
    setLoadingHrContact(true);
    try {
      // Extract the company ID string if companyId is an object
      const companyIdString = typeof companyId === 'object' ? companyId._id : companyId;
      
      // Make a real API call to get HR contact information
      const response = await authAxios.get(`/api/companies/hr-contact/${companyIdString}`);
      setHrContact(response.data.hrContactInfo);
    } catch (err) {
      console.error('Error fetching HR contact:', err);
      // Fallback to default data if API fails
      setHrContact({
        companyName: selectedJob?.companyId?.name || "Company",
        hrManager: {
          name: "HR Manager",
          email: "hr@company.com",
          profilePicture: "/assets/imgs/page/dashboard/avatar.png",
          department: "Human Resources",
          phone: "+1 (555) 123-4567"
        }
      });
    } finally {
      setLoadingHrContact(false);
    }
  };

  const handleShowJobDetail = (job) => {
    setSelectedJob(job)
    setShowJobDetail(true)
  }

  const handleApply = (e) => {
    if (e) e.stopPropagation() 
    // Close job details sidebar before opening application dialog
    setShowJobDetail(false)
    setShowApplicationDialog(true)
  }

  const handleApplicationAction = async (formData, action = 'submit') => {
    if (action === 'fetch-portfolio') {
      try {
        const response = await authAxios.get(`/api/portfolios/user`);
        console.log('Portfolio data fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        throw new Error('Could not fetch portfolio data');
      }
    } else {
      try {
        const payload = {
          jobId: formData.jobId,
          coverLetter: formData.coverLetter
        };
        
        const response = await authAxios.post('/api/applications/apply/' + formData.jobId, payload);
        toast.success('Application submitted successfully!');
        return response.data;
      } catch (error) {
        console.error('Error submitting application:', error);
        toast.error(error.response?.data?.message || 'Failed to submit application');
        throw error;
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      location: '',
      workplaceType: '',
      sortBy: 'newest'
    })
  }

  const getFilteredJobs = () => {
    return jobs
      .filter(job => {
        const searchMatch = filters.search === '' || 
          job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          (job.companyId?.name && job.companyId.name.toLowerCase().includes(filters.search.toLowerCase()))
        
        const locationMatch = filters.location === '' || 
          (job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()))
        
        const workplaceMatch = filters.workplaceType === '' || 
          job.workplaceType === filters.workplaceType
        
        return searchMatch && locationMatch && workplaceMatch
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        } else if (filters.sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt)
        } else if (filters.sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title)
        }
        return 0
      })
  }

  const filteredJobs = getFilteredJobs()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }
  
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const sidebarVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      x: '100%',
      opacity: 0,
      transition: { 
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  }
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <Layout>
      <div>
        <section className="section-box mb-50">
          <div className="container">
            <div className="text-center">
              <motion.h3 
                className="mt-15 color-brand-1" 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Browse Available Jobs
              </motion.h3>
              <motion.p
                className="font-lg color-text-paragraph-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Discover career opportunities matching your experience and skills
              </motion.p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="section-box mb-30"
        >
          <div className="container">
            <div className="box-shadow-border p-30 mb-30 bg-white">
              <div className="search-jobs">
                <div className="row mb-4">
                  <div className="col-md-6 col-lg-4 mb-3">
                    <div className="form-group">
                      <label className="font-sm color-text-mutted mb-1">Search</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="search" 
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Job title or company name" 
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-4 mb-3">
                    <div className="form-group">
                      <label className="font-sm color-text-mutted mb-1">Location</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="location" 
                        value={filters.location}
                        onChange={handleFilterChange}
                        placeholder="City or country" 
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-4 mb-3">
                    <div className="form-group">
                      <label className="font-sm color-text-mutted mb-1">Workplace Type</label>
                      <select 
                        className="form-control" 
                        name="workplaceType" 
                        value={filters.workplaceType}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Types</option>
                        <option value="Remote">Remote</option>
                        <option value="Office">Office</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row align-items-center">
                  <div className="col-md-6 col-lg-4 mb-3">
                    <div className="form-group">
                      <label className="font-sm color-text-mutted mb-1">Sort By</label>
                      <select 
                        className="form-control" 
                        name="sortBy" 
                        value={filters.sortBy}
                        onChange={handleFilterChange}
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="alphabetical">Alphabetical</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-8 text-end">
                    <button 
                      className="btn btn-outline-primary me-2" 
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={fetchJobs}
                    >
                      Refresh Jobs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Jobs Display Section */}
        <section className="section-box">
          <div className="container">
            <div className="row">
              <div className="col-12">
                {isLoading ? (
                  <div className="text-center p-50">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading available jobs...</p>
                  </div>
                ) : error ? (
                  <div className="text-center p-50">
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center p-50">
                    <img 
                      src="/assets/imgs/page/dashboard/no-data.svg" 
                      alt="No jobs found" 
                      className="mb-3" 
                      style={{ maxHeight: '150px' }} 
                    />
                    <h5>No jobs match your criteria</h5>
                    <p className="color-text-paragraph mt-2">Try adjusting your filters or check back later for new opportunities</p>
                  </div>
                ) : (
                  <motion.div 
                    className="row"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {filteredJobs.map((job) => (
                      <motion.div 
                        key={job._id} 
                        className="col-xl-4 col-lg-6 col-md-6"
                        variants={fadeInUp}
                      >
                        <div 
                          className="card-grid-2 hover-up mb-30 cursor-pointer" 
                          onClick={() => handleShowJobDetail(job)}
                        >
                          <div className="card-grid-2-image-left">
                            
                            <div className="right-info">
                              <h5 className="truncate-text-1">{job.title}</h5>
                              <span className="location-small">
                                {job.companyId?.name || "Company"} 
                              </span>
                            </div>
                          </div>
                          <div className="card-block-info">
                            <div className="mb-5 d-flex justify-content-start">
                              <span className={`card-briefcase ${
                                job.workplaceType === 'Remote' ? 'remote' : 
                                job.workplaceType === 'Hybrid' ? 'hybrid' : ''
                              }`}>
                                {job.workplaceType || "Workplace"}
                              </span>
                              <span className="card-time">
                                <span>{new Date(job.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                              </span>
                            </div>
                            <p className="font-sm color-text-paragraph truncate-text-3">
                              {job.description}
                            </p>
                            <div className="mt-15">
                              <h6 className="color-text-paragraph-2 font-sm mb-10">
                                Requirements:
                              </h6>
                              <div className="d-flex flex-wrap">
                                {job.requirements && job.requirements.length > 0 ? (
                                  job.requirements.slice(0, 3).map((req, idx) => (
                                    <span key={idx} className="btn btn-tag-outline mb-1 me-1">{req}</span>
                                  ))
                                ) : (
                                  <span className="font-sm color-text-paragraph">No requirements specified</span>
                                )}
                                {job.requirements && job.requirements.length > 3 && (
                                  <span className="btn btn-tag-outline mb-1 me-1">+{job.requirements.length - 3} more</span>
                                )}
                              </div>
                            </div>
                            <div className="mt-30">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="salary-info">
                                  <span className="font-sm color-text-paragraph-2">Salary:</span>
                                  <span className="font-bold color-brand-1 ml-5">{job.salaryRange || "Not disclosed"}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowJobDetail(job);
                                  }} 
                                  className="btn btn-apply-now"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Job Detail Sidebar */}
        <AnimatePresence>
          {showJobDetail && selectedJob && (
            <>
              {/* Overlay Background */}
              <motion.div 
                className="sidebar-overlay" 
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => setShowJobDetail(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 1000
                }}
              />
              
              {/* Sidebar */}
              <motion.div 
                className="job-detail-sidebar bg-white shadow-sm"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30 
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  width: '420px',
                  maxWidth: '100%',
                  height: '100vh',
                  overflowY: 'auto',
                  zIndex: 1050,
                  padding: '20px'
                }}
              >
                {/* Close Button */}
                <button 
                  type="button" 
                  className="btn-close position-absolute" 
                  style={{ top: '20px', right: '20px' }}
                  onClick={() => setShowJobDetail(false)}
                  aria-label="Close"
                ></button>
                {/* Company Logo & Name */}
                <div className="company-header d-flex align-items-center mb-4">
                  <motion.div 
                    className="company-logo me-3"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <img 
                      src={selectedJob.companyId?.logo || "/assets/imgs/page/dashboard/company-logo.svg"} 
                      alt="Company Logo"
                      className="img-fluid rounded shadow-sm"
                      style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                    />
                  </motion.div>
                  <div>
                    <motion.h5 
                      className="mb-1"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {selectedJob.companyId?.name || 'Company Name'}
                    </motion.h5>
                    <motion.p 
                      className="text-muted mb-0 small d-flex align-items-center"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <i className="fas fa-globe me-1 text-primary"></i>
                      {selectedJob.companyId?.website || 'company.com'}
                    </motion.p>
                    <motion.div 
                      className="d-flex align-items-center mt-1"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <i className="fas fa-users me-1 text-primary"></i>
                      <span className="text-muted small">
                        {selectedJob.companyId?.numberOfEmployees || '1000+'} Employees
                      </span>
                    </motion.div>
                  </div>
                </div>
                
                {/* HR Contact Section */}
                <motion.div 
                  className="hr-contact-section mb-4 p-3 bg-light rounded"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h6 className="section-title d-flex align-items-center mb-3">
                    <i className="fas fa-id-card-alt me-2 text-primary"></i>
                    HR Contact Information
                  </h6>
                  
                  {loadingHrContact ? (
                    <div className="d-flex justify-content-center align-items-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="text-muted">Loading contact details...</span>
                    </div>
                  ) : hrContact ? (
                    <motion.div 
                      className="hr-contact-details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="d-flex mb-3">
                        <div className="hr-avatar position-relative me-3">
                          <img 
                            src={hrContact.hrManager?.profilePicture || "/assets/imgs/page/dashboard/avatar.png"} 
                            alt="HR Avatar"
                            className="rounded-circle"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <span className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1" 
                                style={{ width: '12px', height: '12px', border: '2px solid white' }}></span>
                        </div>
                        <div>
                          <h6 className="mb-0">{hrContact.hrManager?.name || 'HR Manager'}</h6>
                          <p className="text-muted mb-0 small">{hrContact.hrManager?.department || 'Human Resources'}</p>
                        </div>
                      </div>
                      
                      <div className="contact-info">
                        <div className="d-flex align-items-center mb-2">
                          <div className="icon-wrapper me-2 bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                               style={{ width: '30px', height: '30px' }}>
                            <i className="fas fa-envelope text-primary" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <a href={`mailto:${hrContact.hrManager?.email}`} className="text-reset text-decoration-none">
                            {hrContact.hrManager?.email || 'hr@company.com'}
                          </a>
                        </div>
                        
                        <div className="d-flex align-items-center">
                          <div className="icon-wrapper me-2 bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                               style={{ width: '30px', height: '30px' }}>
                            <i className="fas fa-phone-alt text-primary" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <a href={`tel:${hrContact.hrManager?.phone}`} className="text-reset text-decoration-none">
                            {hrContact.hrManager?.phone || '+1 (555) 123-4567'}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted py-2">
                      <i className="fas fa-info-circle me-2"></i>
                      <span>No contact information available</span>
                    </div>
                  )}
                </motion.div>
                
                {/* Job Details */}
                <div className="job-details">
                  <motion.h4 
                    className="job-title mb-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {selectedJob.title}
                  </motion.h4>
                  
                  <motion.div 
                    className="job-meta d-flex flex-wrap mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className={`badge me-2 mb-2 ${
                      selectedJob.workplaceType === 'Remote' ? 'bg-info' : 
                      selectedJob.workplaceType === 'Hybrid' ? 'bg-success' : 'bg-secondary'
                    }`}>
                      <i className={`fas fa-${
                        selectedJob.workplaceType === 'Remote' ? 'home' : 
                        selectedJob.workplaceType === 'Hybrid' ? 'exchange-alt' : 'building'
                      } me-1`}></i>
                      {selectedJob.workplaceType || "Workplace"}
                    </span>
                    <span className="badge bg-light text-dark me-2 mb-2">
                      <i className="fas fa-map-marker-alt me-1 text-danger"></i>
                      {selectedJob.location || "Location"}
                    </span>
                    <span className="badge bg-light text-dark me-2 mb-2">
                      <i className="far fa-calendar-alt me-1 text-primary"></i>
                      Posted: {new Date(selectedJob.createdAt).toLocaleDateString()}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="salary-range mb-3 p-3 bg-light rounded"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h6 className="mb-2 d-flex align-items-center">
                      <i className="fas fa-money-bill-wave me-2 text-success"></i>
                      Salary Range
                    </h6>
                    <p className="text-primary font-bold mb-0">{selectedJob.salaryRange || "Not disclosed"}</p>
                  </motion.div>
                  
                  <motion.div 
                    className="job-description mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h6 className="mb-2 d-flex align-items-center">
                      <i className="fas fa-align-left me-2 text-primary"></i>
                      Job Description
                    </h6>
                    <p className="mb-0">{selectedJob.description}</p>
                  </motion.div>
                  
                  <motion.div 
                    className="job-requirements mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h6 className="mb-2 d-flex align-items-center">
                      <i className="fas fa-check-circle me-2 text-primary"></i>
                      Requirements
                    </h6>
                    <ul className="ps-3 mb-0">
                      {selectedJob.requirements && selectedJob.requirements.length > 0 ? (
                        selectedJob.requirements.map((req, idx) => (
                          <motion.li 
                            key={idx} 
                            className="mb-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + (idx * 0.1) }}
                          >
                            {req}
                          </motion.li>
                        ))
                      ) : (
                        <li>No specific requirements listed</li>
                      )}
                    </ul>
                  </motion.div>
                  
                  {/* Apply Button */}
                  <motion.div 
                    className="mt-4 mb-5 pb-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.8,
                      type: "spring",
                      stiffness: 500,
                      damping: 25 
                    }}
                  >
                    <button 
                      className="btn btn-primary w-100 py-3"
                      onClick={handleApply}
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      Apply Now
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Application Dialog */}
        <ApplicationDialog 
          isOpen={showApplicationDialog}
          onClose={() => setShowApplicationDialog(false)}
          job={selectedJob || {}}
          onSubmit={handleApplicationAction}
          userId={user?.id}
        />
      </div>
    </Layout>
  )
}

export default withAuth(ApplyForJobs, ['CANDIDATE']);
