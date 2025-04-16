import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import withAuth from '../utils/withAuth';
import { createAuthAxios } from '../utils/authUtils';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format relative date (e.g. "2 years")
const getDateRange = (startDate, endDate) => {
  if (!startDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  // Format dates
  const startStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const endStr = endDate 
    ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : 'Present';
    
  // Calculate duration
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const totalMonths = (yearDiff * 12) + monthDiff;
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  let durationStr = '';
  if (years > 0) {
    durationStr += `${years} year${years > 1 ? 's' : ''}`;
  }
  if (months > 0) {
    durationStr += `${years > 0 ? ' ' : ''}${months} month${months > 1 ? 's' : ''}`;
  }
  
  return `${startStr} - ${endStr} (${durationStr})`;
};

function UserPortfolio() {
  const router = useRouter();
  const { userId, applicationId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [application, setApplication] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [authAxios] = useState(() => createAuthAxios());
  
  useEffect(() => {
    if (userId && applicationId) {
      fetchData();
    }
  }, [userId, applicationId]);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parallel fetch for user, portfolio and application data
      const [userResponse, portfolioResponse, applicationResponse] = await Promise.all([
        authAxios.get(`/api/users/user-details/${userId}`),
        authAxios.get(`/api/portfolios/user/${userId}`),
        authAxios.get(`/api/applications/job/application/${applicationId}`)
      ]);
      
      // Check if the portfolio exists and extract it correctly from the response
      // The API returns { success: true, portfolio: {...} }
      const portfolioData = portfolioResponse.data?.portfolio || portfolioResponse.data;
      const userData = userResponse.data;
      
      // Make sure we're displaying portfolio data for the specific user who applied
      const isValidPortfolio = portfolioData && 
        (!portfolioData.createdBy || portfolioData.userId?._id?.toString() === userId);

      if (portfolioData && !isValidPortfolio) {
        console.warn("Portfolio found but not created by the application user");
      }
      
      console.log("Portfolio data:", portfolioData);
      
      setUser(userData);
      setPortfolio(portfolioData);
      setApplication(applicationResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load candidate data. Please try again.');
      
      Swal.fire({
        title: 'Error',
        text: 'Failed to load candidate data',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateApplicationStatus = async (status, feedback = '') => {
    if (!applicationId) return;
    
    try {
      setProcessingAction(true);
      
      // Show confirmation dialog
      const result = await Swal.fire({
        title: `${status === 'Accepted' ? 'Accept' : 'Reject'} Application?`,
        html: `
          <p>Are you sure you want to ${status === 'Accepted' ? 'accept' : 'reject'} this application?</p>
          <div class="form-group mt-3">
            <label for="feedback" class="form-label">Feedback to candidate (optional):</label>
            <textarea id="feedback" class="form-control" rows="3" placeholder="Enter feedback for the candidate..."></textarea>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: status === 'Accepted' ? 'Accept Application' : 'Reject Application',
        confirmButtonColor: status === 'Accepted' ? '#28a745' : '#dc3545',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          return document.getElementById('feedback').value;
        }
      });
      
      if (result.isConfirmed) {
        const feedbackText = result.value || feedback;
        
        // Update application status
        await authAxios.put(`/api/applications/${applicationId}/status`, {
          status,
          feedback: feedbackText
        });
        
        Swal.fire({
          title: 'Success',
          text: `Application has been ${status === 'Accepted' ? 'accepted' : 'rejected'}.`,
          icon: 'success'
        });
        
        // Refresh application data
        const updatedApplication = await authAxios.get(`/api/applications/job/application/${applicationId}`);
        setApplication(updatedApplication.data);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update application status',
        icon: 'error'
      });
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0 }
  };
  
  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="section-box mt-50">
          <div className="container">
            <div className="text-center pt-50 pb-50">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3 className="mt-3">Loading candidate portfolio...</h3>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="section-box mt-50">
          <div className="container">
            <div className="text-center pt-50 pb-50">
              <i className="fi-rr-exclamation text-danger" style={{ fontSize: '48px' }}></i>
              <h3 className="mt-3">Error loading portfolio</h3>
              <p>{error}</p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => router.back()}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <motion.div 
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="section-box mt-30"
      >
        <div className="container">
          {/* Breadcrumbs */}
          <div className="box-heading">
            <div className="breadcrumbs">
              <ul>
                <li><Link href="/">Dashboard</Link></li>
                <li><Link href="/CampanyApplications">Applications</Link></li>
                <li><span>Candidate Portfolio</span></li>
              </ul>
            </div>
          </div>
          
          {/* Application Status Banner */}
          {application && (
            <motion.div 
              variants={sectionVariants}
              className={`alert ${
                application.status === 'Accepted' ? 'alert-success' : 
                application.status === 'Rejected' ? 'alert-danger' : 
                application.status === 'Interview' ? 'alert-primary' : 
                'alert-warning'
              } d-flex align-items-center justify-content-between mb-30`}
            >
              <div>
                <strong>Application Status:</strong> {application.status}
                {application.jobId && (
                  <span className="ms-3">
                    <strong>Job:</strong> {application.jobId.title}
                  </span>
                )}
                <span className="ms-3">
                  <strong>Applied:</strong> {formatDate(application.createdAt)}
                </span>
              </div>
              
              {application.status === 'Pending' && (
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => updateApplicationStatus('Accepted')}
                    disabled={processingAction}
                  >
                    <i className="fi-rr-check me-1"></i> Accept
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => updateApplicationStatus('Rejected')}
                    disabled={processingAction}
                  >
                    <i className="fi-rr-cross-circle me-1"></i> Reject
                  </button>
                </div>
              )}
            </motion.div>
          )}
          
          {/* User Info Header */}
          <motion.div 
            variants={sectionVariants}
            className="row mb-30"
          >
            <div className="col-lg-12">
              <div className="card p-40 rounded shadow">
                <div className="row align-items-center">
                  <div className="col-md-2 col-sm-4 text-center">
                    <div className="image-profile mb-md-0 mb-3">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={`${user.firstName} ${user.lastName}`} 
                          className="rounded-circle img-fluid"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="placeholder-profile rounded-circle d-flex align-items-center justify-content-center bg-light"
                          style={{ width: '120px', height: '120px', fontSize: '40px', color: '#4a6cf7' }}
                        >
                          <i className="fi-rr-user"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-7 col-sm-8">
                    <h3 className="mt-0 mb-1">{user?.firstName} {user?.lastName}</h3>
                    {portfolio?.title && (
                      <h5 className="text-muted mb-2">{portfolio.title}</h5>
                    )}
                    <div className="candidate-info">
                      <ul className="list-unstyled mb-0">
                        <li className="mb-1">
                          <i className="fi-rr-envelope me-2 text-primary"></i>
                          <a href={`mailto:${user?.email}`}>{user?.email}</a>
                        </li>
                        {user?.phone && (
                          <li className="mb-1">
                            <i className="fi-rr-phone-call me-2 text-primary"></i>
                            <a href={`tel:${user.phone}`}>{user.phone}</a>
                          </li>
                        )}
                        {user?.location && (
                          <li>
                            <i className="fi-rr-marker me-2 text-primary"></i>
                            {user.location}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-3 mt-3 mt-md-0 text-md-end">
                    {application && (
                      <div className="d-grid gap-2">
                        {application.status === 'Pending' ? (
                          <>
                            <button 
                              className="btn btn-success"
                              onClick={() => updateApplicationStatus('Accepted')}
                              disabled={processingAction}
                            >
                              <i className="fi-rr-check me-1"></i> Accept Application
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => updateApplicationStatus('Rejected')}
                              disabled={processingAction}
                            >
                              <i className="fi-rr-cross-circle me-1"></i> Reject Application
                            </button>
                          </>
                        ) : application.status === 'Accepted' ? (
                          <>
                            <button 
                              className="btn btn-primary"
                              onClick={() => updateApplicationStatus('Interview')}
                              disabled={processingAction}
                            >
                              <i className="fi-rr-user me-1"></i> Schedule Interview
                            </button>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => updateApplicationStatus('Rejected')}
                              disabled={processingAction}
                            >
                              <i className="fi-rr-cross-circle me-1"></i> Reject Application
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => window.history.back()}
                          >
                            <i className="fi-rr-arrow-left me-1"></i> Back to Applications
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Main Portfolio Content */}
          <div className="row">
            {/* Left Column - Cover Letter and Resume */}
            <div className="col-lg-4">
              {/* Cover Letter */}
              {application?.coverLetter && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-3">
                    <i className="fi-rr-document-signed me-2 text-primary"></i>
                    Cover Letter
                  </h4>
                  <div className="cover-letter-content p-3 bg-light rounded">
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{application.coverLetter}</p>
                  </div>
                </motion.div>
              )}
              
              {/* Resume/CV */}
              {portfolio?.cvFile && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-3">
                    <i className="fi-rr-document me-2 text-primary"></i>
                    Resume / CV
                  </h4>
                  <div className="text-center p-4 bg-light rounded">
                    <i className="fi-rr-file-pdf text-danger" style={{ fontSize: '48px' }}></i>
                    <h5 className="mt-3">Candidate Resume</h5>
                    <a 
                      href={portfolio.cvFile.downloadUrl || portfolio.cvFile} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary mt-2"
                    >
                      <i className="fi-rr-download me-1"></i> View Resume
                    </a>
                  </div>
                </motion.div>
              )}
              
              {/* Skills */}
              {portfolio?.skills && portfolio.skills.length > 0 && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-3">
                    <i className="fi-rr-briefcase me-2 text-primary"></i>
                    Skills
                  </h4>
                  <div className="skills-list">
                    {portfolio.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="badge bg-light text-dark p-2 me-2 mb-2"
                        style={{ 
                          fontSize: '14px', 
                          fontWeight: '500',
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Right Column - Education, Experience, Projects */}
            <div className="col-lg-8">
              {/* About */}
              {portfolio?.about && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-3">
                    <i className="fi-rr-user me-2 text-primary"></i>
                    About
                  </h4>
                  <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{portfolio.about}</p>
                </motion.div>
              )}
              
              {/* Experience */}
              {portfolio?.experience && portfolio.experience.length > 0 && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-4">
                    <i className="fi-rr-briefcase me-2 text-primary"></i>
                    Work Experience
                  </h4>
                  
                  <div className="timeline position-relative">
                    {portfolio.experience.map((exp, index) => (
                      <div 
                        key={index} 
                        className={`timeline-item position-relative ps-4 pb-4 ${
                          index === portfolio.experience.length - 1 ? '' : 'border-start border-2'
                        }`}
                        style={{ borderColor: '#4a6cf7' }}
                      >
                        <div 
                          className="timeline-marker position-absolute rounded-circle"
                          style={{ 
                            width: '14px', 
                            height: '14px', 
                            backgroundColor: '#4a6cf7',
                            left: '-7px',
                            top: '6px'
                          }}
                        ></div>
                        
                        <div className="mb-1">
                          <h5 className="mb-0">{exp.title}</h5>
                          <h6 className="mb-0 text-primary">{exp.company}</h6>
                          <div className="text-muted mb-2 small">
                            <i className="fi-rr-calendar me-1"></i>
                            {getDateRange(exp.startDate, exp.endDate)}
                          </div>
                        </div>
                        
                        {exp.description && (
                          <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Education */}
              {portfolio?.education && portfolio.education.length > 0 && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-4">
                    <i className="fi-rr-graduation-cap me-2 text-primary"></i>
                    Education
                  </h4>
                  
                  <div className="timeline position-relative">
                    {portfolio.education.map((edu, index) => (
                      <div 
                        key={index} 
                        className={`timeline-item position-relative ps-4 pb-4 ${
                          index === portfolio.education.length - 1 ? '' : 'border-start border-2'
                        }`}
                        style={{ borderColor: '#4a6cf7' }}
                      >
                        <div 
                          className="timeline-marker position-absolute rounded-circle"
                          style={{ 
                            width: '14px', 
                            height: '14px', 
                            backgroundColor: '#4a6cf7',
                            left: '-7px',
                            top: '6px'
                          }}
                        ></div>
                        
                        <div className="mb-1">
                          <h5 className="mb-0">{edu.degree}</h5>
                          <h6 className="mb-0 text-primary">{edu.school}</h6>
                          <div className="text-muted mb-2 small">
                            <i className="fi-rr-calendar me-1"></i>
                            {getDateRange(edu.startDate, edu.endDate)}
                          </div>
                        </div>
                        
                        {edu.description && (
                          <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{edu.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Projects */}
              {portfolio?.projects && portfolio.projects.length > 0 && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-3">
                    <i className="fi-rr-bulb me-2 text-primary"></i>
                    Projects
                  </h4>
                  
                  <div className="row">
                    {portfolio.projects.map((project, index) => (
                      <div key={index} className="col-md-6 mb-4">
                        <div className="project-card h-100 p-3 border rounded">
                          <h5 className="mb-1">{project.title}</h5>
                          
                          {project.technologies && (
                            <div className="mb-2">
                              {project.technologies.split(',').map((tech, i) => (
                                <span 
                                  key={i} 
                                  className="badge bg-light text-dark me-1"
                                  style={{ border: '1px solid #e0e0e0' }}
                                >
                                  {tech.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <p className="mb-2 small" style={{ whiteSpace: 'pre-line' }}>{project.description}</p>
                          
                          {project.url && (
                            <a 
                              href={project.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="fi-rr-link me-1"></i> View Project
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Certificates */}
              {portfolio?.certificates && portfolio.certificates.length > 0 && (
                <motion.div 
                  variants={sectionVariants}
                  className="card p-4 mb-30 shadow-sm"
                >
                  <h4 className="mb-3">
                    <i className="fi-rr-diploma me-2 text-primary"></i>
                    Certificates
                  </h4>
                  
                  <div className="row">
                    {portfolio.certificates.map((cert, index) => (
                      <div key={index} className="col-md-6 mb-3">
                        <div className="certificate-card p-3 border rounded">
                          <h5 className="mb-1">{cert.title}</h5>
                          <p className="mb-1 text-primary">{cert.issuer}</p>
                          
                          {cert.date && (
                            <p className="text-muted small mb-2">
                              <i className="fi-rr-calendar me-1"></i>
                              {new Date(cert.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long'
                              })}
                            </p>
                          )}
                          
                          {cert.url && (
                            <a 
                              href={cert.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary mt-1"
                            >
                              <i className="fi-rr-link me-1"></i> View Certificate
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}

export default withAuth(UserPortfolio, ['HR']);
