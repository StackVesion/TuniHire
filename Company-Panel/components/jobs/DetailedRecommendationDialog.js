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
  
  // Chart data for doughnut chart
  const getMatchScoreData = () => {
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
    const allSkills = [...recommendation.strengths, ...recommendation.weaknesses.slice(0, 3)];
    
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
          {/* Backdrop with blur effect */}
          <motion.div
            className="fixed-top w-100 h-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(5px)',
              zIndex: 1050,
            }}
            onClick={onClose}
          />

          {/* Dialog container - perfectly centered */}
          <div 
            className="fixed-top w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 1051 }}
          >
            <motion.div
              className="modal-dialog modal-xl"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              style={{
                width: '100%',
                maxWidth: '1100px',
                margin: 0,
              }}
            >
              <div className="modal-content border-0 shadow-lg overflow-hidden">
                {/* Header with gradient background */}
                <div className="modal-header bg-primary bg-gradient text-white">
                  <h5 className="modal-title d-flex align-items-center">
                    <motion.i 
                      className="fas fa-robot me-2"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: 360 }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    AI Job Match Analysis
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={onClose}
                  />
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
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="tab-pane fade show active"
                      >
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <div className="card h-100 border-0 shadow-sm">
                              <div className="card-body">
                                <h6 className="card-title text-primary">
                                  <i className="fas fa-percentage me-2"></i>
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
                                    className="ms-3"
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