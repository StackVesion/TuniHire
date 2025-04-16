import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const ApplicationDialog = ({ isOpen, onClose, job, onSubmit, userId }) => {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPortfolioData();
    }
  }, [isOpen, userId]);

  const fetchPortfolioData = async () => {
    if (fetchAttempted) return; // Prevent multiple fetch attempts if already tried once
    
    setLoadingPortfolio(true);
    setFetchAttempted(true);
    
    try {
      // We'll use the authAxios from the parent component via onSubmit
      const result = await onSubmit(null, 'fetch-portfolio');
      console.log('Portfolio data fetched successfully:', result);
      
      if (!result || !result.cvFile) {
        toast.info('You need to generate a CV in your portfolio first');
      }
      
      setPortfolioData(result);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Could not load your portfolio information');
      setPortfolioData(null);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      toast.error('Please provide a cover letter');
      return;
    }
    
    if (!portfolioData?.cvFile) {
      toast.error('Please generate a CV in your portfolio before applying');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        jobId: job._id,
        coverLetter: coverLetter,
        userId: userId
      });
      
      setCoverLetter('');
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditResume = () => {
    router.push('/my-resume');
  };

  // Animation variants
  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 500
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="modal-backdrop fade show d-flex justify-content-center align-items-center" 
          style={{ 
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050
          }}
          onClick={onClose}
        >
          <motion.div 
            className="modal show d-block" 
            onClick={e => e.stopPropagation()}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ maxWidth: '95%' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-primary text-white">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-paper-plane me-2" style={{ fontSize: '1.2rem' }}></i>
                    <h5 className="modal-title mb-0">Apply for {job.title}</h5>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={onClose}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <motion.div 
                    className="row" 
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="col-md-12 mb-4">
                      <div className="application-info p-3 rounded d-flex align-items-center" 
                           style={{ backgroundColor: 'rgba(var(--bs-primary-rgb), 0.05)' }}>
                        <div className="company-logo me-3">
                          <img 
                            src={job.companyId?.logo || "/assets/imgs/page/dashboard/company-logo.svg"} 
                            alt="Company Logo"
                            className="img-fluid rounded shadow-sm"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <h6 className="mb-1">{job.companyId?.name || 'Company'}</h6>
                          <p className="mb-0 text-muted small">
                            <i className="fas fa-map-marker-alt me-1 text-danger"></i>
                            {job.location} 
                            <span className="mx-2">•</span>
                            <i className={`fas fa-${
                              job.workplaceType === 'Remote' ? 'home' : 
                              job.workplaceType === 'Hybrid' ? 'exchange-alt' : 'building'
                            } me-1 text-primary`}></i>
                            {job.workplaceType}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Resume Actions */}
                  <motion.div 
                    className="row mb-4"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 }}
                  >
                    <div className="col-md-12">
                      <div className="resume-actions p-3 rounded" style={{ backgroundColor: 'rgba(var(--bs-primary-rgb), 0.05)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <i className="far fa-file-pdf text-danger me-2" style={{ fontSize: '1.5rem' }}></i>
                            <div>
                              <h6 className="mb-0">Your Resume</h6>
                              <p className="mb-0 small text-muted">Make sure your resume is up to date</p>
                            </div>
                          </div>
                          
                          <div className="d-flex gap-2">
                            {loadingPortfolio ? (
                              <button className="btn btn-primary" disabled>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Loading...
                              </button>
                            ) : portfolioData?.cvFile ? (
                              <>
                                <a 
                                  href={portfolioData.cvFile.downloadUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="btn btn-primary"
                                >
                                  <i className="fas fa-external-link-alt me-1"></i>
                                  Check Resume
                                </a>
                                <button 
                                  className="btn btn-outline-secondary"
                                  onClick={handleEditResume}
                                >
                                  <i className="fas fa-pencil-alt me-1"></i>
                                  Edit
                                </button>
                              </>
                            ) : (
                              <button 
                                className="btn btn-warning"
                                onClick={handleEditResume}
                              >
                                <i className="fas fa-plus me-1"></i>
                                Create Resume
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Cover Letter Section */}
                  <motion.form 
                    onSubmit={handleSubmit}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                  >
                    <div className="row mb-3">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label className="form-label fw-bold d-flex align-items-center">
                            <i className="fas fa-envelope-open-text me-2 text-primary"></i>
                            Cover Letter
                          </label>
                          <textarea
                            className="form-control"
                            rows="6"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Introduce yourself and explain why you're a good fit for this position..."
                            required
                          ></textarea>
                          <div className="form-text mt-2">
                            <i className="fas fa-info-circle me-1 text-muted"></i>
                            A thoughtful cover letter significantly increases your chances of getting noticed.
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={isSubmitting || loadingPortfolio || !portfolioData?.cvFile}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Submit Application
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationDialog;
