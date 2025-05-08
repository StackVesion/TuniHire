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
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [resumePreview, setResumePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
    
    // Make sure we have a resume file
    if (!resumeFile) {
      toast.error('Please upload a resume file');
      return;
    }
    
    setIsSubmitting(true);
    setIsUploading(true);
    try {
      // Create a new FormData instance for multipart/form-data
      const formData = new FormData();
      
      // Explicitly append coverLetter as string
      formData.append('coverLetter', coverLetter);
      
      // Add resume file
      formData.append('resume', resumeFile);
      console.log('Adding resume to form data:', resumeFile.name, 'Size:', (resumeFile.size / 1024).toFixed(2) + 'KB');
      
      // Config for tracking upload progress
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
        headers: {
          // Don't set Content-Type manually, let the browser set it with the boundary
          'Accept': 'application/json'
        }
      };
      
      console.log(`Submitting application to job: ${job._id}`);
      const response = await authAxios.post(
        `/api/applications/apply/${job._id}`, 
        formData,
        config
      );
      
      console.log('Application submitted successfully:', response.data);
      toast.success('Application submitted successfully!');
      setCoverLetter('');
      setResumeFile(null);
      setResumePreview(null);
      setUploadProgress(0);
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Show more specific error message if available
        if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to submit application. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file) => {
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must not exceed 5MB');
        return;
      }
      
      setResumeFile(file);
      
      // Create preview for PDF files
      if (file.type === 'application/pdf') {
        const fileUrl = URL.createObjectURL(file);
        setResumePreview(fileUrl);
      } else {
        // For DOC/DOCX files, just show an icon
        setResumePreview('doc');
      }
      
      toast.success('Resume uploaded successfully!');
    }
  };

  // Cleanup object URL on component unmount
  useEffect(() => {
    return () => {
      if (resumePreview && resumePreview !== 'doc') {
        URL.revokeObjectURL(resumePreview);
      }
    };
  }, [resumePreview]);

  const handleEditResume = () => {
    router.push('/my-resume');
  };

  const removeSelectedResume = () => {
    if (resumePreview && resumePreview !== 'doc') {
      URL.revokeObjectURL(resumePreview);
    }
    setResumeFile(null);
    setResumePreview(null);
  };

  // Function to get file icon based on extension
  const getFileIcon = (filename) => {
    if (!filename) return 'fas fa-file';
    
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fas fa-file-pdf';
    if (ext === 'doc' || ext === 'docx') return 'fas fa-file-word';
    return 'fas fa-file';
  };
  
  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="application-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
          }}
          onClick={onClose}
        >
          <motion.div 
            className="application-dialog"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="application-dialog-header"
              style={{
                background: 'linear-gradient(135deg, #4a6cf7 0%, #2c3e80 100%)',
                color: '#ffffff',
                padding: '24px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 600 }}>
                <i className="fas fa-paper-plane mr-2" style={{ marginRight: '12px' }}></i>
                Apply for {job.title}
              </h3>
              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div 
              className="application-dialog-body"
              style={{
                padding: '30px',
                maxHeight: 'calc(90vh - 142px)', 
                overflowY: 'auto'
              }}
            >
              {/* Company Info with improved design */}
              <div 
                className="company-info"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '25px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid #eaeaea'
                }}
              >
                <div 
                  className="company-logo"
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginRight: '18px',
                    backgroundColor: '#f5f9ff',
                    border: '1px solid #e1e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {job.companyId?.logo ? (
                    <img 
                      src={job.companyId.logo} 
                      alt={job.companyId?.name || "Company"} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="fas fa-building" style={{ fontSize: '28px', color: '#4a6cf7' }}></i>
                  )}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#1a1a1a' }}>
                    {job.companyId?.name || "Company"}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#6c757d', fontSize: '15px' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '5px', color: '#f54040' }}></i>
                    <span>{job.location || "Location"}</span>
                    <span style={{ margin: '0 10px', color: '#d0d0d0' }}>•</span>
                    <i className="fas fa-briefcase" style={{ marginRight: '5px', color: '#4a6cf7' }}></i>
                    <span>{job.workplaceType || "On-site"}</span>
                    {job.salary && (
                      <>
                        <span style={{ margin: '0 10px', color: '#d0d0d0' }}>•</span>
                        <i className="fas fa-money-bill-wave" style={{ marginRight: '5px', color: '#2ecc71' }}></i>
                        <span>{job.salary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <form onSubmit={handleSubmit}>
                {/* Modern Resume Upload Section with Drag & Drop */}
                <div 
                  className="resume-upload-section"
                  style={{
                    marginBottom: '28px',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '25px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <label 
                    style={{
                      display: 'block',
                      marginBottom: '12px',
                      fontSize: '17px',
                      fontWeight: '600',
                      color: '#212529'
                    }}
                  >
                    <i className="fas fa-file-upload" style={{ marginRight: '10px', color: '#4a6cf7' }}></i>
                    Upload Your Resume
                  </label>
                  
                  {!resumeFile ? (
                    <div
                      className="dropzone"
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: `2px dashed ${dragActive ? '#4a6cf7' : '#ced4da'}`,
                        borderRadius: '10px',
                        padding: '30px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: dragActive ? 'rgba(74, 108, 247, 0.05)' : 'white'
                      }}
                      onClick={() => document.getElementById('resume-file-input').click()}
                    >
                      <input
                        id="resume-file-input"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        style={{ display: 'none' }}
                      />
                      
                      <div style={{ marginBottom: '15px' }}>
                        <i 
                          className={dragActive ? "fas fa-cloud-upload-alt" : "fas fa-cloud-upload-alt"} 
                          style={{ 
                            fontSize: '48px', 
                            color: dragActive ? '#4a6cf7' : '#adb5bd',
                            marginBottom: '10px',
                            transition: 'all 0.3s ease'
                          }}
                        ></i>
                      </div>
                      
                      <div style={{ fontWeight: '500', fontSize: '16px', color: '#495057', marginBottom: '10px' }}>
                        {dragActive ? 'Drop your file here' : 'Drag & drop your resume or click to browse'}
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
                        Supported formats: PDF, DOC, DOCX (max 5MB)
                      </div>
                      
                      <button
                        type="button"
                        className="browse-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById('resume-file-input').click();
                        }}
                        style={{
                          backgroundColor: '#4a6cf7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fas fa-folder-open" style={{ marginRight: '8px' }}></i>
                        Browse Files
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="file-preview"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e1e7ff',
                        borderRadius: '10px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {/* File info header */}
                      <div 
                        className="file-info"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          marginBottom: resumePreview && resumePreview !== 'doc' ? '15px' : '0',
                          padding: '10px 15px',
                          backgroundColor: '#f5f9ff',
                          borderRadius: '8px'
                        }}
                      >
                        <div
                          className="file-icon"
                          style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: '#e1e7ff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '15px'
                          }}
                        >
                          <i 
                            className={getFileIcon(resumeFile.name)} 
                            style={{ 
                              fontSize: '24px', 
                              color: resumeFile.type === 'application/pdf' ? '#f44336' : '#4285f4'
                            }}
                          ></i>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#212529', marginBottom: '3px' }}>
                            {resumeFile.name}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6c757d' }}>
                            {formatFileSize(resumeFile.size)} • {resumeFile.type.split('/')[1].toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="file-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => document.getElementById('resume-file-input').click()}
                            style={{
                              backgroundColor: '#4a6cf7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              width: '34px',
                              height: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Replace file"
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                          
                          <button
                            type="button"
                            onClick={removeSelectedResume}
                            style={{
                              backgroundColor: '#f8f9fa',
                              color: '#dc3545',
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              width: '34px',
                              height: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Remove file"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                        
                        <input
                          id="resume-file-input"
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          style={{ display: 'none' }}
                        />
                      </div>
                      
                      {/* PDF Preview if available */}
                      {resumePreview && resumePreview !== 'doc' && (
                        <div style={{ width: '100%', marginTop: '15px' }}>
                          <iframe 
                            src={resumePreview} 
                            style={{
                              width: '100%',
                              height: '250px',
                              border: '1px solid #e1e7ff',
                              borderRadius: '8px'
                            }}
                            title="Resume Preview"
                          ></iframe>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Upload progress bar with improved styling */}
                  {uploadProgress > 0 && isUploading && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>Uploading resume...</span>
                        <span style={{ fontSize: '14px', color: '#4a6cf7', fontWeight: '600' }}>{uploadProgress}%</span>
                      </div>
                      <div 
                        style={{ 
                          height: '8px', 
                          backgroundColor: '#e9ecef', 
                          borderRadius: '4px', 
                          overflow: 'hidden' 
                        }}
                      >
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${uploadProgress}%`,
                            background: 'linear-gradient(90deg, #4a6cf7, #2c3e80)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease-in-out'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Letter with improved styling */}
                <div style={{ marginBottom: '25px' }}>
                  <label 
                    style={{
                      display: 'block',
                      marginBottom: '12px',
                      fontSize: '17px',
                      fontWeight: '600',
                      color: '#212529'
                    }}
                  >
                    <i className="fas fa-pen-fancy" style={{ marginRight: '10px', color: '#4a6cf7' }}></i>
                    Cover Letter
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '10px',
                      border: '1px solid #ced4da',
                      minHeight: '200px',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4a6cf7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(74, 108, 247, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ced4da';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  ></textarea>
                  <div 
                    style={{
                      fontSize: '14px',
                      color: '#6c757d',
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      backgroundColor: '#f8f9fa',
                      padding: '12px 15px',
                      borderRadius: '8px'
                    }}
                  >
                    <i className="fas fa-lightbulb" style={{ marginRight: '10px', marginTop: '2px', color: '#ffc107' }}></i>
                    <span>
                      <strong>Pro tip:</strong> A thoughtful cover letter significantly increases your chances of getting noticed. 
                      Mention specific skills and experiences that make you perfect for this role.
                    </span>
                  </div>
                </div>

                {/* Action Buttons with improved styling */}
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '30px',
                    gap: '15px'
                  }}
                >
                  <button 
                    type="button"
                    onClick={onClose}
                    style={{
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                      e.currentTarget.style.borderColor = '#ced4da';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }}
                  >
                    <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#27ae60';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(46, 204, 113, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#2ecc71';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(46, 204, 113, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '3px solid rgba(255, 255, 255, 0.3)',
                            borderTopColor: '#ffffff',
                            animation: 'spin 1s linear infinite',
                            marginRight: '10px'
                          }}
                        ></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane" style={{ marginRight: '10px' }}></i>
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
          
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
            
            @media (max-width: 768px) {
              .application-dialog {
                width: 95% !important;
                max-width: 95% !important;
                margin: 0 10px;
              }
              
              .application-dialog-header {
                padding: 18px 20px !important;
              }
              
              .application-dialog-header h3 {
                font-size: 18px !important;
              }
              
              .application-dialog-body {
                padding: 20px !important;
              }
              
              .file-info {
                flex-direction: column !important;
                align-items: flex-start !important;
              }
              
              .file-icon {
                margin-bottom: 10px !important;
                margin-right: 0 !important;
              }
              
              .file-actions {
                margin-top: 15px !important;
                align-self: flex-end !important;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationDialog;
