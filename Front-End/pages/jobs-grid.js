import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout/Layout";
import BlogSlider from "./../components/sliders/Blog";
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export default function JobGrid() {
    const router = useRouter();
    const { company: companyId, location } = router.query;

    // États pour stocker les données
    const [jobs, setJobs] = useState([]);
    const [allJobs, setAllJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [companyLoading, setCompanyLoading] = useState(false);
    const [jobsLoaded, setJobsLoaded] = useState(false);
    
    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [industryFilter, setIndustryFilter] = useState("");
    const [workplaceType, setWorkplaceType] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [sortBy, setSortBy] = useState("newest"); // newest, oldest, salary-high, salary-low
    
    console.log("Router query:", router.query);
    console.log("Company ID from query:", companyId);
    console.log("Location from query:", location);
    
    // Set initial location filter from URL parameter
    useEffect(() => {
        if (router.isReady && location) {
            setLocationFilter(location);
            console.log("Setting location filter from URL:", location);
        }
    }, [router.isReady, location]);
    
    // Récupérer les emplois depuis l'API
    useEffect(() => {
        const fetchJobs = async () => {
            if (!router.isReady) return;
            
            try {
                setLoading(true);
                setJobsLoaded(false);
                console.log("Fetching jobs with router ready. Company ID:", companyId);
                
                let url = `${API_URL}/api/jobs`;
                // If companyId is provided, fetch jobs only for that company
                if (companyId) {
                    console.log("Filtering jobs by company ID:", companyId);
                    url = `${API_URL}/api/jobs/company/${companyId}`;
                    // Fetch company info separately to ensure it's available
                    fetchCompanyInfo(companyId);
                } else {
                    // Reset company info if not filtering by company
                    setCompanyInfo(null);
                    setCompanyLoading(false);
                }
                
                console.log("Making API request to:", url);
                const response = await axios.get(url);
                console.log("API response:", response);
                
                if (response.data && Array.isArray(response.data)) {
                    console.log(`Received ${response.data.length} jobs`);
                    setAllJobs(response.data);
                } else {
                    console.warn("Response doesn't contain jobs data:", response.data);
                    setAllJobs([]);
                }
                
                setJobsLoaded(true);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching jobs:", error);
                setError(`Failed to load jobs: ${error.message}`);
                setLoading(false);
                setJobsLoaded(true);
            }
        };
        
        fetchJobs();
    }, [companyId, router.isReady]);
    
    // Cleanup effect
    useEffect(() => {
        // Ensure we reset relevant state on component unmount
        return () => {
            setCompanyInfo(null);
            setCompanyLoading(false);
            setError(null);
        };
    }, []);

    // Fetch company information if companyId is provided
    const fetchCompanyInfo = async (id) => {
        if (!id) return;
        
        try {
            setCompanyLoading(true);
            console.log("Fetching company info for ID:", id);
            const response = await axios.get(`${API_URL}/api/companies/${id}`);
            console.log("Company API response:", response);
            
            if (response.data) {
                console.log("Received company data:", response.data);
                setCompanyInfo(response.data);
            } else {
                // Handle empty response
                console.warn("Empty company data received");
                setCompanyInfo({ name: "Unknown Company" });
            }
        } catch (error) {
            console.error("Error fetching company info:", error);
            // Set a fallback name to prevent undefined errors
            setCompanyInfo({ name: "Unknown Company" });
        } finally {
            setCompanyLoading(false);
        }
    };
    
    // Clear company filter
    const clearCompanyFilter = () => {
        router.push('/jobs-grid');
    };
    
    // Effectuer le filtrage, le tri et la pagination
    const filteredAndSortedJobs = useMemo(() => {
        // 1. Filtrage
        let result = [...allJobs];
        
        console.log("Filtering jobs. Total jobs:", result.length);
        console.log("Search term:", searchTerm);
        console.log("Location filter:", locationFilter);
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(job => 
                (job.title && job.title.toLowerCase().includes(term)) || 
                (job.description && job.description.toLowerCase().includes(term))
            );
        }
        
        if (locationFilter) {
            result = result.filter(job => 
                job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }
        
        if (industryFilter && industryFilter !== "0") {
            // Not implemented yet
        }
        
        if (workplaceType) {
            result = result.filter(job => job.workplaceType === workplaceType);
        }
        
        // 2. Tri
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "oldest":
                result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case "salary-high":
                result.sort((a, b) => {
                    const aMax = parseInt(a.salaryRange?.split('-')[1]) || 0;
                    const bMax = parseInt(b.salaryRange?.split('-')[1]) || 0;
                    return bMax - aMax;
                });
                break;
            case "salary-low":
                result.sort((a, b) => {
                    const aMin = parseInt(a.salaryRange?.split('-')[0]) || 0;
                    const bMin = parseInt(b.salaryRange?.split('-')[0]) || 0;
                    return aMin - bMin;
                });
                break;
        }
        
        console.log("After filtering and sorting, job count:", result.length);
        return result;
    }, [allJobs, searchTerm, locationFilter, workplaceType, sortBy, industryFilter]);
    
    // Pagination
    const totalJobs = filteredAndSortedJobs.length;
    const totalPages = Math.ceil(totalJobs / itemsPerPage);
    const indexOfLastJob = currentPage * itemsPerPage;
    const indexOfFirstJob = indexOfLastJob - itemsPerPage;
    
    // Update jobs when filteredAndSortedJobs changes or pagination changes
    useEffect(() => {
        const currentJobs = filteredAndSortedJobs.slice(indexOfFirstJob, indexOfLastJob);
        console.log("Setting current jobs for display:", currentJobs.length);
        
        setJobs(currentJobs);
    }, [filteredAndSortedJobs, currentPage, itemsPerPage]);
    
    // Gérer la recherche
    const handleSearch = (e) => {
        e.preventDefault();
        const form = e.target;
        const searchInput = form.querySelector(".input-keysearch");
        const locationSelect = form.querySelector(".input-location");
        const industrySelect = form.querySelector(".input-industry");
        
        setSearchTerm(searchInput?.value || "");
        setLocationFilter(locationSelect?.value || "");
        setIndustryFilter(industrySelect?.value || "");
        setCurrentPage(1); // Revenir à la première page
    };
    
    // Gérer le changement de filtre de type de travail
    const handleWorkplaceTypeChange = (type) => {
        setWorkplaceType(workplaceType === type ? "" : type);
        setCurrentPage(1);
    };
    
    // Formatage des dates relatives
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minutes ago`;
        } else if (diffInMinutes < 24 * 60) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return `${Math.floor(diffInMinutes / (60 * 24))} days ago`;
        }
    };
    
    // Reset all filters
    const resetFilters = () => {
        setSearchTerm("");
        setLocationFilter("");
        setIndustryFilter("");
        setWorkplaceType("");
        setSortBy("newest");
        setCurrentPage(1);
        
        // Clear URL parameters while keeping the current page
        const url = new URL(window.location.href);
        url.searchParams.delete('location');
        
        // Update the URL without reloading the page
        window.history.pushState({}, '', url);
    };
    
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-single banner-single-bg">
                                <div className="block-banner text-center">
                                    <h3 className="wow animate__animated animate__fadeInUp">
                                        {(() => {
                                            if (loading) {
                                                return "Loading...";
                                            }
                                            
                                            if (companyId) {
                                                if (companyLoading) {
                                                    return "Loading Company Jobs...";
                                                }
                                                
                                                return companyInfo ? `Jobs at ${companyInfo.name}` : "Company Jobs";
                                            }
                                            
                                            return "Browse Jobs";
                                        })()}
                                    </h3>
                                    <div className="font-sm color-text-paragraph-2 mt-10 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                                        {loading ? (
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading jobs...</span>
                                            </div>
                                        ) : companyId && companyLoading ? (
                                            <div className="text-center">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <span className="ml-2">Loading company information...</span>
                                            </div>
                                        ) : companyInfo ? (
                                            <div>
                                                <p>{companyInfo.description || `Find all open positions at ${companyInfo.name}`}</p>
                                                <button 
                                                    onClick={clearCompanyFilter}
                                                    className="btn btn-outline-primary mt-10 btn-sm"
                                                >
                                                    <i className="fi-rr-rotate-right mr-5"></i> 
                                                    Show All Jobs
                                                </button>
                                            </div>
                                        ) : (
                                            'Find the job that fits your life'
                                        )}
                                    </div>
                                    <div className="form-find text-start mt-40 wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                                        <form onSubmit={handleSearch}>
                                            <div className="box-industry">
                                                <select 
                                                    className="form-input mr-10 select-active input-industry"
                                                    value={industryFilter}
                                                    onChange={(e) => setIndustryFilter(e.target.value)}
                                                >
                                                    <option value="0">Industry</option>
                                                    <option value="1">Software</option>
                                                    <option value="2">Finance</option>
                                                    <option value="3">Recruting</option>
                                                    <option value="4">Management</option>
                                                    <option value="5">Advertising</option>
                                                    <option value="6">Development</option>
                                                </select>
                                            </div>
                                            <div className="box-industry">
                                                <select 
                                                    className="form-input mr-10 select-active input-location"
                                                    value={locationFilter}
                                                    onChange={(e) => setLocationFilter(e.target.value)}
                                                >
                                                    <option value="">Location</option>
                                                    <option value="Remote">Remote</option>
                                                    <option value="Office">Office</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                    <option value="Paris">Paris</option>
                                                    <option value="Lyon">Lyon</option>
                                                    <option value="Marseille">Marseille</option>
                                                </select>
                                            </div>
                                            <input 
                                                className="form-input input-keysearch mr-10" 
                                                type="text" 
                                                placeholder="Your keyword... "
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <button className="btn btn-default btn-find font-sm">Search</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="section-box mt-30">
                        <div className="container">
                            <div className="row flex-row-reverse">
                                <div className="col-lg-9 col-md-12 col-sm-12 col-12 float-right">
                                    <div className="content-page">
                                        <div className="box-filters-job">
                                            <div className="row">
                                                <div className="col-xl-6 col-lg-5">
                                                    <span className="text-small text-showing">
                                                        {loading ? (
                                                            "Loading jobs..."
                                                        ) : allJobs.length > 0 ? (
                                                            <>
                                                                Showing <strong>{indexOfFirstJob + 1}-{Math.min(indexOfLastJob, totalJobs)}</strong> of <strong>{totalJobs}</strong> jobs
                                                                {companyInfo ? ` for ${companyInfo.name}` : ''}
                                                            </>
                                                        ) : (
                                                            companyInfo ? 
                                                                `No jobs available for ${companyInfo.name}` : 
                                                                'No jobs available'
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="col-xl-6 col-lg-7 text-lg-end mt-sm-15">
                                                    <div className="display-flex2">
                                                        <div className="box-border mr-10">
                                                            <span className="text-sortby">Show:</span>
                                                            <div className="dropdown dropdown-sort">
                                                                <button className="btn dropdown-toggle" id="dropdownSort" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
                                                                    <span>{itemsPerPage}</span>
                                                                    <i className="fi-rr-angle-small-down" />
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-light" aria-labelledby="dropdownSort">
                                                                    <li onClick={() => { setItemsPerPage(6); setCurrentPage(1); }}>
                                                                        <a className={`dropdown-item ${itemsPerPage === 6 ? 'active' : ''}`}>6</a>
                                                                    </li>
                                                                    <li onClick={() => { setItemsPerPage(12); setCurrentPage(1); }}>
                                                                        <a className={`dropdown-item ${itemsPerPage === 12 ? 'active' : ''}`}>12</a>
                                                                    </li>
                                                                    <li onClick={() => { setItemsPerPage(24); setCurrentPage(1); }}>
                                                                        <a className={`dropdown-item ${itemsPerPage === 24 ? 'active' : ''}`}>24</a>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="box-border">
                                                            <span className="text-sortby">Sort by:</span>
                                                            <div className="dropdown dropdown-sort">
                                                                <button className="btn dropdown-toggle" id="dropdownSort2" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
                                                                    <span>
                                                                        {sortBy === "newest" && "Newest Post"}
                                                                        {sortBy === "oldest" && "Oldest Post"}
                                                                        {sortBy === "salary-high" && "Highest Salary"}
                                                                        {sortBy === "salary-low" && "Lowest Salary"}
                                                                    </span>
                                                                    <i className="fi-rr-angle-small-down" />
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-light" aria-labelledby="dropdownSort2">
                                                                    <li onClick={() => setSortBy("newest")}>
                                                                        <a className={`dropdown-item ${sortBy === "newest" ? 'active' : ''}`}>Newest Post</a>
                                                                    </li>
                                                                    <li onClick={() => setSortBy("oldest")}>
                                                                        <a className={`dropdown-item ${sortBy === "oldest" ? 'active' : ''}`}>Oldest Post</a>
                                                                    </li>
                                                                    <li onClick={() => setSortBy("salary-high")}>
                                                                        <a className={`dropdown-item ${sortBy === "salary-high" ? 'active' : ''}`}>Highest Salary</a>
                                                                    </li>
                                                                    <li onClick={() => setSortBy("salary-low")}>
                                                                        <a className={`dropdown-item ${sortBy === "salary-low" ? 'active' : ''}`}>Lowest Salary</a>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Affichage des emplois */}
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2">Chargement des emplois...</p>
                                            </div>
                                        ) : error ? (
                                            <div className="alert alert-danger" role="alert">
                                                {error}
                                            </div>
                                        ) : (
                                            <div className="row">
                                                {jobs.length === 0 ? (
                                                    <div className="col-12 text-center py-5">
                                                        <div className="alert alert-info" role="alert">
                                                            {(() => {
                                                                // Using an IIFE for more complex conditional logic
                                                                if (loading) {
                                                                    return "Loading jobs...";
                                                                }
                                                                
                                                                if (companyId) {
                                                                    if (companyLoading) {
                                                                        return "Loading company jobs...";
                                                                    }
                                                                    
                                                                    if (!companyInfo) {
                                                                        return "No company information found";
                                                                    }
                                                                    
                                                                    if (allJobs.length === 0) {
                                                                        return `No jobs found for ${companyInfo.name}`;
                                                                    }
                                                                    
                                                                    if (filteredAndSortedJobs.length === 0) {
                                                                        return `No jobs match your filters for ${companyInfo.name}`;
                                                                    }
                                                                }
                                                                
                                                                if (allJobs.length === 0) {
                                                                    return 'No jobs found in the system';
                                                                }
                                                                
                                                                return 'No jobs found matching your criteria';
                                                            })()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    jobs.map((job, index) => (
                                                        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12" key={job._id}>
                                                            <div className="card-grid-2 hover-up">
                                                                <div className="card-grid-2-image-left">
                                                                    <span className="flash" />
                                                                    <div className="image-box">
                                                                        <img src="assets/imgs/brands/brand-1.png" alt="jobBox" />
                                                                    </div>
                                                                    <div className="right-info">
                                                                        {job.companyId ? (
                                                                            <Link href={`/company-details?id=${job.companyId}`} className="name-job">
                                                                                {job.companyId.name || "Company Name"}
                                                                            </Link>
                                                                        ) : (
                                                                            <span className="name-job">Company Name</span>
                                                                        )}
                                                                        <span className="location-small">{job.location}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="card-block-info">
                                                                    <h6>
                                                                        <Link href={`/job-details?id=${job._id}`} className="card-job-name">
                                                                            {job.title}
                                                                        </Link>
                                                                    </h6>
                                                                    <div className="mt-5">
                                                                        <span className="card-briefcase">{job.workplaceType}</span>
                                                                        <span className="card-time">
                                                                            {formatTimeAgo(job.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="font-sm color-text-paragraph mt-15">
                                                                        {job.description.length > 100 
                                                                            ? `${job.description.substring(0, 100)}...` 
                                                                            : job.description}
                                                                    </p>
                                                                    <div className="mt-30">
                                                                        {job.requirements && job.requirements.map((req, index) => (
                                                                            <span className="btn btn-grey-small mr-5" key={index}>{req}</span>
                                                                        ))}
                                                                    </div>
                                                                    <div className="card-2-bottom mt-30">
                                                                        <div className="row">
                                                                            <div className="col-lg-7 col-7">
                                                                                <span className="card-text-price">{job.salaryRange || 'Not specified'}</span>
                                                                            </div>
                                                                            <div className="col-lg-5 col-5 text-end">
                                                                                <Link href={`/job-details?id=${job._id}`} className="btn btn-apply-now">
                                                                                    Apply now
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Pagination */}
                                        {!loading && !error && totalJobs > 0 && (
                                            <div className="paginations">
                                                <ul className="pager">
                                                    <li>
                                                        <a 
                                                            className="pager-prev" 
                                                            href="#" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                            }}
                                                            style={{ cursor: currentPage > 1 ? 'pointer' : 'not-allowed' }}
                                                        />
                                                    </li>
                                                    
                                                    {Array.from({ length: totalPages }, (_, i) => (
                                                        <li key={i}>
                                                            <a 
                                                                className={`pager-number ${currentPage === i + 1 ? 'active' : ''}`}
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setCurrentPage(i + 1);
                                                                }}
                                                            >
                                                                {i + 1}
                                                            </a>
                                                        </li>
                                                    ))}
                                                    
                                                    <li>
                                                        <a 
                                                            className="pager-next" 
                                                            href="#" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                            }}
                                                            style={{ cursor: currentPage < totalPages ? 'pointer' : 'not-allowed' }}
                                                        />
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Sidebar avec filtres */}
                                <div className="col-lg-3 col-md-12 col-sm-12 col-12">
                                    <div className="sidebar-shadow none-shadow mb-30">
                                        <div className="sidebar-filters">
                                            <div className="filter-block head-border mb-30">
                                                <h5>
                                                    Filtres avancés
                                                    <a className="link-reset" onClick={resetFilters} style={{cursor: 'pointer'}}>Reset</a>
                                                </h5>
                                            </div>
                                            
                                            <div className="filter-block mb-20">
                                                <h5 className="medium-heading mb-15">Type de travail</h5>
                                                <div className="form-group">
                                                    <ul className="list-checkbox">
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={workplaceType === 'Remote'} 
                                                                    onChange={() => handleWorkplaceTypeChange('Remote')}
                                                                />
                                                                <span className="text-small">Remote</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={workplaceType === 'Office'} 
                                                                    onChange={() => handleWorkplaceTypeChange('Office')}
                                                                />
                                                                <span className="text-small">Office</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={workplaceType === 'Hybrid'} 
                                                                    onChange={() => handleWorkplaceTypeChange('Hybrid')}
                                                                />
                                                                <span className="text-small">Hybrid</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            
                                            {/* Vous pouvez ajouter d'autres filtres ici */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </Layout>
        </>
    );
}