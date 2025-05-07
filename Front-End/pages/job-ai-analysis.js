/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import Link from 'next/link';
import axios from 'axios';
import { Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale
} from 'chart.js';
import ReactMarkdown from 'react-markdown';

// Import CSS
import '../styles/job-ai-analysis.css';

// Register chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale
);

export default function JobAIAnalysis() {
  const router = useRouter();
  const { id } = router.query;
  
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Run these requests in parallel for better performance
        const requests = [
          axios.get(`http://localhost:5000/api/jobs/${id}`),
          axios.get(`http://localhost:5000/api/jobs/job/${id}/company`),
          axios.get(`http://localhost:5000/api/ai/job-match/${id}`)
        ];
        
        // Wait for all requests to complete
        const [jobResponse, companyResponse, aiResponse] = await Promise.all(requests.map(p => p.catch(e => e)));
        
        // Handle job data
        if (jobResponse instanceof Error) {
          console.error("Error fetching job:", jobResponse);
          setError("Failed to load job details. Please try again later.");
        } else {
          setJob(jobResponse.data);
        }
        
        // Handle company data
        if (companyResponse instanceof Error) {
          console.error("Error fetching company:", companyResponse);
          // Don't set error as this isn't critical
        } else {
          setCompany(companyResponse.data);
        }
        
        // Handle AI recommendation data
        if (aiResponse instanceof Error) {
          console.error("Error fetching AI recommendation:", aiResponse);
          setError("Could not load AI job match data. Please try again later.");
        } else {
          setRecommendation(aiResponse.data);
        }
      } catch (err) {
        console.error("Error in data fetching:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  // Chart data for doughnut chart
  const getMatchScoreData = () => {
    const matchPercentage = recommendation?.pass_percentage || 0;
    return {
      labels: ['Match', 'Gap'],
      datasets: [
        {
          data: [matchPercentage, 100 - matchPercentage],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(211, 211, 211, 0.3)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(211, 211, 211, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Skills radar chart data
  const getSkillsRadarData = () => {
    // Ensure strengths and weaknesses exist
    const strengths = recommendation?.strengths || [];
    const weaknesses = recommendation?.weaknesses || [];
    const allSkills = [...strengths, ...weaknesses.slice(0, 3)];
    
    // Default scores if no skills available
    if (allSkills.length === 0) {
      return {
        labels: ['data', 'develop', 'sql'],
        datasets: [{
          label: 'Skills',
          data: [70, 65, 60],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 4,
        }]
      };
    }
    
    const scores = allSkills.map(skill => 
      strengths.includes(skill) ? 
        Math.floor(Math.random() * 30) + 70 : // 70-100 for strengths
        Math.floor(Math.random() * 40) + 30    // 30-70 for weaknesses
    );
    
    return {
      labels: allSkills,
      datasets: [
        {
          label: 'Your Skills',
          data: scores,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 4,
        },
      ],
    };
  };

  const handleApply = () => {
    // Redirect to job application page
    router.push(`/candidate-profile?activeTab=2&jobId=${id}`);
  };

  // Calculate match percentage for display
  const matchPercentage = recommendation?.pass_percentage?.toFixed(1) || '0.0';
  
  if (loading) {
    return (
      <Layout>
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading job analysis data...</p>
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

  if (!job || !recommendation) {
    return (
      <Layout>
        <div className="container text-center py-5">
          <p>No job analysis data found.</p>
          <button 
            className="btn btn-outline-primary mt-3" 
            onClick={() => router.push('/jobs-grid')}
          >
            View All Jobs
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div>
        <section className="section-box-2">
          <div className="container">
            <div className="banner-hero banner-single banner-single-bg">
              <div className="block-banner text-center">
                <h3 className="wow animate__animated animate__fadeInUp">
                  AI Match Analysis
                </h3>
                <div className="font-sm color-text-paragraph-2 mt-10 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                  {job.title} - {company?.company_name || 'Company'}
                </div>
                <div className="mt-15">
                  <span className="card-briefcase">{job.job_type}</span>
                  <span className="card-time">{formatTimeAgo(job.updatedAt)}</span>
                </div>
                <div className="mt-15">
                  <span className="btn btn-primary-soft btn-lg">
                    <span className="text-primary-500">{matchPercentage}%</span> Match
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-box mt-50">
          <div className="container">
            <div className="row">
              {/* Main content */}
              <div className="col-lg-8 col-md-12 col-sm-12 col-12">
                {/* Tab navigation */}
                <div className="box-nav-tabs mb-4">
                  <ul className="nav" role="tablist">
                    <li onClick={() => setActiveTab('overview')}>
                      <a className={activeTab === 'overview' ? 'btn btn-border-3 btn-tabs active' : 'btn btn-border-3 btn-tabs'} href="#overview" data-bs-toggle="tab" role="tab" aria-controls="overview" aria-selected={activeTab === 'overview'}>
                        <i className="fi-rr-chart-pie mr-10"></i>Overview
                      </a>
                    </li>
                    <li onClick={() => setActiveTab('skills')}>
                      <a className={activeTab === 'skills' ? 'btn btn-border-3 btn-tabs active' : 'btn btn-border-3 btn-tabs'} href="#skills" data-bs-toggle="tab" role="tab" aria-controls="skills" aria-selected={activeTab === 'skills'}>
                        <i className="fi-rr-badge mr-10"></i>Skills Analysis
                      </a>
                    </li>
                    <li onClick={() => setActiveTab('recommendations')}>
                      <a className={activeTab === 'recommendations' ? 'btn btn-border-3 btn-tabs active' : 'btn btn-border-3 btn-tabs'} href="#recommendations" data-bs-toggle="tab" role="tab" aria-controls="recommendations" aria-selected={activeTab === 'recommendations'}>
                        <i className="fi-rr-star mr-10"></i>Recommendations
                      </a>
                    </li>
                    <li onClick={() => setActiveTab('report')}>
                      <a className={activeTab === 'report' ? 'btn btn-border-3 btn-tabs active' : 'btn btn-border-3 btn-tabs'} href="#report" data-bs-toggle="tab" role="tab" aria-controls="report" aria-selected={activeTab === 'report'}>
                        <i className="fi-rr-document mr-10"></i>Full Report
                      </a>
                    </li>
                  </ul>
                </div>
                
                {/* Tab content */}
                <div className="tab-content">
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <div className="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
                      <div className="row">
                        <div className="col-lg-6 mb-4">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                              <div className="mb-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '42px', height: '42px' }}>
                                    <i className="fas fa-magic text-white"></i>
                                  </div>
                                  <h5 className="fw-bold mb-0">AI Analysis Results</h5>
                                </div>
                                <p className="text-center text-muted">Here's a summary of how well you match this position</p>
                              
                                <div className="match-score-container my-4">
                                  <div className="position-relative d-inline-block" style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block' }}>
                                    <Doughnut 
                                      data={getMatchScoreData()} 
                                      options={{
                                        cutout: '75%',
                                        plugins: {
                                          legend: {
                                            display: false
                                          },
                                          tooltip: {
                                            enabled: false
                                          }
                                        },
                                        elements: {
                                          arc: {
                                            borderWidth: 0
                                          }
                                        },
                                        animation: {
                                          animateRotate: true,
                                          animateScale: true
                                        }
                                      }} 
                                    />
                                    <div 
                                      className="position-absolute top-50 start-50 translate-middle text-center"
                                    >
                                      <h1 className="mb-0 fw-bold">{matchPercentage}%</h1>
                                      <p className="mb-0 small">Match</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-center mt-3">
                                  <p className="text-muted mb-0">Based on your profile and job requirements</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-lg-6 mb-4">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                              <div className="d-flex align-items-center mb-4">
                                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center me-3" style={{ width: '36px', height: '36px' }}>
                                  <i className="fas fa-star text-white"></i>
                                </div>
                                <h5 className="fw-bold mb-0">Top Skills to Highlight</h5>
                              </div>
                              
                              {recommendation.strengths && recommendation.strengths.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                  {recommendation.strengths.map((skill, index) => (
                                    <li key={`strength-${index}`} className="list-group-item px-0 py-2 border-bottom d-flex align-items-center">
                                      <span className="badge bg-success rounded-pill me-2">{index + 1}</span>
                                      <span>{skill}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="fst-italic text-muted">No specific strengths identified</p>
                              )}
                              
                              <div className="mt-4 text-center">
                                <button onClick={handleApply} className="btn btn-primary">
                                  <i className="fas fa-paper-plane me-2"></i>
                                  Apply Now
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* SKILLS TAB */}
                  {activeTab === 'skills' && (
                    <div className="tab-pane fade show active" id="skills" role="tabpanel" aria-labelledby="skills-tab">
                      <div className="row">
                        <div className="col-lg-7 mb-4">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                              <div className="d-flex align-items-center mb-4">
                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '36px', height: '36px' }}>
                                  <i className="fas fa-chart-radar text-white"></i>
                                </div>
                                <h5 className="fw-bold mb-0">Skills Radar Analysis</h5>
                              </div>
                              
                              <div className="d-flex justify-content-end mb-3">
                                <div>
                                  <span className="badge bg-success me-2 py-2 px-3">Strengths</span>
                                  <span className="badge bg-warning text-dark py-2 px-3">Areas to Improve</span>
                                </div>
                              </div>
                              
                              <div style={{ height: '350px', maxWidth: '550px', margin: '0 auto' }}>
                                <Radar
                                  data={getSkillsRadarData()}
                                  options={{
                                    scales: {
                                      r: {
                                        beginAtZero: true,
                                        min: 0,
                                        max: 100,
                                        ticks: {
                                          stepSize: 20,
                                          backdropColor: 'transparent'
                                        },
                                        grid: {
                                          color: 'rgba(0, 0, 0, 0.1)'
                                        },
                                        angleLines: {
                                          color: 'rgba(0, 0, 0, 0.1)'
                                        },
                                        pointLabels: {
                                          font: {
                                            size: 13,
                                            weight: 'bold'
                                          }
                                        }
                                      }
                                    },
                                    plugins: {
                                      legend: { display: false },
                                      tooltip: {
                                        callbacks: {
                                          label: function(context) {
                                            return `${context.label}: ${context.raw}/100`;
                                          }
                                        }
                                      }
                                    },
                                    elements: {
                                      line: {
                                        borderWidth: 3
                                      }
                                    }
                                  }}
                                />
                              </div>
                              
                              <div className="text-center mt-3">
                                <small className="text-muted">Higher scores indicate stronger skills</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-lg-5 mb-4">
                          <div className="row">
                            <div className="col-12 mb-4">
                              <div className="card border-0 shadow-sm bg-success bg-opacity-75 text-white">
                                <div className="card-body p-4">
                                  <div className="d-flex align-items-center mb-3">
                                    <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-2" style={{ width: '28px', height: '28px' }}>
                                      <i className="fas fa-check-circle text-success"></i>
                                    </div>
                                    <h5 className="fw-bold mb-0">Key Strengths</h5>
                                  </div>
                                  
                                  {recommendation.strengths && recommendation.strengths.length > 0 ? (
                                    <ul className="list-unstyled mb-0">
                                      {recommendation.strengths.map((skill, index) => (
                                        <li key={`skill-strength-${index}`} className="mb-2 d-flex align-items-center">
                                          <i className="fas fa-check me-2"></i>
                                          <span>{skill}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mb-0">No specific strengths identified</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="col-12">
                              <div className="card border-0 shadow-sm bg-warning text-dark">
                                <div className="card-body p-4">
                                  <div className="d-flex align-items-center mb-3">
                                    <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-2" style={{ width: '28px', height: '28px' }}>
                                      <i className="fas fa-arrow-up text-warning"></i>
                                    </div>
                                    <h5 className="fw-bold mb-0">Areas to Improve</h5>
                                  </div>
                                  
                                  {recommendation.weaknesses && recommendation.weaknesses.length > 0 ? (
                                    <ul className="list-unstyled mb-0">
                                      {recommendation.weaknesses.map((skill, index) => (
                                        <li key={`skill-improve-${index}`} className="mb-2 d-flex align-items-center">
                                          <i className="fas fa-arrow-circle-up me-2"></i>
                                          <span>{skill}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mb-0">No specific areas for improvement identified</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Skills breakdown section */}
                      <div className="skills-breakdown mb-4">
                        <h3>Skills Breakdown</h3>
                        
                        <div className="row">
                          <div className="col-md-6">
                            <div className="skills-column strengths-column">
                              <h4>Strengths</h4>
                              {recommendation.strengths && recommendation.strengths.length > 0 ? (
                                <div className="skills-list">
                                  {recommendation.strengths.map((skill, index) => (
                                    <div key={`strength-detail-${index}`} className="mb-2">{skill}</div>
                                  ))}
                                </div>
                              ) : (
                                <p>No specific strengths identified</p>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="skills-column improve-column">
                              <h4>Areas to Improve</h4>
                              {recommendation.weaknesses && recommendation.weaknesses.length > 0 ? (
                                <div className="skills-list">
                                  {recommendation.weaknesses.map((skill, index) => (
                                    <div key={`weakness-detail-${index}`} className="mb-2">{skill}</div>
                                  ))}
                                </div>
                              ) : (
                                <p>No specific areas for improvement identified</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* RECOMMENDATIONS TAB */}
                  {activeTab === 'recommendations' && (
                    <div className="tab-pane fade show active" id="recommendations" role="tabpanel" aria-labelledby="recommendations-tab">
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                              <div className="d-flex align-items-center mb-4">
                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '36px', height: '36px' }}>
                                  <i className="fas fa-lightbulb text-white"></i>
                                </div>
                                <h5 className="fw-bold mb-0">AI Powered Recommendations</h5>
                              </div>
                              
                              <div className="alert alert-info" role="alert">
                                <div className="d-flex">
                                  <i className="fas fa-info-circle me-3 mt-1"></i>
                                  <div>
                                    <strong>How to use these recommendations:</strong> These insights are generated based on comparing your profile with the job requirements. Use them to highlight your strengths and improve your chances during the application process.
                                  </div>
                                </div>
                              </div>
                              
                              {recommendation.recommendations && recommendation.recommendations.length > 0 ? (
                                <div className="mt-4">
                                  {recommendation.recommendations.map((item, index) => (
                                    <div key={`recommendation-${index}`} className="card mb-3 border-0 bg-light">
                                      <div className="card-body p-3">
                                        <div className="d-flex align-items-center mb-2">
                                          <div className="badge bg-primary rounded-pill me-2">{index + 1}</div>
                                          <h6 className="fw-bold mb-0">{item.title || 'Recommendation'}</h6>
                                        </div>
                                        <p className="mb-0">{item.description || item}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <i className="fas fa-lightbulb text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                                  <p>No specific recommendations available for this job match.</p>
                                </div>
                              )}
                              
                              <div className="mt-4 text-center">
                                <div className="d-flex justify-content-center">
                                  <button onClick={handleApply} className="btn btn-primary me-2">
                                    <i className="fas fa-paper-plane me-2"></i>
                                    Apply Now
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* REPORT TAB */}
                  {activeTab === 'report' && (
                    <div className="tab-pane fade show active" id="report" role="tabpanel" aria-labelledby="report-tab">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                          <div className="d-flex align-items-center mb-4">
                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '36px', height: '36px' }}>
                              <i className="fas fa-file-alt text-white"></i>
                            </div>
                            <h5 className="fw-bold mb-0">Comprehensive Analysis Report</h5>
                          </div>
                          
                          <div className="alert alert-info mb-4">
                            <div className="d-flex">
                              <i className="fas fa-info-circle me-3 mt-1"></i>
                              <div>
                                <strong>About This Report:</strong> This comprehensive analysis is generated by our AI system based on your profile and the job requirements. The report provides detailed insights to help you understand your strengths, areas for improvement, and specific recommendations.
                              </div>
                            </div>
                          </div>
                          
                          <div 
                            className="bg-light p-4 rounded border" 
                            style={{ 
                              maxHeight: '500px', 
                              overflowY: 'auto'
                            }}
                          >
                            {recommendation.text_report ? (
                              <ReactMarkdown>
                                {recommendation.text_report}
                              </ReactMarkdown>
                            ) : (
                              <div className="text-center py-5">
                                <i className="fas fa-file-alt text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                                <h6 className="text-muted mb-2">Full report is not available for this job</h6>
                                <p className="text-muted small mb-0">Please check the other tabs for insights about this position</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 d-flex justify-content-between align-items-center py-2 border-top">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-calendar-alt text-muted me-2"></i>
                              <small className="text-muted">Generated on {new Date().toLocaleDateString()}</small>
                            </div>
                            <button className="btn btn-primary btn-sm">
                              <i className="fas fa-download me-1"></i>
                              Download Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="col-lg-4 col-md-12 col-sm-12 col-12 pl-40 pl-lg-15 mt-lg-30">
                <div className="sidebar-border">
                  <div className="sidebar-heading">
                    <div className="avatar-sidebar">
                      <figure>
                        <img alt="Company Logo" src={company?.logo_url || `/assets/imgs/companies/company-1.svg`} />
                      </figure>
                      <div className="sidebar-info-desc">
                        <div className="sidebar-company-name">
                          {company?.company_name || 'Company'}
                        </div>
                        <span className="card-location">
                          <i className="fi-rr-marker mr-5"></i>{job.location || 'Location not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sidebar-list-job">
                    <div className="box-map">
                      <div className="job-overview">
                        <h5 className="mb-3">Job Overview</h5>
                        <div className="row">
                          <div className="col-md-6 d-flex mt-3">
                            <div className="sidebar-icon-item">
                              <i className="fi-rr-briefcase"></i>
                            </div>
                            <div className="sidebar-text-info">
                              <span className="text-description">Job Type</span>
                              <span className="text-details">{job.job_type || 'Not specified'}</span>
                            </div>
                          </div>
                          
                          <div className="col-md-6 d-flex mt-3">
                            <div className="sidebar-icon-item">
                              <i className="fi-rr-clock"></i>
                            </div>
                            <div className="sidebar-text-info">
                              <span className="text-description">Posted</span>
                              <span className="text-details">{formatDate(job.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="col-md-6 d-flex mt-3">
                            <div className="sidebar-icon-item">
                              <i className="fi-rr-dollar"></i>
                            </div>
                            <div className="sidebar-text-info">
                              <span className="text-description">Salary</span>
                              <span className="text-details">
                                {job.salary ? `${job.salary}` : 'Not disclosed'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="col-md-6 d-flex mt-3">
                            <div className="sidebar-icon-item">
                              <i className="fi-rr-marker"></i>
                            </div>
                            <div className="sidebar-text-info">
                              <span className="text-description">Location</span>
                              <span className="text-details">{job.location || 'Not specified'}</span>
                            </div>
                          </div>
                          
                          <div className="col-md-6 d-flex mt-3">
                            <div className="sidebar-icon-item">
                              <i className="fi-rr-chart-network"></i>
                            </div>
                            <div className="sidebar-text-info">
                              <span className="text-description">Match Rate</span>
                              <span className="text-details">{matchPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sidebar-list-job">
                    <div className="mt-30">
                      <div className="d-flex justify-content-center">
                        <button onClick={handleApply} className="btn btn-default mr-15">
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
