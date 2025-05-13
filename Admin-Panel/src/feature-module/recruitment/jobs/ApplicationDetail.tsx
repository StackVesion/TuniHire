import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { all_routes } from '../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Application } from './types';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Error updating application status:', err);
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

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="alert alert-danger" role="alert">
            {error || 'Application not found'}
          </div>
          <Link to="/applications" className="btn btn-primary">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        {/* Breadcrumb */}
        <div className="page-header">
          <div className="row">
            <div className="col">
              <h3 className="page-title">Application Details</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/applications">Applications</Link>
                </li>
                <li className="breadcrumb-item active">Application Details</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Candidate Information */}
          <div className="col-md-4 col-lg-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex flex-column align-items-center text-center">
                  <div className="mt-3">
                    <ImageWithBasePath
                      src={(application.userId && application.userId.profilePicture) || "assets/img/profiles/avatar-01.jpg"}
                      alt={(application.userId && application.userId.firstName) || "User"}
                      className="rounded-circle"
                      width={120}
                    />
                    <h4 className="mt-2">
                      {application.userId 
                        ? `${application.userId.firstName || ""} ${application.userId.lastName || ""}` 
                        : "Anonymous User"
                      }
                    </h4>
                    <p className="text-muted">{application.userId ? application.userId.email : "No email available"}</p>
                    <span className={`badge ${getStatusBadgeClass(application.status)} me-1`}>
                      {application.status}
                    </span>
                    {application.status === 'Pending' && (
                      <div className="mt-3">
                        <button
                          className="btn btn-success me-2"
                          onClick={() => handleStatusChange('Accepted')}
                        >
                          <i className="ti ti-check me-1" />
                          Accept
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleStatusChange('Rejected')}
                        >
                          <i className="ti ti-x me-1" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="col-md-8 col-lg-9">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Job Details</h5>
                <div className="row">
                  <div className="col-sm-6">
                    <p className="mb-0">Job Title</p>
                    <h6>{application.jobId.title}</h6>
                  </div>
                  <div className="col-sm-6">
                    <p className="mb-0">Company</p>
                    <h6>{application.jobId.companyId.name}</h6>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-sm-6">
                    <p className="mb-0">Location</p>
                    <h6>{application.jobId.location || "Not specified"}</h6>
                  </div>
                  <div className="col-sm-6">
                    <p className="mb-0">Salary Range</p>
                    <h6>{application.jobId.salaryRange || "Not specified"}</h6>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <h5 className="card-title">Application Information</h5>
                <div className="row">
                  <div className="col-sm-6">
                    <p className="mb-0">Application Date</p>
                    <h6>{new Date(application.createdAt).toLocaleDateString()}</h6>
                  </div>
                  <div className="col-sm-6">
                    {application.resume?.url && (
                      <a 
                        href={application.resume.url}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="btn btn-outline-primary"
                      >
                        <i className="ti ti-download me-1" />
                        Download Resume
                      </a>
                    )}
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <h5 className="card-title">Cover Letter</h5>
                <div className="card bg-light">
                  <div className="card-body">
                    <p>{application.coverLetter}</p>
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