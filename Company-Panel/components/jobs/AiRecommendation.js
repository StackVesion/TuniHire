import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
    console.log(`⚡ CALLING AI API: http://localhost:5003/api/recommendation?user_id=${userId}&job_id=${jobId}`);
    
    // Use XMLHttpRequest for better browser compatibility and network monitoring
    const xhr = new XMLHttpRequest();
    const url = `http://localhost:5003/api/recommendation?user_id=${userId}&job_id=${jobId}`;
    
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('✅ AI recommendation data received:', data);
            
            if (data.success) {
              console.log('Raw API response:', data);
              
              // Extract the recommendation data from the nested structure
              // Handle both possible cases: data.data.data (triple nested) or data.data (double nested)
              const apiData = data.data || {};
              const detailedData = apiData.data || apiData;
              
              console.log('Extracted detailed data:', detailedData);
              
              // Create a complete recommendation object with defaults for missing properties
              const recommendationData = {
                // Default values to prevent errors
                detailed_scores: {
                  education_score: 0,
                  experience_score: 0,
                  global_score: 0,
                  languages_score: 0,
                  skills_score: 0
                },
                scoreBreakdown: [],
                match_score: 0,
                ranking: { rank: 1, total_applicants: 10, percentile: 90 },
                strengths: ['Communication', 'Technical Knowledge'],
                similar_jobs: []
              };
              
              // Handle the newer API format with scoreBreakdown array
              if (detailedData.scoreBreakdown && Array.isArray(detailedData.scoreBreakdown)) {
                console.log('Using new scoreBreakdown format:', detailedData.scoreBreakdown);
                
                recommendationData.scoreBreakdown = detailedData.scoreBreakdown;
                
                // Calculate pass_percentage (match_score) as the average of scores if not provided directly
                if (detailedData.match_score) {
                  recommendationData.match_score = detailedData.match_score;
                  recommendationData.pass_percentage = detailedData.match_score; // For backward compatibility
                } else {
                  // Calculate from breakdown scores
                  const validScores = detailedData.scoreBreakdown
                    .map(item => item.score)
                    .filter(score => score > 0);
                  
                  const averageScore = validScores.length > 0 ? 
                    validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0;
                  
                  recommendationData.match_score = averageScore;
                  recommendationData.pass_percentage = averageScore; // For backward compatibility
                }
                
                // Extract strengths from the scoreBreakdown
                // Consider scores that are high as strengths
                const threshold = 60; // Only consider scores above this threshold as strengths
                recommendationData.strengths = detailedData.scoreBreakdown
                  .filter(item => item.score >= threshold)
                  .map(item => item.name);
                  
                // Ensure we have at least some strengths
                if (recommendationData.strengths.length === 0) {
                  // Find the top 2 highest scores
                  const sortedScores = [...detailedData.scoreBreakdown].sort((a, b) => b.score - a.score);
                  recommendationData.strengths = sortedScores.slice(0, 2).map(item => item.name);
                  
                  // If still no strengths, add defaults
                  if (recommendationData.strengths.length === 0) {
                    recommendationData.strengths = ['Technical Knowledge', 'Potential'];
                  }
                }
              } 
              // Backward compatibility for older API format
              else if (detailedData.detailed_scores) {
                const scores = detailedData.detailed_scores;
                recommendationData.detailed_scores = {
                  ...recommendationData.detailed_scores,
                  ...scores
                };
                
                // Construct scoreBreakdown from detailed_scores for compatibility
                recommendationData.scoreBreakdown = [
                  { name: 'Education', score: scores.education_score || 0, color: 'rgba(54, 162, 235, 0.8)' },
                  { name: 'Experience', score: scores.experience_score || 0, color: 'rgba(255, 206, 86, 0.8)' },
                  { name: 'Skills', score: scores.skills_score || 0, color: 'rgba(75, 192, 192, 0.8)' },
                  { name: 'Languages', score: scores.languages_score || 0, color: 'rgba(153, 102, 255, 0.8)' },
                  { name: 'Overall', score: scores.global_score || 0, color: 'rgba(255, 159, 64, 0.8)' }
                ];
                
                // Calculate average score
                let validScores = [];
                if (scores.education_score > 0) validScores.push(scores.education_score);
                if (scores.experience_score > 0) validScores.push(scores.experience_score);
                if (scores.skills_score > 0) validScores.push(scores.skills_score);
                if (scores.languages_score > 0) validScores.push(scores.languages_score);
                if (scores.global_score > 0) validScores.push(scores.global_score);
                
                const averageScore = validScores.length > 0 ? 
                  validScores.reduce((sum, score) => sum + score, 0) / validScores.length : 0;
                
                recommendationData.match_score = averageScore;
                recommendationData.pass_percentage = averageScore; // For backward compatibility
                
                // Set strengths based on highest scores
                const threshold = 40;
                recommendationData.strengths = [];
                if (scores.education_score >= threshold) recommendationData.strengths.push('Education');
                if (scores.experience_score >= threshold) recommendationData.strengths.push('Experience');
                if (scores.skills_score >= threshold) recommendationData.strengths.push('Skills Match');
                if (scores.languages_score >= threshold) recommendationData.strengths.push('Language Proficiency');
                
                if (recommendationData.strengths.length === 0) {
                  recommendationData.strengths = ['Technical Knowledge', 'Potential'];
                }
              }
              
              // Handle error messages from API for logging but don't show to user
              if (apiData.error) {
                console.warn('API returned an error (non-blocking):', apiData.error);
              }
              
              console.log('Processed recommendation data:', recommendationData);
              setRecommendation(recommendationData);
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
    
    // If we have scoreBreakdown, create a chart from it
    if (recommendation.scoreBreakdown && recommendation.scoreBreakdown.length > 0) {
      // Extract data from scoreBreakdown
      const labels = recommendation.scoreBreakdown.map(item => item.name);
      const mainData = recommendation.scoreBreakdown.map(item => item.score);
      const backgroundColors = recommendation.scoreBreakdown.map(item => item.color || getColorForScore(item.score));
      const borderColors = recommendation.scoreBreakdown.map(item => {
        // Make border slightly darker than background
        const color = item.color || getColorForScore(item.score);
        return color.replace('0.8', '1');
      });
      
      return {
        labels: labels,
        datasets: [
          {
            data: mainData,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      };
    }
    
    // Fallback: Create a simple match/gap chart
    const passPercentage = recommendation.match_score || recommendation.pass_percentage || 0;
    return {
      labels: ['Match Score', 'Gap'],
      datasets: [
        {
          data: [passPercentage, 100 - passPercentage],
          backgroundColor: [
            getColorForScore(passPercentage),
            'rgba(211, 211, 211, 0.3)', // Gray for gap
          ],
          borderColor: [
            getColorForScore(passPercentage).replace('0.8', '1'),
            'rgba(211, 211, 211, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Helper function to get color based on score
  const getColorForScore = (score) => {
    if (score >= 80) return 'rgba(40, 167, 69, 0.8)';      // Green (excellent)
    if (score >= 60) return 'rgba(0, 123, 255, 0.8)';      // Blue (good)
    if (score >= 40) return 'rgba(255, 193, 7, 0.8)';      // Yellow (average)
    return 'rgba(220, 53, 69, 0.8)';                      // Red (poor)
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
                  cutout: '70%',
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                          size: 10
                        }
                      }
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
            </div>
          </div>
          <div className="col-md-6">
            <div style={{ height: '160px' }} className="d-flex flex-column justify-content-center">
              <h3 className="text-center mb-0">{(recommendation.match_score || recommendation.pass_percentage || 0).toFixed(1)}%</h3>
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
