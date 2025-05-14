import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const apiUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';

const AiRecommendation = ({ userId, jobId, subscription, authAxios, onViewDetails }) => {
  const [loading, setLoading] = useState(true); // Start with loading state true
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const isPremium = ['Golden', 'Platinum', 'Master'].includes(subscription);
  
  // Debug logging 
  console.log('AI Recommendation Component:', { userId, jobId, subscription, isPremium });

  // Trigger API call when component mounts or when IDs change
  useEffect(() => {
    if (userId && jobId) {
      console.log('AiRecommendation: userId and jobId available, triggering API call');
      console.log('User ID:', userId);
      console.log('Job ID:', jobId);
      fetchRecommendation();
    } else {
      console.log('AiRecommendation: Missing required IDs', { userId, jobId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, jobId]);

  // Animation effect for percentage counter when recommendation is loaded
  useEffect(() => {
    if (recommendation && recommendation.pass_percentage) {
      const targetPercentage = Math.round(recommendation.pass_percentage);
      let startValue = 0;
      const duration = 1500; // milliseconds
      const frameDuration = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameDuration);
      const incrementPerFrame = targetPercentage / totalFrames;
      
      let currentFrame = 0;
      const counter = setInterval(() => {
        currentFrame++;
        const progress = Math.min(incrementPerFrame * currentFrame, targetPercentage);
        setAnimatedPercentage(Math.floor(progress));
        
        if (currentFrame === totalFrames) {
          clearInterval(counter);
          setAnimatedPercentage(targetPercentage);
        }
      }, frameDuration);
      
      return () => clearInterval(counter);
    }
  }, [userId, jobId, recommendation]);

  const fetchRecommendation = () => {
    if (!userId || !jobId) {
      console.error('Cannot fetch recommendation: Missing user ID or job ID');
      setError('Missing required data to analyze this job');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Log the API call attempt for debugging
    console.log(`⚡ CALLING AI API: ${apiUrl}/api/recommendation?user_id=${userId}&job_id=${jobId}`);
    
    // Use XMLHttpRequest for better browser compatibility and network monitoring
    const xhr = new XMLHttpRequest();
    const url = `${apiUrl}/api/recommendation?user_id=${userId}&job_id=${jobId}`;
    
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('✅ AI recommendation data received:', data);
            
            if (data.success && data.data) {
              setRecommendation(data.data);
            } else {
              throw new Error(data.message || 'Failed to get recommendation data');
            }
          } catch (err) {
            console.error('❌ Error parsing AI recommendation response:', err);
            setError('Failed to parse AI insights data. Please try again.');
          }
        } else {
          console.error(`❌ API request failed with status ${xhr.status}: ${xhr.statusText}`);
          setError(`Failed to load AI insights (Status: ${xhr.status}). Please check if the recommendation service is running.`);
        }
        
        // Show loading animation for at least 1.5 seconds for better UX
        setTimeout(() => setLoading(false), 1500);
      }
    };
    
    xhr.onerror = function() {
      console.error('❌ Network error occurred when trying to fetch AI recommendation');
      setError('Network error. Please check if the recommendation service is running on port 5001.');
      setTimeout(() => setLoading(false), 1500);
    };
    
    // Send the request
    xhr.send();
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
            recommendation.pass_percentage > 70 ? 'rgba(40, 167, 69, 0.8)' :  // Green for high score
            recommendation.pass_percentage > 50 ? 'rgba(255, 193, 7, 0.8)' :   // Yellow for medium
            'rgba(220, 53, 69, 0.8)',                                         // Red for low
            'rgba(211, 211, 211, 0.3)',
          ],
          borderColor: [
            recommendation.pass_percentage > 70 ? 'rgba(40, 167, 69, 1)' :  
            recommendation.pass_percentage > 50 ? 'rgba(255, 193, 7, 1)' :   
            'rgba(220, 53, 69, 1)',
            'rgba(211, 211, 211, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Rankings chart data
  const getRankingChartData = () => {
    if (!recommendation || !recommendation.ranking) return null;
    
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

  // Determine the color for match percentage
  const getMatchColor = (percentage) => {
    if (percentage > 70) return 'text-success';
    if (percentage > 50) return 'text-warning';
    return 'text-danger';
  };

  // Render loading state with animated AI loader
  if (loading) {
    return (
      <motion.div 
        className="ai-recommendation mb-4 p-3 bg-light rounded"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h6 className="mb-3 d-flex align-items-center">
          <i className="fas fa-robot me-2 text-primary"></i>
          AI Job Match Analysis
        </h6>
        <div className="text-center py-4">
          <div className="ai-loader mb-3">
            <div className="ai-brain-animation">
              <i className="fas fa-brain" style={{
                fontSize: '2.5rem',
                color: '#3c65f5',
                animation: 'pulse 1.5s infinite'
              }}></i>
              <style jsx>{`
                @keyframes pulse {
                  0% { opacity: 0.6; transform: scale(0.95); }
                  50% { opacity: 1; transform: scale(1.05); }
                  100% { opacity: 0.6; transform: scale(0.95); }
                }
              `}</style>
            </div>
          </div>
          <p className="mb-0">Analyzing job compatibility...</p>
          <p className="text-muted small">Using AI to match your profile with job requirements</p>
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
        transition={{ delay: 0.2 }}
      >
        <h6 className="mb-3 d-flex align-items-center">
          <i className="fas fa-robot me-2 text-primary"></i>
          AI Job Match
        </h6>
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm btn-outline-danger mt-2" 
            onClick={fetchRecommendation}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // Free subscription view with blur effect and premium badge
  if (!isPremium) {
    return (
      <motion.div 
        className="ai-recommendation mb-4 p-3 bg-light rounded position-relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
              <div className="text-center mt-2">
                <h3>65%</h3>
                <p className="mb-0">Match Score</p>
              </div>
              <div className="mt-3">
                <p className="mb-1">Position: #3 of 12 applicants</p>
                <div className="progress">
                  <div className="progress-bar" role="progressbar" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unlock overlay */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-light bg-opacity-90"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 1.5 
            }}
          >
            <i className="fas fa-crown text-warning" style={{ fontSize: '2rem' }}></i>
          </motion.div>
          <h5 className="mt-3 mb-2">Premium Feature</h5>
          <p className="text-center mb-3">Unlock AI-powered job match insights<br />with a premium subscription</p>
          <button 
            className="btn btn-primary" 
            onClick={() => onViewDetails('upgrade')}
          >
            <i className="fas fa-unlock-alt me-2"></i>
            Upgrade Now
          </button>
        </div>
      </motion.div>
    );
  }

  // Premium user view with detailed analysis
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
          onClick={() => window.location.href = `/ai-job-analysis?jobId=${jobId}`}
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
