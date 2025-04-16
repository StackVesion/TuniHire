import VacancyChart from "@/components/elements/VacancyChart"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { Menu } from '@headlessui/react'
import Link from "next/link"
import withAuth from "@/utils/withAuth"
import { useEffect, useState } from "react"
import { getToken, createAuthAxios } from '../utils/authUtils'

function Home({ user }) {
    const [roleDisplay, setRoleDisplay] = useState('');
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        newApplications: 0
    });
    const authAxios = createAuthAxios();
    
    useEffect(() => {
        // Set role display text based on user role
        if (user) {
            const role = user.role.toString().toUpperCase();
            setRoleDisplay(role === 'HR' ? 'HR Dashboard' : 'Candidate Dashboard');
            
            // Fetch company data if user is HR
            if (role === 'HR') {
                fetchCompanyData();
                fetchCompanyStats();
            }
        }
    }, [user]);
    
    // Function to fetch company data
    const fetchCompanyData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching company data...');
            // Use authAxios to ensure proper token handling
            const response = await authAxios.get('/api/companies/user/my-company');
            
            console.log('Company data fetched:', response.data);
            setCompany(response.data.company);
        } catch (err) {
            console.error('Error fetching company data:', err);
            
            if (err.response && err.response.status === 404) {
                // User doesn't have a company yet
                setError("You don't have a company yet. Please create one.");
            } else {
                setError("Failed to load company data. " + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch company statistics
    const fetchCompanyStats = async () => {
        try {
            // Get company first
            const companyResponse = await authAxios.get('/api/companies/user/my-company');
            
            if (!companyResponse.data.success || !companyResponse.data.company) {
                return;
            }
            
            const companyId = companyResponse.data.company._id;
            
            // Get job stats
            const jobsResponse = await authAxios.get(`/api/jobs/company/${companyId}`);
            const totalJobs = jobsResponse.data?.length || 0;
            const activeJobs = jobsResponse.data?.filter(job => job.isActive)?.length || 0;
            
            // Get application stats - this will require multiple calls
            let totalApplications = 0;
            let newApplications = 0;
            
            if (jobsResponse.data && jobsResponse.data.length > 0) {
                // For each job, get the applications
                const jobIds = jobsResponse.data.map(job => job._id);
                
                const applicationPromises = jobIds.map(jobId => 
                    authAxios.get(`/api/applications/job/${jobId}`)
                );
                
                const applicationResponses = await Promise.all(applicationPromises);
                
                applicationResponses.forEach(response => {
                    if (response.data) {
                        totalApplications += response.data.length;
                        
                        // Count applications from the last 7 days
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        
                        const recentApps = response.data.filter(app => 
                            new Date(app.createdAt) >= oneWeekAgo
                        );
                        
                        newApplications += recentApps.length;
                    }
                });
            }
            
            setStats({
                totalJobs,
                activeJobs,
                totalApplications,
                newApplications
            });
            
        } catch (error) {
            console.error("Error fetching company stats:", error);
        }
    };
    
    return (
        <>
            <Layout breadcrumbTitle="Dashboard" breadcrumbActive="Dashboard">
                <div className="alert alert-info mb-20">
                    <h5>Welcome to your {roleDisplay}</h5>
                    <p>You are logged in as {user?.firstName} {user?.lastName} ({user?.role})</p>
                </div>

                {/* Company Information Section - Only for HR users */}
                {user && user.role.toString().toUpperCase() === 'HR' && (
                    <div className="section-box mb-30">
                        <div className="container">
                            <div className="panel-white pt-30 pb-30 pl-30 pr-30">
                                <div className="d-flex justify-content-between align-items-center mb-30">
                                    <h5 className="mb-0">Company Dashboard</h5>
                                    {company && (
                                        <Link href="/settings" className="btn btn-outline-primary btn-sm">
                                            <i className="fi-rr-settings me-2"></i>Manage Company
                                        </Link>
                                    )}
                                </div>
                                
                                {loading && (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading company information...</p>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="alert alert-warning mb-20">
                                        <div className="d-flex">
                                            <div className="me-3">
                                                <i className="fi-rr-exclamation text-warning" style={{ fontSize: '2rem' }}></i>
                                            </div>
                                            <div>
                                                <h5 className="alert-heading">Company Profile Required</h5>
                                                <p>{error}</p>
                                                <div className="mt-15">
                                                    <Link href="/apply-company" className="btn btn-primary">
                                                        <i className="fi-rr-briefcase me-2"></i>Create Company Profile
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {company && (
                                    <>
                                        {/* Company Summary Card */}
                                        <div className="company-card mb-30">
                                            <div className="card border-0 shadow-sm">
                                                <div className="card-body p-4">
                                                    <div className="row align-items-center">
                                                        <div className="col-lg-2 col-md-3 text-center mb-3 mb-md-0">
                                                            <div className="company-logo-wrapper rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2" style={{ width: '120px', height: '120px' }}>
                                                                <img 
                                                                    src={company.logo || "assets/imgs/page/dashboard/building.svg"} 
                                                                    alt={company.name}
                                                                    className="img-fluid"
                                                                    style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-9">
                                                            <h3 className="mt-0 mb-2">{company.name}</h3>
                                                            <div className="d-flex align-items-center mb-3 flex-wrap">
                                                                <span className={`badge me-3 ${
                                                                    company.status === 'Approved' ? 'bg-success' : 
                                                                    company.status === 'Pending' ? 'bg-warning' : 'bg-danger'
                                                                }`}>
                                                                    {company.status}
                                                                </span>
                                                                {company.category && (
                                                                    <span className="badge bg-light text-dark me-3">
                                                                        <i className="fi-rr-briefcase me-1"></i> {company.category}
                                                                    </span>
                                                                )}
                                                                {company.foundedYear && (
                                                                    <span className="badge bg-light text-dark">
                                                                        <i className="fi-rr-calendar me-1"></i> Est. {company.foundedYear}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="company-details">
                                                                <p className="mb-2">
                                                                    <i className="fi-rr-marker me-2 text-primary"></i> 
                                                                    {company.location || 'No location specified'}
                                                                </p>
                                                                <p className="mb-2">
                                                                    <i className="fi-rr-envelope me-2 text-primary"></i> 
                                                                    {company.email}
                                                                </p>
                                                                {company.website && (
                                                                    <p className="mb-2">
                                                                        <i className="fi-rr-globe me-2 text-primary"></i> 
                                                                        <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                                                                    </p>
                                                                )}
                                                                {company.phone && (
                                                                    <p className="mb-0">
                                                                        <i className="fi-rr-phone-call me-2 text-primary"></i> 
                                                                        {company.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-4 mt-4 mt-lg-0">
                                                            <div className="company-actions d-flex flex-column">
                                                                <Link href="/post-job" className="btn btn-primary mb-2">
                                                                    <i className="fi-rr-briefcase me-2"></i> Post New Job
                                                                </Link>
                                                                <Link href="/my-job-grid" className="btn btn-outline-primary mb-2">
                                                                    <i className="fi-rr-document-signed me-2"></i> Manage Jobs
                                                                </Link>
                                                                <Link href="/CampanyApplications" className="btn btn-outline-primary">
                                                                    <i className="fi-rr-users me-2"></i> View Applications
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Stats Cards */}
                                        <div className="row mb-30">
                                            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                                                <div className="card-style-1 hover-up h-100 shadow-sm">
                                                    <div className="card-image bg-primary d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '15px' }}> 
                                                        <img src="assets/imgs/page/dashboard/jobs-white.svg" alt="Total Jobs" width="30" />
                                                    </div>
                                                    <div className="card-info">
                                                        <div className="card-title">
                                                            <h4 className="mb-0 font-bold">{stats.totalJobs}</h4>
                                                            <p className="font-sm mb-0">Total Jobs</p>
                                                        </div>
                                                        <div className="text-end">
                                                            <Link href="/my-job-grid" className="btn btn-link text-primary p-0">
                                                                View All
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                                                <div className="card-style-1 hover-up h-100 shadow-sm">
                                                    <div className="card-image bg-success d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '15px' }}> 
                                                        <img src="assets/imgs/page/dashboard/check-white.svg" alt="Active Jobs" width="30" />
                                                    </div>
                                                    <div className="card-info">
                                                        <div className="card-title">
                                                            <h4 className="mb-0 font-bold">{stats.activeJobs}</h4>
                                                            <p className="font-sm mb-0">Active Jobs</p>
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="badge bg-light text-success">
                                                                {stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}% Active
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                                                <div className="card-style-1 hover-up h-100 shadow-sm">
                                                    <div className="card-image bg-warning d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '15px' }}> 
                                                        <img src="assets/imgs/page/dashboard/users-white.svg" alt="Applications" width="30" />
                                                    </div>
                                                    <div className="card-info">
                                                        <div className="card-title">
                                                            <h4 className="mb-0 font-bold">{stats.totalApplications}</h4>
                                                            <p className="font-sm mb-0">Total Applications</p>
                                                        </div>
                                                        <div className="text-end">
                                                            <Link href="/CampanyApplications" className="btn btn-link text-warning p-0">
                                                                Manage
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                                                <div className="card-style-1 hover-up h-100 shadow-sm">
                                                    <div className="card-image bg-info d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '15px' }}> 
                                                        <img src="assets/imgs/page/dashboard/bell-white.svg" alt="New Applications" width="30" />
                                                    </div>
                                                    <div className="card-info">
                                                        <div className="card-title">
                                                            <h4 className="mb-0 font-bold">{stats.newApplications}</h4>
                                                            <p className="font-sm mb-0">New Applications (7d)</p>
                                                        </div>
                                                        {stats.newApplications > 0 && (
                                                            <div className="text-end">
                                                                <span className="badge bg-light text-info">
                                                                    New
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Company About Section */}
                                        {company.description && (
                                            <div className="row mb-30">
                                                <div className="col-12">
                                                    <div className="card shadow-sm">
                                                        <div className="card-header bg-light">
                                                            <h6 className="mb-0">About {company.name}</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{company.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="col-xxl-8 col-xl-7 col-lg-7">
                    <div className="section-box">
                        <div className="row">
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/computer.svg" alt="jobBox" /></div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>1568<span className="font-sm status up">25<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">Interview Schedules</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/bank.svg" alt="jobBox" /></div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>284<span className="font-sm status up">5<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">Applied Jobs</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/lamp.svg" alt="jobBox" /></div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>136<span className="font-sm status up">12<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">Task Bids Won</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/headphone.svg" alt="jobBox" /></div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>985<span className="font-sm status up">5<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">Application Sent</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/look.svg" alt="jobBox" /></div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>165<span className="font-sm status up">15<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">Profile Viewed</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/open-file.svg" alt="jobBox" /></div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>2356<span className="font-sm status down">- 2%</span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">New Messages</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/doc.svg" alt="jobBox" />
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>254<span className="font-sm status up">2<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">Articles Added</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-4 col-sm-6">
                                <div className="card-style-1 hover-up">
                                    <div className="card-image"> <img src="assets/imgs/page/dashboard/man.svg" alt="jobBox" />
                                    </div>
                                    <div className="card-info">
                                        <div className="card-title">
                                            <h3>548<span className="font-sm status up">48<span>%</span></span>
                                            </h3>
                                        </div>
                                        <p className="color-text-paragraph-2">CV Added</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white">
                                <div className="panel-head">
                                    <h5>Vacancy Stats</h5>
                                    <Menu as="div">
                                        <Menu.Button as="a" className="menudrop" />
                                        <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                            <li><Link className="dropdown-item active" href="#">Add new</Link></li>
                                            <li><Link className="dropdown-item" href="#">Settings</Link></li>
                                            <li><Link className="dropdown-item" href="#">Actions</Link></li>
                                        </Menu.Items>
                                    </Menu>
                                </div>
                                <div className="panel-body">
                                    <VacancyChart />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white">
                                <div className="panel-head">
                                    <h5>Latest Jobs</h5>
                                    <Menu as="div">
                                        <Menu.Button as="a" className="menudrop" />
                                        <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                            <li><Link className="dropdown-item active" href="#">Add new</Link></li>
                                            <li><Link className="dropdown-item" href="#">Settings</Link></li>
                                            <li><Link className="dropdown-item" href="#">Actions</Link></li>
                                        </Menu.Items>
                                    </Menu>
                                </div>
                                <div className="panel-body">
                                    <div className="card-style-2 hover-up">
                                        <div className="card-head">
                                            <div className="card-image"> <img src="assets/imgs/page/dashboard/img1.png" alt="jobBox" /></div>
                                            <div className="card-title">
                                                <h6>Senior Full Stack Engineer, Creator Success</h6><span className="job-type">Full time</span><span className="time-post">3mins
                                                    ago</span><span className="location">New York, US</span>
                                            </div>
                                        </div>
                                        <div className="card-tags"> <a className="btn btn-tag">Figma</a><a className="btn btn-tag">Adobe XD</a>
                                        </div>
                                        <div className="card-price"><strong>$300</strong><span className="hour">/Hour</span>
                                        </div>
                                    </div>
                                    <div className="card-style-2 hover-up">
                                        <div className="card-head">
                                            <div className="card-image"> <img src="assets/imgs/page/dashboard/img2.png" alt="jobBox" /></div>
                                            <div className="card-title">
                                                <h6>Senior Full Stack Engineer, Creator Success</h6><span className="job-type">Full time</span><span className="time-post">3mins
                                                    ago</span><span className="location">Chicago, US</span>
                                            </div>
                                        </div>
                                        <div className="card-tags"> <a className="btn btn-tag">Figma</a><a className="btn btn-tag">Adobe XD</a><a className="btn btn-tag">PSD</a>
                                        </div>
                                        <div className="card-price"><strong>$650</strong><span className="hour">/Hour</span>
                                        </div>
                                    </div>
                                    <div className="card-style-2 hover-up">
                                        <div className="card-head">
                                            <div className="card-image"> <img src="assets/imgs/page/dashboard/img3.png" alt="jobBox" /></div>
                                            <div className="card-title">
                                                <h6>Lead Product/UX/UI Designer Role</h6><span className="job-type">Full
                                                    time</span><span className="time-post">3mins ago</span><span className="location">Paris, France</span>
                                            </div>
                                        </div>
                                        <div className="card-tags"> <a className="btn btn-tag">Figma</a><a className="btn btn-tag">Adobe XD</a><a className="btn btn-tag">PSD</a>
                                        </div>
                                        <div className="card-price"><strong>$1200</strong><span className="hour">/Hour</span>
                                        </div>
                                    </div>
                                    <div className="card-style-2 hover-up">
                                        <div className="card-head">
                                            <div className="card-image"> <img src="assets/imgs/page/dashboard/img4.png" alt="jobBox" /></div>
                                            <div className="card-title">
                                                <h6>Marketing Graphic Designer</h6><span className="job-type">Full
                                                    time</span><span className="time-post">3mins ago</span><span className="location">Tokyto, Japan</span>
                                            </div>
                                        </div>
                                        <div className="card-tags"> <a className="btn btn-tag">Figma</a><a className="btn btn-tag">Adobe XD</a><a className="btn btn-tag">PSD</a>
                                        </div>
                                        <div className="card-price"><strong>$580</strong><span className="hour">/Hour</span>
                                        </div>
                                    </div>
                                    <div className="card-style-2 hover-up">
                                        <div className="card-head">
                                            <div className="card-image"> <img src="assets/imgs/page/dashboard/img5.png" alt="jobBox" /></div>
                                            <div className="card-title">
                                                <h6>Director, Product Design - Creator</h6><span className="job-type">Full
                                                    time</span><span className="time-post">3mins ago</span><span className="location">Ha Noi, Vietnam</span>
                                            </div>
                                        </div>
                                        <div className="card-tags"> <a className="btn btn-tag">Figma</a><a className="btn btn-tag">Adobe XD</a><a className="btn btn-tag">PSD</a>
                                        </div>
                                        <div className="card-price"><strong>$1500</strong><span className="hour">/Hour</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xxl-4 col-xl-5 col-lg-5">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white">
                                <div className="panel-head">
                                    <h5>Top Candidates</h5>
                                    <Menu as="div">
                                        <Menu.Button as="a" className="menudrop" />
                                        <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                            <li><Link className="dropdown-item active" href="#">Add new</Link></li>
                                            <li><Link className="dropdown-item" href="#">Settings</Link></li>
                                            <li><Link className="dropdown-item" href="#">Actions</Link></li>
                                        </Menu.Items>
                                    </Menu>
                                </div>
                                <div className="panel-body">
                                    <div className="card-style-3 hover-up">
                                        <div className="card-image online"><img src="assets/imgs/page/dashboard/avata1.png" alt="jobBox" /></div>
                                        <div className="card-title">
                                            <h6>Robert Fox</h6><span className="job-position">UI/UX Designer</span>
                                        </div>
                                        <div className="card-location"> <span className="location">Chicago, US</span></div>
                                        <div className="card-rating"><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                            (65)</span></div>
                                    </div>
                                    <div className="card-style-3 hover-up">
                                        <div className="card-image online"><img src="assets/imgs/page/dashboard/avata2.png" alt="jobBox" /></div>
                                        <div className="card-title">
                                            <h6>Cody Fisher</h6><span className="job-position">Network Engineer</span>
                                        </div>
                                        <div className="card-location"> <span className="location">New York, US</span></div>
                                        <div className="card-rating"><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                            (65)</span></div>
                                    </div>
                                    <div className="card-style-3 hover-up">
                                        <div className="card-image online"><img src="assets/imgs/page/dashboard/avata3.png" alt="jobBox" /></div>
                                        <div className="card-title">
                                            <h6>Jane Cooper</h6><span className="job-position">Content Manager</span>
                                        </div>
                                        <div className="card-location"> <span className="location">Chicago, US</span></div>
                                        <div className="card-rating"><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                            (65)</span></div>
                                    </div>
                                    <div className="card-style-3 hover-up">
                                        <div className="card-image online"><img src="assets/imgs/page/dashboard/avata4.png" alt="jobBox" /></div>
                                        <div className="card-title">
                                            <h6>Jerome Bell</h6><span className="job-position">Frontend Developer</span>
                                        </div>
                                        <div className="card-location"> <span className="location">Chicago, US</span></div>
                                        <div className="card-rating"><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                            (65)</span></div>
                                    </div>
                                    <div className="card-style-3 hover-up">
                                        <div className="card-image online"><img src="assets/imgs/page/dashboard/avata5.png" alt="jobBox" /></div>
                                        <div className="card-title">
                                            <h6>Floyd Miles</h6><span className="job-position">NodeJS Dev</span>
                                        </div>
                                        <div className="card-location"> <span className="location">Chicago, US</span></div>
                                        <div className="card-rating"><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                            (65)</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white">
                                <div className="panel-head">
                                    <h5>Top Recruiters</h5>
                                    <Menu as="div">
                                        <Menu.Button as="a" className="menudrop" />
                                        <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                            <li><Link className="dropdown-item active" href="#">Add new</Link></li>
                                            <li><Link className="dropdown-item" href="#">Settings</Link></li>
                                            <li><Link className="dropdown-item" href="#">Actions</Link></li>
                                        </Menu.Items>
                                    </Menu>
                                </div>
                                <div className="panel-body">
                                    <div className="row">
                                        <div className="col-lg-6 col-md-6 pr-5 pl-5">
                                            <div className="card-style-4 hover-up">
                                                <div className="d-flex">
                                                    <div className="card-image"><img src="assets/imgs/page/dashboard/avata1.png" alt="jobBox" />
                                                    </div>
                                                    <div className="card-title">
                                                        <h6>Robert Fox</h6><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" />
                                                        <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                                            (65)</span>
                                                    </div>
                                                </div>
                                                <div className="card-location d-flex"><span className="location">Red,
                                                    CA</span><span className="jobs-number">25 Open Jobs</span></div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-6 pr-5 pl-5">
                                            <div className="card-style-4 hover-up">
                                                <div className="d-flex">
                                                    <div className="card-image"><img src="assets/imgs/page/dashboard/avata2.png" alt="jobBox" />
                                                    </div>
                                                    <div className="card-title">
                                                        <h6>Cody Fisher</h6><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" />
                                                        <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                                            (65)</span>
                                                    </div>
                                                </div>
                                                <div className="card-location d-flex"><span className="location">Chicago,
                                                    US</span><span className="jobs-number">25 Open Jobs</span></div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-6 pr-5 pl-5">
                                            <div className="card-style-4 hover-up">
                                                <div className="d-flex">
                                                    <div className="card-image"><img src="assets/imgs/page/dashboard/avata3.png" alt="jobBox" />
                                                    </div>
                                                    <div className="card-title">
                                                        <h6>Jane Cooper</h6><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" />
                                                        <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                                            (65)</span>
                                                    </div>
                                                </div>
                                                <div className="card-location d-flex"><span className="location">Austin,
                                                    TX</span><span className="jobs-number">25 Open Jobs</span></div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-6 pr-5 pl-5">
                                            <div className="card-style-4 hover-up">
                                                <div className="d-flex">
                                                    <div className="card-image"><img src="assets/imgs/page/dashboard/avata4.png" alt="jobBox" />
                                                    </div>
                                                    <div className="card-title">
                                                        <h6>Jerome Bell</h6><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" />
                                                        <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                                            (65)</span>
                                                    </div>
                                                </div>
                                                <div className="card-location d-flex"><span className="location">Remote</span><span className="jobs-number">25 Open
                                                    Jobs</span></div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-6 pr-5 pl-5">
                                            <div className="card-style-4 hover-up">
                                                <div className="d-flex">
                                                    <div className="card-image"><img src="assets/imgs/page/dashboard/avata5.png" alt="jobBox" />
                                                    </div>
                                                    <div className="card-title">
                                                        <h6>Floyd Miles</h6><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" />
                                                        <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                                            (65)</span>
                                                    </div>
                                                </div>
                                                <div className="card-location d-flex"><span className="location">Boston,
                                                    US</span><span className="jobs-number">25 Open Jobs</span></div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-6 pr-5 pl-5">
                                            <div className="card-style-4 hover-up">
                                                <div className="d-flex">
                                                    <div className="card-image"><img src="assets/imgs/page/dashboard/avata1.png" alt="jobBox" />
                                                    </div>
                                                    <div className="card-title">
                                                        <h6>Devon Lane</h6><img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star.svg" alt="jobBox" /> <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" />
                                                        <img src="assets/imgs/page/dashboard/star-none.svg" alt="jobBox" /> <span className="font-xs color-text-mutted">
                                                            (65)</span>
                                                    </div>
                                                </div>
                                                <div className="card-location d-flex"><span className="location">Chicago,
                                                    US</span><span className="jobs-number">25 Open Jobs</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white">
                                <div className="panel-head">
                                    <h5>Queries by search</h5>
                                    <Menu as="div">
                                        <Menu.Button as="a" className="menudrop" />
                                        <Menu.Items as="ul" className="dropdown-menu dropdown-menu-light dropdown-menu-end show" style={{ right: "0", left: "auto" }}>
                                            <li><Link className="dropdown-item active" href="#">Add new</Link></li>
                                            <li><Link className="dropdown-item" href="#">Settings</Link></li>
                                            <li><Link className="dropdown-item" href="#">Actions</Link></li>
                                        </Menu.Items>
                                    </Menu>
                                </div>
                                <div className="panel-body">
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">Developer</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">2635</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">UI/Ux Designer</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">1658</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '90%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">Marketing</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">1452</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '80%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">Content manager</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">1325</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '70%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">Ruby on rain</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">985</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '60%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">Human hunter</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">920</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '50%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style-5 hover-up">
                                        <div className="card-title">
                                            <h6 className="font-sm">Finance</h6>
                                        </div>
                                        <div className="card-progress">
                                            <div className="number font-sm">853</div>
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: '40%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-10">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white pt-30 pb-30 pl-15 pr-15">
                                <div className="box-swiper">
                                    <div className="swiper-container swiper-group-10">
                                        <BrandSlider />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    )
}

// Export with auth HOC
// Allow both HR and Candidate roles to access the dashboard
export default withAuth(Home, ['HR', 'candidate'])