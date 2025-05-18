import VacancyChart from "@/components/elements/VacancyChart"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { Menu } from '@headlessui/react'
import Link from "next/link"
import withAuth from "@/utils/withAuth"
import { useEffect, useState } from "react"
import { createAuthAxios } from '../utils/authUtils'
import { useRouter } from 'next/router'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

function CandidateDashboard({ user }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [portfolioData, setPortfolioData] = useState(null);
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
        
        // Fetch portfolio data for profile completion
        fetchPortfolioData();
    }, [user]);
    
    // Function to calculate profile completion based on user data
    const calculateProfileFromUserData = () => {
        try {
            setProfileLoading(true);
            
            if (!user) {
                console.warn('No user data available');
                setPortfolioData(null);
                setProfileCompletion(0);
                return;
            }
            
            console.log('Using user data for profile completion');
            
            // Create a simulated portfolio object based on user data
            const simulatedPortfolio = {
                fullName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone || '',
                address: user.address || '',
                bio: user.bio || '',
                education: [],
                experience: [],
                skills: [],
                projects: [],
                languages: []
            };
            
            // Calculate completion percentage based on available user data
            let completionScore = 0;
            
            // Basic profile - 40%
            if (user.firstName && user.lastName) completionScore += 10;
            if (user.email) completionScore += 10;
            if (user.phone) completionScore += 5;
            if (user.address) completionScore += 5;
            if (user.bio) completionScore += 10;
            
            // Profile picture - 10%
            if (user.profilePicture) completionScore += 10;
            
            // Skills - 15%
            if (user.skills && Array.isArray(user.skills) && user.skills.length > 0) {
                simulatedPortfolio.skills = user.skills;
                completionScore += 15;
            }
            
            // Education - 15%
            if (user.education && Array.isArray(user.education) && user.education.length > 0) {
                simulatedPortfolio.education = user.education;
                completionScore += 15;
            }
            
            // Experience - 20%
            if (user.experience && Array.isArray(user.experience) && user.experience.length > 0) {
                simulatedPortfolio.experience = user.experience;
                completionScore += 20;
            }
            
            // Set a minimum completion of 25% for logged-in users
            completionScore = Math.max(25, completionScore);
            
            setPortfolioData(simulatedPortfolio);
            setProfileCompletion(completionScore);
            
        } catch (error) {
            console.error('Error calculating profile completion:', error);
            setProfileCompletion(25); // Default to 25% if there's an error
        } finally {
            setProfileLoading(false);
        }
    };
    
    // Alias for backward compatibility
    const fetchPortfolioData = calculateProfileFromUserData;
    
    // Calculate profile completion percentage based on portfolio data
    const calculateProfileCompletion = (portfolio) => {
        if (!portfolio) {
            setProfileCompletion(0);
            return;
        }
        
        // Define the key sections of a complete profile
        const sections = [
            // Basic info
            { name: 'basic', weight: 20, fields: ['fullName', 'email', 'phone', 'address', 'bio'] },
            // Education
            { name: 'education', weight: 20, isArray: true },
            // Experience
            { name: 'experience', weight: 20, isArray: true },
            // Skills
            { name: 'skills', weight: 15, isArray: true },
            // Projects
            { name: 'projects', weight: 15, isArray: true },
            // Languages
            { name: 'languages', weight: 10, isArray: true }
        ];
        
        let totalScore = 0;
        
        // Calculate score for each section
        sections.forEach(section => {
            if (section.isArray) {
                // For array sections like education, experience, etc.
                const items = portfolio[section.name] || [];
                if (items.length > 0) {
                    totalScore += section.weight;
                }
            } else {
                // For object sections with multiple fields
                let fieldCount = 0;
                let filledFieldCount = 0;
                
                section.fields.forEach(field => {
                    fieldCount++;
                    if (portfolio[field] && portfolio[field].trim && portfolio[field].trim() !== '') {
                        filledFieldCount++;
                    }
                });
                
                if (fieldCount > 0) {
                    const sectionScore = (filledFieldCount / fieldCount) * section.weight;
                    totalScore += sectionScore;
                }
            }
        });
        
        // Round to nearest integer
        const percentage = Math.round(totalScore);
        setProfileCompletion(percentage);
    };
    
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
                                        <Link href="/apply-for-jobs" className="btn btn-primary btn-modern">
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
                    <div className="alert alert-warning mb-30 rounded-xl shadow-sm">
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
                                <div className="stats-card p-4 bg-white h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="stats-icon me-3 bg-primary-light"> 
                                            <div className="interview-icon-wrapper">
                                                <i className="fi-rr-calendar text-primary interview-icon-calendar"></i>
                                                <i className="fi-rr-user text-primary interview-icon-person"></i>
                                            </div>
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.totalApplications}</h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Interview Schedules</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="stats-card p-4 bg-white h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="stats-icon me-3 bg-warning-light"> 
                                            <i className="fi-rr-briefcase text-warning" style={{ fontSize: '24px' }}></i>
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.pendingApplications}</h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Applied Jobs</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="stats-card p-4 bg-white h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="stats-icon me-3 bg-success-light"> 
                                            <i className="fi-rr-star text-success" style={{ fontSize: '24px' }}></i>
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.shortlistedApplications}</h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Shortlisted</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="stats-card p-4 bg-white h-100">
                                    <div className="d-flex align-items-center">
                                        <div className="stats-icon me-3 bg-danger-light"> 
                                            <i className="fi-rr-cross-circle text-danger" style={{ fontSize: '24px' }}></i>
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title">
                                                <h3 className="mb-0 fw-bold">{stats.rejectedApplications}</h3>
                                            </div>
                                            <p className="font-sm color-text-paragraph-2 mb-0">Rejected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Completion Section */}
                        <div className="row mb-30">
                            <div className="col-12">
                                <div className="profile-completion-card card shadow-sm hover-up">
                                    <div className="card-header bg-primary-light py-3 px-4 border-0 d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 font-bold">Profile Completion</h5>
                                        <Link href="/my-resume" className="btn btn-sm btn-outline-primary btn-modern">
                                            <i className="fi-rr-edit me-1"></i>Update Profile
                                        </Link>
                                    </div>
                                    <div className="card-body p-4">
                                        <div className="row align-items-center">
                                            <div className="col-md-3 col-sm-4 text-center mb-4 mb-md-0">
                                                <div style={{ width: "150px", margin: "0 auto" }}>
                                                    {profileLoading ? (
                                                        <div className="d-flex justify-content-center align-items-center" style={{ height: '150px' }}>
                                                            <div className="spinner-border text-primary" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                        </div>
                                                    ) : portfolioData === null && profileCompletion === 0 ? (
                                                        <div className="d-flex justify-content-center align-items-center flex-column" style={{ height: '150px' }}>
                                                            <div className="mb-3">
                                                                <i className="fi-rr-user-add text-warning" style={{ fontSize: '48px' }}></i>
                                                            </div>
                                                            <p className="text-muted">No portfolio found</p>
                                                        </div>
                                                    ) : (
                                                        <CircularProgressbar
                                                            value={profileCompletion}
                                                            text={`${profileCompletion}%`}
                                                            background
                                                            backgroundPadding={0}
                                                            styles={buildStyles({
                                                                backgroundColor: "#D8E0FD",
                                                                textColor: "#05264E",
                                                                pathColor: profileCompletion < 50 ? "#FFA500" : profileCompletion < 80 ? "#3498DB" : "#2ECC71",
                                                                trailColor: "transparent",
                                                                strokeLinecap: "butt"
                                                            })}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-md-9 col-sm-8">
                                                <h6 className="mb-3 font-bold">
                                                    {portfolioData === null && profileCompletion === 0 ? (
                                                        <span className="text-warning">You need to create a portfolio!</span>
                                                    ) : profileCompletion < 50 ? (
                                                        <span className="text-warning">Your profile needs attention!</span>
                                                    ) : profileCompletion < 80 ? (
                                                        <span className="text-primary">Your profile is looking good!</span>
                                                    ) : (
                                                        <span className="text-success">Your profile is excellent!</span>
                                                    )}
                                                </h6>
                                                <div className="mb-3">
                                                    {portfolioData === null && profileCompletion === 0 ? (
                                                        <p>You haven't created a portfolio yet. A professional portfolio is essential for showcasing your skills and experience to potential employers. Create your portfolio to increase your chances of getting hired.</p>
                                                    ) : profileCompletion < 50 ? (
                                                        <p>A complete profile significantly increases your chances of getting noticed by employers. Take some time to add more details about your skills, experience, and education.</p>
                                                    ) : profileCompletion < 80 ? (
                                                        <p>Your profile is coming along nicely! Consider adding more details to your portfolio sections to make your profile stand out even more to potential employers.</p>
                                                    ) : (
                                                        <p>Excellent job completing your profile! Keep it updated with your latest achievements and skills to maintain your professional presence.</p>
                                                    )}
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    <Link href="/my-resume" className="btn btn-sm btn-primary btn-modern">
                                                        <i className="fi-rr-user me-1"></i>
                                                        {portfolioData === null && profileCompletion === 0 ? 'Create Portfolio' : 'Complete Profile'}
                                                    </Link>
                                                    <Link href="/apply-for-jobs" className="btn btn-sm btn-outline-primary btn-modern">
                                                        <i className="fi-rr-briefcase me-1"></i>Find Jobs
                                                    </Link>
                                                </div>
                                            </div>
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
                                                <Link href="/apply-for-jobs" className="quick-action-card d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="quick-action-icon mb-3 d-flex align-items-center justify-content-center bg-primary-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-search text-primary" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">Find Jobs</h6>
                                                    <p className="font-sm mb-0 text-muted">Search and apply for job positions</p>
                                                </Link>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/my-applications" className="quick-action-card d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="quick-action-icon mb-3 d-flex align-items-center justify-content-center bg-success-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-document-signed text-success" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">My Applications</h6>
                                                    <p className="font-sm mb-0 text-muted">Track your job applications</p>
                                                </Link>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/my-resume" className="quick-action-card d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="quick-action-icon mb-3 d-flex align-items-center justify-content-center bg-warning-light rounded-circle" style={{ width: '70px', height: '70px' }}>
                                                        <i className="fi-rr-file-edit text-warning" style={{ fontSize: '26px' }}></i>
                                                    </div>
                                                    <h6 className="mb-2 font-bold">My Resume</h6>
                                                    <p className="font-sm mb-0 text-muted">Update your resume and profile</p>
                                                </Link>
                                            </div>
                                            <div className="col-lg-3 col-md-6">
                                                <Link href="/settings" className="quick-action-card d-flex flex-column align-items-center p-4 border rounded hover-up shadow-sm text-center h-100 bg-white">
                                                    <div className="quick-action-icon mb-3 d-flex align-items-center justify-content-center bg-info-light rounded-circle" style={{ width: '70px', height: '70px' }}>
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
                                <div className="panel-white rounded-xl shadow-hover">
                                    <div className="panel-head d-flex justify-content-between p-4 bg-primary-light rounded-top">
                                        <h5 className="font-bold mb-0">Recommended Jobs</h5>
                                        <Link href="/apply-for-jobs" className="btn btn-link text-primary">View All</Link>
                                    </div>
                                    <div className="panel-body p-4">
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
                                                                    <Link href="/apply-for-jobs" className="btn btn-sm btn-outline-primary btn-modern rounded-pill">
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
                                                                    <Link href="/apply-for-jobs" className="btn btn-sm btn-outline-primary btn-modern rounded-pill">
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