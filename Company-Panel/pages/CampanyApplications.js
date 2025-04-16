import React, { useEffect, useState } from "react"
import Layout from "@/components/layout/Layout"
import { createAuthAxios, getToken } from "../utils/authUtils"
import Swal from "sweetalert2"
import { format } from "date-fns"
import Link from "next/link"
import withAuth from "@/utils/withAuth"

function CampanyApplications() {
    const [applications, setApplications] = useState([])
    const [filteredApplications, setFilteredApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [companyJobs, setCompanyJobs] = useState([])
    
    // Filter states
    const [selectedJob, setSelectedJob] = useState("all")
    const [dateRange, setDateRange] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    
    const authAxios = createAuthAxios()
    
    useEffect(() => {
        fetchCompanyData()
    }, [])
    
    // Apply filters whenever filter parameters change
    useEffect(() => {
        applyFilters()
    }, [applications, selectedJob, dateRange, searchTerm, statusFilter, sortBy])
    
    // First fetch company, then fetch jobs for the company, then fetch applications for each job
    const fetchCompanyData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Step 1: Get company info
            console.log("Getting company data...")
            const companyResponse = await authAxios.get('/api/companies/user/my-company')
            
            if (!companyResponse.data.success || !companyResponse.data.company) {
                setError("Please set up your company profile first.")
                setLoading(false)
                return
            }
            
            const companyId = companyResponse.data.company._id
            console.log(`Company ID: ${companyId}`)
            
            // Step 2: Get company jobs
            console.log("Getting company jobs...")
            const jobsResponse = await authAxios.get(`/api/jobs/company/${companyId}`)
            
            if (!jobsResponse.data || !jobsResponse.data.length) {
                setCompanyJobs([])
                setError("Your company doesn't have any job posts yet. Create jobs to receive applications.")
                setLoading(false)
                return
            }
            
            setCompanyJobs(jobsResponse.data)
            const jobs = jobsResponse.data
            console.log(`Found ${jobs.length} jobs`)
            
            // Step 3: Get applications for each job
            console.log("Getting applications for each job...")
            let allApplications = []
            const jobApplicationsPromises = []
            
            // For each job, create a promise to fetch its applications
            for (const job of jobs) {
                jobApplicationsPromises.push(
                    authAxios.get(`/api/applications/job/${job._id}`)
                        .then(response => {
                            console.log(`Job ${job._id} has ${response.data?.length || 0} applications`)
                            return response.data || []
                        })
                        .catch(err => {
                            console.log(`Error fetching applications for job ${job._id}:`, err.message)
                            // Return empty array for failed job application fetch
                            return []
                        })
                )
            }
            
            // Wait for all application fetch promises to resolve
            const jobApplicationsResults = await Promise.all(jobApplicationsPromises)
            
            // Combine all applications
            jobApplicationsResults.forEach(apps => {
                if (Array.isArray(apps) && apps.length > 0) {
                    allApplications = [...allApplications, ...apps]
                }
            })
            
            console.log(`Total applications found: ${allApplications.length}`)
            
            setApplications(allApplications)
            setFilteredApplications(allApplications)
            setLoading(false)
            
        } catch (error) {
            console.error("Error in application fetch process:", error)
            
            let errorMessage = "An error occurred while fetching applications."
            
            if (error.response) {
                const status = error.response.status
                const message = error.response.data?.message || error.message
                
                if (status === 403) {
                    errorMessage = `Authentication error: ${message}`
                } else if (status === 404) {
                    errorMessage = "Resource not found. Please check if your company profile is properly set up."
                } else {
                    errorMessage = `Server error (${status}): ${message}`
                }
            }
            
            setError(errorMessage)
            setLoading(false)
        }
    }
    
    // Apply all filters and sorting
    const applyFilters = () => {
        if (!applications.length) {
            setFilteredApplications([])
            return
        }
        
        let filtered = [...applications]
        
        // Filter by job
        if (selectedJob !== "all") {
            filtered = filtered.filter(app => app.jobId._id === selectedJob)
        }
        
        // Filter by date range
        if (dateRange !== "all") {
            const now = new Date()
            let cutoffDate = new Date()
            
            if (dateRange === "today") {
                cutoffDate.setHours(0, 0, 0, 0)
            } else if (dateRange === "week") {
                cutoffDate.setDate(now.getDate() - 7)
            } else if (dateRange === "month") {
                cutoffDate.setMonth(now.getMonth() - 1)
            }
            
            filtered = filtered.filter(app => new Date(app.createdAt) >= cutoffDate)
        }
        
        // Filter by search term (candidate name or email)
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(app => 
                (app.userId.firstName + " " + app.userId.lastName).toLowerCase().includes(term) ||
                app.userId.email.toLowerCase().includes(term)
            )
        }
        
        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(app => app.status === statusFilter)
        }
        
        // Apply sorting
        if (sortBy === "newest") {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        } else if (sortBy === "oldest") {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        }
        
        setFilteredApplications(filtered)
    }
    
    // Update application status
    const updateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await authAxios.put(`/api/applications/${applicationId}/status`, {
                status: newStatus
            })
            
            // Update local state after successful API call
            setApplications(prevApps => 
                prevApps.map(app => 
                    app._id === applicationId ? { ...app, status: newStatus } : app
                )
            )
            
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Application status changed to ${newStatus}`,
            })
        } catch (err) {
            console.error("Error updating application status:", err)
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.response?.data?.message || "Failed to update application status",
            })
        }
    }
    
    // Format date for display
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy')
        } catch (err) {
            return dateString
        }
    }
    
    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Accepted': return 'bg-success'
            case 'Rejected': return 'bg-danger'
            default: return 'bg-warning'
        }
    }
    
    return (
        <Layout breadcrumbTitle="Applications" breadcrumbActive="Manage Applications">
            <div className="section-box">
                <div className="container">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading applications...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-warning my-4">
                            <h5 className="alert-heading">Unable to Load Applications</h5>
                            <p>{error}</p>
                            <div className="mt-3">
                                <Link href="/post-job" className="btn btn-primary me-2">
                                    <i className="fi-rr-briefcase me-2"></i>Post a Job
                                </Link>
                                <Link href="/" className="btn btn-outline-primary">
                                    Return to Dashboard
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="panel-white mb-30">
                                <div className="box-padding">
                                    <h5 className="mb-4">Job Applications</h5>
                                    
                                    {/* Filters Section */}
                                    <div className="filters-container mb-4">
                                        <div className="row g-3">
                                            <div className="col-md-3">
                                                <label className="form-label">Filter by Job</label>
                                                <select 
                                                    className="form-select" 
                                                    value={selectedJob}
                                                    onChange={(e) => setSelectedJob(e.target.value)}
                                                >
                                                    <option value="all">All Jobs</option>
                                                    {companyJobs.map(job => (
                                                        <option key={job._id} value={job._id}>
                                                            {job.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Date Range</label>
                                                <select 
                                                    className="form-select"
                                                    value={dateRange}
                                                    onChange={(e) => setDateRange(e.target.value)}
                                                >
                                                    <option value="all">All Time</option>
                                                    <option value="today">Today</option>
                                                    <option value="week">Last 7 Days</option>
                                                    <option value="month">Last 30 Days</option>
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Status</label>
                                                <select 
                                                    className="form-select"
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                >
                                                    <option value="all">All Status</option>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Sort By</label>
                                                <select
                                                    className="form-select"
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                >
                                                    <option value="newest">Newest First</option>
                                                    <option value="oldest">Oldest First</option>
                                                </select>
                                            </div>
                                            <div className="col-md-12 mt-3">
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-0">
                                                        <i className="fi-rr-search"></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-0 bg-light"
                                                        placeholder="Search by candidate name or email..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Results Summary */}
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <p className="mb-0">
                                            <strong>{filteredApplications.length}</strong> applications found
                                        </p>
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={fetchCompanyData}
                                        >
                                            <i className="fi-rr-refresh me-1"></i> Refresh
                                        </button>
                                    </div>
                                    
                                    {filteredApplications.length === 0 ? (
                                        <div className="text-center py-5">
                                            <img 
                                                src="/assets/imgs/page/dashboard/no-results.svg" 
                                                alt="No applications" 
                                                style={{ height: '120px', marginBottom: '20px', opacity: '0.6' }}
                                            />
                                            <h6>No applications found</h6>
                                            <p className="text-muted">
                                                {applications.length > 0 
                                                    ? "Try adjusting your filters or search criteria"
                                                    : "You haven't received any applications yet. Post a job to start receiving applications."}
                                            </p>
                                            {applications.length === 0 && (
                                                <div className="mt-3">
                                                    <Link href="/post-job" className="btn btn-primary">
                                                        <i className="fi-rr-briefcase me-2"></i>Post a Job
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-bordered table-hover">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Candidate</th>
                                                        <th>Skills</th>
                                                        <th>Job Position</th>
                                                        <th>Applied On</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredApplications.map((application) => (
                                                        <tr key={application._id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <img 
                                                                        src={application.userId.profilePicture || "/assets/imgs/page/dashboard/avatar.png"} 
                                                                        alt={application.userId.firstName}
                                                                        className="me-2 rounded-circle"
                                                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                    />
                                                                    <div>
                                                                        <h6 className="mb-0">
                                                                            {application.userId.firstName} {application.userId.lastName}
                                                                        </h6>
                                                                        <small className="text-muted">
                                                                            {application.userId.email}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="skills-tags">
                                                                    {application.userProfile?.skills?.slice(0, 3).map((skill, index) => (
                                                                        <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {application.userProfile?.skills?.length > 3 && (
                                                                        <span className="badge bg-light text-primary">
                                                                            +{application.userProfile.skills.length - 3} more
                                                                        </span>
                                                                    )}
                                                                    {(!application.userProfile?.skills || application.userProfile.skills.length === 0) && (
                                                                        <span className="text-muted">No skills listed</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {application.jobId.title}
                                                            </td>
                                                            <td>
                                                                {formatDate(application.createdAt)}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getStatusColor(application.status)}`}>
                                                                    {application.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="btn-group" role="group">
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        data-bs-toggle="modal"
                                                                        data-bs-target={`#viewApplicationModal-${application._id}`}
                                                                    >
                                                                        <i className="fi-rr-eye me-1"></i> View
                                                                    </button>
                                                                    <div className="btn-group" role="group">
                                                                        <button 
                                                                            type="button" 
                                                                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                                            data-bs-toggle="dropdown"
                                                                            aria-expanded="false"
                                                                        >
                                                                            Status
                                                                        </button>
                                                                        <ul className="dropdown-menu">
                                                                            <li>
                                                                                <button 
                                                                                    className="dropdown-item" 
                                                                                    onClick={() => updateApplicationStatus(application._id, 'Pending')}
                                                                                >
                                                                                    <i className="fi-rr-time-forward me-1"></i> Pending
                                                                                </button>
                                                                            </li>
                                                                            <li>
                                                                                <button 
                                                                                    className="dropdown-item" 
                                                                                    onClick={() => updateApplicationStatus(application._id, 'Accepted')}
                                                                                >
                                                                                    <i className="fi-rr-check me-1"></i> Accept
                                                                                </button>
                                                                            </li>
                                                                            <li>
                                                                                <button 
                                                                                    className="dropdown-item" 
                                                                                    onClick={() => updateApplicationStatus(application._id, 'Rejected')}
                                                                                >
                                                                                    <i className="fi-rr-cross-circle me-1"></i> Reject
                                                                                </button>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Modal for application details - Will be shown when "View" is clicked */}
                                                                <div className="modal fade" id={`viewApplicationModal-${application._id}`} tabIndex="-1" aria-hidden="true">
                                                                    <div className="modal-dialog modal-lg">
                                                                        <div className="modal-content">
                                                                            <div className="modal-header">
                                                                                <h5 className="modal-title">Application Details</h5>
                                                                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                                            </div>
                                                                            <div className="modal-body">
                                                                                <div className="row mb-4">
                                                                                    <div className="col-md-3">
                                                                                        <img 
                                                                                            src={application.userId.profilePicture || "/assets/imgs/page/dashboard/avatar.png"}
                                                                                            alt={application.userId.firstName}
                                                                                            className="img-fluid rounded"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-md-9">
                                                                                        <h4>{application.userId.firstName} {application.userId.lastName}</h4>
                                                                                        <p className="mb-1"><i className="fi-rr-envelope me-2"></i>{application.userId.email}</p>
                                                                                        {application.userId.phone && (
                                                                                            <p className="mb-1"><i className="fi-rr-phone-call me-2"></i>{application.userId.phone}</p>
                                                                                        )}
                                                                                        <div className="mt-3">
                                                                                            <span className={`badge ${getStatusColor(application.status)} me-2`}>
                                                                                                {application.status}
                                                                                            </span>
                                                                                            <span className="text-muted">
                                                                                                Applied on {formatDate(application.createdAt)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                <div className="row">
                                                                                    <div className="col-md-12">
                                                                                        <div className="card mb-3">
                                                                                            <div className="card-header bg-light">
                                                                                                <h6 className="mb-0">Cover Letter</h6>
                                                                                            </div>
                                                                                            <div className="card-body">
                                                                                                <p style={{ whiteSpace: 'pre-line' }}>{application.coverLetter}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="col-md-6">
                                                                                        <div className="card mb-3">
                                                                                            <div className="card-header bg-light">
                                                                                                <h6 className="mb-0">Skills</h6>
                                                                                            </div>
                                                                                            <div className="card-body">
                                                                                                {application.userProfile?.skills?.map((skill, index) => (
                                                                                                    <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                                                                                        {skill}
                                                                                                    </span>
                                                                                                ))}
                                                                                                {(!application.userProfile?.skills || application.userProfile.skills.length === 0) && (
                                                                                                    <p className="text-muted mb-0">No skills listed</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="col-md-6">
                                                                                        <div className="card mb-3">
                                                                                            <div className="card-header bg-light">
                                                                                                <h6 className="mb-0">Applied For</h6>
                                                                                            </div>
                                                                                            <div className="card-body">
                                                                                                <h6>{application.jobId.title}</h6>
                                                                                                <p className="mb-1">
                                                                                                    <i className="fi-rr-marker me-1"></i>
                                                                                                    {application.jobId.location || 'Remote'}
                                                                                                </p>
                                                                                                <p className="mb-0">
                                                                                                    <i className="fi-rr-briefcase me-1"></i>
                                                                                                    {application.jobId.workplaceType}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    {application.userProfile?.education && application.userProfile.education.length > 0 && (
                                                                                        <div className="col-md-12">
                                                                                            <div className="card mb-3">
                                                                                                <div className="card-header bg-light">
                                                                                                    <h6 className="mb-0">Education</h6>
                                                                                                </div>
                                                                                                <div className="card-body">
                                                                                                    <div className="table-responsive">
                                                                                                        <table className="table table-sm">
                                                                                                            <thead>
                                                                                                                <tr>
                                                                                                                    <th>Degree</th>
                                                                                                                    <th>Institution</th>
                                                                                                                    <th>Year</th>
                                                                                                                </tr>
                                                                                                            </thead>
                                                                                                            <tbody>
                                                                                                                {application.userProfile.education.map((edu, index) => (
                                                                                                                    <tr key={index}>
                                                                                                                        <td>{edu.degree}</td>
                                                                                                                        <td>{edu.institution}</td>
                                                                                                                        <td>{edu.yearCompleted}</td>
                                                                                                                    </tr>
                                                                                                                ))}
                                                                                                            </tbody>
                                                                                                        </table>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="modal-footer">
                                                                                <button 
                                                                                    type="button" 
                                                                                    className="btn btn-outline-primary"
                                                                                    data-bs-dismiss="modal"
                                                                                >
                                                                                    Close
                                                                                </button>
                                                                                <div className="btn-group">
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-success"
                                                                                        onClick={() => {
                                                                                            updateApplicationStatus(application._id, 'Accepted');
                                                                                            // Close modal after update
                                                                                            document.querySelector(`#viewApplicationModal-${application._id} .btn-close`).click();
                                                                                        }}
                                                                                    >
                                                                                        <i className="fi-rr-check me-1"></i> Accept
                                                                                    </button>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-danger"
                                                                                        onClick={() => {
                                                                                            updateApplicationStatus(application._id, 'Rejected');
                                                                                            // Close modal after update
                                                                                            document.querySelector(`#viewApplicationModal-${application._id} .btn-close`).click();
                                                                                        }}
                                                                                    >
                                                                                        <i className="fi-rr-cross-circle me-1"></i> Reject
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default withAuth(CampanyApplications, ['HR']);