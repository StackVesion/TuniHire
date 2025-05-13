import React, { useState, useEffect } from 'react';
import { all_routes } from '../../router/all_routes';
import { Link } from 'react-router-dom';
import PredefinedDateRanges from '../../../core/common/datePicker';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import axios from 'axios';
import { Application } from './types';

const JobGrid = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            // Récupérer le token d'authentification du stockage local
            const token = localStorage.getItem('token');
            
            // Faire l'appel API avec le token dans les en-têtes
            const response = await axios.get('http://localhost:5000/api/applications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setApplications(response.data);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (applicationId: string, newStatus: 'Accepted' | 'Rejected') => {
        try {
            // Récupérer le token d'authentification
            const token = localStorage.getItem('token');
            
            await axios.patch(`http://localhost:5000/api/applications/${applicationId}/status`, {
                status: newStatus
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Mettre à jour l'état local après le changement de statut
            setApplications(applications.map(app => 
                app._id === applicationId ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            console.error('Error updating application status:', err);
            // Afficher une notification d'erreur si nécessaire
        }
    };

    const getFilteredApplications = () => {
        if (statusFilter === 'all') return applications;
        return applications.filter(app => 
            app.status.toLowerCase() === statusFilter.toLowerCase()
        );
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

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Applications List</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Administration</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Applications List
                                    </li>
                                </ol>
                            </nav>
                        </div>

                        {/* Filter Controls */}
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="dropdown me-3">
                                <button className="btn btn-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Status: {statusFilter === 'all' ? 'All' : statusFilter}
                                </button>
                                <ul className="dropdown-menu">
                                    <li><button className="dropdown-item" onClick={() => setStatusFilter('all')}>All</button></li>
                                    <li><button className="dropdown-item" onClick={() => setStatusFilter('Pending')}>Pending</button></li>
                                    <li><button className="dropdown-item" onClick={() => setStatusFilter('Accepted')}>Accepted</button></li>
                                    <li><button className="dropdown-item" onClick={() => setStatusFilter('Rejected')}>Rejected</button></li>
                                </ul>
                            </div>
                            <button className="btn btn-outline-primary" onClick={fetchApplications}>
                                <i className="ti ti-refresh me-1" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Applications Grid */}
                    <div className="row">
                        {loading ? (
                            <div className="col-12 text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="col-12">
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            </div>
                        ) : getFilteredApplications().length === 0 ? (
                            <div className="col-12 text-center p-5">
                                <h4>No applications found</h4>
                            </div>
                        ) : (
                            getFilteredApplications().map((application) => (
                                <div key={application._id} className="col-xl-3 col-lg-4 col-md-6">
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
                                                            onClick={() => handleStatusChange(application._id, 'Accepted')}
                                                        >
                                                            <i className="ti ti-check me-1" />
                                                            Accept
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleStatusChange(application._id, 'Rejected')}
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
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default JobGrid;
