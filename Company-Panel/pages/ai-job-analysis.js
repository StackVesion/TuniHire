import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title, 
  Tooltip, 
  Legend
);

// Custom CircularProgressWithLabel component for displaying match percentages
const CircularProgressWithLabel = ({ value, color = 'primary' }) => {
  // Map color names to Bootstrap color classes
  const colorMap = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545'
  };
  
  const colorHex = colorMap[color] || colorMap.primary;
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const progress = value / 100;
  const dashoffset = circumference * (1 - progress);
  
  return (
    <div className="position-relative" style={{ width: '60px', height: '60px' }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        {/* Background circle */}
        <circle 
          cx="30" 
          cy="30" 
          r={radius}
          fill="none" 
          stroke="#f0f0f0"
          strokeWidth="5"
        />
        {/* Progress circle */}
        <circle 
          cx="30" 
          cy="30" 
          r={radius}
          fill="none" 
          stroke={colorHex}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 30 30)"
        />
      </svg>
    </div>
  );
};

const AIJobAnalysis = () => {
  const router = useRouter();
  const { jobId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  
  // Get user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  // Fetch job details and AI recommendation when jobId is available
  useEffect(() => {
    if (!jobId || !user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Create an axios instance with authentication
        const authAxios = axios.create({
          baseURL: process.env.NEXT_PUBLIC_API_URL || '',
          headers: {
            Authorization: user.token ? `Bearer ${user.token}` : '',
          },
        });
        
        // Fetch job details
        const jobResponse = await authAxios.get(`/api/jobs/${jobId}`);
        setJob(jobResponse.data);
        
        // Fetch AI recommendation directly from the recommendation service
        console.log(`Fetching AI recommendation for user ${user._id} and job ${jobId}`);
        const aiResponse = await fetch(`http://localhost:5001/api/recommendation?user_id=${user._id}&job_id=${jobId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!aiResponse.ok) {
          throw new Error(`AI API request failed with status ${aiResponse.status}`);
        }
        
        const aiData = await aiResponse.json();
        
        if (aiData.success && aiData.data) {
          setRecommendation(aiData.data);
        } else {
          throw new Error(aiData.message || 'Failed to get recommendation data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load job data or AI insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [jobId, user]);
  
  // Chart data for match score doughnut chart
  const getMatchScoreData = () => {
    if (!recommendation) return null;
    
    return {
      labels: ['Match', 'Gap'],
      datasets: [
        {
          data: [recommendation.pass_percentage, 100 - recommendation.pass_percentage],
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
    if (!recommendation) return null;
    
    // Combine strengths and weaknesses for a complete skills overview
    const allSkills = [...recommendation.strengths, ...recommendation.weaknesses.slice(0, 3)];
    
    // Generate scores: strengths are high, weaknesses are low
    const scores = allSkills.map(skill => 
      recommendation.strengths.includes(skill) ? 
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

  // Similar jobs chart data
  const getSimilarJobsData = () => {
    if (!recommendation || !recommendation.similar_jobs || recommendation.similar_jobs.length === 0) {
      return null;
    }
    
    return {
      labels: recommendation.similar_jobs.slice(0, 5).map(job => job.title),
      datasets: [
        {
          label: 'Match Percentage',
          data: recommendation.similar_jobs.slice(0, 5).map(job => job.match_percentage),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ],
    };
  };
  
  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="mt-3">Loading AI analysis...</h5>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error Loading Data</h4>
            <p>{error}</p>
            <hr />
            <p className="mb-0">
              <button className="btn btn-outline-danger" onClick={() => router.back()}>
                <i className="fas fa-arrow-left me-2"></i>
                Go Back
              </button>
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // No data state
  if (!job || !recommendation) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="alert alert-warning" role="alert">
            <h4 className="alert-heading">No Data Available</h4>
            <p>We couldn't load the job details or AI analysis at this time.</p>
            <hr />
            <p className="mb-0">
              <button className="btn btn-outline-primary" onClick={() => router.back()}>
                <i className="fas fa-arrow-left me-2"></i>
                Go Back
              </button>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/apply-for-jobs">Jobs</a></li>
            <li className="breadcrumb-item active" aria-current="page">AI Analysis</li>
          </ol>
        </nav>
        
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">AI Job Match Analysis</h1>
          <button 
            className="btn btn-outline-primary"
            onClick={() => router.back()}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Jobs
          </button>
        </div>
        
        {/* Job and Company Details Section */}
        <div className="card shadow-sm mb-4 border-0 overflow-hidden">
          <div className="card-header bg-light py-3">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Job & Company Details</h5>
              <h3 className="text-primary mb-0">{recommendation.pass_percentage.toFixed(1)}%</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-0">
              {/* Company Logo and Info */}
              <div className="col-md-3 border-end pe-3">
                <div className="text-center mb-3">
                  {job.company?.logo ? (
                    <img 
                      src={job.company.logo} 
                      alt={job.company?.name} 
                      className="img-fluid rounded mb-3" 
                      style={{ maxHeight: '100px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="bg-light rounded p-3 mb-3 d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
                      <i className="fas fa-building text-secondary" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                  )}
                  <h5>{job.company?.name || 'Company'}</h5>
                  <p className="small text-muted mb-2">
                    {job.company?.category && (
                      <span className="d-block mb-1">
                        <i className="fas fa-tag me-1"></i> {job.company.category}
                      </span>
                    )}
                    {job.company?.numberOfEmployees && (
                      <span className="d-block mb-1">
                        <i className="fas fa-users me-1"></i> {job.company.numberOfEmployees} employees
                      </span>
                    )}
                    {job.company?.website && (
                      <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="d-block text-primary">
                        <i className="fas fa-globe me-1"></i> Website
                      </a>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Job Details */}
              <div className="col-md-9 ps-md-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="mb-0">{job.title}</h4>
                  <div>
                    <button onClick={() => router.back()} className="btn btn-sm btn-outline-primary">
                      <i className="fas fa-arrow-left me-2"></i>
                      Back to Jobs
                    </button>
                  </div>
                </div>
                
                <div className="d-flex flex-wrap mb-3">
                  <span className="badge bg-primary me-2 mb-2 p-2">
                    <i className="fas fa-briefcase me-1"></i>
                    {job.workplaceType || 'Unspecified'}
                  </span>
                  <span className="badge bg-secondary me-2 mb-2 p-2">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {job.location || 'Location not specified'}
                  </span>
                  <span className="badge bg-info me-2 mb-2 p-2">
                    <i className="fas fa-money-bill-wave me-1"></i>
                    {job.salaryRange || (job.salaryMin && job.salaryMax ? `$${job.salaryMin}-$${job.salaryMax}/year` : 'Salary not specified')}
                  </span>
                  <span className="badge bg-success mb-2 p-2">
                    <i className="fas fa-calendar-alt me-1"></i>
                    Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                
                {/* HR Contact Info if available */}
                {job.hrContact && (
                  <div className="card bg-light mb-3 border-0">
                    <div className="card-body py-2">
                      <h6 className="mb-2"><i className="fas fa-user-tie me-2 text-primary"></i>HR Contact</h6>
                      <div className="d-flex flex-wrap">
                        {job.hrContact.name && (
                          <div className="me-4 mb-1">
                            <strong>Name:</strong> {job.hrContact.name}
                          </div>
                        )}
                        {job.hrContact.email && (
                          <div className="me-4 mb-1">
                            <strong>Email:</strong> {job.hrContact.email}
                          </div>
                        )}
                        {job.hrContact.phone && (
                          <div className="me-4 mb-1">
                            <strong>Phone:</strong> {job.hrContact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Job Description Preview */}
                <div>
                  <h6 className="mb-2">Job Description</h6>
                  <p className="mb-2">{job.description ? (job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description) : 'No description available'}</p>
                  
                  {/* Requirements */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mt-3">
                      <h6 className="mb-2">Key Requirements</h6>
                      <ul className="list-unstyled">
                        {job.requirements.slice(0, 3).map((req, index) => (
                          <li key={index} className="mb-1">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            {req}
                          </li>
                        ))}
                        {job.requirements.length > 3 && (
                          <li className="text-muted small">
                            <i className="fas fa-ellipsis-h me-2"></i>
                            And {job.requirements.length - 3} more requirements
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content - Tabs */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-chart-pie me-2"></i>
                  Overview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('skills')}
                >
                  <i className="fas fa-tools me-2"></i>
                  Skills Analysis
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  <i className="fas fa-lightbulb me-2"></i>
                  Recommendations
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  <i className="fas fa-file-alt me-2"></i>
                  Full Report
                </button>
              </li>
            </ul>
          </div>
          
          <div className="card-body">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                padding: 10,
                                bodyFont: {
                                  size: 13
                                },
                                callbacks: {
                                  label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}%`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </motion.div>
                    ) : (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        No skills data available for this job.
                        {/* Match Score Interpretation Guide */}
                        <div className="mt-3 pt-3 border-top">
                          <h6 className="card-subtitle mb-2">What This Means:</h6>
                          <div className="d-flex align-items-center mb-2">
                            <div className="legend-item" style={{ width: '14px', height: '14px', backgroundColor: 'rgba(54, 162, 235, 0.8)', borderRadius: '50%', marginRight: '8px' }}></div>
                            <span className="small"><strong>Match Score</strong> - How well your profile matches this job</span>
                          </div>
                          <div className="match-scale d-flex justify-content-between align-items-center mt-2 px-2">
                            <span className="small text-danger">Low Match<br/>&lt; 60%</span>
                            <span className="small text-warning">Average<br/>60-75%</span>
                            <span className="small text-success">Strong Match<br/>&gt; 75%</span>
                          </div>
                          <div className="progress mt-1" style={{ height: '6px' }}>
                            <div className="progress-bar bg-danger" style={{ width: '33%' }}></div>
                            <div className="progress-bar bg-warning" style={{ width: '33%' }}></div>
                            <div className="progress-bar bg-success" style={{ width: '34%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-trophy me-2 text-primary"></i>
                          Your Ranking
                        </h6>
                        <div className="text-center py-3">
                          <motion.h3 
                            className="display-4 fw-bold mb-0"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 500, 
                              delay: 0.3 
                            }}
                          >
                            {recommendation.ranking.rank}
                          </motion.h3>
                          <p className="text-muted">of {recommendation.ranking.total_applicants} applicants</p>
                          <div className="badge bg-success p-2 mb-2">
                            Top {recommendation.ranking.percentile.toFixed(0)}%
                          </div>
                          
                          {/* Visual ranking indicator */}
                          <div className="position-relative my-3" style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                            <motion.div 
                              className="position-absolute top-0 start-0 bg-primary" 
                              style={{ 
                                height: '8px', 
                                borderRadius: '4px',
                                maxWidth: '100%'
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${100 - recommendation.ranking.percentile}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            ></motion.div>
                            <motion.div 
                              className="position-absolute top-0 start-0 translate-middle-y" 
                              style={{ 
                                left: `${100 - recommendation.ranking.percentile}%`, 
                                marginTop: '4px'
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1.5 }}
                            >
                              <div className="bg-primary rounded-circle" style={{ width: '14px', height: '14px' }}></div>
                            </motion.div>
                          </div>
                          
                          <div className="mt-2">
                            <small className="text-muted">
                              Your application score: <strong>{recommendation.ranking.score.toFixed(2)}</strong>
                            </small>
                          </div>
                        </div>
                        
                        {/* Ranking explanation */}
                        <div className="mt-3 pt-3 border-top">
                          <h6 className="card-subtitle mb-2">Understanding Your Rank:</h6>
                          <ul className="list-unstyled small">
                            <li className="mb-1">
                              <i className="fas fa-info-circle text-primary me-1"></i>
                              <strong>Rank #{recommendation.ranking.rank}</strong>: Your position among all applicants
                            </li>
                            <li className="mb-1">
                              <i className="fas fa-users text-primary me-1"></i>
                              <strong>Total Applicants</strong>: {recommendation.ranking.total_applicants} people applied for this job
                            </li>
                            <li>
                              <i className="fas fa-chart-line text-primary me-1"></i>
                              <strong>Percentile</strong>: You're in the top {recommendation.ranking.percentile.toFixed(0)}% of all applicants
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-lightbulb me-2 text-primary"></i>
                          Key Insights
                        </h6>
                        <div className="row mt-3">
                          <div className="col-md-6">
                            <h6 className="fw-bold text-success">Strengths</h6>
                            <ul className="list-group list-group-flush">
                              {recommendation.strengths.map((strength, index) => (
                                <motion.li 
                                  key={index} 
                                  className="list-group-item border-0 d-flex align-items-center px-0"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <i className="fas fa-check-circle text-success me-2"></i>
                                  {strength}
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                          <div className="col-md-6">
                            <h6 className="fw-bold text-danger">Areas to Improve</h6>
                            <ul className="list-group list-group-flush">
                              {recommendation.weaknesses.slice(0, 5).map((weakness, index) => (
                                <motion.li 
                                  key={index} 
                                  className="list-group-item border-0 d-flex align-items-center px-0"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <i className="fas fa-exclamation-circle text-danger me-2"></i>
                                  {weakness}
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Skills Analysis Tab */}
            {activeTab === 'skills' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="row">
                  <div className="col-md-7">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-chart-radar me-2 text-primary"></i>
                          Skills Radar
                        </h6>
                        <div className="radar-chart-container position-relative">
                          <div className="mb-3 d-flex justify-content-center">
                            <div className="legend-box d-flex align-items-center me-3">
                              <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(54, 162, 235, 0.2)', border: '1px solid rgba(54, 162, 235, 1)', marginRight: '5px' }}></div>
                              <small>Your Skills</small>
                            </div>
                            <div className="legend-hint d-flex align-items-center">
                              <i className="fas fa-info-circle text-muted me-1"></i>
                              <small className="text-muted">Higher scores (outer edges) are better</small>
                            </div>
                          </div>
                          <div className="chart-container" style={{ height: '350px' }}>
                            <Radar
                              data={getSkillsRadarData()}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  r: {
                                    angleLines: {
                                      display: true,
                                      color: 'rgba(0, 0, 0, 0.1)'
                                    },
                                    grid: {
                                      color: 'rgba(0, 0, 0, 0.1)'
                                    },
                                    pointLabels: {
                                      font: {
                                        size: 12,
                                        weight: 'bold'
                                      },
                                      color: '#333'
                                    },
                                    suggestedMin: 0,
                                    suggestedMax: 100,
                                    ticks: {
                                      display: false,
                                      stepSize: 20
                                    }
                                  }
                                },
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        return `Skill Level: ${context.raw}/100`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Skills legend */}
                        <div className="mt-3 pt-3 border-top">
                          <h6 className="mb-2">How to Read This Chart:</h6>
                          <ul className="list-unstyled small mb-0">
                            <li className="mb-2">
                              <i className="fas fa-circle text-success me-1"></i>
                              <strong>Strengths (70-100)</strong>: Skills where you excel and match job requirements
                            </li>
                            <li className="mb-2">
                              <i className="fas fa-circle text-warning me-1"></i>
                              <strong>Moderate (50-69)</strong>: Skills where you have some competency but could improve
                            </li>
                            <li>
                              <i className="fas fa-circle text-danger me-1"></i>
                              <strong>Areas to Develop (0-49)</strong>: Skills where improvement would significantly enhance your match
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-5">
                    <div className="card mb-4 border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-briefcase me-2 text-primary"></i>
                          Recommended Jobs For You
                        </h6>
                        
                        <div className="bg-light p-3 mb-3 rounded">
                          <div className="d-flex">
                            <div className="me-2">
                              <i className="fas fa-lightbulb text-warning fs-4"></i>
                            </div>
                            <div>
                              <h6 className="mb-1">AI Recommendation</h6>
                              <p className="small text-muted mb-0">
                                Based on your profile and skills, our AI has identified these jobs as strong matches for you. The match percentage indicates how well your profile aligns with each position's requirements.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {recommendation.similar_jobs && recommendation.similar_jobs.length > 0 ? (
                          <div>
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <div className="chart-container" style={{ height: '250px' }}>
                                  <Bar
                                    data={getSimilarJobsData()}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      indexAxis: 'y',
                                      scales: {
                                        x: {
                                          beginAtZero: true,
                                          max: 100,
                                          ticks: {
                                            callback: function(value) {
                                              return value + '%';
                                            }
                                          }
                                        }
                                      },
                                      plugins: {
                                        legend: {
                                          display: false
                                        },
                                        tooltip: {
                                          callbacks: {
                                            label: function(context) {
                                              return `Match: ${context.raw}%`;
                                            }
                                          }
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="match-interpretation rounded p-3 bg-white border">
                                  <h6 className="border-bottom pb-2 mb-2">Match Score Guide</h6>
                                  <div className="d-flex align-items-center mb-2">
                                    <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(40, 167, 69, 0.7)', borderRadius: '50%', marginRight: '10px' }}></div>
                                    <div>
                                      <strong>90-100%</strong>: <span className="text-success">Excellent match</span> - You meet almost all requirements
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(0, 123, 255, 0.7)', borderRadius: '50%', marginRight: '10px' }}></div>
                                    <div>
                                      <strong>70-89%</strong>: <span className="text-primary">Strong match</span> - You meet most key requirements
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(255, 193, 7, 0.7)', borderRadius: '50%', marginRight: '10px' }}></div>
                                    <div>
                                      <strong>50-69%</strong>: <span className="text-warning">Moderate match</span> - You meet some requirements
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(220, 53, 69, 0.7)', borderRadius: '50%', marginRight: '10px' }}></div>
                                    <div>
                                      <strong>Below 50%</strong>: <span className="text-danger">Low match</span> - Consider upskilling first
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Detailed Similar Jobs List */}
                            <div className="mt-4">
                              <h6 className="border-bottom pb-2 mb-3">Recommended Positions</h6>
                              {recommendation.similar_jobs.map((job, index) => (
                                <motion.div 
                                  key={index}
                                  className="card mb-3 position-relative border-0 shadow-sm"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <h6 className="mb-1">{job.title}</h6>
                                        <p className="text-muted small mb-2">{job.company || 'Company not specified'}</p>
                                        <div className="d-flex flex-wrap">
                                          {job.location && (
                                            <span className="badge bg-light text-dark me-2 mb-1">
                                              <i className="fas fa-map-marker-alt text-muted me-1"></i>
                                              {job.location}
                                            </span>
                                          )}
                                          {job.salary && (
                                            <span className="badge bg-light text-dark me-2 mb-1">
                                              <i className="fas fa-money-bill-wave text-muted me-1"></i>
                                              {job.salary}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-end">
                                        <div className="position-relative" style={{ width: '60px', height: '60px' }}>
                                          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                            <span className="fw-bold">{job.match_percentage}%</span>
                                          </div>
                                          <CircularProgressWithLabel 
                                            value={job.match_percentage} 
                                            color={job.match_percentage >= 90 ? 'success' : 
                                                  job.match_percentage >= 70 ? 'primary' : 
                                                  job.match_percentage >= 50 ? 'warning' : 'danger'}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    {job.description && (
                                      <p className="small mt-2 mb-2">
                                        {job.description.length > 120 ? `${job.description.substring(0, 120)}...` : job.description}
                                      </p>
                                    )}
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                      <div>
                                        {job.skills && job.skills.length > 0 && (
                                          <div className="d-flex flex-wrap">
                                            {job.skills.slice(0, 3).map((skill, idx) => (
                                              <span key={idx} className="badge bg-success bg-opacity-10 text-success me-1 mb-1">{skill}</span>
                                            ))}
                                            {job.skills.length > 3 && (
                                              <span className="badge bg-light text-muted mb-1">+{job.skills.length - 3} more</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <button 
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => window.open(`/job-details?id=${job.id || job._id}`, '_blank')}
                                      >
                                        View Job
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            No similar job recommendations available at this time.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-tasks me-2 text-primary"></i>
                          Skills Assessment
                        </h6>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div className="text-center">
                            <div className="display-6 fw-bold text-success">
                              {recommendation.strengths.length}
                            </div>
                            <small className="text-muted">Strengths</small>
                          </div>
                          <div className="border-start h-100"></div>
                          <div className="text-center">
                            <div className="display-6 fw-bold text-danger">
                              {recommendation.weaknesses.length}
                            </div>
                            <small className="text-muted">To Improve</small>
                          </div>
                        </div>
                        
                        {/* Focus skill */}
                        {recommendation.weaknesses.length > 0 && (
                          <div className="mt-4">
                            <h6 className="text-muted">Top Priority to Develop:</h6>
                            <div className="alert alert-warning d-flex align-items-center">
                              <i className="fas fa-lightbulb me-2 text-warning"></i>
                              <div><strong>{recommendation.weaknesses[0]}</strong></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="row">
                  <div className="col-md-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-lightbulb me-2 text-primary"></i>
                          Personalized Recommendations
                        </h6>
                        
                        <div className="alert alert-primary d-flex align-items-center mt-3">
                          <div className="me-3 fs-3">
                            <i className="fas fa-robot"></i>
                          </div>
                          <div>
                            <strong>AI Insight:</strong> Based on your profile and this job's requirements, here are tailored recommendations to improve your chances.
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <motion.div 
                            className="d-flex mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="me-3">
                              <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                                <i className="fas fa-graduation-cap text-primary fs-4"></i>
                              </div>
                            </div>
                            <div>
                              <h5 className="mb-2">Skills Development</h5>
                              <p className="text-muted">
                                Consider focusing on <strong>{recommendation.weaknesses.slice(0, 2).join(", ")}</strong> to improve your match rate for similar positions.
                                These skills appear frequently in job postings similar to this one and could significantly boost your application strength.
                              </p>
                              <div className="card bg-light">
                                <div className="card-body py-2 px-3">
                                  <small>
                                    <i className="fas fa-lightbulb text-warning me-1"></i>
                                    <strong>Pro Tip:</strong> Look for online courses that specifically focus on these skills to enhance your profile.
                                  </small>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="d-flex mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <div className="me-3">
                              <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                                <i className="fas fa-file-alt text-success fs-4"></i>
                              </div>
                            </div>
                            <div>
                              <h5 className="mb-2">Resume Optimization</h5>
                              <p className="text-muted">
                                Highlight your experience with <strong>{recommendation.strengths.slice(0, 2).join(", ")}</strong> more prominently on your resume and cover letter.
                                These are your strongest matches to this job's requirements and should be featured early in your application materials.
                              </p>
                              <div className="card bg-light">
                                <div className="card-body py-2 px-3">
                                  <small>
                                    <i className="fas fa-lightbulb text-warning me-1"></i>
                                    <strong>Pro Tip:</strong> Use concrete examples and metrics when describing your experience with these skills.
                                  </small>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="d-flex"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="me-3">
                              <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                                <i className="fas fa-briefcase text-info fs-4"></i>
                              </div>
                            </div>
                            <div>
                              <h5 className="mb-2">Career Path</h5>
                              <p className="text-muted">
                                Based on your profile, you might be a better fit for <strong>{recommendation.similar_jobs && recommendation.similar_jobs.length > 0 ? recommendation.similar_jobs[0].title : 'similar roles'}</strong> positions.
                                Consider exploring these alternative career paths that better match your current skill set.
                              </p>
                              <div className="card bg-light">
                                <div className="card-body py-2 px-3">
                                  <small>
                                    <i className="fas fa-lightbulb text-warning me-1"></i>
                                    <strong>Pro Tip:</strong> Set up job alerts for these alternative positions to expand your opportunities.
                                  </small>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Full Report Tab */}
            {activeTab === 'report' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title d-flex align-items-center">
                      <i className="fas fa-file-alt me-2 text-primary"></i>
                      Detailed Analysis Report
                    </h6>
                    <div className="bg-light p-3 rounded mb-3">
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        This report is generated by our AI system based on your profile and the job requirements. It provides a detailed analysis of your fit for this position.
                      </small>
                    </div>
                    <div className="markdown-content mt-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {recommendation.text_report ? (
                        <ReactMarkdown>
                          {recommendation.text_report}
                        </ReactMarkdown>
                      ) : (
                        <div className="alert alert-info">
                          Full text report is not available for this job match.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIJobAnalysis;
