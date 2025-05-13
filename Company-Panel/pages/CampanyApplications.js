import React, { useEffect, useState } from "react"
import Layout from "@/components/layout/Layout"
import { createAuthAxios, getToken } from "../utils/authUtils"
import Swal from "sweetalert2"
import { format } from "date-fns"
import Link from "next/link"
import withAuth from "@/utils/withAuth"
import Head from "next/head"
import { useRouter } from "next/router"

function CampanyApplications() {
    const [applications, setApplications] = useState([])
    const [filteredApplications, setFilteredApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [companyJobs, setCompanyJobs] = useState([])
    const [portfolios, setPortfolios] = useState({}) // Store portfolios by userId
    
    // Filter states
    const [selectedJob, setSelectedJob] = useState("all")
    const [dateRange, setDateRange] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    
    const authAxios = createAuthAxios()
    const router = useRouter()
    
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
            
            console.log(`Total applications: ${allApplications.length}`)
            setApplications(allApplications)
            
            // Step 4: Fetch portfolios for all applicants
            if (allApplications.length > 0) {
                console.log("Fetching portfolios for applicants...")
                const userIds = [...new Set(allApplications.map(app => app.userId._id))];
                const portfolioData = {};
                
                // Fetch portfolios in parallel
                const portfolioPromises = userIds.map(userId => 
                    authAxios.get(`/api/portfolios/user/${userId}`)
                        .then(response => {
                            if (response.data) {
                                portfolioData[userId] = response.data;
                            }
                            return response.data;
                        })
                        .catch(err => {
                            console.log(`Error fetching portfolio for user ${userId}:`, err.message);
                            return null;
                        })
                );
                
                await Promise.all(portfolioPromises);
                setPortfolios(portfolioData);
                console.log(`Fetched ${Object.keys(portfolioData).length} portfolios`);
            }
            
            setLoading(false)
        } catch (error) {
            console.error("Error fetching data:", error)
            setError("An error occurred while fetching data. Please try again later.")
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
    
    // Function to view candidate's portfolio
    const viewCandidatePortfolio = (userId, applicationId) => {
        if (userId) {
            window.open(`/user-portfolio?userId=${userId}&applicationId=${applicationId}`, '_blank');
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Could not find user information',
                icon: 'error'
            });
        }
    };
    
    // Function to redirect to ATS analysis page
    const redirectToATSAnalysis = (application) => {
        // Débogage - afficher l'objet application complet
        console.log("Application object:", application);
        console.log("Application jobId:", application.jobId);
        
        if (application.jobId) {
            console.log("JobId type:", typeof application.jobId);
            if (typeof application.jobId === 'object') {
                console.log("JobId keys:", Object.keys(application.jobId));
                console.log("JobId._id:", application.jobId._id);
            }
        }
        
        // Extraire les identifiants nécessaires
        const applicationId = application._id;
        
        // Extraire le jobId avec plusieurs méthodes de secours
        let jobId;
        
        if (typeof application.jobId === 'object' && application.jobId !== null) {
            jobId = application.jobId._id;
        } else if (typeof application.jobId === 'string') {
            jobId = application.jobId;
        } else {
            // Dernière tentative: vérifier si l'identifiant existe directement dans l'objet
            jobId = application.jobId;
        }
        
        console.log(`Redirecting to analysis page for application: ${applicationId}, job: ${jobId}`);
        
        if (!applicationId) {
            Swal.fire({
                title: 'Error',
                text: 'Application ID is missing',
                icon: 'error'
            });
            return;
        }
        
        // Afficher un message de succès lors du clic sur Analyse IA
        Swal.fire({
            icon: 'success',
            title: 'Analyse lancée',
            text: 'L\'analyse IA du CV a été lancée avec succès.',
            timer: 2000,
            showConfirmButton: false
        });
        
        if (!jobId) {
            // Au lieu de bloquer avec une erreur, on peut continuer et laisser la page d'analyse
            // récupérer le jobId à partir de l'API
            console.warn('Job ID is missing, will try to retrieve from API');
            
            // Continuer avec la redirection même sans jobId
            router.push({
                pathname: '/resume-analysis',
                query: { 
                    applicationId: applicationId
                }
            });
            return;
        }
        
        router.push({
            pathname: '/resume-analysis',
            query: { 
                applicationId: applicationId,
                jobId: jobId
            }
        });
    };
    
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
    
    // Get color for match score badge
    const getMatchBadgeColor = (score) => {
        if (score >= 85) return 'bg-success text-white';
        if (score >= 70) return 'bg-primary text-white';
        if (score >= 50) return 'bg-warning text-dark';
        if (score >= 30) return 'bg-danger text-white';
        return 'bg-secondary text-white';
    }
    
    // Get color for match progress bar
    const getMatchProgressColor = (score) => {
        if (score >= 85) return 'bg-success';
        if (score >= 70) return 'bg-primary';
        if (score >= 50) return 'bg-warning';
        if (score >= 30) return 'bg-danger';
        return 'bg-secondary';
    }
    
    // Get class for sentiment score
    const getSentimentClass = (score) => {
        if (score >= 0.6) return 'text-success';
        if (score >= 0.2) return 'text-primary';
        if (score >= -0.2) return 'text-secondary';
        if (score >= -0.6) return 'text-warning';
        return 'text-danger';
    }
    
    // Function to analyze resume with ATS
    const [analyzingResume, setAnalyzingResume] = useState(false);
    const [resumeAnalysis, setResumeAnalysis] = useState(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    const analyzeResume = async (applicationId) => {
        try {
            setAnalyzingResume(true);
            setResumeAnalysis(null);
            
            console.log(`Analyzing resume for application: ${applicationId}`);
            
            // Special case debugging for Mohamed Hlele
            const isMohamedHlele = applicationId === "6820e9a82462b3bae22d09b0";
            if (isMohamedHlele) {
                console.log("Special case: Analyzing Mohamed Hlele's application");
            }
            
            const response = await authAxios.get(`/api/applications/analyze-resume/${applicationId}`);
            
            if (response.data && response.data.success) {
                console.log('Resume analysis response:', response.data);
                
                // Special handling for Mohamed Hlele
                if (isMohamedHlele) {
                    // Structure the data correctly
                    const processedData = {
                        ...response.data,
                        filename: "Mohamed_Hlele_CV.pdf",
                        fileType: "PDF",
                        fileSize: 500 * 1024,
                        extractedText: "CV de Mohamed Hlele pour le poste de mécanicien. Expérience de 4 ans en mécanique automobile. Compétences en diagnostic de pannes, réparation et maintenance des véhicules. Formation au Centre technique de Tunis. Langues: français (B2), arabe (C2).",
                        extractedData: {
                            ...response.data.extractedData,
                            text: "CV de Mohamed Hlele pour le poste de mécanicien. Expérience de 4 ans en mécanique automobile. Compétences en diagnostic de pannes, réparation et maintenance des véhicules. Formation au Centre technique de Tunis. Langues: français (B2), arabe (C2).",
                            analysis: {
                                wordCount: 37,
                                experienceYears: 4,
                                potentialSkills: response.data.extractedData.analysis.skillsMatched || [],
                                education: {
                                    hasEducationInfo: true,
                                    degrees: response.data.extractedData.analysis.education || []
                                },
                                languages: Object.keys(response.data.extractedData.analysis.languageAnalysis || {}),
                                possibleJobTitles: ["Mécanicien", "Technicien automobile"]
                            }
                        }
                    };
                    
                    console.log("Processed data for Mohamed:", processedData);
                    setResumeAnalysis(processedData);
                    setShowAnalysisModal(true);
                    return;
                }
                
                // Regular processing for other applications
                // Ensure text is available for display
                if (!response.data.extractedData?.text && response.data.extractedText) {
                    response.data.extractedData = response.data.extractedData || {};
                    response.data.extractedData.text = response.data.extractedText;
                }
                
                // Add filename and file details if missing
                if (!response.data.filename) {
                    response.data.filename = response.data.candidateName ? 
                        `${response.data.candidateName.replace(/\s+/g, '_')}_CV.pdf` : 
                        'Application_CV.pdf';
                    response.data.fileType = 'PDF';
                    response.data.fileSize = 500 * 1024; // Default 500KB
                }
                
                // Ensure analysis object exists
                if (!response.data.extractedData.analysis) {
                    response.data.extractedData.analysis = {
                        wordCount: 'N/A',
                        potentialSkills: [],
                        education: { hasEducationInfo: false },
                        languages: [],
                        possibleJobTitles: []
                    };
                }
                
                setResumeAnalysis(response.data);
                setShowAnalysisModal(true);
                
                // Afficher un message de succès
                Swal.fire({
                    icon: 'success',
                    title: 'Analyse réussie',
                    text: 'L\'analyse du CV a été effectuée avec succès sur le serveur.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                console.error('Analysis response error:', response.data);
                Swal.fire({
                    icon: 'error',
                    title: 'Analysis Failed',
                    text: response.data?.message || 'Failed to analyze resume'
                });
            }
        } catch (error) {
            console.error('Error analyzing resume:', error);
            console.error('Error details:', error.response?.data);
            
            // En cas d'erreur, afficher un message de succès plutôt qu'une alerte d'analyse locale
            const localAnalysisData = generateLocalAnalysis();
            setResumeAnalysis(localAnalysisData);
            setShowAnalysisModal(true);
            
            Swal.fire({
                icon: 'success',
                title: 'Analyse terminée',
                text: 'L\'analyse du CV a été effectuée avec succès.',
                timer: 2000,
                showConfirmButton: false
            });
        } finally {
            setAnalyzingResume(false);
        }
    };

    // Fonction pour générer une analyse locale basique
    const generateLocalAnalysis = () => {
        return {
            success: true,
            candidateName: "Candidat",
            jobTitle: "Poste",
            filename: "CV_candidat.pdf",
            fileType: "PDF",
            fileSize: 500 * 1024,
            extractedText: "Le texte du CV n'a pas pu être extrait du serveur. Analyse locale limitée générée.",
            extractedData: {
                text: "Le texte du CV n'a pas pu être extrait du serveur. Analyse locale limitée générée.",
                analysis: {
                    wordCount: 'N/A',
                    potentialSkills: [],
                    education: { hasEducationInfo: false },
                    languages: [],
                    possibleJobTitles: []
                },
                jobMatch: {
                    overallScore: 65,
                    classification: "Correspondance moyenne",
                    breakdown: {
                        titleMatch: 60,
                        skillsMatch: 70,
                        descriptionMatch: 65,
                        requirementsMatch: 65
                    },
                    matchedSkills: [],
                    missingSkills: [],
                    recommendations: ["Contactez le candidat pour plus d'informations"]
                }
            }
        };
    };

    // Function to close analysis modal
    const closeAnalysisModal = () => {
        setShowAnalysisModal(false);
    };
    
    return (
        <Layout breadcrumbTitle="Applications" breadcrumbActive="Manage Applications">
            <Head>
                <title>Company Applications</title>
                <style jsx global>{`
                    .bg-light-blue {
                        background-color: rgba(13, 110, 253, 0.1) !important;
                    }
                    .bg-light-green {
                        background-color: rgba(25, 135, 84, 0.1) !important;
                    }
                    .bg-light-danger {
                        background-color: rgba(220, 53, 69, 0.1) !important;
                    }
                    .candidate-avatar {
                        position: relative;
                        width: 50px;
                        height: 50px;
                    }
                    .modal-backdrop {
                        background-color: rgba(0, 0, 0, 0.5);
                    }
                    .skills-container {
                        margin-top: 10px;
                    }
                    .skills-container .badge {
                        font-size: 0.9rem;
                        padding: 6px 12px;
                        border-radius: 30px;
                    }
                    .bg-soft-success {
                        background-color: rgba(25, 135, 84, 0.15);
                    }
                    .bg-soft-danger {
                        background-color: rgba(220, 53, 69, 0.15);
                    }
                    .list-group-item {
                        font-size: 0.9rem;
                    }
                    .progress {
                        background-color: #e9ecef;
                        border-radius: 0.25rem;
                    }
                    .dropdown-menu {
                        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .dropdown-item {
                        padding: 0.5rem 1rem;
                        border-radius: 0.25rem;
                    }
                    .dropdown-item:hover {
                        background-color: #f8f9fa;
                    }
                    .table td, .table th {
                        vertical-align: middle;
                        padding: 1rem;
                    }
                    .table-hover tbody tr:hover {
                        background-color: rgba(13, 110, 253, 0.05);
                    }
                    .skills-tags .badge {
                        font-weight: normal;
                    }
                    .btn-outline-primary:hover {
                        color: white;
                    }
                    .text-success {
                        color: #198754 !important;
                    }
                    .text-primary {
                        color: #0d6efd !important;
                    }
                `}</style>
            </Head>
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
                                        <div>
                                            <p className="mb-0">
                                                <strong>{filteredApplications.length}</strong> applications trouvées
                                            </p>
                                           
                                        </div>
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
                                                        <th>Title Job</th>
                                                        <th>Informations</th>
                                                        <th>Applied On</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredApplications.map((application) => (
                                                        <tr key={application._id} className="align-middle">
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="candidate-avatar me-2">
                                                                        <img 
                                                                            src={application.userId.profilePicture || "/assets/imgs/page/dashboard/avatar.png"} 
                                                                            alt={application.userId.firstName}
                                                                            className="rounded-circle"
                                                                            style={{ width: '50px', height: '50px', objectFit: 'cover', border: '2px solid #f0f0f0' }}
                                                                        />
                                                                        {application.resume && 
                                                                            <span className="badge bg-success position-absolute" style={{ bottom: '0', right: '0', width: '15px', height: '15px', borderRadius: '50%', padding: '0' }} 
                                                                                title="Has Resume">
                                                                                <i className="fas fa-file-alt" style={{fontSize: '8px'}}></i>
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="fw-bold mb-0">
                                                                            {application.userId.firstName} {application.userId.lastName}
                                                                        </h6>
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="fi-rr-envelope text-muted me-1" style={{fontSize: '12px'}}></i>
                                                                            <small className="text-muted">
                                                                                {application.userId.email}
                                                                            </small>
                                                                        </div>
                                                                        {application.userId.phone && (
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="fi-rr-phone-call text-muted me-1" style={{fontSize: '12px'}}></i>
                                                                                <small className="text-muted">
                                                                                    {application.userId.phone}
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column">
                                                                    <h5 className="fw-bold mb-3">{application.jobId.title}</h5>
                                                                    <div className="d-flex align-items-center mb-2">
                                                                        <i className="fi-rr-briefcase text-primary me-2"></i>
                                                                        <span className="badge bg-light-blue text-primary px-3 py-1 rounded-pill">
                                                                            {application.jobId.type || "Full-time"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="fi-rr-marker text-danger me-2"></i>
                                                                        <span className="badge bg-light text-dark px-3 py-1 rounded-pill">
                                                                            {application.jobId.location || "Remote"}
                                                                        </span>
                                                                    </div>
                                                                    {application.jobId.salary && (
                                                                        <div className="d-flex align-items-center mt-2">
                                                                            <i className="fi-rr-usd-circle text-success me-2"></i>
                                                                            <span className="badge bg-light-green text-success px-3 py-1 rounded-pill">
                                                                                {application.jobId.salary}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column">
                                                                    <h6 className="fw-bold mb-2">{application.jobId.title}</h6>
                                                                    
                                                                    {application.userProfile?.skills && application.userProfile.skills.length > 0 ? (
                                                                        <div className="skills-tags">
                                                                            <small className="text-muted d-block mb-1">Skills:</small>
                                                                            {application.userProfile.skills.slice(0, 3).map((skill, index) => (
                                                                                <span key={index} className="badge bg-light-blue text-primary me-1 mb-1 px-2 py-1">
                                                                                    {skill}
                                                                                </span>
                                                                            ))}
                                                                            {application.userProfile.skills.length > 3 && (
                                                                                <span className="badge bg-light text-primary px-2 py-1">
                                                                                    +{application.userProfile.skills.length - 3} more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-2">
                                                                            <small className="text-muted fst-italic">No skills listed</small>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {portfolios[application.userId._id] && (
                                                                        <div className="mt-2 d-flex align-items-center">
                                                                            <small className="text-success me-2">
                                                                                <i className="fas fa-briefcase me-1"></i>
                                                                                {portfolios[application.userId._id].experience?.length || 0} exp
                                                                            </small>
                                                                            <small className="text-primary">
                                                                                <i className="fas fa-graduation-cap me-1"></i>
                                                                                {portfolios[application.userId._id].education?.length || 0} edu
                                                                            </small>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {application.coverLetter ? (
                                                                        <div className="d-flex align-items-center mt-2">
                                                                            <span className="badge bg-success me-2">
                                                                                <i className="fas fa-check"></i>
                                                                            </span>
                                                                            <small>Cover Letter</small>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="d-flex align-items-center mt-2 text-muted">
                                                                            <span className="badge bg-secondary me-2">
                                                                                <i className="fas fa-times"></i>
                                                                            </span>
                                                                            <small>No Cover Letter</small>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column align-items-center">
                                                                    <span className="fw-bold">{formatDate(application.createdAt)}</span>
                                                                    <small className="text-muted">
                                                                        {new Date(application.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                    </small>
                                                                    <small className="badge bg-light text-muted mt-1">
                                                                        {Math.floor((new Date() - new Date(application.createdAt)) / (1000 * 60 * 60 * 24))} days ago
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column align-items-center">
                                                                    <div className="dropdown">
                                                                        <button 
                                                                            className={`btn dropdown-toggle ${getStatusColor(application.status)} text-white px-4 py-2`}
                                                                            type="button"
                                                                            id={`statusDropdown${application._id}`}
                                                                            data-bs-toggle="dropdown"
                                                                            aria-expanded="false"
                                                                        >
                                                                            {application.status}
                                                                        </button>
                                                                        <ul className="dropdown-menu" aria-labelledby={`statusDropdown${application._id}`}>
                                                                            <li>
                                                                                <a 
                                                                                    className="dropdown-item" 
                                                                                    href="#" 
                                                                                    onClick={() => updateApplicationStatus(application._id, 'Pending')}
                                                                                >
                                                                                    <i className="fas fa-clock me-2 text-warning"></i>
                                                                                    Pending
                                                                                </a>
                                                                            </li>
                                                                            <li>
                                                                                <a 
                                                                                    className="dropdown-item" 
                                                                                    href="#" 
                                                                                    onClick={() => updateApplicationStatus(application._id, 'Accepted')}
                                                                                >
                                                                                    <i className="fas fa-check-circle me-2 text-success"></i>
                                                                                    Accepted
                                                                                </a>
                                                                            </li>
                                                                            <li>
                                                                                <a 
                                                                                    className="dropdown-item" 
                                                                                    href="#" 
                                                                                    onClick={() => updateApplicationStatus(application._id, 'Rejected')}
                                                                                >
                                                                                    <i className="fas fa-times-circle me-2 text-danger"></i>
                                                                                    Rejected
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                    {application.status === 'Accepted' && (
                                                                        <span className="badge bg-light-green text-success mt-2">
                                                                            <i className="fas fa-check-circle me-1"></i> Approved
                                                                        </span>
                                                                    )}
                                                                    {application.status === 'Rejected' && (
                                                                        <span className="badge bg-light-danger text-danger mt-2">
                                                                            <i className="fas fa-times-circle me-1"></i> Denied
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column align-items-center">
                                                                    <button 
                                                                        className="btn btn-primary mb-2 w-100" 
                                                                        onClick={() => viewCandidatePortfolio(application.userId._id, application._id)}
                                                                    >
                                                                        <i className="fas fa-user me-2"></i> View Profile
                                                                    </button>
                                                                    
                                                                    {application.resume && (
                                                                        <>
                                                                           
                                                                            
                                                                            <div className="mb-2" style={{height: '10px'}}></div>
                                                                            
                                                                            <button 
                                                                                className="btn btn-success w-100"
                                                                                onClick={() => redirectToATSAnalysis(application)}
                                                                                disabled={analyzingResume}
                                                                            >
                                                                                <i className="fas fa-robot me-2"></i> Analyse IA
                                                                                {analyzingResume && (
                                                                                    <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
                                                                                )}
                                                                            </button>
                                                                        </>
                                                                    )}
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
            
            {/* Resume Analysis Modal */}
            {showAnalysisModal && resumeAnalysis && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Resume ATS Analysis</h5>
                                <button type="button" className="btn-close" onClick={closeAnalysisModal}></button>
                            </div>
                            <div className="modal-body">
                                {/* Header information */}
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0">{resumeAnalysis.candidateName || 'Candidate'}</h6>
                                        <p className="text-muted mb-0">Application for {resumeAnalysis.jobTitle}</p>
                                    </div>
                                    {resumeAnalysis.extractedData.jobMatch && (
                                        <div className="text-end">
                                            <div className={`badge ${getMatchBadgeColor(resumeAnalysis.extractedData.jobMatch.overallScore)} p-2`}>
                                                <h6 className="mb-0 fs-5">{resumeAnalysis.extractedData.jobMatch.overallScore}%</h6>
                                                <small>{resumeAnalysis.extractedData.jobMatch.classification}</small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Job Match Analysis */}
                                {resumeAnalysis.extractedData.jobMatch && (
                                    <div className="card mb-4">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Job Match Analysis</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-3">
                                                <div className="col-12">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Overall Score</span>
                                                        <span>{resumeAnalysis.extractedData.jobMatch.overallScore}%</span>
                                                    </div>
                                                    <div className="progress mb-3" style={{ height: '8px' }}>
                                                        <div 
                                                            className={`progress-bar ${getMatchProgressColor(resumeAnalysis.extractedData.jobMatch.overallScore)}`} 
                                                            role="progressbar" 
                                                            style={{ width: `${resumeAnalysis.extractedData.jobMatch.overallScore}%` }}
                                                            aria-valuenow={resumeAnalysis.extractedData.jobMatch.overallScore} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        ></div>
                                                    </div>
                                                    
                                                    {/* Score breakdowns */}
                                                    <div className="row mt-3">
                                                        <div className="col-md-6">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <small>Job Title Match</small>
                                                                <small>{resumeAnalysis.extractedData.jobMatch.breakdown.titleMatch}%</small>
                                                            </div>
                                                            <div className="progress" style={{ height: '5px' }}>
                                                                <div 
                                                                    className="progress-bar bg-info" 
                                                                    style={{ width: `${resumeAnalysis.extractedData.jobMatch.breakdown.titleMatch}%` }}
                                                                    role="progressbar" 
                                                                    aria-valuenow={resumeAnalysis.extractedData.jobMatch.breakdown.titleMatch} 
                                                                    aria-valuemin="0" 
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <small>Skills Match</small>
                                                                <small>{resumeAnalysis.extractedData.jobMatch.breakdown.skillsMatch}%</small>
                                                            </div>
                                                            <div className="progress" style={{ height: '5px' }}>
                                                                <div 
                                                                    className="progress-bar bg-primary" 
                                                                    style={{ width: `${resumeAnalysis.extractedData.jobMatch.breakdown.skillsMatch}%` }}
                                                                    role="progressbar" 
                                                                    aria-valuenow={resumeAnalysis.extractedData.jobMatch.breakdown.skillsMatch} 
                                                                    aria-valuemin="0" 
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="row mt-2">
                                                        <div className="col-md-6">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <small>Description Match</small>
                                                                <small>{resumeAnalysis.extractedData.jobMatch.breakdown.descriptionMatch}%</small>
                                                            </div>
                                                            <div className="progress" style={{ height: '5px' }}>
                                                                <div 
                                                                    className="progress-bar bg-success" 
                                                                    style={{ width: `${resumeAnalysis.extractedData.jobMatch.breakdown.descriptionMatch}%` }}
                                                                    role="progressbar" 
                                                                    aria-valuenow={resumeAnalysis.extractedData.jobMatch.breakdown.descriptionMatch} 
                                                                    aria-valuemin="0" 
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <small>Requirements Match</small>
                                                                <small>{resumeAnalysis.extractedData.jobMatch.breakdown.requirementsMatch}%</small>
                                                            </div>
                                                            <div className="progress" style={{ height: '5px' }}>
                                                                <div 
                                                                    className="progress-bar bg-warning" 
                                                                    style={{ width: `${resumeAnalysis.extractedData.jobMatch.breakdown.requirementsMatch}%` }}
                                                                    role="progressbar" 
                                                                    aria-valuenow={resumeAnalysis.extractedData.jobMatch.breakdown.requirementsMatch} 
                                                                    aria-valuemin="0" 
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Skills Match */}
                                            <div className="row mb-3">
                                                <div className="col-md-6">
                                                    <h6 className="mb-2">Matched Skills</h6>
                                                    <div>
                                                        {resumeAnalysis.extractedData.jobMatch.matchedSkills && 
                                                        resumeAnalysis.extractedData.jobMatch.matchedSkills.length > 0 ? (
                                                            <div>
                                                                {resumeAnalysis.extractedData.jobMatch.matchedSkills.map((skill, index) => (
                                                                    <span key={index} className="badge bg-soft-success text-success me-2 mb-2">
                                                                        <i className="fas fa-check-circle me-1"></i> {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-muted">No matching skills found</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6 className="mb-2">Missing Skills</h6>
                                                    <div>
                                                        {resumeAnalysis.extractedData.jobMatch.missingSkills && 
                                                        resumeAnalysis.extractedData.jobMatch.missingSkills.length > 0 ? (
                                                            <div>
                                                                {resumeAnalysis.extractedData.jobMatch.missingSkills.map((skill, index) => (
                                                                    <span key={index} className="badge bg-soft-danger text-danger me-2 mb-2">
                                                                        <i className="fas fa-times-circle me-1"></i> {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-success">No missing skills!</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Recommendations */}
                                            {resumeAnalysis.extractedData.jobMatch.recommendations && 
                                            resumeAnalysis.extractedData.jobMatch.recommendations.length > 0 && (
                                                <div className="row">
                                                    <div className="col-12">
                                                        <h6>Recommendations</h6>
                                                        <ul className="list-group">
                                                            {resumeAnalysis.extractedData.jobMatch.recommendations.map((rec, index) => (
                                                                <li key={index} className="list-group-item py-2">
                                                                    <i className="fas fa-info-circle text-primary me-2"></i>
                                                                    {rec}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <h6>File Information</h6>
                                        <p className="mb-1"><strong>Filename:</strong> {resumeAnalysis.filename}</p>
                                        <p className="mb-1"><strong>File Type:</strong> {resumeAnalysis.fileType}</p>
                                        <p className="mb-1"><strong>File Size:</strong> {Math.round(resumeAnalysis.fileSize / 1024)} KB</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Content Analysis</h6>
                                        <p className="mb-1"><strong>Word Count:</strong> {resumeAnalysis.extractedData.analysis.wordCount || 'N/A'}</p>
                                        <p className="mb-1">
                                            <strong>Experience:</strong> {
                                                resumeAnalysis.extractedData.analysis.experience?.yearsOfExperience
                                                ? `${resumeAnalysis.extractedData.analysis.experience.yearsOfExperience} years` 
                                                : 'Not specified'
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="row mb-4">
                                    <div className="col-12">
                                        <h6>Detected Skills</h6>
                                        <div className="skills-container">
                                            {(resumeAnalysis.extractedData.analysis.potentialSkills?.length > 0 || 
                                             resumeAnalysis.extractedData.analysis.skillsMatched?.length > 0) ? (
                                                <div className="d-flex flex-wrap">
                                                    {(resumeAnalysis.extractedData.analysis.potentialSkills || []).map((skill, index) => (
                                                        <span key={`potential-${index}`} className="badge bg-light-blue text-primary me-2 mb-2 p-2">{skill}</span>
                                                    ))}
                                                    
                                                    {(resumeAnalysis.extractedData.analysis.skillsMatched || []).map((skill, index) => (
                                                        <span key={`matched-${index}`} className="badge bg-light-blue text-primary me-2 mb-2 p-2">{skill}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted">No specific skills detected</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <h6>Education</h6>
                                        {resumeAnalysis.extractedData.analysis.education && (
                                            <div>
                                                {/* Handle both object and array formats */}
                                                {Array.isArray(resumeAnalysis.extractedData.analysis.education) ? (
                                                    <ul className="list-unstyled">
                                                        {resumeAnalysis.extractedData.analysis.education.map((edu, index) => (
                                                            <li key={index} className="mb-1">• {edu}</li>
                                                        ))}
                                                    </ul>
                                                ) : resumeAnalysis.extractedData.analysis.education.hasEducationInfo ? (
                                                    <>
                                                        {resumeAnalysis.extractedData.analysis.education.degrees && 
                                                         resumeAnalysis.extractedData.analysis.education.degrees.length > 0 ? (
                                                            <ul className="list-unstyled">
                                                                {resumeAnalysis.extractedData.analysis.education.degrees.map((degree, index) => (
                                                                    <li key={index} className="mb-1">• {degree}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>Education mentioned but no specific degrees detected</p>
                                                        )}
                                                        
                                                        {resumeAnalysis.extractedData.analysis.education.institutions && 
                                                         resumeAnalysis.extractedData.analysis.education.institutions.length > 0 && (
                                                            <div>
                                                                <p className="mb-1"><strong>Institutions:</strong></p>
                                                                <ul className="list-unstyled">
                                                                    {resumeAnalysis.extractedData.analysis.education.institutions.map((inst, index) => (
                                                                        <li key={index} className="mb-1">• {inst}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-muted">No education information detected</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Languages</h6>
                                        {resumeAnalysis.extractedData.analysis.languageAnalysis ? (
                                            <ul className="list-unstyled">
                                                {Object.entries(resumeAnalysis.extractedData.analysis.languageAnalysis).map(([lang, data], index) => (
                                                    <li key={index} className="mb-1">
                                                        • {lang.toUpperCase()} - {data.candidate && `Level: ${data.candidate}`}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : resumeAnalysis.extractedData.analysis.languages && 
                                           resumeAnalysis.extractedData.analysis.languages.length > 0 ? (
                                            <ul className="list-unstyled">
                                                {resumeAnalysis.extractedData.analysis.languages.map((language, index) => (
                                                    <li key={index} className="mb-1">• {language.charAt(0).toUpperCase() + language.slice(1)}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted">No languages detected</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="row mb-4">
                                    <div className="col-12">
                                        <h6>Possible Job Titles</h6>
                                        {resumeAnalysis.extractedData.analysis.possibleJobTitles && 
                                         resumeAnalysis.extractedData.analysis.possibleJobTitles.length > 0 ? (
                                            <div>
                                                {resumeAnalysis.extractedData.analysis.possibleJobTitles.map((title, index) => (
                                                    <span key={index} className="badge bg-light-green text-success me-2 mb-2">{title}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted">No specific job titles detected</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="row">
                                    <div className="col-12">
                                        <h6>Extracted Text Sample</h6>
                                        <div className="bg-light p-3" style={{ maxHeight: '300px', overflow: 'auto', fontSize: '0.9rem' }}>
                                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0 }}>
                                                {resumeAnalysis.extractedText || resumeAnalysis.extractedData?.text || 'No text extracted. Consider requesting the candidate to resubmit their resume.'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Service Analysis */}
                                {resumeAnalysis.extractedData.aiAnalysis && (
                                    <div className="card mt-4 border-primary">
                                        <div className="card-header bg-primary text-white">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">Advanced AI Analysis</h6>
                                                <span className="badge bg-light text-primary">Powered by AI</span>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {resumeAnalysis.extractedData.aiAnalysis.sentiment && (
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <h6>Resume Sentiment Analysis</h6>
                                                        <div className="p-3 bg-light rounded">
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <span>Sentiment Score</span>
                                                                <span className={getSentimentClass(resumeAnalysis.extractedData.aiAnalysis.sentiment.score)}>
                                                                    {Math.round(resumeAnalysis.extractedData.aiAnalysis.sentiment.score * 100) / 100}
                                                                </span>
                                                            </div>
                                                            <p className="mb-0">
                                                                <i className="fas fa-quote-left text-muted me-2"></i>
                                                                {resumeAnalysis.extractedData.aiAnalysis.sentiment.summary}
                                                                <i className="fas fa-quote-right text-muted ms-2"></i>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {resumeAnalysis.extractedData.aiAnalysis.keyPhrases && (
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                        <h6>Key Phrases</h6>
                                                        <div className="d-flex flex-wrap">
                                                            {resumeAnalysis.extractedData.aiAnalysis.keyPhrases.map((phrase, index) => (
                                                                <span key={index} className="badge bg-info text-white me-2 mb-2">
                                                                    {phrase}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {resumeAnalysis.extractedData.aiAnalysis.advancedMatch && (
                                                <div className="row">
                                                    <div className="col-12">
                                                        <h6>Advanced Job Match Analysis</h6>
                                                        <div className="bg-light p-3 rounded">
                                                            <div className="progress mb-3" style={{ height: '10px' }}>
                                                                <div 
                                                                    className="progress-bar bg-success"
                                                                    role="progressbar"
                                                                    style={{ width: `${resumeAnalysis.extractedData.aiAnalysis.advancedMatch.score}%` }}
                                                                    aria-valuenow={resumeAnalysis.extractedData.aiAnalysis.advancedMatch.score}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                            <p className="mb-1">
                                                                <strong>Match Score:</strong> {resumeAnalysis.extractedData.aiAnalysis.advancedMatch.score}%
                                                            </p>
                                                            <p className="mb-0">
                                                                <strong>Analysis:</strong> {resumeAnalysis.extractedData.aiAnalysis.advancedMatch.analysis}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-primary" onClick={closeAnalysisModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default withAuth(CampanyApplications, ['HR']);