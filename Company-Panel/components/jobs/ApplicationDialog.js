import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { createAuthAxios } from '../../utils/authUtils';

const ApplicationDialog = ({ isOpen, onClose, job, onSubmit, userId }) => {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authAxios] = useState(() => createAuthAxios());

  useEffect(() => {
    if (isOpen) {
      fetchPortfolio();
    }
  }, [isOpen]);

  const fetchPortfolio = async () => {
    setIsLoading(true);
    try {
      const response = await authAxios.get('/api/portfolios/user');
      console.log('Portfolio data:', response.data);
      setPortfolioData(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      toast.error('Please provide a cover letter');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await authAxios.post(`/api/applications/apply/${job._id}`, {
        coverLetter: coverLetter
      });
      
      toast.success('Application submitted successfully!');
      setCoverLetter('');
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditResume = () => {
    router.push('/my-resume');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="modal-backdrop show d-flex justify-content-center align-items-center position-fixed top-0 start-0 w-100 h-100" 
          style={{ 
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 1050
          }}
          onClick={onClose}
        >
          <div 
            className="modal-dialog modal-dialog-centered" 
            style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Apply for {job.title}</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={onClose}
                ></button>
              </div>
              
              <div className="modal-body p-4">
                <div className="company-info d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div className="company-logo me-3">
                    <img 
                      src={job.companyId?.logo || "/assets/imgs/page/company-logo-placeholder.png"} 
                      alt={job.companyId?.name || "Company"} 
                      width="50"
                      height="50"
                      className="rounded"
                    />
                  </div>
                  <div>
                    <h6 className="mb-0">{job.companyId?.name || "Company"}</h6>
                    <span className="text-muted small">{job.location || "Location"}</span>
                  </div>
                </div>
                
                <div className="resume-section mb-4 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Your Resume</h6>
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      onClick={handleEditResume}
                    >
                      <i className="fas fa-edit me-1"></i>
                      {portfolioData?.cvFile ? 'Edit Resume' : 'Create Resume'}
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center py-2">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      <span>Loading...</span>
                    </div>
                  ) : portfolioData?.cvFile ? (
                    <div className="d-flex align-items-center">
                      <i className="fas fa-file-pdf text-danger me-2"></i>
                      <div className="me-auto">Resume available</div>
                      <a 
                        href={portfolioData.cvFile.downloadUrl || portfolioData.cvFile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        <i className="fas fa-external-link-alt me-1"></i>
                        View Resume
                      </a>
                    </div>
                  ) : (
                    <div className="alert alert-warning mb-0 py-2">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Resume not found. Please create one first.
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-4">
                    <label className="form-label fw-bold">Cover Letter</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Introduce yourself and explain why you're a good fit for this position..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2">
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationDialog;
