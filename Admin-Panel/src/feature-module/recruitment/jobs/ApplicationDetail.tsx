import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { all_routes } from '../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Application } from './types';
import Swal from 'sweetalert2';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchApplicationDetail();
  }, [id]);

  const fetchApplicationDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:5000/api/applications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setApplication(response.data);
    } catch (err) {
      console.error('Error fetching application details:', err);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'Accepted' | 'Rejected') => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      
      await axios.patch(`http://localhost:5000/api/applications/${id}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the local state
      if (application) {
        setApplication({
          ...application,
          status: newStatus
        });
      }
      
      // Show success message
      Swal.fire({
        title: 'Success',
        text: `Application has been ${newStatus.toLowerCase()} successfully`,
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (err) {
      console.error('Error updating application status:', err);
      
      // Show error message
      Swal.fire({
        title: 'Error',
        text: 'Failed to update application status',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-warning-transparent';
      case 'Accepted':
        return 'bg-success-transparent';
      case 'Rejected':
        return 'bg-danger-transparent';
      default:
        return 'bg-secondary-transparent';
    }
  };
  
  const goBackToApplications = () => {
    navigate('/job-grid');
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading application details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="card">
            <div className="card-body text-center p-5">
              <div className="mb-4">
                <i className="ti ti-alert-circle text-danger" style={{ fontSize: '4rem' }} />
              </div>
              <h3>Error Loading Application</h3>
              <p className="text-muted">{error || 'Application not found'}</p>
              <button className="btn btn-primary mt-3" onClick={goBackToApplications}>
                <i className="ti ti-arrow-left me-1" />
                Back to Applications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (    <div className="page-wrapper">
      <div className="content container-fluid">
        {/* Breadcrumb */}
        <div className="page-header">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h3 className="page-title">Application Details</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/job-grid">Applications</Link>
                </li>
                <li className="breadcrumb-item active">Application Details</li>
              </ul>
            </div>
            <button className="btn btn-outline-primary" onClick={goBackToApplications}>
              <i className="ti ti-arrow-left me-1" />
              Back to Applications
            </button>
          </div>
        </div>

        {/* Application Status */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-3">Application Status:</h5>
                    <span className={`badge fs-6 py-2 px-3 ${getStatusBadgeClass(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                  {application.status === 'Pending' && (
                    <div>
                      <button
                        className="btn btn-success me-2"
                        onClick={() => handleStatusChange('Accepted')}
                        disabled={isUpdating}
                      >
                        <i className="ti ti-check me-1" />
                        Accept Application
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleStatusChange('Rejected')}
                        disabled={isUpdating}
                      >
                        <i className="ti ti-x me-1" />
                        Reject Application
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Candidate Information */}
          <div className="col-md-4 col-lg-3">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Applicant Details</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column align-items-center text-center mb-4">
                  <div className="mb-3">
                    <ImageWithBasePath
                      src={(application.userId && application.userId.profilePicture) || "assets/img/profiles/avatar-01.jpg"}
                      alt={(application.userId && application.userId.firstName) || "User"}
                      className="rounded-circle img-thumbnail"
                      width={120}
                    />
                  </div>
                  <h4>
                    {application.userId 
                      ? `${application.userId.firstName || ""} ${application.userId.lastName || ""}` 
                      : "Anonymous User"
                    }
                  </h4>
                  <p className="text-muted mb-1">{application.userId ? application.userId.email : "No email available"}</p>
                  <p className="text-muted">Applied on: {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>
                
                {application.resume?.url && (
                  <div className="d-grid">
                    <a 
                      href={application.resume.url}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="btn btn-outline-primary"
                    >
                      <i className="ti ti-download me-1" />
                      Download Resume
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="col-md-8 col-lg-9">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title">Job Details</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-xl-3 col-lg-4 col-sm-6 mb-3">
                    <h6 className="text-muted mb-1">Position</h6>
                    <p className="fs-5">{application.jobId.title}</p>
                  </div>
                  <div className="col-xl-3 col-lg-4 col-sm-6 mb-3">
                    <h6 className="text-muted mb-1">Company</h6>
                    <div className="d-flex align-items-center">
                      {application.jobId.companyId?.logo && (
                        <ImageWithBasePath src={application.jobId.companyId.logo} alt="Company logo" className="me-2" width={24} />
                      )}
                      <p className="fs-5 mb-0">{application.jobId.companyId?.name || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="col-xl-3 col-lg-4 col-sm-6 mb-3">
                    <h6 className="text-muted mb-1">Location</h6>
                    <p className="fs-5">{application.jobId.location || "Not specified"}</p>
                  </div>
                  <div className="col-xl-3 col-lg-4 col-sm-6 mb-3">
                    <h6 className="text-muted mb-1">Salary Range</h6>
                    <p className="fs-5">{application.jobId.salaryRange || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Cover Letter</h5>
              </div>
              <div className="card-body">
                <div className="card bg-light mb-0">
                  <div className="card-body">
                    {application.coverLetter ? (
                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{application.coverLetter}</p>
                    ) : (
                      <p className="text-muted mb-0">No cover letter provided</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;