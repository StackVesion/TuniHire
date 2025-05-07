import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AiRecommendation = ({ userId, jobId, subscription, authAxios, onViewDetails }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [showUnlockForm, setShowUnlockForm] = useState(false);

  const isPremium = ['Golden', 'Platinum', 'Master'].includes(subscription);

  useEffect(() => {
    if (isPremium && userId && jobId) {
      fetchRecommendation();
    }
  }, [userId, jobId, subscription]);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.get(`http://localhost:5001/api/recommendation?user_id=${userId}&job_id=${jobId}`);
      setRecommendation(response.data.data);
    } catch (err) {
      console.error('Error fetching AI recommendation:', err);
      setError('Failed to load AI insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Chart data for premium users
  const getChartData = () => {
    if (!recommendation) return null;
    
    return {
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
    };
  };

  // Rankings chart data
  const getRankingChartData = () => {
    if (!recommendation) return null;
    
    return {
      labels: ['Your Score'],
      datasets: [
        {
          label: 'Application Score',
          data: [recommendation.ranking.score],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ],
    };
  };

  // Render loading state
  if (loading) {
    return (
      <motion.div 
        className="ai-recommendation mb-4 p-3 bg-light rounded"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h6 className="mb-3 d-flex align-items-center">
          <i className="fas fa-robot me-2 text-primary"></i>
          AI Job Match
        </h6>
        <div className="d-flex justify-content-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div 
        className="ai-recommendation mb-4 p-3 bg-light rounded"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h6 className="mb-3 d-flex align-items-center">
          <i className="fas fa-robot me-2 text-primary"></i>
          AI Job Match
        </h6>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </motion.div>
    );
  }

  // Free subscription view with blur effect
  if (!isPremium) {
    return (
      <motion.div 
        className="ai-recommendation mb-4 p-3 bg-light rounded position-relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h6 className="mb-3 d-flex align-items-center">
          <i className="fas fa-robot me-2 text-primary"></i>
          AI Job Match Insights
          <span className="ms-2 badge bg-warning text-dark">Premium</span>
        </h6>
        
        {/* Blurred preview content */}
        <div className="position-relative" style={{ filter: 'blur(6px)' }}>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="chart-container" style={{ height: '160px' }}>
                <Doughnut 
                  data={{
                    labels: ['Match Score', 'Gap'],
                    datasets: [{
                      data: [65, 35],
                      backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(211, 211, 211, 0.3)',
                      ]
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ height: '160px' }} className="d-flex flex-column justify-content-center">
                <h3 className="text-center mb-0">65%</h3>
                <p className="text-center text-muted mb-0">Match Rate</p>
                <p className="text-center mt-2">
                  <i className="fas fa-users me-1"></i> Rank: <span className="badge bg-success">Top 25%</span>
                </p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <h6 className="border-bottom pb-2">Key Strengths</h6>
              <div className="d-flex flex-wrap gap-1 mb-3">
                <span className="badge bg-light text-dark p-2">JavaScript</span>
                <span className="badge bg-light text-dark p-2">React</span>
                <span className="badge bg-light text-dark p-2">Node.js</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Unlock overlay */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ background: 'rgba(255,255,255,0.7)', zIndex: 2 }}
        >
          <div className="text-center px-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 1.5 
              }}
            >
              <i className="fas fa-crown text-warning" style={{ fontSize: '3rem' }}></i>
            </motion.div>
            <h5 className="mt-3">Unlock AI Insights</h5>
            <p className="text-muted mb-3">Upgrade to a premium plan to access AI-powered job match analysis and improve your chances.</p>
            <button 
              className="btn btn-warning"
              onClick={() => onViewDetails('upgrade')}
            >
              <i className="fas fa-unlock-alt me-2"></i>
              Upgrade Now
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Premium subscription view with actual data
  if (recommendation) {
    return (
      <motion.div 
        className="ai-recommendation mb-4 p-3 bg-light rounded"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h6 className="mb-3 d-flex align-items-center justify-content-between">
          <span>
            <i className="fas fa-robot me-2 text-primary"></i>
            AI Job Match Analysis
          </span>
          <span className="badge bg-primary">
            {subscription} Plan
          </span>
        </h6>
        
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="chart-container" style={{ height: '160px' }}>
              <Doughnut 
                data={getChartData()}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
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
            </div>
          </div>
          <div className="col-md-6">
            <div style={{ height: '160px' }} className="d-flex flex-column justify-content-center">
              <h3 className="text-center mb-0">{recommendation.pass_percentage.toFixed(1)}%</h3>
              <p className="text-center text-muted mb-0">Match Rate</p>
              <p className="text-center mt-2">
                <i className="fas fa-users me-1"></i> Rank: <span className="badge bg-success">
                  {recommendation.ranking.rank} of {recommendation.ranking.total_applicants}
                </span>
              </p>
              <p className="text-center mb-0">
                <span className="badge bg-info">Top {(recommendation.ranking.percentile).toFixed(0)}%</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="row mb-3">
          <div className="col-12">
            <h6 className="border-bottom pb-2">Key Strengths</h6>
            <div className="d-flex flex-wrap gap-1 mb-3">
              {recommendation.strengths.map((strength, index) => (
                <span key={index} className="badge bg-light text-dark p-2">
                  {strength}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-outline-primary w-100"
          onClick={() => onViewDetails('details', recommendation)}
        >
          <i className="fas fa-chart-line me-2"></i>
          View Detailed Analysis
        </button>
      </motion.div>
    );
  }

  // Fallback for premium users when data isn't available yet
  return (
    <motion.div 
      className="ai-recommendation mb-4 p-3 bg-light rounded"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h6 className="mb-3 d-flex align-items-center">
        <i className="fas fa-robot me-2 text-primary"></i>
        AI Job Match
      </h6>
      <div className="alert alert-info" role="alert">
        <i className="fas fa-info-circle me-2"></i>
        AI recommendation data is not available for this job.
      </div>
    </motion.div>
  );
};

export default AiRecommendation;
