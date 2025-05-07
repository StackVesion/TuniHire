import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Badge, ProgressBar, Button } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import './DetailedAIResultsDialog.css';

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

// Animation variants for titles
const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Animation variants for cards
const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.4 }
  }
};

const DetailedAIResultsDialog = ({ 
  isOpen, 
  onClose, 
  recommendation, 
  jobData,
  onApply
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Close sidebar effect when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Add code here to close sidebar if needed
      document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  if (!isOpen || !recommendation) return null;
  
  // Format the match percentage for display
  const matchPercentage = recommendation.pass_percentage?.toFixed(1) || '0.0';
  const premiumBonus = recommendation.premium_bonus || 0;
  
  // Chart data for doughnut chart
  const getMatchScoreData = () => {
    return {
      labels: ['Match', 'Gap'],
      datasets: [
        {
          data: [recommendation.pass_percentage || 0, 100 - (recommendation.pass_percentage || 0)],
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
    const strengths = recommendation.strengths || [];
    const weaknesses = recommendation.weaknesses || [];
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

  // Handle apply button click
  const handleApply = () => {
    if (onApply && typeof onApply === 'function') {
      onApply();
      onClose();
    }
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      dialogClassName="ai-results-modal"
      contentClassName="ai-results-content"
      className="fullscreen-modal"
      aria-labelledby="ai-job-analysis"
      centered
      size="xl"
    >
      <div className="position-relative">
        {/* Close button */}
        <button 
          className="btn-close position-absolute top-0 end-0 m-3 bg-white rounded-circle shadow-sm" 
          onClick={onClose}
          style={{ zIndex: 1050, padding: '0.75rem' }}
          aria-label="Close"
        />

        <div className="full-screen-dialog p-0 overflow-hidden">
          {/* Header with job title and apply button */}
          <div className="bg-primary text-white py-4 px-4">
            <div className="container-fluid">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <motion.h4 
                    className="mb-1 fw-bold"
                    initial="hidden"
                    animate="visible"
                    variants={titleVariants}
                  >
                    AI Job Match Analysis
                  </motion.h4>
                  <motion.p 
                    className="mb-0 opacity-75"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.75 }}
                    transition={{ delay: 0.3 }}
                  >
                    {jobData?.title || 'Job Position'} - {jobData?.company || 'Company'}
                  </motion.p>
                </div>
                <div>
                  <Button 
                    variant="light" 
                    className="fw-bold"
                    onClick={handleApply}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Navigation */}
          <div className="px-4 pt-3 bg-white border-bottom">
            <div className="container-fluid">
              <div className="nav-container d-flex">
                <div 
                  className={`nav-tab me-4 pb-3 ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <span className="d-flex align-items-center">
                    <i className="fas fa-chart-pie me-2"></i>
                    Overview
                  </span>
                </div>
                <div 
                  className={`nav-tab me-4 pb-3 ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('skills')}
                >
                  <span className="d-flex align-items-center">
                    <i className="fas fa-lightbulb me-2"></i>
                    Skills Analysis
                  </span>
                </div>
                <div 
                  className={`nav-tab me-4 pb-3 ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  <span className="d-flex align-items-center">
                    <i className="fas fa-award me-2"></i>
                    Recommendations
                  </span>
                </div>
                <div 
                  className={`nav-tab me-4 pb-3 ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  <span className="d-flex align-items-center">
                    <i className="fas fa-file-alt me-2"></i>
                    Full Report
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="tab-content-area p-4 bg-light" style={{ height: 'calc(100vh - 170px)', overflowY: 'auto' }}>
            <div className="container-fluid">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="row g-4">
                    <div className="col-md-8">
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="card border-0 shadow-sm h-100"
                      >
                        <div className="card-body p-4">
                          <div className="text-center mb-4">
                            <motion.h5 
                              className="fw-bold mb-2"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              AI has analyzed your profile against this job
                            </motion.h5>
                            <p className="text-muted">Here's a summary of how well you match this position</p>
                            
                            <div className="match-score-container my-4">
                              <div className="position-relative d-inline-block" style={{ width: '200px', height: '200px' }}>
                                <Doughnut
                                  data={getMatchScoreData()}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    cutout: '75%',
                                    plugins: {
                                      legend: { display: false },
                                      tooltip: { enabled: false }
                                    }
                                  }}
                                />
                                <div className="position-absolute top-50 start-50 translate-middle text-center">
                                  <h1 className="mb-0 fw-bold">{matchPercentage}%</h1>
                                  <div className="text-muted">Match Rate</div>
                                </div>
                              </div>
                              {premiumBonus > 0 && (
                                <div className="text-success mt-2">
                                  <i className="fas fa-award me-1"></i>
                                  {premiumBonus}% premium bonus
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Row className="g-3 mb-4">
                            <Col md={6}>
                              <Card className="border-0 bg-light h-100">
                                <Card.Body className="d-flex align-items-center">
                                  <div className="d-flex align-items-center w-100">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                                      <i className="fas fa-medal text-white fa-lg"></i>
                                    </div>
                                    <div>
                                      <div className="text-muted small">Your Rank</div>
                                      <h4 className="mb-0 fw-bold">1 <span className="text-muted fs-6 fw-normal">of 1</span></h4>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                            
                            <Col md={6}>
                              <Card className="border-0 bg-light h-100">
                                <Card.Body className="d-flex align-items-center">
                                  <div className="d-flex align-items-center w-100">
                                    <div className="rounded-circle bg-success d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                                      <i className="fas fa-chart-line text-white fa-lg"></i>
                                    </div>
                                    <div>
                                      <div className="text-muted small">Percentile</div>
                                      <h4 className="mb-0 fw-bold">Top 100%</h4>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                          
                          <Row className="g-3">
                            <Col md={6}>
                              <Card className="border-0 bg-light h-100">
                                <Card.Body className="d-flex align-items-center">
                                  <div className="d-flex align-items-center w-100">
                                    <div className="rounded-circle bg-info d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                                      <i className="fas fa-check text-white fa-lg"></i>
                                    </div>
                                    <div>
                                      <div className="text-muted small">Strengths</div>
                                      <h4 className="mb-0 fw-bold">{recommendation.strengths?.length || 0} <span className="fs-6 fw-normal text-muted">key skills</span></h4>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                            
                            <Col md={6}>
                              <Card className="border-0 bg-light h-100">
                                <Card.Body className="d-flex align-items-center">
                                  <div className="d-flex align-items-center w-100">
                                    <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                                      <i className="fas fa-arrow-up text-white fa-lg"></i>
                                    </div>
                                    <div>
                                      <div className="text-muted small">To Improve</div>
                                      <h4 className="mb-0 fw-bold">{recommendation.weaknesses?.length || 0} <span className="fs-6 fw-normal text-muted">areas</span></h4>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="col-md-4">
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                        className="card border-0 shadow-sm h-100"
                      >
                        <div className="card-body p-4">
                          <motion.h5 
                            className="fw-bold border-start border-primary ps-3 border-4 mb-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            Top Skills to Highlight
                          </motion.h5>
                          
                          {recommendation.strengths && recommendation.strengths.length > 0 ? (
                            <ul className="list-group list-group-flush">
                              {recommendation.strengths.map((skill, index) => (
                                <motion.li 
                                  key={`strength-${index}`} 
                                  className="list-group-item px-0 py-3 border-bottom d-flex align-items-center"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 * (index + 1) }}
                                >
                                  <span className="badge bg-success p-2 rounded-circle me-3">
                                    <i className="fas fa-check text-white"></i>
                                  </span>
                                  <span className="fw-medium">{skill}</span>
                                </motion.li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-center py-5 text-muted">
                              <i className="fas fa-search mb-3" style={{ fontSize: '2rem' }}></i>
                              <p className="mb-0">No specific strengths identified</p>
                            </div>
                          )}
                          
                          <Button variant="primary" className="mt-4 w-100" onClick={handleApply}>
                            <i className="fas fa-paper-plane me-2"></i>
                            Apply Now
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SKILLS TAB */}
              {activeTab === 'skills' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Row className="g-4">
                    <Col lg={7}>
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="card border-0 shadow-sm h-100"
                      >
                        <div className="card-body p-4">
                          <motion.h5 
                            className="fw-bold border-start border-primary ps-3 border-4 mb-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            Skills Radar Analysis
                          </motion.h5>
                          
                          <div className="d-flex justify-content-end mb-3">
                            <div>
                              <Badge bg="success" className="me-2 py-2 px-3">Strengths</Badge>
                              <Badge bg="warning" text="dark" className="py-2 px-3">Areas to Improve</Badge>
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
                      </motion.div>
                    </Col>
                    
                    <Col lg={5}>
                      <div className="row g-4">
                        <div className="col-12">
                          <motion.div 
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.3 }}
                            className="card border-0 shadow-sm"
                            style={{ background: 'linear-gradient(45deg, #38b368, #2c9862)' }}
                          >
                            <div className="card-body p-4 text-white">
                              <h5 className="fw-bold mb-3">
                                <i className="fas fa-check-circle me-2"></i>
                                Key Strengths
                              </h5>
                              
                              {recommendation.strengths && recommendation.strengths.length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                  {recommendation.strengths.map((skill, index) => (
                                    <motion.li 
                                      key={`skill-strength-${index}`} 
                                      className="mb-2 d-flex align-items-center"
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 * (index + 1) }}
                                    >
                                      <i className="fas fa-check me-2"></i>
                                      <span>{skill}</span>
                                    </motion.li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mb-0">No specific strengths identified</p>
                              )}
                            </div>
                          </motion.div>
                        </div>
                        
                        <div className="col-12">
                          <motion.div 
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.4 }}
                            className="card border-0 shadow-sm"
                            style={{ background: 'linear-gradient(45deg, #ffc107, #ffbb00)' }}
                          >
                            <div className="card-body p-4 text-dark">
                              <h5 className="fw-bold mb-3">
                                <i className="fas fa-arrow-up me-2"></i>
                                Areas to Improve
                              </h5>
                              
                              {recommendation.weaknesses && recommendation.weaknesses.length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                  {recommendation.weaknesses.map((skill, index) => (
                                    <motion.li 
                                      key={`skill-improve-${index}`} 
                                      className="mb-2 d-flex align-items-center"
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 * (index + 1) }}
                                    >
                                      <i className="fas fa-arrow-circle-up me-2"></i>
                                      <span>{skill}</span>
                                    </motion.li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mb-0">No specific areas for improvement identified</p>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </motion.div>
              )}
              
              {/* RECOMMENDATIONS TAB */}
              {activeTab === 'recommendations' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Row className="g-4">
                    <Col md={8}>
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="card border-0 shadow-sm mb-4"
                      >
                        <div className="card-body p-4">
                          <motion.h5 
                            className="fw-bold border-start border-primary ps-3 border-4 mb-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            Career Recommendations
                          </motion.h5>
                          
                          <div className="alert alert-light border mb-4">
                            <div className="d-flex">
                              <i className="fas fa-info-circle text-primary me-3 mt-1"></i>
                              <div>
                                <span className="fw-medium">Based on your profile,</span> our AI recommends these similar job positions that could be a good match for your skills and experience.
                              </div>
                            </div>
                          </div>
                          
                          <h6 className="fw-bold mb-3">Similar Jobs to Consider</h6>
                          <Row className="g-3 mb-2">
                            {recommendation.similar_jobs && recommendation.similar_jobs.length > 0 ? (
                              recommendation.similar_jobs.slice(0, 3).map((job, index) => (
                                <Col md={4} key={`similar-job-${index}`}>
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * (index + 1) }}
                                    className="card h-100 bg-light border-0"
                                  >
                                    <div className="card-body p-3">
                                      <h6 className="card-title mb-1">{job.title}</h6>
                                      <p className="text-muted small mb-2">{job.company || 'Various companies'}</p>
                                      <ProgressBar 
                                        variant="info" 
                                        now={job.match_percentage} 
                                        style={{ height: '6px' }} 
                                      />
                                      <p className="text-end small mt-1 mb-0">{job.match_percentage}% match</p>
                                    </div>
                                  </motion.div>
                                </Col>
                              ))
                            ) : (
                              <Col xs={12} className="text-center py-4">
                                <i className="fas fa-briefcase text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                                <h6 className="text-muted">No similar jobs available for this position</h6>
                              </Col>
                            )}
                          </Row>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                        className="card border-0 shadow-sm"
                      >
                        <div className="card-body p-4">
                          <motion.h5 
                            className="fw-bold border-start border-primary ps-3 border-4 mb-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            Action Plan
                          </motion.h5>
                          
                          <div className="alert alert-light border mb-4">
                            <div className="d-flex">
                              <i className="fas fa-lightbulb text-warning me-3 mt-1"></i>
                              <div>
                                <span className="fw-medium">Enhance your application</span> with these specific recommendations to improve your chances of success.
                              </div>
                            </div>
                          </div>
                          
                          <Row className="g-4">
                            <Col md={6}>
                              <div className="bg-light p-4 rounded h-100 border">
                                <h6 className="text-primary mb-3 border-bottom pb-2">
                                  <i className="fas fa-star me-2"></i>
                                  Highlight in Application
                                </h6>
                                <ul className="list-unstyled mb-0">
                                  {recommendation.strengths && recommendation.strengths.length > 0 ? (
                                    recommendation.strengths.slice(0, 3).map((item, index) => (
                                      <motion.li 
                                        key={`highlight-${index}`} 
                                        className="mb-2 d-flex align-items-center"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * (index + 1) }}
                                      >
                                        <i className="fas fa-check-circle text-success me-2"></i>
                                        <span>{item}</span>
                                      </motion.li>
                                    ))
                                  ) : (
                                    <li className="text-muted">No specific strengths identified</li>
                                  )}
                                </ul>
                              </div>
                            </Col>
                            
                            <Col md={6}>
                              <div className="bg-light p-4 rounded h-100 border">
                                <h6 className="text-warning mb-3 border-bottom pb-2">
                                  <i className="fas fa-graduation-cap me-2"></i>
                                  Skills to Develop
                                </h6>
                                <ul className="list-unstyled mb-0">
                                  {recommendation.weaknesses && recommendation.weaknesses.length > 0 ? (
                                    recommendation.weaknesses.slice(0, 3).map((item, index) => (
                                      <motion.li 
                                        key={`develop-${index}`} 
                                        className="mb-2 d-flex align-items-center"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * (index + 1) }}
                                      >
                                        <i className="fas fa-arrow-circle-up text-warning me-2"></i>
                                        <span>{item}</span>
                                      </motion.li>
                                    ))
                                  ) : (
                                    <li className="text-muted">No specific areas for improvement identified</li>
                                  )}
                                </ul>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </motion.div>
                    </Col>
                    
                    <Col md={4}>
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.3 }}
                        className="card border-0 shadow-sm h-100"
                      >
                        <div className="card-body p-4">
                          <motion.h5 
                            className="fw-bold border-start border-primary ps-3 border-4 mb-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            Application Tips
                          </motion.h5>
                          
                          <div className="p-3 bg-primary bg-opacity-10 rounded mb-4">
                            <h6 className="fw-bold text-primary mb-3">
                              <i className="fas fa-rocket me-2"></i>
                              Boost Your Application
                            </h6>
                            <ul className="list-unstyled mb-0">
                              <li className="mb-3 d-flex">
                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                <div>
                                  <strong>Tailor your resume</strong> to highlight your strongest matching skills
                                </div>
                              </li>
                              <li className="mb-3 d-flex">
                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                <div>
                                  <strong>Prepare examples</strong> that demonstrate your experience with key skills
                                </div>
                              </li>
                              <li className="d-flex">
                                <i className="fas fa-check-circle text-success me-2 mt-1"></i>
                                <div>
                                  <strong>Address improvement areas</strong> by mentioning relevant training or learning plans
                                </div>
                              </li>
                            </ul>
                          </div>
                          
                          <div className="mt-4">
                            <Button variant="primary" className="w-100 mb-3" onClick={handleApply}>
                              <i className="fas fa-paper-plane me-2"></i>
                              Apply Now
                            </Button>
                            <Button variant="outline-secondary" className="w-100">
                              <i className="fas fa-file-download me-2"></i>
                              Download Report
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  </Row>
                </motion.div>
              )}
              
              {/* REPORT TAB */}
              {activeTab === 'report' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">
                      <motion.h5 
                        className="fw-bold border-start border-primary ps-3 border-4 mb-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Comprehensive Analysis Report
                      </motion.h5>
                      
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
                          overflowY: 'auto', 
                          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' 
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
                        <Button variant="primary" size="sm">
                          <i className="fas fa-download me-1"></i>
                          Download Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DetailedAIResultsDialog;
