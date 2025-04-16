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

  if (!isOpen) return null;

  return (
    <div 
      className="application-dialog-overlay"
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
      onClick={onClose}
    >
      <div 
        className="application-dialog"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="application-dialog-header"
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
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            <i className="fas fa-paper-plane mr-2" style={{ marginRight: '10px' }}></i>
            Apply for {job.title}
          </h3>
          <button 
            onClick={onClose}
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

        {/* Body */}
        <div 
          className="application-dialog-body"
          style={{
            padding: '25px',
            maxHeight: 'calc(90vh - 142px)', 
            overflowY: 'auto'
          }}
        >
          {/* Company Info */}
          <div 
            className="company-info"
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #e0e0e0'
            }}
          >
            <div 
              className="company-logo"
              style={{
                width: '60px',
                height: '60px',
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
              {job.companyId?.logo ? (
                <img 
                  src={job.companyId.logo} 
                  alt={job.companyId?.name || "Company"} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <i className="fas fa-building" style={{ fontSize: '24px', color: '#4a6cf7' }}></i>
              )}
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                {job.companyId?.name || "Company"}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', color: '#6c757d' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: '5px', color: '#f54040' }}></i>
                <span>{job.location || "Location"}</span>
                <span style={{ margin: '0 10px' }}>•</span>
                <i className="fas fa-briefcase" style={{ marginRight: '5px', color: '#4a6cf7' }}></i>
                <span>{job.workplaceType || "On-site"}</span>
              </div>
            </div>
          </div>

          {/* Resume Section */}
          <div 
            className="resume-section"
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px',
              border: '1px solid #e9ecef'
            }}
          >
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}
            >
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                <i className="fas fa-file-pdf" style={{ marginRight: '8px', color: '#f54040' }}></i>
                Your Resume
              </h5>
              <button 
                onClick={handleEditResume}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #4a6cf7',
                  borderRadius: '4px',
                  color: '#4a6cf7',
                  padding: '6px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className="fas fa-edit" style={{ marginRight: '5px' }}></i>
                {portfolioData?.cvFile ? 'Edit Resume' : 'Create Resume'}
              </button>
            </div>

            {isLoading ? (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '15px'
                }}
              >
                <div 
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #4a6cf7',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                    marginRight: '10px'
                  }}
                ></div>
                <span>Loading resume...</span>
              </div>
            ) : portfolioData?.cvFile ? (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  padding: '12px 15px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: '10px', color: '#28a745', fontSize: '18px' }}></i>
                  <span>Resume is ready for submission</span>
                </div>
                <a 
                  href={portfolioData.cvFile.downloadUrl || portfolioData.cvFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#4a6cf7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 15px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>
                  View Resume
                </a>
              </div>
            ) : (
              <div 
                style={{
                  backgroundColor: '#fff8e1',
                  color: '#856404',
                  padding: '12px 15px',
                  borderRadius: '6px',
                  border: '1px solid #ffeeba',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px', color: '#f0ad4e' }}></i>
                <span>Resume not found. Please create one before applying.</span>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label 
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                <i className="fas fa-pen-fancy" style={{ marginRight: '8px', color: '#4a6cf7' }}></i>
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Introduce yourself and explain why you're a good fit for this position..."
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: '1px solid #ced4da',
                  minHeight: '180px',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
                required
              ></textarea>
              <div 
                style={{
                  fontSize: '13px',
                  color: '#6c757d',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                A thoughtful cover letter significantly increases your chances of getting noticed.
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
                gap: '10px'
              }}
            >
              <button 
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '15px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div 
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite',
                        marginRight: '8px'
                      }}
                    ></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
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
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .application-dialog-body::-webkit-scrollbar {
          width: 8px;
        }
        
        .application-dialog-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .application-dialog-body::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .application-dialog-body::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
};

export default ApplicationDialog;
