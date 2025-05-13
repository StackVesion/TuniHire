import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Application } from './types';

interface ApplicationCardProps {
  application: Application;
  onStatusChange: (applicationId: string, newStatus: 'Accepted' | 'Rejected') => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onStatusChange }) => {
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

  return (
    <div className="card">
      <div className="card-body">
        <div className="card bg-light">
          <div className="card-body p-3">
            <div className="d-flex align-items-center">
              <Link to="#" className="me-2">
                <span className="avatar avatar-lg bg-white">
                  <ImageWithBasePath
                    src={(application.userId && application.userId.profilePicture) || "assets/img/profiles/avatar-01.jpg"}
                    alt={(application.userId && application.userId.firstName) || "User"}
                    className="rounded-circle"
                  />
                </span>
              </Link>
              <div>
                <h6 className="fw-medium mb-1 text-truncate">
                  {application.userId ? `${application.userId.firstName || ""} ${application.userId.lastName || ""}` : "Anonymous User"}
                </h6>
                <p className="fs-12 text-gray fw-normal">{application.userId ? application.userId.email : "No email available"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column mb-3">
          <p className="text-dark d-inline-flex align-items-center mb-2">
            <i className="ti ti-briefcase text-gray-5 me-2" />
            {application.jobId.title}
          </p>
          <p className="text-dark d-inline-flex align-items-center mb-2">
            <i className="ti ti-map-pin-check text-gray-5 me-2" />
            {application.jobId.location || "Location not specified"}
          </p>
          <p className="text-dark d-inline-flex align-items-center">
            <i className="ti ti-calendar text-gray-5 me-2" />
            {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="mb-3">
          <span className={`badge ${getStatusBadgeClass(application.status)} me-1`}>
            {application.status}
          </span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          {application.status === 'Pending' && (
            <div className="btn-group" role="group">
              <button 
                className="btn btn-sm btn-success me-2"
                onClick={() => onStatusChange(application._id, 'Accepted')}
              >
                <i className="ti ti-check me-1" />
                Accept
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => onStatusChange(application._id, 'Rejected')}
              >
                <i className="ti ti-x me-1" />
                Reject
              </button>
            </div>
          )}
          <Link to={`/applications/${application._id}`} className="btn btn-sm btn-outline-primary">
            <i className="ti ti-eye me-1" />
            View Details
          </Link>
          {application.resume?.url && (
            <a 
              href={application.resume.url}
              target="_blank"
              rel="noopener noreferrer" 
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="ti ti-download me-1" />
              Resume
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard; 