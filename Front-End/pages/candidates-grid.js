/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import BlogSlider from "./../components/sliders/Blog";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function CandidateGrid() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [candidatesPerPage] = useState(12);
    const [totalCandidates, setTotalCandidates] = useState(0);
    const [filter, setFilter] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                setLoading(true);
                // Create axios instance with specific config for this request
                const axiosInstance = axios.create({
                    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                });
                
                // Configure axios to not throw errors on non-2xx responses
                const response = await axiosInstance.get('/api/users/allusers', {
                    validateStatus: function (status) {
                        // Don't reject if status is 401 (Unauthorized)
                        return (status >= 200 && status < 300) || status === 401;
                    }
                });
                
                // Check if we got a valid response
                if (response.status === 401) {
                    console.warn("Authentication required, but continuing with public data");
                    // You might want to handle this case differently, e.g., set a flag to show limited functionality
                }
                
                // Check if the response has the expected structure
                if (response.data && response.data.success && Array.isArray(response.data.users)) {
                    // Filter users with role 'candidate'
                    const candidateUsers = response.data.users.filter(user => 
                        user.role && user.role.toLowerCase() === 'candidate'
                    );
                    setTotalCandidates(candidateUsers.length);
                    setCandidates(candidateUsers);
                } else {
                    console.error("Unexpected API response format:", response.data);
                    setError("Invalid response format from the server");
                    toast.error("Failed to load candidates: Invalid response format");
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching candidates:", err);
                setError("Failed to load candidates. Please try again later.");
                setLoading(false);
                toast.error("Failed to load candidates");
            }
        };

        fetchCandidates();
    }, []);

    // Get current candidates for pagination
    const indexOfLastCandidate = currentPage * candidatesPerPage;
    const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
    
    // Filter candidates based on filter (if any)
    const filteredCandidates = filter 
        ? candidates.filter(candidate => 
            (candidate.firstName && candidate.firstName.toLowerCase().includes(filter.toLowerCase())) || 
            (candidate.lastName && candidate.lastName.toLowerCase().includes(filter.toLowerCase())) ||
            (candidate.skills && candidate.skills.some(skill => skill.toLowerCase().includes(filter.toLowerCase()))))
        : candidates;
    
    // Sort candidates
    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortBy === "oldest") {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortBy === "nameAZ") {
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (sortBy === "nameZA") {
            return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        }
        return 0;
    });
    
    const currentCandidates = sortedCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle filter change
    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle sort change
    const handleSortChange = (option) => {
        setSortBy(option);
    };

    // Determine candidate skills to display
    const getCandidateSkills = (candidate) => {
        if (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0) {
            return candidate.skills.slice(0, 5); // Limit to 5 skills
        }
        return ["HTML", "CSS", "JavaScript"]; // Default skills if none available
    };

    // Function to get candidate rate
    const getCandidateRate = (candidate) => {
        if (candidate.hourlyRate) {
            return `$${candidate.hourlyRate}/hour`;
        }
        return "Not specified";
    };

    // Function to get candidate location
    const getCandidateLocation = (candidate) => {
        if (candidate.location) {
            return candidate.location;
        }
        return "Tunisia";
    };

    return (
        <>
            <Layout>
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-company">
                                <div className="block-banner text-center">
                                    <h3 className="wow animate__animated animate__fadeInUp">Browse Candidates</h3>
                                    <div className="font-sm color-text-paragraph-2 mt-10 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                                        Discover top talent for your open positions
                                    </div>
                                    <div className="box-search-job mt-20">
                                        <input 
                                            className="input-search" 
                                            type="text" 
                                            placeholder="Search by name, skills, or expertise..."
                                            value={filter}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-30">
                        <div className="container">
                            <div className="content-page">
                                <div className="box-filters-job">
                                    <div className="row">
                                        <div className="col-xl-6 col-lg-5">
                                            <span className="text-small text-showing">
                                                Showing <strong>{indexOfFirstCandidate + 1}-{Math.min(indexOfLastCandidate, filteredCandidates.length)} </strong>
                                                of <strong>{filteredCandidates.length}</strong> candidates
                                            </span>
                                        </div>
                                        <div className="col-xl-6 col-lg-7 text-lg-end mt-sm-15">
                                            <div className="display-flex2">
                                                <div className="box-border mr-10">
                                                    <span className="text-sortby">Show:</span>
                                                    <div className="dropdown dropdown-sort">
                                                        <button className="btn dropdown-toggle" id="dropdownSort" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
                                                            <span>{candidatesPerPage}</span>
                                                            <i className="fi-rr-angle-small-down" />
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-light" aria-labelledby="dropdownSort">
                                                            <li>
                                                                <Link legacyBehavior href="#">
                                                                    <a className="dropdown-item active">10</a>
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link legacyBehavior href="#">
                                                                    <a className="dropdown-item">12</a>
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link legacyBehavior href="#">
                                                                    <a className="dropdown-item">20</a>
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="box-border">
                                                    <span className="text-sortby">Sort by:</span>
                                                    <div className="dropdown dropdown-sort">
                                                        <button className="btn dropdown-toggle" id="dropdownSort2" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
                                                            <span>
                                                                {sortBy === "newest" && "Newest"}
                                                                {sortBy === "oldest" && "Oldest"}
                                                                {sortBy === "nameAZ" && "Name A-Z"}
                                                                {sortBy === "nameZA" && "Name Z-A"}
                                                            </span>
                                                            <i className="fi-rr-angle-small-down" />
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-light" aria-labelledby="dropdownSort2">
                                                            <li onClick={() => handleSortChange("newest")}>
                                                                <a className={`dropdown-item ${sortBy === "newest" ? "active" : ""}`}>Newest</a>
                                                            </li>
                                                            <li onClick={() => handleSortChange("oldest")}>
                                                                <a className={`dropdown-item ${sortBy === "oldest" ? "active" : ""}`}>Oldest</a>
                                                            </li>
                                                            <li onClick={() => handleSortChange("nameAZ")}>
                                                                <a className={`dropdown-item ${sortBy === "nameAZ" ? "active" : ""}`}>Name A-Z</a>
                                                            </li>
                                                            <li onClick={() => handleSortChange("nameZA")}>
                                                                <a className={`dropdown-item ${sortBy === "nameZA" ? "active" : ""}`}>Name Z-A</a>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading candidates...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-5">
                                        <div className="alert alert-danger">{error}</div>
                                    </div>
                                ) : filteredCandidates.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="alert alert-info">No candidates found matching your criteria.</div>
                                    </div>
                                ) : (
                                    <div className="row">
                                        {currentCandidates.map((candidate, index) => (
                                            <div className="col-xl-3 col-lg-4 col-md-6" key={candidate._id || index}>
                                                <div className="card-grid-2 hover-up">
                                                    <div className="card-grid-2-image-left">
                                                        <div className="card-grid-2-image-rd online">
                                                            <Link legacyBehavior href={`/candidate-details?id=${candidate._id}`}>
                                                                <a>
                                                                    <figure>
                                                                        <img 
                                                                            alt={`${candidate.firstName} ${candidate.lastName} ` }
                                                                            src={candidate.profilePicture || "assets/imgs/page/candidates/user1.png"} 
                                                                            onError={(e) => {
                                                                                e.target.src = "assets/imgs/page/candidates/user1.png";
                                                                            }} 
                                                                        />
                                                                    </figure>
                                                                </a>
                                                            </Link>
                                                        </div>
                                                        <div className="card-profile pt-10">                                                            <Link legacyBehavior href={`/candidate-details?id=${candidate._id}`}>
                                                                <a>
                                                                    <h5>
                                                                        {candidate.firstName} {candidate.lastName}
                                                                        {candidate.isVerified === true && (
                                                                            <img 
                                                                                src="/assets/imgs/template/icons/Verified_Badge.svg" 
                                                                                alt="Verified" 
                                                                                className="ml-5" 
                                                                                style={{ 
                                                                                    height: "16px", 
                                                                                    width: "auto", 
                                                                                    display: "inline-block",
                                                                                    verticalAlign: "middle"
                                                                                }}
                                                                                title="Verified Profile"
                                                                            />
                                                                        )}
                                                                    </h5>
                                                                </a>
                                                            </Link>
                                                            <span className="font-xs color-text-mutted">
                                                                {candidate.title || candidate.position || "Professional"}
                                                            </span>
                                                            <div className="rate-reviews-small pt-5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i}>
                                                                        <img src="assets/imgs/template/icons/star.svg" alt="star" />
                                                                    </span>
                                                                ))}
                                                                <span className="ml-10 color-text-mutted font-xs">
                                                                    ({candidate.reviewsCount || 0})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="card-block-info">
                                                        <p className="font-xs color-text-paragraph-2">
                                                            {candidate.bio || candidate.description || "Talented professional ready for new opportunities"}
                                                        </p>
                                                        <div className="card-2-bottom card-2-bottom-candidate mt-30">
                                                            <div className="text-start">
                                                                {getCandidateSkills(candidate).map((skill, index) => (
                                                                    <span className="btn btn-tags-sm mb-10 mr-5" key={index}>
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="employers-info align-items-center justify-content-center mt-15">
                                                            <div className="row">
                                                                <div className="col-6">
                                                                    <span className="d-flex align-items-center">
                                                                        <i className="fi-rr-marker mr-5 ml-0" />
                                                                        <span className="font-sm color-text-mutted">
                                                                            {getCandidateLocation(candidate)}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                                <div className="col-6">
                                                                    <span className="d-flex justify-content-end align-items-center">
                                                                        <i className="fi-rr-clock mr-5" />
                                                                        <span className="font-sm color-brand-1">
                                                                            {getCandidateRate(candidate)}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredCandidates.length > 0 && (
                                    <div className="paginations">
                                        <ul className="pager">
                                            <li>
                                                <a 
                                                    className="pager-prev" 
                                                    href="#" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) paginate(currentPage - 1);
                                                    }}
                                                    style={{ cursor: currentPage > 1 ? 'pointer' : 'not-allowed', opacity: currentPage > 1 ? 1 : 0.5 }}
                                                />
                                            </li>
                                            {[...Array(Math.ceil(filteredCandidates.length / candidatesPerPage)).keys()].map(number => (
                                                <li key={number + 1}>
                                                    <a 
                                                        className={`pager-number ${currentPage === number + 1 ? 'active' : ''}`}
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            paginate(number + 1);
                                                        }}
                                                    >
                                                        {number + 1}
                                                    </a>
                                                </li>
                                            ))}
                                            <li>
                                                <a 
                                                    className="pager-next" 
                                                    href="#" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage < Math.ceil(filteredCandidates.length / candidatesPerPage)) {
                                                            paginate(currentPage + 1);
                                                        }
                                                    }}
                                                    style={{ 
                                                        cursor: currentPage < Math.ceil(filteredCandidates.length / candidatesPerPage) ? 'pointer' : 'not-allowed',
                                                        opacity: currentPage < Math.ceil(filteredCandidates.length / candidatesPerPage) ? 1 : 0.5
                                                    }}
                                                />
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    
                    <section className="section-box mt-50 mb-50">
                        <div className="container">
                            <div className="text-start">
                                <h2 className="section-title mb-10 wow animate__animated animate__fadeInUp">News and Blog</h2>
                                <p className="font-lg color-text-paragraph-2 wow animate__animated animate__fadeInUp">Get the latest news, updates and tips</p>
                            </div>
                        </div>
                        <div className="container">
                            <div className="mt-50">
                                <div className="box-swiper style-nav-top">
                                    <BlogSlider />
                                </div>
                                <div className="text-center">
                                    <Link legacyBehavior href="blog-grid">
                                        <a className="btn btn-brand-1 btn-icon-load mt--30 hover-up">Load More Posts</a>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className="section-box mt-50 mb-20">
                        <div className="container">
                            <div className="box-newsletter">
                                <div className="row">
                                    <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                        <img src="assets/imgs/template/newsletter-left.png" alt="joxBox" />
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
                                        <img src="assets/imgs/template/newsletter-right.png" alt="joxBox" />
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
