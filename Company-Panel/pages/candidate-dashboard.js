import VacancyChart from "@/components/elements/VacancyChart"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { Menu } from '@headlessui/react'
import Link from "next/link"
import withAuth from "@/utils/withAuth"
import { useEffect, useState } from "react"
import { createAuthAxios } from '../utils/authUtils'
import { useRouter } from 'next/router'

function CandidateDashboard({ user }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalApplications: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        rejectedApplications: 0
    });
    const authAxios = createAuthAxios();
    
    useEffect(() => {
        // Redirect if not Candidate role
        if (user && user.role.toString().toUpperCase() !== 'CANDIDATE') {
            router.push('/hr-dashboard');
            return;
        }
        
        // Fetch candidate data
        fetchCandidateStats();
    }, [user]);
    
    // Fetch candidate statistics
    const fetchCandidateStats = async () => {
        try {
            setLoading(true);
            
            // Get candidate's applications
            const applicationsResponse = await authAxios.get('/api/applications/user');
            
            if (applicationsResponse.data) {
                const applications = applicationsResponse.data;
                const totalApplications = applications.length;
                const pendingApplications = applications.filter(app => app.status === 'Pending').length;
                const shortlistedApplications = applications.filter(app => app.status === 'Shortlisted').length;
                const rejectedApplications = applications.filter(app => app.status === 'Rejected').length;
                
                setStats({
                    totalApplications,
                    pendingApplications,
                    shortlistedApplications,
                    rejectedApplications
                });
            }
            
        } catch (error) {
            console.error("Error fetching candidate stats:", error);
            setError("Failed to load your application statistics.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            <Layout breadcrumbTitle="Candidate Dashboard" breadcrumbActive="Dashboard">
                <div className="dashboard-header mb-30">
                    <div className="bg-primary-light rounded-top p-4">
                        <div className="container-fluid">
                            <div className="row align-items-center">
                                <div className="col-lg-6">
                                    <div className="d-flex align-items-center">
                                        <div className="dashboard-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', minWidth: '60px' }}>
                                            <i className="fi-rr-user text-white" style={{ fontSize: '24px' }}></i>
                                        </div>
                                        <div className="ms-3">
                                            <h4 className="text-dark mb-1">Welcome, {user?.firstName} {user?.lastName}!</h4>
                                            <p className="text-muted mb-0">Here's an overview of your job applications and activity.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 mt-3 mt-lg-0">
                                    <div className="d-flex justify-content-lg-end align-items-center">
                                        <div className="d-flex align-items-center me-4">
                                            <div className="d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }}>
                                                <i className="fi-rr-calendar text-primary"></i>
                                            </div>
                                            <div className="ms-2">
                                                <span className="text-muted small">Today</span>
                                                <p className="mb-0 font-bold">{new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                                            </div>
                                        </div>
                                        <Link href="/apply-for-jobs" className="btn btn-primary">
                                            <i className="fi-rr-briefcase me-2"></i>Browse Jobs
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading your dashboard...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-warning mb-30">
                        <div className="d-flex">
                            <div className="me-3">
                                <i className="fi-rr-exclamation text-warning" style={{ fontSize: '2rem' }}></i>
                            </div>
                            <div>
                                <h5 className="alert-heading">Error Loading Dashboard</h5>
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Stats Cards */}
                        <div className="row mb-30">
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up p-4 bg-white rounded shadow-sm h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="card-image me-3"> 
                                            <img src="assets/imgs/page/dashboard/computer.svg" alt="jobBox" />
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.totalApplications}<span className="font-sm status up ms-1">25<span>%</span></span></h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Interview Schedules</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up p-4 bg-white rounded shadow-sm h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="card-image me-3"> 
                                            <img src="assets/imgs/page/dashboard/bank.svg" alt="jobBox" />
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.pendingApplications}<span className="font-sm status up ms-1">5<span>%</span></span></h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Applied Jobs</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up p-4 bg-white rounded shadow-sm h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="card-image me-3"> 
                                            <img src="assets/imgs/page/dashboard/lamp.svg" alt="jobBox" />
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.shortlistedApplications}<span className="font-sm status up ms-1">12<span>%</span></span></h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Shortlisted</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up p-4 bg-white rounded shadow-sm h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="card-image me-3"> 
                                            <img src="assets/imgs/page/dashboard/headphone.svg" alt="jobBox" />
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.rejectedApplications}<span className="font-sm status down ms-1">- 2<span>%</span></span></h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Rejected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Section */}
                        <div className="row mb-30">
                            <div className="col-12">
                                <div className="card shadow-sm hover-up">
                                    <div className="card-header bg-primary-light py-3 px-4 border-0">
                                        <h5 className="mb-0 font-bold">Quick Actions</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        <div className="row g-4">
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/apply-for-jobs" className="d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="mb-3 d-flex align-items-center justify-content-center bg-primary-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-search text-primary" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">Find Jobs</h6>
                                                    <p className="font-sm mb-0 text-muted">Search and apply for job positions</p>
                                                </Link>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/my-applications" className="d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="mb-3 d-flex align-items-center justify-content-center bg-success-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-document-signed text-success" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">My Applications</h6>
                                                    <p className="font-sm mb-0 text-muted">Track your job applications</p>
                                                </Link>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/my-resume" className="d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="mb-3 d-flex align-items-center justify-content-center bg-warning-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-file-edit text-warning" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">My Resume</h6>
                                                    <p className="font-sm mb-0 text-muted">Update your resume and profile</p>
                                                </Link>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/settings" className="d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="mb-3 d-flex align-items-center justify-content-center bg-info-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-settings text-info" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">Account Settings</h6>
                                                    <p className="font-sm mb-0 text-muted">Manage your account preferences</p>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recommended Jobs Section */}
                        <div className="section-box mb-30">
                            <div className="container">
                                <div className="panel-white">
                                    <div className="panel-head d-flex justify-content-between">
                                        <h5>Recommended Jobs</h5>
                                        <Link href="/apply-for-jobs" className="btn btn-link text-primary">View All</Link>
                                    </div>
                                    <div className="panel-body">
                                        <div className="row">
                                            <div className="col-xl-6 col-lg-6 col-md-12 mb-3">
                                                <div className="card-job hover-up">
                                                    <div className="card-job-body d-flex align-items-start p-4 border rounded">
                                                        <div className="card-job-image me-3 mt-1">
                                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                                                <img src="assets/imgs/page/dashboard/img1.png" alt="Company Logo" style={{ maxWidth: '40px', maxHeight: '40px' }} />
                                                            </div>
                                                        </div>
                                                        <div className="card-job-info flex-grow-1">
                                                            <h6 className="mb-1">Senior Full Stack Engineer</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="fi-rr-marker me-2 text-muted"></i>
                                                                <span className="font-sm">New York, US</span>
                                                                <span className="mx-3 border-end"></span>
                                                                <span className="badge bg-soft-primary text-primary">Full-time</span>
                                                            </div>
                                                            <div className="mt-2 d-flex align-items-center">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="fi-rr-dollar me-1 text-muted"></i>
                                                                    <span className="font-sm">$100-$120k/year</span>
                                                                </div>
                                                                <div className="ms-auto">
                                                                    <Link href="/apply-for-jobs" className="btn btn-sm btn-outline-primary rounded-pill">
                                                                        Apply Now
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-6 col-lg-6 col-md-12 mb-3">
                                                <div className="card-job hover-up">
                                                    <div className="card-job-body d-flex align-items-start p-4 border rounded">
                                                        <div className="card-job-image me-3 mt-1">
                                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                                                <img src="assets/imgs/page/dashboard/img2.png" alt="Company Logo" style={{ maxWidth: '40px', maxHeight: '40px' }} />
                                                            </div>
                                                        </div>
                                                        <div className="card-job-info flex-grow-1">
                                                            <h6 className="mb-1">Marketing Graphic Designer</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="fi-rr-marker me-2 text-muted"></i>
                                                                <span className="font-sm">Chicago, US</span>
                                                                <span className="mx-3 border-end"></span>
                                                                <span className="badge bg-soft-success text-success">Remote</span>
                                                            </div>
                                                            <div className="mt-2 d-flex align-items-center">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="fi-rr-dollar me-1 text-muted"></i>
                                                                    <span className="font-sm">$80-$90k/year</span>
                                                                </div>
                                                                <div className="ms-auto">
                                                                    <Link href="/apply-for-jobs" className="btn btn-sm btn-outline-primary rounded-pill">
                                                                        Apply Now
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Layout>
        </>
    )
}

// Export with auth HOC
// Allow only the candidate role to access
export default withAuth(CandidateDashboard, ['candidate'])