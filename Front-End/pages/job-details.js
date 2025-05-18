/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout/Layout";
import FeaturedSlider from "./../components/sliders/Featured";
import axios from 'axios';
import Swal from "sweetalert2";

export default function JobDetails() {
    const router = useRouter();
    const { id } = router.query;
    
    const [job, setJob] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchJobDetails = async () => {
            if (!id) return; // Wait until we have the ID
            
            setLoading(true);
            setError(null);
            
            try {
                // 1. Fetch job post details first
                const jobResponse = await axios.get(`http://localhost:5000/api/jobs/${id}`);
                const jobData = jobResponse.data;
                setJob(jobData);
                
                // 2. Fetch company details using our new endpoint
                try {
                    const companyResponse = await axios.get(`http://localhost:5000/api/jobs/job/${id}/company`);
                    setCompany(companyResponse.data);
                } catch (companyError) {
                    console.error("Error fetching company:", companyError);
                    // We don't set the main error state here to allow the page to still render with job data
                }
            } catch (err) {
                console.error("Error fetching job details:", err);
                setError("Failed to load job details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchJobDetails();
    }, [id]);
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };
    
    // Format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return "N/A";
        
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
    
    if (loading) {
        return (
            <Layout>
                <div className="container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading job details...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container text-center py-5">
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                    <button 
                        className="btn btn-outline-primary mt-3" 
                        onClick={() => router.back()}
                    >
                        Go Back
                    </button>
                </div>
            </Layout>
        );
    }

    if (!job) {
        return (
            <Layout>
                <div className="container text-center py-5">
                    <p>No job details found.</p>
                    <button 
                        className="btn btn-outline-primary mt-3" 
                        onClick={() => router.push('/jobs-grid')}
                    >
                        Browse Jobs
                    </button>
                </div>
            </Layout>
        );
    }
    
    return (
        <>
            <Layout>
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-image-single">
                                <img src="assets/imgs/page/job-single/thumb.png" alt="jobBox" />
                            </div>
                            <div className="row mt-10">
                                <div className="col-lg-8 col-md-12">
                                    <h3 className="job-title-detail">{job.title}</h3>
                                    <div className="mt-0 mb-15 d-flex align-items-center">
                                        <Link href={`/company-details?id=${job.companyId}`} className="name-job">
                                            <i className="fi-rr-building mr-5"></i> {company?.name || job.companyName || "Company Name"}
                                        </Link>
                                        <span className="card-location ml-15"><i className="fi-rr-marker mr-5"></i> {job.location || "Remote"}</span>
                                        <span className="card-briefcase ml-15"><i className="fi-rr-briefcase mr-5"></i> {job.workplaceType}</span>
                                        <span className="card-time ml-15"><i className="fi-rr-clock mr-5"></i> {formatTimeAgo(job.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-12 text-lg-end">
                                    <a href="http://localhost:3001/apply-for-jobs" className="btn btn-apply-icon btn-apply btn-apply-big hover-up" style={{backgroundColor: '#3b82f6', borderColor: '#3b82f6'}}>
                                        <i className="fi-rr-paper-plane mr-5"></i> Apply now
                                    </a>
                                </div>
                            </div>
                            <div className="border-bottom pt-10 pb-10" />
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-8 col-md-12 col-sm-12 col-12">
                                    <div className="job-overview">
                                        <h5 className="border-bottom pb-15 mb-30">Employment Information</h5>
                                        <div className="row">
                                            <div className="col-md-6 d-flex">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/industry.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description industry-icon mb-10">Industry</span>
                                                    <strong className="small-heading">{job.industry || "Not specified"}</strong>
                                                </div>
                                            </div>
                                            <div className="col-md-6 d-flex mt-sm-15">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/job-level.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description joblevel-icon mb-10">Job level</span>
                                                    <strong className="small-heading">{job.level || "Not specified"}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mt-25">
                                            <div className="col-md-6 d-flex mt-sm-15">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/salary.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description salary-icon mb-10">Salary</span>
                                                    <strong className="small-heading">{job.salaryRange || "Not specified"}</strong>
                                                </div>
                                            </div>
                                            <div className="col-md-6 d-flex">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/experience.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description experience-icon mb-10">Experience</span>
                                                    <strong className="small-heading">{job.experience || "Not specified"}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mt-25">
                                            <div className="col-md-6 d-flex mt-sm-15">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/job-type.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description jobtype-icon mb-10">Job type</span>
                                                    <strong className="small-heading">{job.jobType || job.workplaceType || "Not specified"}</strong>
                                                </div>
                                            </div>
                                            <div className="col-md-6 d-flex mt-sm-15">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/deadline.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description mb-10">Deadline</span>
                                                    <strong className="small-heading">{job.deadline ? formatDate(job.deadline) : "Not specified"}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mt-25">
                                            <div className="col-md-6 d-flex mt-sm-15">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/updated.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description jobtype-icon mb-10">Updated</span>
                                                    <strong className="small-heading">{job.updatedAt ? formatDate(job.updatedAt) : formatDate(job.createdAt)}</strong>
                                                </div>
                                            </div>
                                            <div className="col-md-6 d-flex mt-sm-15">
                                                <div className="sidebar-icon-item">
                                                    <img src="assets/imgs/page/job-single/location.svg" alt="jobBox" />
                                                </div>
                                                <div className="sidebar-text-info ml-10">
                                                    <span className="text-description mb-10">Location</span>
                                                    <strong className="small-heading">{job.location || "Not specified"}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="content-single">
                                        <h4>Job Description</h4>
                                        <p dangerouslySetInnerHTML={{ __html: job.description }}></p>
                                        
                                        {job.requirements && job.requirements.length > 0 && (
                                            <>
                                                <h4>Requirements</h4>
                                                <ul>
                                                    {job.requirements.map((req, index) => (
                                                        <li key={index}>{req}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        
                                        {job.responsibilities && job.responsibilities.length > 0 && (
                                            <>
                                                <h4>Responsibilities</h4>
                                                <ul>
                                                    {job.responsibilities.map((resp, index) => (
                                                        <li key={index}>{resp}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        
                                        {job.benefits && job.benefits.length > 0 && (
                                            <>
                                                <h4>Benefits</h4>
                                                <ul>
                                                    {job.benefits.map((benefit, index) => (
                                                        <li key={index}>{benefit}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                    <div className="author-single">
                                        <span>{job.companyName || "Company"}</span>
                                    </div>
                                    <div className="single-apply-jobs">
                                        <div className="row align-items-center">
                                            <div className="col-md-7 d-flex gap-3">
                                                <a href="http://localhost:3001/apply-for-jobs" className="btn btn-apply-icon btn-apply btn-apply-big hover-up" style={{backgroundColor: '#3b82f6', borderColor: '#3b82f6'}}>
                                                    <i className="fi-rr-paper-plane mr-5"></i> Apply now
                                                </a>
                                                
                                                <Link href="#" className="btn btn-border">
                                                    <i className="fi-rr-bookmark mr-5"></i> Save job
                                                </Link>
                                            </div>
                                            <div className="col-md-7 text-lg-end social-share">
                                                <h6 className="color-text-paragraph-2 d-inline-block d-baseline mr-10">Share this</h6>
                                                <Link href="#" className="mr-5 d-inline-block d-middle">
                                                    <img alt="jobBox" src="assets/imgs/template/icons/share-fb.svg" />
                                                </Link>

                                                <Link href="#" className="mr-5 d-inline-block d-middle">
                                                    <img alt="jobBox" src="assets/imgs/template/icons/share-tw.svg" />
                                                </Link>

                                                <Link href="#" className="mr-5 d-inline-block d-middle">
                                                    <img alt="jobBox" src="assets/imgs/template/icons/share-red.svg" />
                                                </Link>

                                                <Link href="#" className="d-inline-block d-middle">
                                                    <img alt="jobBox" src="assets/imgs/template/icons/share-whatsapp.svg" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-12 col-sm-12 col-12 pl-40 pl-lg-15 mt-lg-30">
                                    <div className="sidebar-border">
                                        <div className="sidebar-heading">
                                            <div className="avatar-sidebar">
                                                <figure>
                                                    {company?.logo ? (
                                                        <img alt={company.name} src={company.logo} />
                                                    ) : (
                                                        <img alt="company" src="assets/imgs/page/job-single/avatar.png" />
                                                    )}
                                                </figure>
                                                <div className="sidebar-info">
                                                    <span className="sidebar-company">{company?.name || "Company"}</span>
                                                    <span className="card-location">{company?.location || job.location}</span>
                                                    {company?._id && (
                                                        <Link 
                                                            href={`/company-details?id=${company._id}`}
                                                            className="link-underline mt-15"
                                                        >
                                                            View Company Profile
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sidebar-list-job">
                                            <ul>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-marker" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Location</span>
                                                        <strong className="small-heading">{company?.location || job.location || "Not specified"}</strong>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-briefcase" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Job type</span>
                                                        <strong className="small-heading">{job.jobType || job.workplaceType || "Not specified"}</strong>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="sidebar-icon-item">
                                                        <i className="fi-rr-dollar" />
                                                    </div>
                                                    <div className="sidebar-text-info">
                                                        <span className="text-description">Salary</span>
                                                        <strong className="small-heading">{job.salaryRange || "Not specified"}</strong>
                                                    </div>
                                                </li>
                                                {company?.numberOfEmployees && (
                                                    <li>
                                                        <div className="sidebar-icon-item">
                                                            <i className="fi-rr-users" />
                                                        </div>
                                                        <div className="sidebar-text-info">
                                                            <span className="text-description">Company Size</span>
                                                            <strong className="small-heading">{company.numberOfEmployees}</strong>
                                                        </div>
                                                    </li>
                                                )}
                                                {company?.category && (
                                                    <li>
                                                        <div className="sidebar-icon-item">
                                                            <i className="fi-rr-building" />
                                                        </div>
                                                        <div className="sidebar-text-info">
                                                            <span className="text-description">Industry</span>
                                                            <strong className="small-heading">{company.category}</strong>
                                                        </div>
                                                    </li>
                                                )}
                                                {company?.createdAt && (
                                                    <li>
                                                        <div className="sidebar-icon-item">
                                                            <i className="fi-rr-time-fast" />
                                                        </div>
                                                        <div className="sidebar-text-info">
                                                            <span className="text-description">Founded</span>
                                                            <strong className="small-heading">
                                                                {new Date(company.createdAt).getFullYear()}
                                                            </strong>
                                                        </div>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="sidebar-list-job">
                                            <ul className="ul-disc">
                                                {company?.phone && (
                                                    <li>Phone: {company.phone}</li>
                                                )}
                                                {company?.email && (
                                                    <li>Email: {company.email}</li>
                                                )}
                                                {company?.website && (
                                                    <li>
                                                        Website: <Link 
                                                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                        >
                                                            {company.website}
                                                        </Link>
                                                    </li>
                                                )}
                                                {company?.projects && company.projects.length > 0 && (
                                                    <li>
                                                        <span className="font-sm">Projects: </span>
                                                        <div className="mt-5">
                                                            {company.projects.map((project, index) => (
                                                                <span key={index} className="btn btn-grey-small mr-5 mb-5">{project}</span>
                                                            ))}
                                                        </div>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="mt-30">
                                            <Link 
                                                href="/candidate-profile?activeTab=2"
                                                className="btn btn-send-message"
                                            >
                                                Apply now
                                            </Link>
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
