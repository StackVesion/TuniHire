import React, { useState } from 'react';
import { Modal, Tabs, Tab, Row, Col, Card, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';
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

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      size="lg"
      aria-labelledby="ai-recommendation-dialog"
      className="ai-recommendation-dialog"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title id="ai-recommendation-dialog">AI Job Match Analysis</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          id="recommendation-tabs"
          className="mb-0"
        >
          <Tab eventKey="overview" title="Overview">
            <div className="p-3">
              <div className="text-center mb-4">
                <h5 className="mb-2">AI has analyzed your profile against this job</h5>
                <p className="text-muted small">Here's a summary of how well you match this position</p>
              </div>
              
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block" style={{ width: '160px', height: '160px' }}>
                  <Doughnut
                    data={getMatchScoreData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      cutout: '75%',
                      plugins: {
                        legend: { display: false },
                      }
                    }}
                  />
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <h2 className="mb-0">{matchPercentage}%</h2>
                    <div className="small text-muted">Match Rate</div>
                  </div>
                </div>
                {premiumBonus > 0 && (
                  <div className="text-success small mt-2">
                    <i className="fas fa-award me-1"></i>
                    {premiumBonus}% premium bonus
                  </div>
                )}
              </div>
              
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body className="d-flex align-items-center">
                      <div className="d-flex flex-row align-items-center w-100">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                          <i className="fas fa-medal text-white"></i>
                        </div>
                        <div>
                          <div className="text-muted small">Your Rank</div>
                          <h5 className="mb-0"><strong>1</strong> of 1</h5>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body className="d-flex align-items-center">
                      <div className="d-flex flex-row align-items-center w-100">
                        <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                          <i className="fas fa-chart-line text-white"></i>
                        </div>
                        <div>
                          <div className="text-muted small">Percentile</div>
                          <h5 className="mb-0">Top 100%</h5>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body className="d-flex align-items-center">
                      <div className="d-flex flex-row align-items-center w-100">
                        <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                          <i className="fas fa-check text-white"></i>
                        </div>
                        <div>
                          <div className="text-muted small">Strengths</div>
                          <h5 className="mb-0">{recommendation.strengths?.length || 0} <span className="small fw-normal">key skills</span></h5>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body className="d-flex align-items-center">
                      <div className="d-flex flex-row align-items-center w-100">
                        <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                          <i className="fas fa-arrow-up text-white"></i>
                        </div>
                        <div>
                          <div className="text-muted small">To Improve</div>
                          <h5 className="mb-0">{recommendation.weaknesses?.length || 0} <span className="small fw-normal">opportunities</span></h5>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div>
                <h5 className="mb-3">Top Skills to Highlight</h5>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    {recommendation.strengths && recommendation.strengths.length > 0 ? (
                      <ul className="list-unstyled mb-0">
                        {recommendation.strengths.map((skill, index) => (
                          <li key={`strength-${index}`} className="py-2 border-bottom d-flex align-items-center">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-3 text-muted">
                        No specific strengths identified
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          </Tab>
          
          <Tab eventKey="skills" title="Skills">
            <div className="p-3">
              <h5 className="mb-3 text-primary">Skills Analysis</h5>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <div>
                    <Badge bg="success" className="me-2">Strengths</Badge>
                    <Badge bg="warning" text="dark">Areas to Improve</Badge>
                  </div>
                  <span className="text-muted small">Higher scores = stronger skills</span>
                </div>
                
                <Card className="bg-light border-0 mb-4">
                  <Card.Body>
                    <div style={{ height: '320px', maxWidth: '500px', margin: '0 auto' }}>
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
                                  size: 12
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
                          }
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </div>
              
              <h5 className="mb-3">Skills Breakdown</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Card className="h-100 border-0" style={{ backgroundColor: '#198754', color: 'white' }}>
                    <Card.Body>
                      <h6 className="border-bottom pb-2 mb-3">Strengths</h6>
                      {recommendation.strengths && recommendation.strengths.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {recommendation.strengths.map((skill, index) => (
                            <li key={`strength-detail-${index}`} className="mb-2 d-flex align-items-center">
                              <i className="fas fa-check-circle me-2"></i>
                              <span>{skill}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-0">No specific strengths identified</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="h-100 border-0" style={{ backgroundColor: '#ffc107', color: '#212529' }}>
                    <Card.Body>
                      <h6 className="border-bottom pb-2 mb-3">Areas to Improve</h6>
                      {recommendation.weaknesses && recommendation.weaknesses.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {recommendation.weaknesses.map((skill, index) => (
                            <li key={`weakness-detail-${index}`} className="mb-2 d-flex align-items-center">
                              <i className="fas fa-arrow-circle-up me-2"></i>
                              <span>{skill}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-0">No specific areas for improvement identified</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tab>
          
          <Tab eventKey="recommendations" title="Recommendations">
            <div className="p-3">
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h5 className="card-title fw-bold mb-3 text-primary">Career Recommendations</h5>
                  
                  <Alert variant="light" className="border mb-3">
                    <div className="d-flex">
                      <div className="me-2">
                        <i className="fas fa-info-circle text-primary"></i>
                      </div>
                      <div className="small">
                        Based on your skills and profile, our AI recommends these similar job positions that could be a good match for your career.
                      </div>
                    </div>
                  </Alert>
                  
                  <h6 className="mb-3 border-start border-primary border-3 ps-2">Similar Jobs to Consider</h6>
                  <Row className="g-3">
                    {recommendation.similar_jobs && recommendation.similar_jobs.length > 0 ? (
                      recommendation.similar_jobs.slice(0, 3).map((job, index) => (
                        <Col md={4} key={`job-${index}`}>
                          <Card className="h-100 bg-light border-0">
                            <Card.Body className="p-3">
                              <h6 className="card-title mb-1">{job.title}</h6>
                              <p className="text-muted small mb-2">{job.company || 'Various companies'}</p>
                              <ProgressBar 
                                variant="info" 
                                now={job.match_percentage} 
                                style={{ height: '6px' }} 
                              />
                              <p className="text-end small mt-1 mb-0">{job.match_percentage}% match</p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col xs={12} className="text-center py-4">
                        <i className="fas fa-briefcase text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                        <h6 className="text-muted">No similar jobs available for this position</h6>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
              
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h5 className="card-title fw-bold mb-3 text-primary">Action Plan</h5>
                  
                  <Alert variant="light" className="border mb-3">
                    <div className="d-flex">
                      <div className="me-2">
                        <i className="fas fa-lightbulb text-warning"></i>
                      </div>
                      <div className="small">
                        Here are specific recommendations to enhance your application and improve your chances of success.
                      </div>
                    </div>
                  </Alert>
                  
                  <h6 className="mb-3 border-start border-success border-3 ps-2">Recommended Actions</h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="bg-light p-3 rounded h-100 border">
                        <h6 className="text-primary mb-3 border-bottom pb-2">
                          <i className="fas fa-star me-2"></i>
                          Highlight in Application
                        </h6>
                        <ul className="list-unstyled mb-0">
                          {recommendation.strengths && recommendation.strengths.length > 0 ? (
                            recommendation.strengths.slice(0, 3).map((item, index) => (
                              <li key={`highlight-${index}`} className="mb-2 d-flex align-items-center">
                                <i className="fas fa-check-circle text-success me-2"></i>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted">No specific strengths identified</li>
                          )}
                        </ul>
                      </div>
                    </Col>
                    
                    <Col md={6}>
                      <div className="bg-light p-3 rounded h-100 border">
                        <h6 className="text-warning mb-3 border-bottom pb-2">
                          <i className="fas fa-graduation-cap me-2"></i>
                          Skills to Develop
                        </h6>
                        <ul className="list-unstyled mb-0">
                          {recommendation.weaknesses && recommendation.weaknesses.length > 0 ? (
                            recommendation.weaknesses.slice(0, 3).map((item, index) => (
                              <li key={`develop-${index}`} className="mb-2 d-flex align-items-center">
                                <i className="fas fa-arrow-circle-up text-warning me-2"></i>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted">No specific areas for improvement identified</li>
                          )}
                        </ul>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Tab>
          
          <Tab eventKey="report" title="Report">
            <div className="p-3">
              <h5 className="mb-3 text-primary">Comprehensive Analysis Report</h5>
              
              <Alert variant="info" className="mb-3">
                <div className="d-flex">
                  <div className="me-2">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div className="small">
                    <strong>About This Report:</strong> This comprehensive analysis is generated by our AI system based on your profile and the job requirements. The report provides detailed insights to help you understand your strengths, areas for improvement, and specific recommendations.
                  </div>
                </div>
              </Alert>
              
              <div className="bg-light p-4 rounded border" style={{ maxHeight: '380px', overflowY: 'auto', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
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
              
              <div className="mt-3 d-flex justify-content-between align-items-center py-2 border-top">
                <div className="d-flex align-items-center">
                  <i className="fas fa-calendar-alt text-muted me-2"></i>
                  <small className="text-muted">Generated on {new Date().toLocaleDateString()}</small>
                </div>
                <button className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-download me-1"></i>
                  Download Report
                </button>
              </div>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default DetailedRecommendationDialog;
