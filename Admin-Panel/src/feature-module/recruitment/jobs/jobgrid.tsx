import React, { useState, useEffect } from 'react';
import { all_routes } from '../../router/all_routes';
import { Link } from 'react-router-dom';
import PredefinedDateRanges from '../../../core/common/datePicker';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import axios from 'axios';
import { Application } from './types';
import Swal from 'sweetalert2';

const JobGrid = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'status'
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'

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
            console.log('Applications fetched:', response.data);
            setApplications(response.data);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Failed to load applications');
            Swal.fire({
                title: 'Error',
                text: 'Failed to load applications. Please try again later.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };    const handleStatusChange = async (applicationId: string, newStatus: 'Accepted' | 'Rejected') => {
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
            
            // Show success message
            Swal.fire({
                title: 'Success',
                text: `Application has been ${newStatus.toLowerCase()} successfully`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Error updating application status:', err);
            Swal.fire({
                title: 'Error',
                text: 'Failed to update application status',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };
    
    // Sort applications based on the selected criteria
    const sortApplications = (apps: Application[]) => {
        return [...apps].sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy === 'name') {
                const nameA = a.userId?.firstName || '';
                const nameB = b.userId?.firstName || '';
                return sortDirection === 'asc' 
                    ? nameA.localeCompare(nameB) 
                    : nameB.localeCompare(nameA);
            } else if (sortBy === 'status') {
                return sortDirection === 'asc' 
                    ? a.status.localeCompare(b.status) 
                    : b.status.localeCompare(a.status);
            }
            return 0;
        });
    };

    const toggleSortDirection = () => {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };

    const getFilteredApplications = () => {
        let filtered = applications;
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => 
                app.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }
        
        // Apply sorting
        return sortApplications(filtered);
    };    const getStatusBadgeClass = (status: string) => {
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
                                    <li className="breadcrumb-item">Recruitment</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Applications List
                                    </li>
                                </ol>
                            </nav>
                        </div>

                        {/* Filter Controls */}
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            <div className="dropdown me-2">
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

                            <div className="dropdown me-2">
                                <button className="btn btn-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Sort By: {sortBy === 'date' ? 'Date' : sortBy === 'name' ? 'Name' : 'Status'}
                                </button>
                                <ul className="dropdown-menu">
                                    <li><button className="dropdown-item" onClick={() => setSortBy('date')}>Date</button></li>
                                    <li><button className="dropdown-item" onClick={() => setSortBy('name')}>Name</button></li>
                                    <li><button className="dropdown-item" onClick={() => setSortBy('status')}>Status</button></li>
                                </ul>
                            </div>

                            <button className="btn btn-white me-2" onClick={toggleSortDirection}>
                                <i className={`ti ti-sort-${sortDirection === 'asc' ? 'ascending' : 'descending'}`} />
                                {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                            </button>

                            <button className="btn btn-outline-primary" onClick={fetchApplications}>
                                <i className="ti ti-refresh me-1" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="row mb-3">
                        <div className="col-xl-3 col-sm-6 col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="mb-0">{applications.length}</h3>
                                            <p className="text-muted">Total Applications</p>
                                        </div>
                                        <div className="avatar p-2 bg-light-primary">
                                            <span className="avatar-title rounded-circle bg-primary">
                                                <i className="ti ti-files"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="mb-0">{applications.filter(app => app.status === 'Pending').length}</h3>
                                            <p className="text-muted">Pending</p>
                                        </div>
                                        <div className="avatar p-2 bg-light-warning">
                                            <span className="avatar-title rounded-circle bg-warning">
                                                <i className="ti ti-clock"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="mb-0">{applications.filter(app => app.status === 'Accepted').length}</h3>
                                            <p className="text-muted">Accepted</p>
                                        </div>
                                        <div className="avatar p-2 bg-light-success">
                                            <span className="avatar-title rounded-circle bg-success">
                                                <i className="ti ti-check"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="mb-0">{applications.filter(app => app.status === 'Rejected').length}</h3>
                                            <p className="text-muted">Rejected</p>
                                        </div>
                                        <div className="avatar p-2 bg-light-danger">
                                            <span className="avatar-title rounded-circle bg-danger">
                                                <i className="ti ti-x"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>                    {/* Applications Grid */}
                    <div className="row">
                        {loading ? (
                            <div className="col-12 text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading applications...</p>
                            </div>
                        ) : error ? (
                            <div className="col-12">
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            </div>
                        ) : getFilteredApplications().length === 0 ? (
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body text-center p-5">
                                        <div className="mb-4">
                                            <i className="ti ti-clipboard-text text-primary" style={{ fontSize: '4rem' }} />
                                        </div>
                                        <h3>No applications found</h3>
                                        <p className="text-muted">
                                            {statusFilter !== 'all' 
                                                ? `No applications with status "${statusFilter}" found.` 
                                                : "There are no job applications to display"}
                                        </p>
                                        <button 
                                            className="btn btn-primary mt-3" 
                                            onClick={() => {
                                                setStatusFilter('all');
                                                fetchApplications();
                                            }}
                                        >
                                            <i className="ti ti-refresh me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            getFilteredApplications().map((application) => (
                                <div key={application._id} className="col-xl-3 col-lg-4 col-md-6 mb-3">
                                    <div className="card h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                                                    {application.status}
                                                </span>
                                                <small className="text-muted">
                                                    {new Date(application.createdAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                            
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="me-3">
                                                    <span className="avatar avatar-md">
                                                        <ImageWithBasePath
                                                            src={(application.userId && application.userId.profilePicture) || "assets/img/profiles/avatar-01.jpg"}
                                                            alt={(application.userId && application.userId.firstName) || "User"}
                                                            className="rounded-circle"
                                                        />
                                                    </span>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 text-primary">
                                                        {application.userId 
                                                            ? `${application.userId.firstName || ""} ${application.userId.lastName || ""}` 
                                                            : "Anonymous User"
                                                        }
                                                    </h6>
                                                    <p className="text-muted mb-0 fs-13">
                                                        {application.userId ? application.userId.email : "No email available"}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="job-info mb-3">
                                                <h6 className="mb-2 text-truncate" title={application.jobId.title}>
                                                    <i className="ti ti-briefcase text-muted me-1"></i> 
                                                    {application.jobId.title}
                                                </h6>
                                                <p className="mb-1 fs-13">
                                                    <i className="ti ti-building text-muted me-1"></i>
                                                    {application.jobId.companyId ? application.jobId.companyId.name : "Company not specified"}
                                                </p>
                                                <p className="mb-0 fs-13">
                                                    <i className="ti ti-map-pin text-muted me-1"></i>
                                                    {application.jobId.location || "Location not specified"}
                                                </p>
                                                {application.jobId.salaryRange && (
                                                    <p className="mb-0 fs-13">
                                                        <i className="ti ti-coin text-muted me-1"></i>
                                                        {application.jobId.salaryRange}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="d-flex flex-wrap gap-2">
                                                <Link to={`/applications/${application._id}`} className="btn btn-sm btn-outline-primary flex-grow-1">
                                                    <i className="ti ti-eye me-1" />
                                                    View
                                                </Link>
                                                
                                                {application.resume?.url && (
                                                    <a 
                                                        href={application.resume.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer" 
                                                        className="btn btn-sm btn-outline-info"
                                                        title="Download Resume"
                                                    >
                                                        <i className="ti ti-download" />
                                                    </a>
                                                )}
                                                
                                                {application.status === 'Pending' && (
                                                    <>
                                                        <button 
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleStatusChange(application._id, 'Accepted')}
                                                            title="Accept Application"
                                                        >
                                                            <i className="ti ti-check" />
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleStatusChange(application._id, 'Rejected')}
                                                            title="Reject Application"
                                                        >
                                                            <i className="ti ti-x" />
                                                        </button>
                                                    </>
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
