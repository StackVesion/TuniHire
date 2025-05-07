import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Badge, ProgressBar, Button } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

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
