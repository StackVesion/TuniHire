import Link from "next/link";
import Layout from "../components/Layout/Layout";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "react-toastify";
import Head from "next/head";

// Helper function to ensure paths start with / for client-side rendering
const ensurePath = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (!path.startsWith('/')) return `/${path}`;
    return path;
};

export default function CandidateDetails() {
    const [activeIndex, setActiveIndex] = useState(1);
    const [candidate, setCandidate] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        // Only fetch data if ID is available and the component is mounted
        if (id) {
            fetchCandidateDetails();
        }
    }, [id]);

    const fetchCandidateDetails = async () => {
        if (!id) return; // Exit if no ID is available
        
        try {
            setLoading(true);
            setError(null);
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            
            // Get token only on client-side
            let token = null;
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('token');
            }
            
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // First try to get authenticated user details
            try {
                console.log(`Fetching authenticated user details for ID: ${id}`);
                const response = await axios.get(`${apiUrl}/api/users/user-details/${id}`, { 
                    headers,
                    validateStatus: function (status) {
                        return status < 500; // Don't throw for any status < 500
                    }
                });
                
                if (response.status === 200 && response.data) {
                    console.log("Successfully fetched authenticated user details");
                    setCandidate(response.data);
                } else if (response.status === 401) {
                    console.warn("Authentication required, trying public profile endpoint");
                    
                    // Try the public profile endpoint as fallback
                    try {
                        // The correct endpoint from your routes is /:id/public-profile
                        const publicResponse = await axios.get(`${apiUrl}/api/users/${id}/public-profile`);
                        
                        if (publicResponse.data) {
                            console.log("Successfully fetched public profile");
                            setCandidate(publicResponse.data);
                        } else {
                            throw new Error("Empty response from public profile endpoint");
                        }
                    } catch (publicError) {
                        console.error("Error fetching public profile:", publicError);
                        
                        // Since we couldn't get public profile data, try another fallback
                        try {
                            // Many APIs use this format instead
                            const alternativeResponse = await axios.get(`${apiUrl}/api/users/public-profile/${id}`);
                            if (alternativeResponse.data) {
                                setCandidate(alternativeResponse.data);
                            } else {
                                setError("Failed to load candidate details");
                                toast.error("Could not load candidate details");
                            }
                        } catch (altError) {
                            console.error("Alternative endpoint also failed:", altError);
                            setError("Failed to load candidate details");
                            toast.error("Could not load candidate details");
                        }
                    }
                } else {
                    setError("Failed to load candidate details");
                    toast.error("Could not load candidate details");
                }
            } catch (userError) {
                console.error("Error fetching user details:", userError);
                setError("Failed to load candidate details");
                toast.error("Error loading candidate data");
                setLoading(false);
                return;
            }
            
            // Only try to fetch portfolio if we have a candidate
            if (candidate || id) {
                try {
                    console.log("Fetching portfolio data");
                    const portfolioResponse = await axios.get(`${apiUrl}/api/portfolios/user/${id}`, { 
                        headers,
                        validateStatus: function (status) {
                            return status < 500; // Don't throw for any status < 500
                        }
                    });
                    
                    if (portfolioResponse.status === 200 && portfolioResponse.data) {
                        console.log("Successfully fetched portfolio data", portfolioResponse.data);
                        
                        // Check if portfolio data is nested under a 'portfolio' key (as per your backend controller)
                        if (portfolioResponse.data.portfolio) {
                            setPortfolio(portfolioResponse.data.portfolio);
                        } else {
                            // If not nested, use the data directly
                            setPortfolio(portfolioResponse.data);
                        }
                    } else {
                        console.log("Portfolio not found or not accessible", portfolioResponse.status);
                    }
                } catch (portfolioError) {
                    console.error("Error fetching portfolio:", portfolioError);
                }
            }
        } catch (err) {
            console.error("Error in candidate details:", err);
            setError("Failed to load candidate details. Please try again later.");
            toast.error("Error loading candidate details");
        } finally {
            setLoading(false);
        }
    };

    const handleOnClick = (index) => {
        setActiveIndex(index);
    };

    const formatSkills = (skills) => {
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return ["HTML", "CSS", "JavaScript"];
        }
        return skills;
    };

    const getExperienceYears = () => {
        return candidate?.experienceYears || portfolio?.experience?.length || "Not specified";
    };

    const getLocation = () => {
        return candidate?.location || "Tunisia";
    };

    const getHourlyRate = () => {
        return candidate?.hourlyRate ? `$${candidate.hourlyRate}/hour` : "Not specified";
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return "Present";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short'
        });
    };

    if (loading) {
        return (
            <Layout>
                <Head>
                    <title>Loading Candidate Profile | TuniHire</title>
                </Head>
                <div className="text-center py-5 my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading candidate details...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <Head>
                    <title>Error | TuniHire</title>
                </Head>
                <div className="text-center py-5 my-5">
                    <div className="alert alert-danger">{error}</div>
                    <button 
                        className="btn btn-primary mt-3" 
                        onClick={() => router.push("/candidates-grid")}
                    >
                        Back to Candidates
                    </button>
                </div>
            </Layout>
        );
    }

    if (!candidate) {
        return (
            <Layout>
                <Head>
                    <title>Candidate Not Found | TuniHire</title>
                </Head>
                <div className="text-center py-5 my-5">
                    <div className="alert alert-warning">Candidate not found</div>
                    <button 
                        className="btn btn-primary mt-3" 
                        onClick={() => router.push("/candidates-grid")}
                    >
                        Back to Candidates
                    </button>
                </div>
            </Layout>
        );
    }

    // Set dynamic page title
    const pageTitle = `${candidate.firstName} ${candidate.lastName} | TuniHire`;

    return (
        <>
            <Layout>
                <Head>
                    <title>{pageTitle}</title>
                </Head>
                <section className="section-box-2">
                    <div className="container">
                        <div className="banner-hero banner-image-single">
                            <img src={ensurePath("assets/imgs/page/candidates/img.png")} alt="jobbox" />
                        </div>
                        <div className="box-company-profile position-relative">
                            <div className="row">
                                <div className="col-lg-4 col-md-6 col-sm-8 col-12 mx-auto text-center">
                                    <div className="image-compay position-relative" style={{ 
                                        maxWidth: '150px', 
                                        maxHeight: '150px', 
                                        overflow: 'hidden', 
                                        margin: '-110px auto 0',
                                        zIndex: 2, 
                                        borderRadius: '50%', 
                                        border: '5px solid #fff', 
                                        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
                                    }}>
                                        <img 
                                            src={ensurePath(candidate.profilePicture || "assets/imgs/page/candidates/candidate-profile.png")} 
                                            alt={`${candidate.firstName} ${candidate.lastName}`} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = ensurePath("assets/imgs/page/candidates/candidate-profile.png");
                                            }}
                                        />
                                    </div>
                                    <h3 className="mt-2 font-bold">
                                        {candidate.firstName} {candidate.lastName}
                                    </h3>
                                    <p className="card-location font-regular mb-1">
                                        <i className=""></i> {getLocation()}
                                    </p>
                                    <p className="mt-0 font-md color-text-paragraph-2 mb-2">
                                        {candidate.title || candidate.position || portfolio?.experience?.[0]?.position || "Professional"}
                                    </p>
                                    <div className="mt-2 mb-4 d-flex justify-content-center">
                                        <img src={ensurePath("assets/imgs/template/icons/star.svg")} alt="jobbox" />
                                        <img src={ensurePath("assets/imgs/template/icons/star.svg")} alt="jobbox" />
                                        <img src={ensurePath("assets/imgs/template/icons/star.svg")} alt="jobbox" />
                                        <img src={ensurePath("assets/imgs/template/icons/star.svg")} alt="jobbox" />
                                        <img src={ensurePath("assets/imgs/template/icons/star.svg")} alt="jobbox" />
                                        <span className="font-xs color-text-mutted ml-10">({candidate.reviewsCount || 0})</span>
                                        {candidate.isVerified && (
                                            <img className="ml-30" src={ensurePath("assets/imgs/page/candidates/verified.png")} alt="verified" />
                                        )}
                                    </div>
                                    
                                    <div className="mt-2">
                                        {(candidate.resumeUrl || portfolio?.cvFile?.downloadUrl) && (
                                            <a 
                                                href={candidate.resumeUrl || portfolio?.cvFile?.downloadUrl} 
                                                className="btn btn-download-icon btn-apply"
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                Download CV
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Navigation tabs */}
                        <div className="box-nav-tabs mt-40 mb-5">
                            <ul className="nav" role="tablist">
                                <li>
                                    <a 
                                        className={`btn btn-border aboutus-icon mr-15 mb-5 ${activeIndex === 1 ? 'active' : ''}`} 
                                        onClick={() => handleOnClick(1)}
                                    >
                                        Short Bio
                                    </a>
                                </li>
                                {portfolio && (
                                    <li>
                                        <a 
                                            className={`btn btn-border people-icon mr-15 mb-5 ${activeIndex === 4 ? 'active' : ''}`} 
                                            onClick={() => handleOnClick(4)}
                                        >
                                            Portfolio
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="border-bottom pt-10 pb-10" />
                    </div>
                </section>
                
                {/* Main content section */}
                <section className="section-box mt-50">
                    <div className="container">
                        {/* The rest of your component... (tabs content, sidebar, etc.) */}
                        <div className="row">
                            <div className="col-lg-8 col-md-12 col-sm-12 col-12">
                                <div className="content-single">
                                    {/* Tab content */}
                                    <div className="tab-content">
                                        {/* Tab 1: Bio */}
                                        <div className={`tab-pane fade ${activeIndex === 1 ? "show active" : ""}`}>
                                            <h4>About Me</h4>
                                            <p>{portfolio?.about || candidate.bio || "No biography information available."}</p>
                                            
                                            {/* Education section if available */}
                                            {/* Skills section */}
                                            <h4>Professional Skills</h4>
                                            <div className="row mb-40">
                                                <div className="col-lg-12 col-md-12 col-sm-12">
                                                    {formatSkills(portfolio?.skills || candidate.skills).map((skill, index) => (
                                                        <span key={index} className="btn btn-tags-sm mb-10 mr-5">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Tab 4: Portfolio */}
                                        {portfolio && (
                                            <div className={`tab-pane fade ${activeIndex === 4 ? "show active" : ""}`}>
                                                <h4>Portfolio Projects</h4>
                                                {portfolio.projects && portfolio.projects.length > 0 ? (
                                                    <div className="row">
                                                        {portfolio.projects.map((project, index) => (
                                                            <div key={index} className="col-xl-12 col-md-12 col-12 mb-15">
                                                                <div className="card-grid-2 hover-up">
                                                                    <div className="card-block-info">
                                                                        <div className="d-flex justify-content-between">
                                                                            <h5>{project.title}</h5>
                                                                            {project.link && (
                                                                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-link">
                                                                                    <i className="fi-rr-link mr-5"></i> Project Link
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                        {project.image && (
                                                                            <div className="mt-10 mb-15">
                                                                                <img 
                                                                                    src={project.image} 
                                                                                    alt={project.title} 
                                                                                    className="img-fluid rounded"
                                                                                    onError={(e) => {
                                                                                        e.target.style.display = 'none';
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        <p className="font-sm color-text-paragraph mt-10">
                                                                            {project.description}
                                                                        </p>
                                                                        {project.technologies && project.technologies.length > 0 && (
                                                                            <div className="mt-15">
                                                                                <strong>Technologies:</strong>
                                                                                <div className="card-2-bottom-tagcloud mt-10">
                                                                                    {project.technologies.map((tech, idx) => (
                                                                                        <span key={idx} className="btn btn-tags-sm mb-10 mr-5">{tech}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <div className="alert alert-info">
                                                            <i className="fi-rr-info-circle me-2"></i>
                                                            This candidate has not added any portfolio projects yet.
                                                            {!localStorage.getItem('token') && (
                                                                <div className="mt-3">
                                                                    <Link href="/login" className="btn btn-brand-1">
                                                                        Sign in to view full profile
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Education section */}
                                                <h4 className="mt-4">Education</h4>
                                                {portfolio.education && portfolio.education.length > 0 ? (
                                                    <div className="row">
                                                        {portfolio.education.map((edu, index) => (
                                                            <div key={index} className="col-xl-12 col-md-12 col-12 mb-15">
                                                                <div className="card-grid-2 hover-up">
                                                                    <div className="card-block-info">
                                                                        <h5>{edu.degree}</h5>
                                                                        <p className="font-md color-text-paragraph-2">{edu.school}</p>
                                                                        <div className="text-muted font-sm">
                                                                            {formatDate(edu.startDate)} - {edu.currentlyEnrolled ? "Present" : formatDate(edu.endDate)}
                                                                        </div>
                                                                        {edu.location && <div className="font-xs color-text-mutted mt-5">{edu.location}</div>}
                                                                        {edu.description && <p className="font-sm color-text-paragraph mt-10">{edu.description}</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-light">No education information available.</div>
                                                )}

                                                {/* Certificates section */}
                                                <h4 className="mt-4">Certificates</h4>
                                                {portfolio.certificates && portfolio.certificates.length > 0 ? (
                                                    <div className="row">
                                                        {portfolio.certificates.map((cert, index) => (
                                                            <div key={index} className="col-xl-12 col-md-12 col-12 mb-15">
                                                                <div className="card-grid-2 hover-up">
                                                                    <div className="card-block-info">
                                                                        <h5>{cert.title}</h5>
                                                                        <p className="font-sm color-text-paragraph mt-10">
                                                                            {cert.description}
                                                                        </p>
                                                                        {cert.skills && cert.skills.length > 0 && (
                                                                            <div className="mt-15">
                                                                                {cert.skills.map((skill, idx) => (
                                                                                    <span key={idx} className="btn btn-tags-sm mb-10 mr-5">{skill}</span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {cert.certificateUrl && (
                                                                            <div className="mt-30">
                                                                                <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-apply-now">
                                                                                    View Certificate
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-light">No certificates available.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sidebar */}
                            <div className="col-lg-4 col-md-12 col-sm-12 col-12 pl-40 pl-lg-15 mt-lg-30">
                                <div className="sidebar-border">
                                    <h5 className="f-18">Overview</h5>
                                    <div className="sidebar-list-job">
                                        <ul>
                                            <li>
                                                <div className="sidebar-icon-item">
                                                    <i className="fi-rr-briefcase" />
                                                </div>
                                                <div className="sidebar-text-info">
                                                    <span className="text-description">Experience</span>
                                                    <strong className="small-heading">{getExperienceYears()} years</strong>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="sidebar-icon-item">
                                                    <i className="fi-rr-dollar" />
                                                </div>
                                                <div className="sidebar-text-info">
                                                    <span className="text-description">Expected Salary</span>
                                                    <strong className="small-heading">{getHourlyRate()}</strong>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="sidebar-icon-item">
                                                    <i className="fi-rr-marker" />
                                                </div>
                                                <div className="sidebar-text-info">
                                                    <span className="text-description">Location</span>
                                                    <strong className="small-heading">{getLocation()}</strong>
                                                </div>
                                            </li>
                                            {candidate.languagePreferences && candidate.languagePreferences.length > 0 && (
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-world" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Languages</span>
                                                        <strong className="small-heading">{candidate.languagePreferences.join(', ')}</strong>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    
                                    {/* Contact info */}
                                    <div className="sidebar-list-job">
                                        <ul className="ul-disc">
                                            <li>{getLocation()}</li>
                                            {candidate.phone && <li>Phone: {candidate.phone}</li>}
                                            {candidate.email && <li>Email: {candidate.email}</li>}
                                        </ul>
                                        
                                        {/* Social links if available */}
                                        {portfolio?.socialLinks && Object.values(portfolio.socialLinks).some(link => link) && (
                                            <div className="mt-20">
                                                <h6 className="color-text-paragraph">Social Links</h6>
                                                <div className="mt-15 d-flex flex-wrap">
                                                    {portfolio.socialLinks.linkedin && (
                                                        <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-social-outline btn-sm mr-10 mb-10">
                                                            <i className="fi-rr-link mr-5"></i> LinkedIn
                                                        </a>
                                                    )}
                                                    {portfolio.socialLinks.github && (
                                                        <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="btn btn-social-outline btn-sm mr-10 mb-10">
                                                            <i className="fi-rr-code-branch mr-5"></i> GitHub
                                                        </a>
                                                    )}
                                                    {portfolio.socialLinks.website && (
                                                        <a href={portfolio.socialLinks.website} target="_blank" rel="noopener noreferrer" className="btn btn-social-outline btn-sm mr-10 mb-10">
                                                            <i className="fi-rr-globe mr-5"></i> Website
                                                        </a>
                                                    )}
                                                    {portfolio.socialLinks.twitter && (
                                                        <a href={portfolio.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-social-outline btn-sm mr-10 mb-10">
                                                            <i className="fi-rr-at mr-5"></i> Twitter
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Contact button */}
                                        {candidate.email && (
                                            <div className="mt-30">
                                                <a href={`mailto:${candidate.email}`} className="btn btn-send-message">
                                                    Send Message
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* "View all candidates" sidebar box */}
                                <div className="sidebar-border-bg bg-right mt-50">
                                    <span className="text-grey">Discover</span>
                                    <span className="text-hiring">Top Talent</span>
                                    <p className="font-xxs color-text-paragraph mt-5">
                                        Browse more candidates in our database
                                    </p>
                                    <div className="mt-15">
                                        <Link href="/candidates-grid" className="btn btn-paragraph-2">
                                            View All Candidates
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Newsletter section */}
                <section className="section-box mt-50 mb-20">
                    <div className="container">
                        <div className="box-newsletter">
                            <div className="row">
                                <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                    <img src={ensurePath("assets/imgs/template/newsletter-left.png")} alt="joxBox" />
                                </div>
                                <div className="col-lg-12 col-xl-6 col-12">
                                    <h2 className="text-md-newsletter text-center">
                                        New Things Will Always
                                        <br /> Update Regularly
                                    </h2>
                                    <div className="box-form-newsletter mt-40">
                                        <form className="form-newsletter">
                                            <input className="input-newsletter" type="text" placeholder="Enter your email here" />
                                            <button className="btn btn-default font-heading icon-send-letter">Subscribe</button>
                                        </form>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                    <img src={ensurePath("assets/imgs/template/newsletter-right.png")} alt="joxBox" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        </>
    );
}
