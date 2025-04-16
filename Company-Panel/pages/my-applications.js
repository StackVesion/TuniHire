import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import withAuth from '../utils/withAuth';
import { createAuthAxios } from '../utils/authUtils';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Function to format dates instead of using moment.js
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Function to get relative time (e.g., "2 hours ago")
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

const ApplicationStatus = ({ status }) => {
  let bgColor, textColor, icon;
  
  switch(status?.toUpperCase()) {
    case 'PENDING':
      bgColor = '#fff8e1';
      textColor = '#f59f00';
      icon = 'clock';
      break;
    case 'REVIEWED':
      bgColor = '#e3f2fd';
      textColor = '#1976d2';
      icon = 'eye';
      break;
    case 'SHORTLISTED':
      bgColor = '#e8f5e9';
      textColor = '#2e7d32';
      icon = 'check-circle';
      break;
    case 'INTERVIEW':
      bgColor = '#e0f7fa';
      textColor = '#0097a7';
      icon = 'user-tie';
      break;
    case 'REJECTED':
      bgColor = '#ffebee';
      textColor = '#c62828';
      icon = 'times-circle';
      break;
    case 'HIRED':
      bgColor = '#e8f5e9';
      textColor = '#2e7d32';
      icon = 'handshake';
      break;
    default:
      bgColor = '#f5f5f5';
      textColor = '#757575';
      icon = 'question-circle';
  }
  
  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      padding: '6px 12px', 
      borderRadius: '50px', 
      backgroundColor: bgColor, 
      color: textColor,
      fontSize: '14px',
      fontWeight: '500'
    }}>
      <i className={`fas fa-${icon} mr-2`} style={{ marginRight: '6px' }}></i>
      {status || 'Unknown'}
    </div>
  );
};

function MyApplications({ user }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [authAxios] = useState(() => createAuthAxios());
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await authAxios.get('/api/applications/user');
      console.log('Applications data:', response.data);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Could not load your applications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredApplications = () => {
    if (filter === 'all') return applications;
    return applications.filter(app => app.status.toUpperCase() === filter.toUpperCase());
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
      await authAxios.put(`/api/applications/${applicationId}/withdraw`);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <Layout>
      <div className="section-box">
        <div className="container">
          <div className="banner-hero banner-breadcrums">
            <div className="breadcrumb">
              <ul>
                <li>
                  <Link href="/" className="home">Home</Link>
                </li>
                <li><span>My Applications</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="section-box mt-50">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="content-page">
                <div className="box-filters-job mb-4">
                  <div className="row">
                    <div className="col-xl-6 col-lg-5">
                      <span className="text-small text-showing">
                        Showing {getFilteredApplications().length} applications
                      </span>
                    </div>
                    <div className="col-xl-6 col-lg-7 text-lg-end">
                      <div className="d-inline-flex">
                        <div className="box-border mr-2">
                          <span className="text-small">Status:</span>
                          <div className="dropdown dropdown-sort">
                            <button 
                              className="btn dropdown-toggle" 
                              id="dropdownSort" 
                              type="button" 
                              data-bs-toggle="dropdown" 
                              aria-expanded="false" 
                              data-bs-display="static"
                            >
                              <span>{filter === 'all' ? 'All Applications' : filter}</span>
                              <i className="fi-rr-angle-small-down"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-light" aria-labelledby="dropdownSort">
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('all')}
                              >All Applications</button></li>
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('pending')}
                              >Pending</button></li>
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('reviewed')}
                              >Reviewed</button></li>
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('shortlisted')}
                              >Shortlisted</button></li>
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('interview')}
                              >Interview</button></li>
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('rejected')}
                              >Rejected</button></li>
                              <li><button 
                                className="dropdown-item" 
                                onClick={() => setFilter('hired')}
                              >Hired</button></li>
                            </ul>
                          </div>
                        </div>
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={fetchApplications}
                        >
                          <i className="fas fa-sync-alt mr-2"></i> Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading your applications...</p>
                  </div>
                ) : getFilteredApplications().length > 0 ? (
                  <motion.div 
                    className="row"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {getFilteredApplications().map((application) => (
                      <motion.div 
                        key={application._id} 
                        className="col-xl-12 col-12"
                        variants={itemVariants}
                      >
                        <div className="card-grid-2 hover-up mb-20">
                          <div className="row">
                            <div className="col-lg-8 col-md-7 col-7">
                              <div className="card-grid-2-image-left">
                                <div className="image-box">
                                  <img 
                                    src={application.jobId?.companyId?.logo || "/assets/imgs/page/company-logo-placeholder.png"} 
                                    alt={application.jobId?.companyId?.name || "Company"} 
                                  />
                                </div>
                                <div className="right-info">
                                  <div className="name-job">
                                    <h5>{application.jobId?.title || "Job Title"}</h5>
                                    <span className="location-small">
                                      {application.jobId?.companyId?.name || "Company"}
                                    </span>
                                  </div>
                                  <div className="mt-5">
                                    <ApplicationStatus status={application.status} />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-4 col-md-5 col-5 text-end">
                              <div className="card-grid-2-button-right">
                                <div className="card-text-date">
                                  <span className="font-sm">
                                    <i className="fi-rr-clock mr-5"></i>
                                    Applied {getRelativeTime(application.createdAt)}
                                  </span>
                                </div>
                                <div className="mt-15">
                                  <button 
                                    className="btn btn-sm btn-brand-1 mr-5" 
                                    onClick={() => handleViewDetails(application)}
                                  >
                                    View Details
                                  </button>
                                  {application.status.toUpperCase() === 'PENDING' && (
                                    <button 
                                      className="btn btn-sm btn-outline-danger" 
                                      onClick={() => handleWithdraw(application._id)}
                                    >
                                      Withdraw
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-5 my-5">
                    <div className="mb-4">
                      <img 
                        src="/assets/imgs/page/no-data.svg" 
                        alt="No Applications" 
                        style={{ width: '150px', height: 'auto', opacity: 0.6 }}
                      />
                    </div>
                    <h4>No Applications Found</h4>
                    <p className="text-muted mb-4">
                      {filter === 'all' 
                        ? "You haven't applied to any jobs yet." 
                        : `You don't have any ${filter.toLowerCase()} applications.`}
                    </p>
                    <Link href="/apply-for-jobs" className="btn btn-primary">
                      <i className="fas fa-search mr-2"></i> Browse Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div 
          className="application-details-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflow: 'hidden',
              animation: 'fadeInUp 0.3s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div 
              className="modal-header"
              style={{
                background: 'linear-gradient(135deg, #4a6cf7 0%, #2c3e80 100%)',
                color: '#ffffff',
                padding: '20px 25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Application Details
              </h4>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontSize: '16px'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div 
              className="modal-body"
              style={{
                padding: '25px',
                maxHeight: 'calc(90vh - 76px)',
                overflowY: 'auto'
              }}
            >
              {/* Job Information */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginRight: '15px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {selectedApplication.jobId?.companyId?.logo ? (
                      <img 
                        src={selectedApplication.jobId.companyId.logo} 
                        alt={selectedApplication.jobId?.companyId?.name || "Company"} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="fas fa-building" style={{ fontSize: '30px', color: '#4a6cf7' }}></i>
                    )}
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                      {selectedApplication.jobId?.title || "Job Title"}
                    </h5>
                    <p style={{ margin: '0 0 5px 0', color: '#6c757d' }}>
                      <i className="fas fa-building mr-2" style={{ marginRight: '6px', color: '#4a6cf7' }}></i>
                      {selectedApplication.jobId?.companyId?.name || "Company"}
                    </p>
                    <p style={{ margin: 0, color: '#6c757d' }}>
                      <i className="fas fa-map-marker-alt mr-2" style={{ marginRight: '6px', color: '#f54040' }}></i>
                      {selectedApplication.jobId?.location || "Location"}
                      <span style={{ margin: '0 10px' }}>•</span>
                      <i className="fas fa-briefcase mr-2" style={{ marginRight: '6px', color: '#4a6cf7' }}></i>
                      {selectedApplication.jobId?.workplaceType || "On-site"}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <ApplicationStatus status={selectedApplication.status} />
                </div>
              </div>
              
              {/* Application Timeline */}
              <div 
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '25px',
                  border: '1px solid #e9ecef'
                }}
              >
                <h5 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600 }}>
                  <i className="fas fa-history mr-2" style={{ marginRight: '8px', color: '#4a6cf7' }}></i>
                  Timeline
                </h5>
                <div className="application-timeline">
                  <div 
                    style={{ 
                      display: 'flex',
                      marginBottom: '15px',
                      position: 'relative',
                      paddingLeft: '30px'
                    }}
                  >
                    <div 
                      style={{ 
                        position: 'absolute',
                        left: 0,
                        top: '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#4a6cf7',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                    >
                      <i className="fas fa-paper-plane"></i>
                    </div>
                    <div>
                      <h6 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 600 }}>Application Submitted</h6>
                      <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                        {formatDate(selectedApplication.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {selectedApplication.status !== 'PENDING' && (
                    <div 
                      style={{ 
                        display: 'flex',
                        marginBottom: '15px',
                        position: 'relative',
                        paddingLeft: '30px'
                      }}
                    >
                      <div 
                        style={{ 
                          position: 'absolute',
                          left: 0,
                          top: '2px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#28a745',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </div>
                      <div>
                        <h6 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 600 }}>Application Reviewed</h6>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                          {selectedApplication.statusUpdatedAt 
                            ? formatDate(selectedApplication.statusUpdatedAt)
                            : 'Date not available'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {['SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'].includes(selectedApplication.status) && (
                    <div 
                      style={{ 
                        display: 'flex',
                        marginBottom: '15px',
                        position: 'relative',
                        paddingLeft: '30px'
                      }}
                    >
                      <div 
                        style={{ 
                          position: 'absolute',
                          left: 0,
                          top: '2px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: selectedApplication.status === 'REJECTED' ? '#dc3545' : '#17a2b8',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        <i className={`fas fa-${selectedApplication.status === 'REJECTED' ? 'times' : selectedApplication.status === 'HIRED' ? 'check' : 'user-check'}`}></i>
                      </div>
                      <div>
                        <h6 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 600 }}>
                          {selectedApplication.status === 'SHORTLISTED' ? 'Shortlisted' :
                           selectedApplication.status === 'INTERVIEW' ? 'Interview Scheduled' :
                           selectedApplication.status === 'HIRED' ? 'Hired' : 'Application Rejected'}
                        </h6>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                          {selectedApplication.statusUpdatedAt 
                            ? formatDate(selectedApplication.statusUpdatedAt)
                            : 'Date not available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Cover Letter */}
              <div>
                <h5 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600 }}>
                  <i className="fas fa-pen-fancy mr-2" style={{ marginRight: '8px', color: '#4a6cf7' }}></i>
                  Cover Letter
                </h5>
                <div 
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #e0e0e0',
                    whiteSpace: 'pre-line',
                    fontSize: '15px',
                    lineHeight: '1.6'
                  }}
                >
                  {selectedApplication.coverLetter}
                </div>
              </div>
              
              {/* Feedback (if any) */}
              {selectedApplication.feedback && (
                <div style={{ marginTop: '25px' }}>
                  <h5 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600 }}>
                    <i className="fas fa-comment-alt mr-2" style={{ marginRight: '8px', color: '#4a6cf7' }}></i>
                    Employer Feedback
                  </h5>
                  <div 
                    style={{
                      backgroundColor: selectedApplication.status === 'REJECTED' ? '#ffebee' : '#e8f5e9',
                      borderRadius: '8px',
                      padding: '20px',
                      border: `1px solid ${selectedApplication.status === 'REJECTED' ? '#ffcdd2' : '#c8e6c9'}`,
                      whiteSpace: 'pre-line',
                      fontSize: '15px',
                      lineHeight: '1.6'
                    }}
                  >
                    {selectedApplication.feedback}
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className="modal-footer"
              style={{
                padding: '15px 25px',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              {selectedApplication.status === 'PENDING' && (
                <button 
                  className="btn btn-danger me-2"
                  onClick={() => {
                    handleWithdraw(selectedApplication._id);
                    setShowModal(false);
                  }}
                >
                  <i className="fas fa-times-circle mr-2" style={{ marginRight: '5px' }}></i>
                  Withdraw Application
                </button>
              )}
              
              <button 
                className="btn btn-primary"
                onClick={() => window.open(`/apply-for-jobs?job=${selectedApplication.jobId?._id}`, '_blank')}
              >
                <i className="fas fa-external-link-alt mr-2" style={{ marginRight: '5px' }}></i>
                View Job
              </button>
            </div>
          </div>
          
          <style jsx global>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .modal-body::-webkit-scrollbar {
              width: 8px;
            }
            
            .modal-body::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 4px;
            }
            
            .modal-body::-webkit-scrollbar-thumb {
              background: #c1c1c1;
              border-radius: 4px;
            }
            
            .modal-body::-webkit-scrollbar-thumb:hover {
              background: #a1a1a1;
            }
          `}</style>
        </div>
      )}
    </Layout>
  );
}

export default withAuth(MyApplications, ['CANDIDATE']);
