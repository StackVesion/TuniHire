import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';

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

const DetailedRecommendationDialog = ({ isOpen, onClose, recommendation, subscription }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !recommendation) return null;

  // Match percentile chart data
  const getMatchPercentileData = () => {
    return {
      labels: ['You', 'Average'],
      datasets: [
        {
          label: 'Match Score',
          data: [recommendation.pass_percentage, (recommendation.pass_percentage * 0.8).toFixed(1)], // Example average
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Skills radar chart
  const getSkillsRadarData = () => {
    // Combine strengths and weaknesses for a complete skills overview
    const allSkills = [...recommendation.strengths, ...recommendation.weaknesses.slice(0, 3)]; // Limit to top 3 weaknesses
    
    // Generate scores: strengths are high, weaknesses are low
    const scores = allSkills.map(skill => 
      recommendation.strengths.includes(skill) ? 
        Math.floor(Math.random() * 30) + 70 : // 70-100 for strengths
        Math.floor(Math.random() * 40) + 30 // 30-70 for weaknesses
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

  // Similar jobs chart
  const getSimilarJobsData = () => {
    if (!recommendation.similar_jobs || recommendation.similar_jobs.length === 0) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1050,
            }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="modal-dialog modal-dialog-centered modal-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1051,
              width: '100%',
              maxWidth: '900px',
            }}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="fas fa-brain me-2"></i>
                  AI Job Match Analysis
                  <span className="badge bg-warning text-dark ms-2">{subscription} Plan</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={onClose}
                ></button>
              </div>
              
              <div className="modal-body p-0">
                {/* Navigation Tabs */}
                <ul className="nav nav-tabs nav-fill">
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
                
                {/* Tab Content */}
                <div className="tab-content p-4">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="tab-pane fade show active">
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <div className="card h-100">
                            <div className="card-body">
                              <h6 className="card-title">Match Score</h6>
                              <div className="d-flex align-items-center">
                                <div className="chart-container" style={{ height: '180px', width: '180px' }}>
                                  <Doughnut
                                    data={{
                                      labels: ['Match Score', 'Gap'],
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
                                    }}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      cutout: '75%',
                                      plugins: {
                                        legend: {
                                          display: false
                                        }
                                      }
                                    }}
                                  />
                                </div>
                                <div className="ms-3">
                                  <h2 className="mb-0">{recommendation.pass_percentage.toFixed(1)}%</h2>
                                  <p className="text-muted mb-0">Match Rate</p>
                                  {recommendation.subscription_bonus > 0 && (
                                    <div className="text-success small mt-2">
                                      <i className="fas fa-arrow-up me-1"></i>
                                      {recommendation.subscription_bonus}% premium bonus
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="card h-100">
                            <div className="card-body">
                              <h6 className="card-title">Your Ranking</h6>
                              <div className="text-center py-3">
                                <h3 className="display-4 fw-bold mb-0">{recommendation.ranking.rank}</h3>
                                <p className="text-muted">of {recommendation.ranking.total_applicants} applicants</p>
                                <div className="badge bg-success p-2 mb-2">
                                  Top {recommendation.ranking.percentile.toFixed(0)}%
                                </div>
                                <div className="mt-2">
                                  <small className="text-muted">
                                    Your application score: <strong>{recommendation.ranking.score.toFixed(2)}</strong>
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-12">
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">Key Insights</h6>
                              <div className="row mt-3">
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-success">Strengths</h6>
                                  <ul className="list-group list-group-flush">
                                    {recommendation.strengths.map((strength, index) => (
                                      <li key={index} className="list-group-item border-0 d-flex align-items-center px-0">
                                        <i className="fas fa-check-circle text-success me-2"></i>
                                        {strength}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-danger">Areas to Improve</h6>
                                  <ul className="list-group list-group-flush">
                                    {recommendation.weaknesses.slice(0, 5).map((weakness, index) => (
                                      <li key={index} className="list-group-item border-0 d-flex align-items-center px-0">
                                        <i className="fas fa-exclamation-circle text-danger me-2"></i>
                                        {weakness}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Skills Analysis Tab */}
                  {activeTab === 'skills' && (
                    <div className="tab-pane fade show active">
                      <div className="row">
                        <div className="col-md-7">
                          <div className="card h-100">
                            <div className="card-body">
                              <h6 className="card-title">Skills Radar</h6>
                              <div className="chart-container" style={{ height: '400px' }}>
                                <Radar
                                  data={getSkillsRadarData()}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                      r: {
                                        angleLines: {
                                          display: true
                                        },
                                        suggestedMin: 0,
                                        suggestedMax: 100
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-5">
                          <div className="card mb-4">
                            <div className="card-body">
                              <h6 className="card-title">Key Skills Match</h6>
                              <div className="mt-3">
                                {recommendation.strengths.map((skill, index) => (
                                  <div key={index} className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span>{skill}</span>
                                      <span className="badge bg-success">Match</span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                      <div
                                        className="progress-bar bg-success"
                                        role="progressbar"
                                        style={{ width: `${Math.floor(Math.random() * 30) + 70}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">Skills to Develop</h6>
                              <div className="mt-3">
                                {recommendation.weaknesses.slice(0, 3).map((skill, index) => (
                                  <div key={index} className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span>{skill}</span>
                                      <span className="badge bg-warning text-dark">Gap</span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                      <div
                                        className="progress-bar bg-warning"
                                        role="progressbar"
                                        style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations Tab */}
                  {activeTab === 'recommendations' && (
                    <div className="tab-pane fade show active">
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">Similar Jobs You Might Like</h6>
                              {recommendation.similar_jobs && recommendation.similar_jobs.length > 0 ? (
                                <>
                                  <div className="chart-container mb-4" style={{ height: '250px' }}>
                                    <Bar
                                      data={getSimilarJobsData()}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                          y: {
                                            beginAtZero: true,
                                            max: 100,
                                            title: {
                                              display: true,
                                              text: 'Match Percentage'
                                            }
                                          },
                                          x: {
                                            title: {
                                              display: true,
                                              text: 'Job Title'
                                            }
                                          }
                                        },
                                        plugins: {
                                          legend: {
                                            display: false
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="row">
                                    {recommendation.similar_jobs.slice(0, 3).map((job, index) => (
                                      <div key={index} className="col-md-4 mb-3">
                                        <div className="card h-100 border">
                                          <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <h6 className="card-title mb-1">{job.title}</h6>
                                              <span className="badge bg-primary">{job.match_percentage.toFixed(1)}%</span>
                                            </div>
                                            <p className="text-muted small mb-2">
                                              <i className="fas fa-building me-1"></i> {job.company_name}
                                            </p>
                                            <div className="mt-3 text-end">
                                              <a href={`/apply-for-jobs?job=${job.id}`} className="btn btn-sm btn-outline-primary">
                                                View Job
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="alert alert-info">
                                  No similar jobs found.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-body">
                              <h6 className="card-title">Improvement Recommendations</h6>
                              <div className="mt-3">
                                <div className="d-flex mb-3">
                                  <div className="me-3">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                                      <i className="fas fa-graduation-cap text-primary"></i>
                                    </div>
                                  </div>
                                  <div>
                                    <h6 className="mb-1">Skills Development</h6>
                                    <p className="text-muted mb-0">
                                      Consider focusing on {recommendation.weaknesses.slice(0, 2).join(", ")} to improve your match rate for similar positions.
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="d-flex mb-3">
                                  <div className="me-3">
                                    <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                                      <i className="fas fa-file-alt text-success"></i>
                                    </div>
                                  </div>
                                  <div>
                                    <h6 className="mb-1">Resume Optimization</h6>
                                    <p className="text-muted mb-0">
                                      Highlight your experience with {recommendation.strengths.slice(0, 2).join(", ")} more prominently on your resume and cover letter.
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="d-flex">
                                  <div className="me-3">
                                    <div className="bg-info bg-opacity-10 p-2 rounded-circle">
                                      <i className="fas fa-briefcase text-info"></i>
                                    </div>
                                  </div>
                                  <div>
                                    <h6 className="mb-1">Career Path</h6>
                                    <p className="text-muted mb-0">
                                      Based on your profile, you might be a better fit for {recommendation.similar_jobs && recommendation.similar_jobs.length > 0 ? recommendation.similar_jobs[0].title : 'similar roles'} positions.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Full Report Tab */}
                  {activeTab === 'report' && (
                    <div className="tab-pane fade show active">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">Detailed Analysis Report</h6>
                          <div className="markdown-content mt-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {recommendation.text_report ? (
                              <ReactMarkdown>
                                {recommendation.text_report}
                              </ReactMarkdown>
                            ) : (
                              <div className="alert alert-info">
                                Full text report is not available.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailedRecommendationDialog;
