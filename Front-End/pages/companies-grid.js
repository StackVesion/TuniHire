/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout/Layout";
import BlogSlider from "./../components/sliders/Blog";
import { getCompanies } from "../lib/api";

export default function CompaniesGrid() {
    // Pagination state
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCompanies, setTotalCompanies] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(9); // Number of companies per page
    
    // Filter state
    const [filters, setFilters] = useState({
        location: "",
        industry: "all",
        keyword: "",
        sortBy: "newest", // newest, oldest, rating
    });
    
    // Load companies based on current filters
    useEffect(() => {
        fetchCompanies();
    }, [filters, currentPage, itemsPerPage]);
    
    const fetchCompanies = async () => {
        try {
            setLoading(true);
            
            // Fetch companies from the API
            const result = await getCompanies();
            let filteredCompanies = result.companies || [];
            
            // Filter out companies with 'Pending' status - only show Approved
            filteredCompanies = filteredCompanies.filter(company => 
                company.status !== "Pending"
            );
            
            // Apply client-side filters
            if (filters.location && filters.location !== "all") {
                filteredCompanies = filteredCompanies.filter(company => 
                    company.location && company.location.toLowerCase().includes(filters.location.toLowerCase())
                );
            }
            
            if (filters.industry && filters.industry !== "all") {
                filteredCompanies = filteredCompanies.filter(company => 
                    company.category && company.category.toLowerCase() === filters.industry.toLowerCase()
                );
            }
            
            if (filters.keyword) {
                filteredCompanies = filteredCompanies.filter(company => 
                    company.name.toLowerCase().includes(filters.keyword.toLowerCase()) ||
                    (company.description && company.description.toLowerCase().includes(filters.keyword.toLowerCase()))
                );
            }
            
            // Apply sorting
            if (filters.sortBy === "newest") {
                filteredCompanies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (filters.sortBy === "oldest") {
                filteredCompanies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            } else if (filters.sortBy === "rating") {
                // Assuming companies have a rating property
                filteredCompanies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            }
            
            console.log('Displaying only approved companies:', filteredCompanies.length);
            setCompanies(filteredCompanies);
            setTotalCompanies(filteredCompanies.length);
            
        } catch (err) {
            console.error("Error fetching companies:", err);
            setError("Failed to load companies. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    // Handler for filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterName]: value
        }));
        setCurrentPage(1); // Reset to first page when filters change
    };
    
    // Reset all filters
    const resetFilters = (e) => {
        e.preventDefault();
        setFilters({
            location: "",
            industry: "all",
            keyword: "",
            sortBy: "newest",
        });
        setCurrentPage(1);
    };
    
    // Handle per page change
    const handleItemsPerPageChange = (number) => {
        setItemsPerPage(number);
        setCurrentPage(1); // Reset to first page
    };
    
    // Handle sort change
    const handleSortChange = (sortOption) => {
        handleFilterChange('sortBy', sortOption);
    };
    
    // Get current companies for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCompanies = companies.slice(indexOfFirstItem, indexOfLastItem);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <Layout>
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-company">
                                <div className="block-banner text-center">
                                    <h3 className="wow animate__animated animate__fadeInUp">Browse Companies</h3>
                                    <div className="font-sm color-text-paragraph-2 mt-10 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                                        Discover top companies that are hiring and find your next career opportunity
                                    </div>
                                    <div className="box-list-character">
                                        <ul>
                                            <li>
                                                <Link href="#" className="active">A</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">B</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">C</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">D</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">E</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">F</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">G</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">H</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">I</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">J</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">K</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">L</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">M</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">N</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">O</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">P</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">Q</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">R</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">S</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">T</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">U</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">V</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">W</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">X</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">Y</Link>
                                            </li>
                                            <li>
                                                <Link href="#" className="">Z</Link>
                                            </li>
                                        </ul>
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
                                                        Showing <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalCompanies)} </strong>
                                                        of <strong>{totalCompanies} </strong>companies
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
                                                                    <li onClick={() => handleItemsPerPageChange(9)}>
                                                                        <Link href="#" className={`dropdown-item ${itemsPerPage === 9 ? 'active' : ''}`}>9</Link>
                                                                    </li>
                                                                    <li onClick={() => handleItemsPerPageChange(12)}>
                                                                        <Link href="#" className={`dropdown-item ${itemsPerPage === 12 ? 'active' : ''}`}>12</Link>
                                                                    </li>
                                                                    <li onClick={() => handleItemsPerPageChange(20)}>
                                                                        <Link href="#" className={`dropdown-item ${itemsPerPage === 20 ? 'active' : ''}`}>20</Link>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="box-border">
                                                            <span className="text-sortby">Sort by:</span>
                                                            <div className="dropdown dropdown-sort">
                                                                <button className="btn dropdown-toggle" id="dropdownSort2" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
                                                                    <span>
                                                                        {filters.sortBy === "newest" && "Newest Post"}
                                                                        {filters.sortBy === "oldest" && "Oldest Post"}
                                                                        {filters.sortBy === "rating" && "Rating Post"}
                                                                    </span>
                                                                    <i className="fi-rr-angle-small-down" />
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-light" aria-labelledby="dropdownSort2">
                                                                    <li onClick={() => handleSortChange('newest')}>
                                                                        <Link href="#" className={`dropdown-item ${filters.sortBy === 'newest' ? 'active' : ''}`}>Newest Post</Link>
                                                                    </li>
                                                                    <li onClick={() => handleSortChange('oldest')}>
                                                                        <Link href="#" className={`dropdown-item ${filters.sortBy === 'oldest' ? 'active' : ''}`}>Oldest Post</Link>
                                                                    </li>
                                                                    <li onClick={() => handleSortChange('rating')}>
                                                                        <Link href="#" className={`dropdown-item ${filters.sortBy === 'rating' ? 'active' : ''}`}>Rating Post</Link>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="box-view-type">
                                                            <Link href="/jobs-list" className="view-type">
                                                                <img src="assets/imgs/template/icons/icon-list.svg" alt="jobBox" />
                                                            </Link>

                                                            <Link href="/jobs-grid" className="view-type">
                                                                <img src="assets/imgs/template/icons/icon-grid-hover.svg" alt="jobBox" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            {loading ? (
                                                <div className="col-12 text-center">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            ) : error ? (
                                                <div className="col-12 text-center">
                                                    <div className="alert alert-danger">{error}</div>
                                                </div>
                                            ) : currentCompanies.length === 0 ? (
                                                <div className="col-12 text-center">
                                                    <div className="alert alert-info">No companies found.</div>
                                                </div>
                                            ) : (
                                                currentCompanies.map((company, index) => (
                                                    <div key={company._id} className="col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                                        <div className="card-grid-1 hover-up wow animate__animated animate__fadeIn">
                                                            <div className="image-box">
                                                                <Link href={`/company-details?id=${company._id}`}>
                                                                    <img 
                                                                        src={company.logo || "assets/imgs/brands/brand-1.png"} 
                                                                        alt={company.name} 
                                                                        style={{ 
                                                                            maxWidth: '100%', 
                                                                            maxHeight: '80px', 
                                                                            objectFit: 'contain' 
                                                                        }} 
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="info-text mt-10">
                                                                <h5 className="font-bold">
                                                                    <Link href={`/company-details?id=${company._id}`}>
                                                                        {company.name}
                                                                    </Link>
                                                                </h5>
                                                                <div className="mt-5">
                                                                    <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                                                                    <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                                                                    <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                                                                    <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                                                                    <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                                                                </div>
                                                                <span className="card-location">{company.location || "Location not specified"}</span>
                                                                <div className="mt-30">
                                                                    <Link
                                                                        href={`/jobs-grid?company=${company._id}`}
                                                                        className="btn btn-grey-big"
                                                                    >
                                                                        <span>{company.jobCount !== undefined ? company.jobCount : '...'}</span>
                                                                        <span> {company.jobCount === 1 ? 'Job Open' : 'Jobs Open'}</span>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div className="paginations">
                                        <ul className="pager">
                                            <li>
                                                <Link href="#" className="pager-prev" onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) paginate(currentPage - 1);
                                                }} />
                                            </li>
                                            {Array.from({ length: Math.ceil(totalCompanies / itemsPerPage) }).map((_, index) => (
                                                <li key={index}>
                                                    <Link href="#" className={`pager-number ${currentPage === index + 1 ? 'active' : ''}`} onClick={(e) => {
                                                        e.preventDefault();
                                                        paginate(index + 1);
                                                    }}>
                                                        {index + 1}
                                                    </Link>
                                                </li>
                                            ))}
                                            <li>
                                                <Link href="#" className="pager-next" onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage < Math.ceil(totalCompanies / itemsPerPage)) {
                                                        paginate(currentPage + 1);
                                                    }
                                                }} />
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-12 col-sm-12 col-12">
                                    <div className="sidebar-shadow none-shadow mb-30">
                                        <div className="sidebar-filters">
                                            <div className="filter-block head-border mb-30">
                                                <h5>
                                                    Advance Filter
                                                    <Link href="#" className="link-reset" onClick={resetFilters}>Reset</Link>
                                                </h5>
                                            </div>
                                            <div className="filter-block mb-30">
                                                <div className="form-group select-style select-style-icon">
                                                    <select 
                                                        className="form-control form-icons select-active"
                                                        value={filters.location}
                                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                                    >
                                                        <option value="">All Locations</option>
                                                        <option value="New York, US">New York, US</option>
                                                        <option value="London">London</option>
                                                        <option value="Paris">Paris</option>
                                                        <option value="Berlin">Berlin</option>
                                                    </select>
                                                    <i className="fi-rr-marker" />
                                                </div>
                                            </div>
                                            <div className="filter-block mb-20">
                                                <h5 className="medium-heading mb-15">Industry</h5>
                                                <div className="form-group">
                                                    <ul className="list-checkbox">
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={filters.industry === "all"} 
                                                                    onChange={() => handleFilterChange('industry', 'all')}
                                                                />
                                                                <span className="text-small">All</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">180</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={filters.industry === "software"} 
                                                                    onChange={() => handleFilterChange('industry', 'software')}
                                                                />
                                                                <span className="text-small">Software</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">12</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.industry === "finance"} 
                                                                    onChange={() => handleFilterChange('industry', 'finance')}
                                                                />
                                                                <span className="text-small">Finance</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">23</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.industry === "recruiting"} 
                                                                    onChange={() => handleFilterChange('industry', 'recruiting')}
                                                                />
                                                                <span className="text-small">Recruiting</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">43</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.industry === "management"} 
                                                                    onChange={() => handleFilterChange('industry', 'management')}
                                                                />
                                                                <span className="text-small">Management</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">65</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.industry === "advertising"} 
                                                                    onChange={() => handleFilterChange('industry', 'advertising')}
                                                                />
                                                                <span className="text-small">Advertising</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">76</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            
                                            <div className="filter-block mb-30">
                                                <h5 className="medium-heading mb-10">Popular Keyword</h5>
                                                <div className="form-group">
                                                    <ul className="list-checkbox">
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={filters.keyword === "software"}
                                                                    onChange={() => handleFilterChange('keyword', filters.keyword === "software" ? "" : "software")}
                                                                />
                                                                <span className="text-small">Software</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">24</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.keyword === "developer"} 
                                                                    onChange={() => handleFilterChange('keyword', filters.keyword === "developer" ? "" : "developer")}
                                                                />
                                                                <span className="text-small">Developer</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">45</span>
                                                        </li>
                                                        <li>
                                                            <label className="cb-container">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.keyword === "web"} 
                                                                    onChange={() => handleFilterChange('keyword', filters.keyword === "web" ? "" : "web")}
                                                                />
                                                                <span className="text-small">Web</span>
                                                                <span className="checkmark" />
                                                            </label>
                                                            <span className="number-item">57</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                        
                                            
                                        </div>
                                    </div>
                                </div>
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
                                    <Link href="blog-grid" className="btn btn-brand-1 btn-icon-load mt--30 hover-up">Load More Posts</Link>
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
