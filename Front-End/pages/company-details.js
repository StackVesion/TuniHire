/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Layout from "../components/Layout/Layout";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { getCompanyById, getJobsByCompany } from "../lib/api";

export default function CompanyDetails() {
    const [activeIndex, setActiveIndex] = useState(1);
    const [user, setUser] = useState(null);
    const [company, setCompany] = useState(null);
    const [companyJobs, setCompanyJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(true);
    const router = useRouter();
    const { id } = router.query;

    const handleOnClick = (index) => {
        setActiveIndex(index); 
    };

    useEffect(() => {
        // Fetch user data when component mounts
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get('http://localhost:5000/api/users/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(response.data.user);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        // Fetch company data when id is available
        const fetchCompanyData = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const response = await getCompanyById(id);
                setCompany(response.company);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching company data:', error);
                setLoading(false);
                
                // Show error message and redirect if company not found
                Swal.fire({
                    title: 'Error!',
                    text: 'Company not found or you do not have permission to view it.',
                    icon: 'error',
                }).then(() => {
                    router.push('/companies-grid');
                });
            }
        };

        fetchCompanyData();
    }, [id, router]);
    
    // Fetch company jobs
    useEffect(() => {
        const fetchCompanyJobs = async () => {
            if (!id) return;
            
            try {
                setJobsLoading(true);
                const response = await getJobsByCompany(id);
                console.log('Jobs response:', response);
                
                if (response.jobs && Array.isArray(response.jobs)) {
                    setCompanyJobs(response.jobs);
                    console.log(`Loaded ${response.jobs.length} jobs for company`);
                } else {
                    console.warn('No jobs array in response:', response);
                    setCompanyJobs([]);
                }
                setJobsLoading(false);
            } catch (error) {
                console.error('Error fetching company jobs:', error);
                setJobsLoading(false);
                setCompanyJobs([]);
            }
        };
        
        fetchCompanyJobs();
    }, [id]);

    // Function to handle Apply for Company button click
    const handleApplyForCompany = async () => {
        try {
            if (!user) {
                Swal.fire({
                    title: 'Please Login',
                    text: 'You need to be logged in to apply for a company',
                    icon: 'warning',
                    confirmButtonText: 'Go to Login',
                    showCancelButton: true,
                }).then((result) => {
                    if (result.isConfirmed) {
                        router.push('/login');
                    }
                });
                return;
            }

            // Verify user role is candidate
            if (user.role !== 'candidate') {
                Swal.fire({
                    title: 'Not Eligible',
                    text: 'Only candidates can apply for creating a company',
                    icon: 'error',
                });
                return;
            }

            // Show company creation form
            const { value: formValues } = await Swal.fire({
                title: 'Create Company',
                html:
                    '<input id="swal-name" class="swal2-input" placeholder="Company Name*" required>' +
                    '<input id="swal-email" class="swal2-input" placeholder="Company Email*" required>' +
                    '<input id="swal-website" class="swal2-input" placeholder="Website">' +
                    '<input id="swal-category" class="swal2-input" placeholder="Category">' +
                    '<input id="swal-employees" class="swal2-input" type="number" placeholder="Number of Employees">',
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Submit',
                preConfirm: () => {
                    const name = document.getElementById('swal-name').value;
                    const email = document.getElementById('swal-email').value;
                    
                    // Basic validation
                    if (!name || !email) {
                        Swal.showValidationMessage('Company name and email are required');
                        return false;
                    }
                    
                    return {
                        name: name,
                        email: email,
                        website: document.getElementById('swal-website').value,
                        category: document.getElementById('swal-category').value,
                        numberOfEmployees: document.getElementById('swal-employees').value || 0
                    }
                }
            });

            if (formValues) {
                setLoading(true);
                
                // Get token from localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Not authenticated');
                }

                // Call API to create company
                const response = await axios.post(
                    'http://localhost:5000/api/companies',
                    formValues,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setLoading(false);
                
                // Show success message
                Swal.fire({
                    title: 'Application Submitted!',
                    text: 'Your company application has been submitted and is pending approval',
                    icon: 'success',
                }).then(() => {
                    // Redirect to dashboard or refresh page
                    router.push('/company-details');
                });
            }
        } catch (error) {
            setLoading(false);
            console.error('Error creating company:', error);
            
            // Show error message
            Swal.fire({
                title: 'Error!',
                text: error.response?.data?.message || 'Failed to create company. Please try again.',
                icon: 'error',
            });
        }
    };
    
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-image-single">
                                <img src="assets/imgs/page/company/img.png" alt="jobBox" />
                            </div>
                            <div className="box-company-profile">
                                <div className="image-compay">
                                    {company?.logo ? (
                                        <img 
                                            src={company.logo}
                                            alt={company?.name}
                                            style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <img src="assets/imgs/page/company/company.png" alt="Default company logo" />
                                    )}
                                </div>
                                <div className="row mt-10">
                                    <div className="col-lg-8 col-md-12">
                                        <h5 className="f-18">
                                            {company?.name} <span className="card-location font-regular ml-20">{company?.location}</span>
                                        </h5>
                                        <p className="mt-5 font-md color-text-paragraph-2 mb-15">{company?.description}</p>
                                    </div>
                                    <div className="col-lg-4 col-md-12 text-lg-end">
                                        {user && user.role === "candidate" ? (
                                            <button 
                                                className="btn btn-call-icon btn-apply btn-apply-big" 
                                                onClick={handleApplyForCompany}
                                                disabled={loading}
                                            >
                                                {loading ? 'Processing...' : 'Apply for Company'}
                                            </button>
                                        ) : (
                                            <Link legacyBehavior href="page-contact">
                                                <a className="btn btn-call-icon btn-apply btn-apply-big">Contact us</a>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="box-nav-tabs mt-40 mb-5">
                                <ul className="nav" role="tablist">
                                    <li>
                                        <a className="btn btn-border aboutus-icon mr-15 mb-5 active" onClick={() => handleOnClick(1)}>
                                            About us
                                        </a>
                                    </li>
                                    <li>
                                        <a className="btn btn-border recruitment-icon mr-15 mb-5" onClick={() => handleOnClick(2)}>
                                            Recruitments
                                        </a>
                                    </li>
                                    <li>
                                        <a className="btn btn-border people-icon mb-5" onClick={() => handleOnClick(3)}>
                                            People
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="border-bottom pt-10 pb-10" />
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-8 col-md-12 col-sm-12 col-12">
                                    <div className="content-single">
                                        <div className="tab-content">
                                            <div className={`tab-pane fade ${activeIndex === 1 && "show active"}`}>
                                                <h4>Welcome to {company?.name}</h4>
                                                <p>{company?.description}</p>
                                                <h4>Essential Knowledge, Skills, and Experience</h4>
                                                <ul>
                                                    <li>A portfolio demonstrating well thought through and polished end to end customer journeys</li>
                                                    <li>5+ years of industry experience in interactive design and / or visual design</li>
                                                    <li>Excellent interpersonal skills</li>
                                                    <li>Aware of trends in mobile, communications, and collaboration</li>
                                                    <li>Ability to create highly polished design prototypes, mockups, and other communication artifacts</li>
                                                    <li>The ability to scope and estimate efforts accurately and prioritize tasks and goals independently</li>
                                                    <li>History of impacting shipping products with your work</li>
                                                    <li>A Bachelor s Degree in Design (or related field) or equivalent professional experience</li>
                                                    <li>Proficiency in a variety of design tools such as Figma, Photoshop, Illustrator, and Sketch</li>
                                                </ul>
                                            </div>
                                            <div className={`tab-pane fade ${activeIndex === 2 && "show active"}`}>
                                                <h4>Recruitments</h4>
                                                <p>{company?.description}</p>
                                            </div>
                                            <div className={`tab-pane fade ${activeIndex === 3 && "show active"}`}>
                                                <h4>People</h4>
                                                <p>{company?.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="box-related-job content-page">
                                        <h5 className="mb-30">Latest Jobs</h5>
                                        <div className="box-list-jobs display-list">
                                            {jobsLoading ? (
                                                <div className="text-center p-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading jobs...</span>
                                                    </div>
                                                    <p className="mt-2">Loading available jobs...</p>
                                                </div>
                                            ) : companyJobs.length === 0 ? (
                                                <div className="text-center p-4">
                                                    <p>No jobs available from this company at the moment.</p>
                                                    <Link legacyBehavior href="/companies-grid">
                                                        <a className="btn btn-outline-primary mt-3">
                                                            <i className="fi-rr-building mr-5"></i>
                                                            Browse other companies
                                                        </a>
                                                    </Link>
                                                </div>
                                            ) : (
                                                companyJobs.map((job, index) => (
                                                    <div key={job._id || index} className="col-xl-12 col-12">
                                                        <div className="card-grid-2 hover-up">
                                                            <span className="flash" />
                                                            <div className="row">
                                                                <div className="col-lg-6 col-md-6 col-sm-12">
                                                                    <div className="card-grid-2-image-left">
                                                                        <div className="image-box">
                                                                            <img 
                                                                                src={company?.logo || "assets/imgs/brands/brand-6.png"} 
                                                                                alt={company?.name}
                                                                                style={{ maxHeight: '60px', objectFit: 'contain' }}
                                                                            />
                                                                        </div>
                                                                        <div className="right-info">
                                                                            <Link legacyBehavior href="#">
                                                                                <a className="name-job">{company?.name}</a>
                                                                            </Link>
                                                                            <span className="location-small">{job.location || company?.location}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6 text-start text-md-end pr-60 col-md-6 col-sm-12">
                                                                    <div className="pl-15 mb-15 mt-30">
                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">{job.category}</a>
                                                                        </Link>

                                                                        <Link legacyBehavior href="#">
                                                                            <a className="btn btn-grey-small mr-5">{job.type || 'Full-time'}</a>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-block-info">
                                                                <h4>
                                                                    <Link legacyBehavior href={`/job-details?id=${job._id}`}>
                                                                        <a>{job.title}</a>
                                                                    </Link>
                                                                </h4>
                                                                <div className="mt-5">
                                                                    <span className="card-briefcase">{job.type || 'Full-time'}</span>
                                                                    <span className="card-time">
                                                                        <span>Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'recently'}</span>
                                                                    </span>
                                                                </div>
                                                                <p className="font-sm color-text-paragraph mt-10">
                                                                    {job.description ? 
                                                                        (job.description.length > 150 ? 
                                                                            job.description.substring(0, 150) + '...' : 
                                                                            job.description) : 
                                                                        'No description available'
                                                                    }
                                                                </p>
                                                                <div className="card-2-bottom mt-20">
                                                                    <div className="row">
                                                                        <div className="col-lg-7 col-7">
                                                                            <span className="card-text-price">{job.salaryRange || 'Negotiable'}</span>
                                                                            {job.salaryRange && <span className="text-muted">/Month</span>}
                                                                        </div>
                                                                        <div className="col-lg-5 col-5 text-end">
                                                                            <Link legacyBehavior href={`/job-details?id=${job._id}`}>
                                                                                <a className="btn btn-apply-now">
                                                                                    View details
                                                                                </a>
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
                                        {companyJobs.length > 0 && (
                                            <div className="paginations mt-4">
                                                <Link legacyBehavior href="/jobs-grid">
                                                    <a className="btn btn-brand-1 btn-icon">
                                                        <i className="fi-rr-briefcase me-2"></i>
                                                        View all jobs
                                                    </a>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-12 col-sm-12 col-12 pl-40 pl-lg-15 mt-lg-30">
                                    <div className="sidebar-border">
                                        <div className="sidebar-heading">
                                            <div className="avatar-sidebar">
                                                <div className="sidebar-info pl-0">
                                                    <span className="sidebar-company">{company?.name}</span>
                                                    <span className="card-location">{company?.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sidebar-list-job">
                                            <div className="box-map">
                                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.3150609575905!2d-87.6235655!3d41.886080899999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2ca8b34afe61%3A0x6caeb5f721ca846!2s205%20N%20Michigan%20Ave%20Suit%20810%2C%20Chicago%2C%20IL%2060601%2C%20Hoa%20K%E1%BB%B3!5e0!3m2!1svi!2s!4v1658551322537!5m2!1svi!2s" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                                            </div>
                                        </div>
                                        <div className="sidebar-list-job">
                                            <ul>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-briefcase" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Company field</span>
                                                        <strong className="small-heading">{company?.category}</strong>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-marker" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Location</span>
                                                        <strong className="small-heading">{company?.location}</strong>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-dollar" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Salary</span>
                                                        <strong className="small-heading">$35k - $45k</strong>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-clock" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Member since</span>
                                                        <strong className="small-heading">Jul 2012</strong>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-time-fast" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Last Jobs Posted</span>
                                                        <strong className="small-heading">4 days</strong>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="sidebar-list-job">
                                            <ul className="ul-disc">
                                                <li>205 North Michigan Avenue, Suite 810 Chicago, 60601, USA</li>
                                                <li>Phone: (123) 456-7890</li>
                                                <li>Email: contact@Evara.com</li>
                                            </ul>
                                            <div className="mt-30">
                                                <Link legacyBehavior href="page-contact">
                                                    <a className="btn btn-send-message">Send Message</a>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sidebar-border-bg bg-right">
                                        <span className="text-grey">WE ARE</span>
                                        <span className="text-hiring">HIRING</span>
                                        <p className="font-xxs color-text-paragraph mt-5">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae architecto</p>
                                        <div className="mt-15">
                                            <Link legacyBehavior href="page-contact">
                                                <a className="btn btn-paragraph-2">Know More</a>
                                            </Link>
                                        </div>
                                    </div>
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
