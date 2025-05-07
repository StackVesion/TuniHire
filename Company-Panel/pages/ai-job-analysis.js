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
        
        // Fetch company details if available
        if (jobResponse.data && jobResponse.data.companyId) {
          const companyResponse = await authAxios.get(`/api/companies/${jobResponse.data.companyId}`);
          if (companyResponse.data) {
            setJob(prev => ({
              ...prev,
              company: companyResponse.data
            }));
          }
        }
        
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
        setError(err.message || 'Failed to load job data');
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
      labels: ['Match Score', 'Remaining'],
      datasets: [
        {
          data: [recommendation.pass_percentage, 100 - recommendation.pass_percentage],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(211, 211, 211, 0.3)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(211, 211, 211, 0)'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };
  };
  
  // Skills radar chart data
  const getSkillsChartData = () => {
    if (!recommendation || !recommendation.skills_match) return null;
    
    const labels = Object.keys(recommendation.skills_match || {});
    const values = Object.values(recommendation.skills_match || {}).map(value => parseFloat(value));
    
    return {
      labels,
      datasets: [
        {
          label: 'Your Skills',
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 4
        },
        {
          label: 'Job Requirements',
          data: labels.map(() => 90), // Assuming job requirements are at 90% level
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 99, 132, 1)',
          pointRadius: 4
        }
      ]
    };
  };
  
  // Similar jobs chart data
  const getSimilarJobsData = () => {
    if (!recommendation || !recommendation.similar_jobs) return null;
    
    const labels = recommendation.similar_jobs.map(job => job.title || 'Unnamed Job').slice(0, 5);
    const data = recommendation.similar_jobs.map(job => job.match_percentage || 0).slice(0, 5);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: data.map(value => {
            if (value >= 90) return 'rgba(40, 167, 69, 0.7)';  // Green
            if (value >= 70) return 'rgba(0, 123, 255, 0.7)';  // Blue
            if (value >= 50) return 'rgba(255, 193, 7, 0.7)';  // Yellow
            return 'rgba(220, 53, 69, 0.7)';  // Red
          }),
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mt-3">Loading Job Analysis...</h5>
              <p className="text-muted">Please wait while we analyze this position for you.</p>
            </div>
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
            <p>There is no job or recommendation data available for analysis.</p>
            <hr />
            <p className="mb-0">
              <button className="btn btn-outline-warning" onClick={() => router.back()}>
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
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-sm btn-outline-secondary me-3" 
            onClick={() => router.back()}
          >
            <i className="fas fa-arrow-left me-1"></i>
            Back
          </button>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
              <li className="breadcrumb-item"><a href="/apply-for-jobs">Jobs</a></li>
              <li className="breadcrumb-item active" aria-current="page">AI Analysis</li>
            </ol>
          </nav>
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
                  <motion.div 
                    className="badge bg-primary p-2"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <i className="fas fa-chart-line me-1"></i>
                    {recommendation.pass_percentage.toFixed(1)}% Match
                  </motion.div>
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
        
        {/* Tabs and Analysis Content */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-chart-pie me-1"></i>
                  Overview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('skills')}
                >
                  <i className="fas fa-code me-1"></i>
                  Skills Analysis
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  <i className="fas fa-lightbulb me-1"></i>
                  Recommendations
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  <i className="fas fa-file-alt me-1"></i>
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
                className="overview-tab"
              >
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-percentage me-2 text-primary"></i>
                          Match Score
                        </h6>
                        <div className="d-flex align-items-center">
                          <motion.div 
                            className="chart-container" 
                            style={{ height: '180px', width: '180px' }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ 
                              type: "spring", 
                              duration: 1.2,
                              delay: 0.2
                            }}
                          >
                            <Doughnut
                              data={getMatchScoreData()}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '75%',
                                plugins: {
                                  legend: {
                                    display: false
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        return `${context.label}: ${context.raw}%`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </motion.div>
                          <motion.div 
                            className="ms-4"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <h2 className="mb-0">{recommendation.pass_percentage.toFixed(1)}%</h2>
                            <p className="text-muted mb-0">Match Rate</p>
                            {recommendation.subscription_bonus > 0 && (
                              <div className="text-success small mt-2">
                                <i className="fas fa-arrow-up me-1"></i>
                                {recommendation.subscription_bonus}% premium bonus
                              </div>
                            )}
                          </motion.div>
                        </div>
                        
                        {/* Match Score Interpretation Guide */}
                        <div className="mt-3 pt-3 border-top">
                          <h6 className="card-subtitle mb-2">What This Means:</h6>
                          <div className="match-score-guide">
                            <div className="d-flex align-items-center mb-2">
                              <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', marginRight: '8px' }}></div>
                              <small className="text-muted">90-100%: Excellent match for this position</small>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <div style={{ width: '12px', height: '12px', backgroundColor: '#17a2b8', borderRadius: '50%', marginRight: '8px' }}></div>
                              <small className="text-muted">70-89%: Strong match with some gaps</small>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <div style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '50%', marginRight: '8px' }}></div>
                              <small className="text-muted">50-69%: Moderate match, consider upskilling</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <div style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', borderRadius: '50%', marginRight: '8px' }}></div>
                              <small className="text-muted">Below 50%: Not a strong match currently</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title d-flex align-items-center">
                          <i className="fas fa-medal me-2 text-primary"></i>
                          Ranking
                        </h6>
                        <div className="ranking-stats">
                          <motion.div 
                            className="text-center pt-3 pb-3"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="ranking-position position-relative d-inline-block">
                              <div 
                                className="position-relative rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: '150px', 
                                  height: '150px', 
                                  backgroundColor: 'rgba(54, 162, 235, 0.1)',
                                  border: '4px solid rgba(54, 162, 235, 0.5)'
                                }}
                              >
                                <div>
                                  <h2 className="mb-0">
                                    {recommendation.ranking_stats ? recommendation.ranking_stats.position : '-'}
                                  </h2>
                                  <p className="text-muted mb-0">of {recommendation.ranking_stats ? recommendation.ranking_stats.total_applicants : '-'}</p>
                                </div>
                              </div>
                              {recommendation.ranking_stats && recommendation.ranking_stats.top_percentage && (
                                <div 
                                  className="position-absolute badge bg-success"
                                  style={{ top: 0, right: 0 }}
                                >
                                  Top {recommendation.ranking_stats.top_percentage}%
                                </div>
                              )}
                            </div>
                          </motion.div>
                          
                          {recommendation.ranking_stats && (
                            <motion.div 
                              className="ranking-details mt-3"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.6 }}
                            >
                              <div className="d-flex justify-content-between mb-2">
                                <div>Skills Match:</div>
                                <div>
                                  <span className="text-primary">{recommendation.ranking_stats.skills_score}%</span>
                                </div>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <div>Experience Match:</div>
                                <div>
                                  <span className="text-primary">{recommendation.ranking_stats.experience_score}%</span>
                                </div>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <div>Education Match:</div>
                                <div>
                                  <span className="text-primary">{recommendation.ranking_stats.education_score}%</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Ranking Interpretation Guide */}
                          <div className="mt-3 pt-3 border-top">
                            <h6 className="card-subtitle mb-2">What This Means:</h6>
                            <p className="small text-muted mb-0">
                              Your position relative to other applicants for this job. A higher ranking indicates a stronger match compared to other candidates.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
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
                   <div className="col-12">
                     <div className="card border-0 shadow-sm">
                       <div className="card-body">
                         <h6 className="card-title d-flex align-items-center mb-3">
                           <i className="fas fa-code-branch me-2 text-primary"></i>
                           Skills Analysis
                         </h6>
                         {getSkillsChartData() ? (
                           <div className="chart-container" style={{ height: '350px' }}>
                             <Radar
                               data={getSkillsChartData()}
                               options={{
                                 responsive: true,
                                 maintainAspectRatio: false,
                                 scales: {
                                   r: {
                                     suggestedMin: 0,
                                     suggestedMax: 100,
                                     ticks: {
                                       display: false
                                     }
                                   }
                                 },
                                 plugins: {
                                   legend: {
                                     position: 'bottom'
                                   }
                                 }
                               }}
                             />
                           </div>
                         ) : (
                           <div className="alert alert-info">
                             No skills data available.
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
                   <div className="col-12">
                     <div className="card border-0 shadow-sm">
                       <div className="card-body">
                         <h6 className="card-title mb-3">
                           <i className="fas fa-lightbulb me-2 text-primary"></i>
                           AI Career Recommendations
                         </h6>
                         
                         <div className="recommendations-container">
                           <div className="recommendation-item mb-3 p-3 border rounded">
                             <h5>Skills Enhancement</h5>
                             <p>
                               Consider focusing on improving these skills: 
                               <span className="text-primary">
                                 {recommendation.recommendations?.skills_to_improve ? 
                                   recommendation.recommendations.skills_to_improve.join(', ') : 
                                   'JavaScript, React, Node.js'}
                               </span>
                             </p>
                           </div>
                           
                           <div className="recommendation-item mb-3 p-3 border rounded">
                             <h5>Resume Optimization</h5>
                             <p>
                               Highlight these keywords on your resume: 
                               <span className="text-primary">
                                 {recommendation.recommendations?.keywords_to_include ? 
                                   recommendation.recommendations.keywords_to_include.join(', ') : 
                                   'React, Node.js, API integration'}
                               </span>
                             </p>
                           </div>
                           
                           <div className="recommendation-item p-3 border rounded">
                             <h5>Interview Preparation</h5>
                             <p>
                               Be prepared to discuss your experience with: 
                               <span className="text-primary">
                                 {recommendation.recommendations?.interview_topics ? 
                                   recommendation.recommendations.interview_topics.join(', ') : 
                                   'Project management, team collaboration, problem-solving'}
                               </span>
                             </p>
                           </div>
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
                     <h6 className="card-title">
                       <i className="fas fa-file-alt me-2 text-primary"></i>
                       Detailed Analysis Report
                     </h6>
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
 