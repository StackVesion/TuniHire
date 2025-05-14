import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import Layout from "@/components/layout/Layout";
import axios from "axios";
import Link from "next/link";
import withAuth from "@/utils/withAuth";
import { getToken, createAuthAxios } from "@/utils/authUtils";
import { FaTimes, FaLock } from "react-icons/fa";

// Import form components
import EducationForm from '../components/portfolio/EducationForm';
import ExperienceForm from '../components/portfolio/ExperienceForm';
import CertificateForm from '../components/portfolio/CertificateForm';

// Import section components
import EducationSection from '../components/portfolio/EducationSection';
import ExperienceSection from '../components/portfolio/ExperienceSection';
import CertificateSection from '../components/portfolio/CertificateSection';
import ProjectSection from '../components/portfolio/ProjectSection';
import PortfolioGuide from '../components/portfolio/PortfolioGuide';

// Import data
import suggestions from '../data/suggestions.json';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function Portfolio({ user }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [portfolio, setPortfolio] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [currentStep, setCurrentStep] = useState('about');
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Education form state
    const [educationForm, setEducationForm] = useState({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        currentlyEnrolled: false,
        description: '',
        location: ''
    });
    
    // Experience form state
    const [experienceForm, setExperienceForm] = useState({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: '',
        location: ''
    });
    
    // Skills form state
    const [newSkill, setNewSkill] = useState('');
    
    // State variables for social links and about section
    const [showSocialLinksForm, setShowSocialLinksForm] = useState(false);
    const [showAboutForm, setShowAboutForm] = useState(false);
    const [socialLinks, setSocialLinks] = useState({
        linkedin: '',
        github: '',
        website: '',
        twitter: ''
    });
    const [about, setAbout] = useState('');
    
    // Modal states
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [showExperienceModal, setShowExperienceModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItemId, setCurrentItemId] = useState(null);
    
    // Project section state
    const [projectForm, setProjectForm] = useState({
        title: '',
        description: '',
        technologies: '',
        link: '',
        image: ''
    });
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [isProjectEditing, setIsProjectEditing] = useState(false);
    const [currentProjectIndex, setCurrentProjectIndex] = useState(null);
    
    // Certificate state management
    const [certificateForm, setCertificateForm] = useState({
        title: '',
        description: '',
        skills: '',
        certificateUrl: ''
    });
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [editingCertificateIndex, setEditingCertificateIndex] = useState(null);
    
    // State variables for step-by-step guide
    const [activeGuideStep, setActiveGuideStep] = useState(1);
    const guideSteps = [
        { step: 1, title: 'Generate CV', description: 'Generate your CV to showcase your professional background.', target: 'cv-section' },
        { step: 2, title: 'Add Education', description: 'Add your educational background to highlight your qualifications.', target: 'education-section' },
        { step: 3, title: 'Add Experience', description: 'Share your work experience to demonstrate your professional journey.', target: 'experience-section' },
        { step: 4, title: 'Add Skills', description: 'List your key skills to highlight your strengths.', target: 'skills-section' },
        { step: 5, title: 'Review Portfolio', description: 'Review your complete portfolio before finalizing.', target: 'progress-section' }
    ];
    
    // Function to show the next guide step
    const showNextGuideStep = () => {
        const nextStep = activeGuideStep + 1;
        if (nextStep <= guideSteps.length) {
            setActiveGuideStep(nextStep);
            
            // Scroll to the appropriate section
            const sectionMap = {
                1: 'cv-section',
                2: 'education-section',
                3: 'experience-section',
                4: 'skills-section',
                5: 'progress-section'
            };
            
            const targetSection = document.getElementById(sectionMap[nextStep]);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            // If we have a guide step for this index, show a modal
            if (nextStep < guideSteps.length) {
                const step = guideSteps[nextStep];
                Swal.fire({
                    title: `Step ${step.step}: ${step.title}`,
                    text: step.description,
                    icon: 'info',
                    confirmButtonText: 'Got it!'
                });
                
                // If this is the education or experience step, show the add modal
                if (step.target === 'education-section' && portfolio?.education?.length === 0) {
                    setShowEducationModal(true);
                } else if (step.target === 'experience-section' && portfolio?.experience?.length === 0) {
                    setShowExperienceModal(true);
                }
            }
        }
    };
    
    // Helper function to make robust portfolio update API calls
    const updatePortfolioOnServer = async (updatedPortfolioData) => {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }
        
        if (!portfolio || !portfolio._id) {
            throw new Error('No portfolio ID available for update');
        }
          // Use the proper endpoint based on our new routes
        try {
            const endpoint = `${apiUrl}/api/portfolios/${portfolio._id}`;
            console.log(`Updating portfolio with endpoint: ${endpoint}`);
            
            const authAxios = createAuthAxios();
            const response = await authAxios.put(endpoint, updatedPortfolioData);
            
            console.log(`Successfully updated portfolio`);
            return response.data;
        } catch (err) {
            console.error('Portfolio update failed', err);
            throw new Error('Failed to update portfolio on the server');
        }
    };
    
    // Add clear state for portfolio existence
    const [portfolioExists, setPortfolioExists] = useState(false);

    // Fetch portfolio data on component mount
    useEffect(() => {
        const fetchPortfolioData = async () => {
            try {
                setLoading(true);
                // Check if user exists before making the API call
                if (!user || !user._id) {
                    console.log('User not authenticated or missing ID');
                    setPortfolio(null);
                    setPortfolioExists(false);
                    setWizardActive(true);
                    return; // Exit early if no user
                }
                
                const authAxios = createAuthAxios();
                try {
                    // Try to get the portfolio
                    const response = await authAxios.get(`${apiUrl}/api/portfolios/user/${user._id}`);
                    
                    // If we got a valid portfolio
                    if (response.data && response.data.success) {
                        // The portfolio is in response.data.portfolio
                        const portfolioData = response.data.portfolio || response.data;
                        setPortfolio(portfolioData);
                        setPortfolioExists(true);
                        
                        // Set the About and SocialLinks states from the portfolio
                        setAbout(portfolioData.about || '');
                        setSocialLinks(portfolioData.socialLinks || { 
                            linkedin: '', github: '', website: '', twitter: '' 
                        });
                    } else {
                        // Handle case where API returns a successful response but no portfolio
                        console.log('No portfolio found, initializing empty state');
                        setPortfolio(null);
                        setPortfolioExists(false);
                        setWizardActive(true); // Show portfolio creation wizard
                    }
                } catch (error) {
                    // This is an inner try/catch to handle the 404 without triggering the Next.js error overlay
                    if (error.response && error.response.status === 404) {
                        // This is expected for new users - handle gracefully without showing error
                        console.log('No portfolio found for this user - need to create one');
                        setPortfolio(null);
                        setPortfolioExists(false);
                        setWizardActive(true); // Show portfolio creation wizard
                    } else {
                        // For other errors, still log but don't throw
                        console.log('Error fetching portfolio:', error.message || 'Unknown error');
                        // Don't show error toast for 404 - this is normal for new users
                        if (error.response && error.response.status !== 404) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to fetch portfolio data. Please try again.'
                            });
                        }
                    }
                }
            } catch (outerError) {
                // This outer catch is just a safety net, should rarely be hit
                console.log('Unexpected error:', outerError);
            } finally {
                setLoading(false);
            }
        };
        
        if (user && user._id) {
            fetchPortfolioData();
        }
    }, [user, portfolio?._id]);
    
    // Calculate progress percentage whenever portfolio changes
    useEffect(() => {
        if (portfolio) {
            calculateProgress();
        }
    }, [portfolio]);
    
    // Test API function to restore
    const testApiEndpoints = async () => {
        console.log("Testing API endpoints...");
        
        if (!user || !user._id) {
            console.error("Missing user ID");
            return;
        }

        try {
            const authAxios = createAuthAxios();
            const response = await authAxios.post(`${apiUrl}/api/portfolios/${portfolio._id}/skills`, {
                skill: newSkill.trim()
            });

            if (response.data.success) {
                setPortfolio(response.data.portfolio);
                setNewSkill('');
                Swal.fire({
                    icon: 'success',
                    title: 'Skill Added',
                    text: 'Your skill has been added successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to add skill. ' + (error.response?.data?.message || 'Please try again.') 
            });
        }
    };

    // Function to calculate progress percentage
    const calculateProgress = () => {
        let totalItems = 3; // CV, Experience, Education are the required items
        let completedItems = 0;
        
        // Check each required item
        if (portfolio?.cvFile) completedItems++;
        if (portfolio?.education?.length > 0) completedItems++;
        if (portfolio?.experience?.length > 0) completedItems++;
        
        // Optional items can increase progress beyond the base requirements
        let bonusItems = 0;
        let totalBonus = 2; // Skills and Certificates are bonus items
        
        if (portfolio?.skills?.length > 0) bonusItems++;
        if (portfolio?.certificates?.length > 0) bonusItems++;
        
        // Calculate base percentage (up to 85%)
        let basePercentage = (completedItems / totalItems) * 85;
        
        // Add bonus percentage (up to 15%)
        let bonusPercentage = (bonusItems / totalBonus) * 15;
        
        // Set progress and check if we should show the next guide step
        const newProgress = Math.round(basePercentage + bonusPercentage);
        setProgressPercentage(newProgress);
        
        // If a section was completed and we have an active guide step, maybe show the next step
        // Only advance automatically if this is the first completion of this step
        if (completedItems > 0 && completedItems === activeGuideStep && activeGuideStep < guideSteps.length - 1) {
            showNextGuideStep();
        }
        
        return { 
            total: totalItems + totalBonus,
            completed: completedItems + bonusItems,
            percentage: newProgress
        };
    };
    
    // Education handlers
    const handleEducationChange = (e) => {
        const { name, value } = e.target;
        
        // Format date input if this is a date field
        if (name === 'startDate' || name === 'endDate') {
            const formattedDate = value ? new Date(value).toISOString().split('T')[0] : '';
            setEducationForm(prev => ({ ...prev, [name]: formattedDate }));
        } else {
            setEducationForm(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleEducationCheckbox = (e) => {
        const { checked } = e.target;
        setEducationForm(prev => ({
            ...prev,
            currentlyEnrolled: checked,
            endDate: checked ? '' : prev.endDate
        }));
    };
    
    // Add new education entry
    const handleAddEducation = async () => {
        // Check if CV has been uploaded - cannot add education without CV
        if (!portfolio?._id || !portfolio?.cvFile) {
            Swal.fire({
                icon: 'warning',
                title: 'Generate CV First',
                text: 'You need to generate your CV before adding education details.'
            });
            
            // Close the education modal
            setShowEducationModal(false);
            
            // Redirect to CV section
            const cvSection = document.getElementById('cv-section');
            if (cvSection) {
                cvSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            return;
        }
        
        // Validate required fields
        if (!educationForm.school || !educationForm.degree || !educationForm.fieldOfStudy || !educationForm.startDate) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Information',
                text: 'Please fill in all required fields (School, Degree, Field of Study, Start Date)'
            });
            return;
        }
        
        try {
            const authAxios = createAuthAxios();
            
            const updatedPortfolio = { ...portfolio };
            
            if (!updatedPortfolio.education) {
                updatedPortfolio.education = [];
            }
            
            if (isEditing && currentItemId !== null) {
                // Update existing education entry
                updatedPortfolio.education[currentItemId] = educationForm;
            } else {
                // Add new education entry
                updatedPortfolio.education.push(educationForm);
            }
            
            // Update portfolio on the server
            await updatePortfolioOnServer(updatedPortfolio);
            
            // Update local state
            setPortfolio(updatedPortfolio);
            
            // Reset form
            setEducationForm({
                school: '',
                degree: '',
                fieldOfStudy: '',
                startDate: '',
                endDate: '',
                currentlyEnrolled: false,
                description: '',
                location: ''
            });
            
            setShowEducationModal(false);
            setIsEditing(false);
            setCurrentItemId(null);
            
            Swal.fire({
                icon: 'success',
                title: isEditing ? 'Education Updated' : 'Education Added',
                text: isEditing ? 'Your education has been updated successfully.' : 'Your education has been added successfully.'
            });
        } catch (err) {
            console.error('Error adding/updating education:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error processing your request. Please try again.'
            });
        }
    };
    
    // Edit education entry
    const handleEditEducation = (index) => {
        const education = portfolio.education[index];
        if (education) {
            // Format dates for the date input fields
            const startDate = education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '';
            const endDate = education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : '';
            
            setEducationForm({
                ...education,
                startDate,
                endDate
            });
            setIsEditing(true);
            setCurrentItemId(index);
            setShowEducationModal(true);
        }
    };
    
    // Delete education entry
    const handleDeleteEducation = async (index) => {
        try {
            const result = await Swal.fire({
                title: 'Delete Education',
                text: 'Are you sure you want to delete this education entry?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel'
            });
            
            if (result.isConfirmed) {
                const authAxios = createAuthAxios();
                
                if (!authAxios) {
                    console.error('No auth axios found');
                    return;
                }
                
                const updatedPortfolio = { ...portfolio };
                updatedPortfolio.education.splice(index, 1);
                
                // Update portfolio on the server
                await updatePortfolioOnServer(updatedPortfolio);
                
                // Update local state
                setPortfolio(updatedPortfolio);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Education Deleted',
                    text: 'Your education entry has been deleted successfully.'
                });
            }
        } catch (err) {
            console.error('Error deleting education:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error processing your request. Please try again.'
            });
        }
    };
    
    // Experience handlers
    const handleExperienceChange = (e) => {
        const { name, value } = e.target;
        
        // Format date input if this is a date field
        if (name === 'startDate' || name === 'endDate') {
            const formattedDate = value ? new Date(value).toISOString().split('T')[0] : '';
            setExperienceForm(prev => ({ ...prev, [name]: formattedDate }));
        } else {
            setExperienceForm(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleExperienceCheckbox = (e) => {
        const { checked } = e.target;
        setExperienceForm(prev => ({
            ...prev,
            currentlyWorking: checked,
            endDate: checked ? '' : prev.endDate
        }));
    };
    
    // Add new experience entry
    const handleAddExperience = async () => {
        // Check if CV has been uploaded - cannot add experience without CV
        if (!portfolio?._id || !portfolio?.cvFile) {
            Swal.fire({
                icon: 'warning',
                title: 'Generate CV First',
                text: 'You need to generate your CV before adding experience details.'
            });
            
            // Close the experience modal
            setShowExperienceModal(false);
            
            // Redirect to CV section
            const cvSection = document.getElementById('cv-section');
            if (cvSection) {
                cvSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            return;
        }
        
        // Validate required fields
        if (!experienceForm.company || !experienceForm.position || !experienceForm.startDate) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Information',
                text: 'Please fill in all required fields (Company, Position, Start Date)'
            });
            return;
        }
        
        try {
            const authAxios = createAuthAxios();
            
            const updatedPortfolio = { ...portfolio };
            
            if (!updatedPortfolio.experience) {
                updatedPortfolio.experience = [];
            }
            
            if (isEditing && currentItemId !== null) {
                // Update existing experience entry
                updatedPortfolio.experience[currentItemId] = experienceForm;
            } else {
                // Add new experience entry
                updatedPortfolio.experience.push(experienceForm);
            }
            
            // Update portfolio on the server
            await updatePortfolioOnServer(updatedPortfolio);
            
            // Update local state
            setPortfolio(updatedPortfolio);
            
            // Reset form
            setExperienceForm({
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                currentlyWorking: false,
                description: '',
                location: ''
            });
            
            setShowExperienceModal(false);
            setIsEditing(false);
            setCurrentItemId(null);
            
            Swal.fire({
                icon: 'success',
                title: isEditing ? 'Experience Updated' : 'Experience Added',
                text: isEditing ? 'Your experience has been updated successfully.' : 'Your experience has been added successfully.'
            });
        } catch (err) {
            console.error('Error adding/updating experience:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error processing your request. Please try again.'
            });
        }
    };
    
    // Edit experience entry
    const handleEditExperience = (index) => {
        const experience = portfolio.experience[index];
        if (experience) {
            // Format dates for the date input fields
            const startDate = experience.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '';
            const endDate = experience.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '';
            
            setExperienceForm({
                ...experience,
                startDate,
                endDate
            });
            setIsEditing(true);
            setCurrentItemId(index);
            setShowExperienceModal(true);
        }
    };
    
    // Delete experience entry
    const handleDeleteExperience = async (index) => {
        try {
            const result = await Swal.fire({
                title: 'Delete Experience',
                text: 'Are you sure you want to delete this experience entry?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel'
            });
            
            if (result.isConfirmed) {
                const authAxios = createAuthAxios();
                
                if (!authAxios) {
                    console.error('No auth axios found');
                    return;
                }
                
                const updatedPortfolio = { ...portfolio };
                updatedPortfolio.experience.splice(index, 1);
                
                // Update portfolio on the server
                await updatePortfolioOnServer(updatedPortfolio);
                
                // Update local state
                setPortfolio(updatedPortfolio);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Experience Deleted',
                    text: 'Your experience entry has been deleted successfully.'
                });
            }
        } catch (err) {
            console.error('Error deleting experience:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error processing your request. Please try again.'
            });
        }
    };
    
    // Skills management functions
    const handleAddSkill = async () => {
        if (!newSkill.trim()) {
            return;
        }

        try {
            const authAxios = createAuthAxios();
            // Make sure we have the portfolio ID
            if (!portfolio || !portfolio._id) {
                console.error('Portfolio ID missing');
                return;
            }
            
            const response = await authAxios.post(`${apiUrl}/api/portfolios/${portfolio._id}/skills`, {
                skill: newSkill.trim()
            });

            if (response.data.success) {
                // Update the portfolio state with the returned portfolio object
                setPortfolio(response.data.portfolio);
                setNewSkill(''); // Reset the input field
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Skill Added',
                    text: 'Your skill has been added successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to add skill. ' + (error.response?.data?.message || 'Please try again.') 
            });
        }
    };

    const handleRemoveSkill = async (skill) => {
        try {
            const authAxios = createAuthAxios();
            
            // Make sure we have the portfolio ID
            if (!portfolio || !portfolio._id) {
                console.error('Portfolio ID missing');
                return;
            }
            
            const response = await authAxios.delete(`${apiUrl}/api/portfolios/${portfolio._id}/skills/${encodeURIComponent(skill)}`);
            
            if (response.data.success) {
                // Update the portfolio state with the returned portfolio object
                setPortfolio(response.data.portfolio);
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Skill Removed',
                    text: 'Your skill has been removed successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error removing skill:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to remove skill'
            });
        }
    };
    
    const handleSocialLinksSubmit = async (e) => {
        e.preventDefault();
        try {
            const authAxios = createAuthAxios();
            const response = await authAxios.put(`${apiUrl}/api/portfolios/${portfolio._id}/social-links`, {
                socialLinks: socialLinks
            });

            if (response.data.success) {
                setPortfolio(response.data.portfolio);
                setShowSocialLinksForm(false);
                Swal.fire({
                    icon: 'success',
                    title: 'Social Links Updated',
                    text: 'Your social links have been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error updating social links:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update social links.'
            });
        }
    };

    const handleAboutSubmit = async (e) => {
        e.preventDefault();
        try {
            const authAxios = createAuthAxios();
            const response = await authAxios.put(`${apiUrl}/api/portfolios/${portfolio._id}/about`, {
                about: about
            });

            if (response.data.success) {
                setPortfolio(response.data.portfolio);
                setShowAboutForm(false);
                Swal.fire({
                    icon: 'success',
                    title: 'About Section Updated',
                    text: 'Your about section has been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error updating about section:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update about section.'
            });
        }
    };
    
    // About section management
    const [editingAbout, setEditingAbout] = useState(false);
    const [aboutInput, setAboutInput] = useState('');
    
    useEffect(() => {
        if (portfolio?.about) {
            setAboutInput(portfolio.about);
        }
    }, [portfolio]);
    
    const updateAbout = async () => {
        try {
            setLoading(true);
            const authAxios = createAuthAxios();
            
            // Use the proper endpoint based on our new routes
            const response = await authAxios.patch(`${apiUrl}/api/portfolios/about`, {
                userId: user._id,
                about: aboutInput
            });
            
            if (response.data.success) {
                // Update local portfolio state
                setPortfolio(prev => ({ ...prev, about: aboutInput }));
                setEditingAbout(false);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Bio Updated',
                    text: 'Your professional bio has been updated.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error(response.data.message || 'Failed to update bio');
            }
        } catch (error) {
            console.error('Error updating bio:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update your bio. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Project handling functions
    const handleAddProject = async () => {
        if (!projectForm.title) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please provide a project title.'
            });
            return;
        }
        
        try {
            setLoading(true);
            const authAxios = createAuthAxios();
            
            // Convert comma-separated technologies to array
            const techArray = projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean);
            const projectData = { ...projectForm, technologies: techArray };
            
            const response = await authAxios.post(`${apiUrl}/api/portfolios/projects`, {
                userId: user._id,
                project: projectData
            });
            
            if (response.data.success) {
                // Update local portfolio state
                setPortfolio(prev => ({
                    ...prev,
                    projects: [...(prev.projects || []), projectData]
                }));
                
                // Reset form and close modal
                setProjectForm({title: '', description: '', technologies: '', link: '', image: ''});
                setShowProjectModal(false);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Project Added',
                    text: 'Your project has been added to your portfolio.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error(response.data.message || 'Failed to add project');
            }
        } catch (error) {
            console.error('Error adding project:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to add your project. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleEditProject = (index) => {
        const project = portfolio.projects[index];
        setProjectForm({
            title: project.title,
            description: project.description || '',
            technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : '',
            link: project.link || '',
            image: project.image || ''
        });
        setEditingProjectIndex(index);
        setShowProjectModal(true);
    };
    
    const handleUpdateProject = async () => {
        if (!projectForm.title) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please provide a project title.'
            });
            return;
        }
        
        try {
            setLoading(true);
            const authAxios = createAuthAxios();
            
            // Convert comma-separated technologies to array
            const techArray = projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean);
            const projectData = { ...projectForm, technologies: techArray };
            
            const response = await authAxios.put(`${apiUrl}/api/portfolios/projects/${editingProjectIndex}`, {
                userId: user._id,
                project: projectData
            });
            
            if (response.data.success) {
                // Update local portfolio state
                setPortfolio(prev => {
                    const updatedProjects = [...prev.projects];
                    updatedProjects[editingProjectIndex] = projectData;
                    return { ...prev, projects: updatedProjects };
                });
                
                // Reset form and close modal
                setProjectForm({title: '', description: '', technologies: '', link: '', image: ''});
                setShowProjectModal(false);
                setEditingProjectIndex(null);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Project Updated',
                    text: 'Your project has been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error(response.data.message || 'Failed to update project');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update your project. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteProject = async (index) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'This project will be permanently deleted.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });
            
            if (result.isConfirmed) {
                setLoading(true);
                const authAxios = createAuthAxios();
                
                const response = await authAxios.delete(`${apiUrl}/api/portfolios/projects/${index}`, {
                    data: { userId: user._id }
                });
                
                if (response.data.success) {
                    // Update local portfolio state
                    setPortfolio(prev => {
                        const updatedProjects = [...prev.projects];
                        updatedProjects.splice(index, 1);
                        return { ...prev, projects: updatedProjects };
                    });
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Project Deleted',
                        text: 'Your project has been removed from your portfolio.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to delete project');
                }
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to delete your project. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Certificate handling functions
    const handleAddCertificate = async () => {
        if (!certificateForm.title) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please provide a certificate title.'
            });
            return;
        }
        
        try {
            setLoading(true);
            const authAxios = createAuthAxios();
            
            // Convert comma-separated skills to array
            const skillsArray = certificateForm.skills.split(',').map(s => s.trim()).filter(Boolean);
            const certificateData = { ...certificateForm, skills: skillsArray };
            
            const response = await authAxios.post(`${apiUrl}/api/portfolios/certificates`, {
                userId: user._id,
                certificate: certificateData
            });
            
            if (response.data.success) {
                // Update local portfolio state
                setPortfolio(prev => ({
                    ...prev,
                    certificates: [...(prev.certificates || []), certificateData]
                }));
                
                // Reset form and close modal
                setCertificateForm({title: '', description: '', skills: '', certificateUrl: ''});
                setShowCertificateModal(false);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Certificate Added',
                    text: 'Your certificate has been added to your portfolio.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error(response.data.message || 'Failed to add certificate');
            }
        } catch (error) {
            console.error('Error adding certificate:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to add your certificate. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleEditCertificate = (index) => {
        const certificate = portfolio.certificates[index];
        setCertificateForm({
            title: certificate.title,
            description: certificate.description || '',
            skills: Array.isArray(certificate.skills) ? certificate.skills.join(', ') : '',
            certificateUrl: certificate.certificateUrl || ''
        });
        setEditingCertificateIndex(index);
        setShowCertificateModal(true);
    };
    
    const handleUpdateCertificate = async () => {
        if (!certificateForm.title) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please provide a certificate title.'
            });
            return;
        }
        
        try {
            setLoading(true);
            const authAxios = createAuthAxios();
            
            // Convert comma-separated skills to array
            const skillsArray = certificateForm.skills.split(',').map(s => s.trim()).filter(Boolean);
            const certificateData = { ...certificateForm, skills: skillsArray };
            
            const response = await authAxios.put(`${apiUrl}/api/portfolios/certificates/${editingCertificateIndex}`, {
                userId: user._id,
                certificate: certificateData
            });
            
            if (response.data.success) {
                // Update local portfolio state
                setPortfolio(prev => {
                    const updatedCertificates = [...(prev.certificates || [])];
                    updatedCertificates[editingCertificateIndex] = certificateData;
                    return { ...prev, certificates: updatedCertificates };
                });
                
                // Reset form and close modal
                setCertificateForm({title: '', description: '', skills: '', certificateUrl: ''});
                setShowCertificateModal(false);
                setEditingCertificateIndex(null);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Certificate Updated',
                    text: 'Your certificate has been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error(response.data.message || 'Failed to update certificate');
            }
        } catch (error) {
            console.error('Error updating certificate:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update your certificate. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteCertificate = async (index) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'This certificate will be permanently deleted.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });
            
            if (result.isConfirmed) {
                setLoading(true);
                const authAxios = createAuthAxios();
                
                const response = await authAxios.delete(`${apiUrl}/api/portfolios/certificates/${index}`, {
                    data: { userId: user._id }
                });
                
                if (response.data.success) {
                    // Update local portfolio state
                    setPortfolio(prev => {
                        const updatedCertificates = [...(prev.certificates || [])];
                        updatedCertificates.splice(index, 1);
                        return { ...prev, certificates: updatedCertificates };
                    });
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Certificate Deleted',
                        text: 'Your certificate has been removed from your portfolio.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to delete certificate');
                }
            }
        } catch (error) {
            console.error('Error deleting certificate:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to delete your certificate. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Function to remove skill
    const removeSkill = async (index) => {
        try {
            if (!portfolio || !portfolio.skills || !portfolio.skills[index]) {
                return;
            }
            
            const skillToRemove = portfolio.skills[index];
            const authAxios = createAuthAxios();
            const response = await authAxios.delete(`${apiUrl}/api/portfolios/${portfolio._id}/skills/${encodeURIComponent(skillToRemove)}`);
            
            if (response.data.success) {
                // Update local portfolio state
                setPortfolio(prev => {
                    const updatedSkills = [...prev.skills];
                    updatedSkills.splice(index, 1);
                    return { ...prev, skills: updatedSkills };
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Skill Removed',
                    text: 'Your skill has been removed successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error removing skill:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to remove skill'
            });
        }
    };
    
    // --- Add wizard state for portfolio creation flow ---
    const [wizardStep, setWizardStep] = useState(1);
    const [tempPortfolio, setTempPortfolio] = useState({
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certificates: [], 
        socialLinks: { linkedin: '', github: '', website: '', twitter: '' },
        about: ''
    });

    // Move to next step in wizard
    const nextStep = () => setWizardStep(prev => prev + 1);

    // Move to previous step
    const prevStep = () => setWizardStep(prev => Math.max(1, prev - 1));

    // Function to create a new portfolio in the database
    const submitPortfolio = async () => {
        try {
            setLoading(true);
            // Create the portfolio with all collected information
            const newPortfolioData = {
                userId: user._id,
                education: tempPortfolio.education,
                experience: tempPortfolio.experience,
                projects: tempPortfolio.projects,
                skills: tempPortfolio.skills,
                certificates: tempPortfolio.certificates, 
                socialLinks: tempPortfolio.socialLinks,
                about: tempPortfolio.about
            };
            
            // Send the data to the backend
            const authAxios = createAuthAxios();
            const response = await authAxios.post(`${apiUrl}/api/portfolios`, newPortfolioData);
            
            if (response.data.success) {
                // Portfolio successfully created, update the local state
                setPortfolio(response.data.portfolio);
                setWizardActive(false); // Exit the wizard
                setPortfolioExists(true); // Update portfolio exists flag
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Portfolio Created!',
                    text: 'Your portfolio has been successfully created.'
                });
                
                // Reset temporary portfolio
                setTempPortfolio({
                    education: [],
                    experience: [],
                    projects: [],
                    skills: [],
                    certificates: [], 
                    socialLinks: {
                        linkedin: '',
                        github: '',
                        website: '',
                        twitter: ''
                    },
                    about: ''
                });
                
                // Call fetch function directly
                // This was causing the error because the function name wasn't matching
                setTimeout(() => {
                    // Use the function we defined above
                    const fetchPortfolioData = async () => {
                        try {
                            setLoading(true);
                            // Check if user exists before making the API call
                            if (!user || !user._id) {
                                console.log('User not authenticated or missing ID');
                                setPortfolio(null);
                                setPortfolioExists(false);
                                setWizardActive(true);
                                return; // Exit early if no user
                            }
                            
                            const authAxios = createAuthAxios();
                            try {
                                // Try to get the portfolio
                                const response = await authAxios.get(`${apiUrl}/api/portfolios/user/${user._id}`);
                                
                                // If we got a valid portfolio
                                if (response.data && response.data.success) {
                                    // The portfolio is in response.data.portfolio
                                    const portfolioData = response.data.portfolio || response.data;
                                    setPortfolio(portfolioData);
                                    setPortfolioExists(true);
                                    
                                    // Set the About and SocialLinks states from the portfolio
                                    setAbout(portfolioData.about || '');
                                    setSocialLinks(portfolioData.socialLinks || { 
                                        linkedin: '', github: '', website: '', twitter: '' 
                                    });
                                } else {
                                    // Handle case where API returns a successful response but no portfolio
                                    console.log('No portfolio found, initializing empty state');
                                    setPortfolio(null);
                                    setPortfolioExists(false);
                                    setWizardActive(true); // Show portfolio creation wizard
                                }
                            } catch (error) {
                                // This is an inner try/catch to handle the 404 without triggering the Next.js error overlay
                                if (error.response && error.response.status === 404) {
                                    // This is expected for new users - handle gracefully without showing error
                                    console.log('No portfolio found for this user - need to create one');
                                    setPortfolio(null);
                                    setPortfolioExists(false);
                                    setWizardActive(true); // Show portfolio creation wizard
                                } else {
                                    // For other errors, still log but don't throw
                                    console.log('Error fetching portfolio:', error.message || 'Unknown error');
                                    // Don't show error toast for 404 - this is normal for new users
                                    if (error.response && error.response.status !== 404) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Failed to fetch portfolio data. Please try again.'
                                        });
                                    }
                                }
                            }
                        } catch (outerError) {
                            // This outer catch is just a safety net, should rarely be hit
                            console.log('Unexpected error:', outerError);
                        } finally {
                            setLoading(false);
                        }
                    };
                    
                    if (user && user._id) {
                        fetchPortfolioData();
                    }
                }, 500);
            } else {
                throw new Error(response.data.message || 'Failed to create portfolio');
            }
        } catch (error) {
            console.error('Error creating portfolio:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'There was a problem creating your portfolio. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to generate CV
    const [isGeneratingCV, setIsGeneratingCV] = useState(false);
    const [cvGenerationStep, setCvGenerationStep] = useState('idle'); // idle, generating, uploading, complete
    const [showCVModal, setShowCVModal] = useState(false);
    const [cvURL, setCvURL] = useState('');

    const generateCV = async () => {
        try {
            // Set loading states
            setIsGeneratingCV(true);
            setCvGenerationStep('generating');
            
            // Call API to generate CV with the updated endpoint path
            const authAxios = createAuthAxios();
            
            // Instead of fetching user data, use the user object already available
            const personalInfo = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            };
            
            // Prepare data for CV generation
            const payload = {
                userId: user._id,
                personalInfo,
                education: portfolio.education || [],
                experience: portfolio.experience || [],
                skills: portfolio.skills || [],
                certificates: portfolio.certificates || [],
                projects: portfolio.projects || []
            };
            
            setCvGenerationStep('uploading');
            const response = await authAxios.post(`${apiUrl}/api/portfolios/generate-cv`, payload);
            
            if (response.data.success) {
                console.log('CV generation successful:', response.data);
                
                // Update portfolio with the CV file info
                setPortfolio(prev => ({ 
                    ...prev, 
                    cvFile: response.data.portfolio.cvFile 
                }));
                
                // Use the downloadUrl provided directly from the backend
                const pdfUrl = response.data.downloadUrl;
                setCvURL(pdfUrl);
                
                console.log('PDF URL set to:', pdfUrl);
                setCvGenerationStep('complete');
                
                // Show the CV modal
                setShowCVModal(true);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'CV generated successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error('Failed to generate CV');
            }
        } catch (error) {
            console.error('Error generating CV:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to generate CV. Please try again.'
            });
            setCvGenerationStep('idle');
        } finally {
            setIsGeneratingCV(false);
        }
    };

    // Function to save CV URL to portfolio
    const saveCVToPortfolio = async () => {
        try {
            setIsGeneratingCV(true);
            const authAxios = createAuthAxios();
            
            // No need to update anything as the CV is already saved in the portfolio during generation
            setShowCVModal(false);
            
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'CV saved to your portfolio',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error saving CV:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save CV to your portfolio. Please try again.'
            });
        } finally {
            setIsGeneratingCV(false);
        }
    };

    // Add a state to track if wizard is active
    const [wizardActive, setWizardActive] = useState(false);

    // Activate the wizard
    const startWizard = () => {
        setWizardActive(true);
        setWizardStep(1);
    };

    // Add a helper function to check if the portfolio exists and has content
    const hasPortfolio = () => {
        return !!portfolio && !!portfolio._id;
    };

    // Portfolio Creation Wizard State
    const [tempEducation, setTempEducation] = useState({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        currentlyEnrolled: false,
        description: '',
        location: ''
    });

    // Experience Form State
    const [tempExperience, setTempExperience] = useState({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: '',
        location: ''
    });

    // Project Form State
    const [tempProject, setTempProject] = useState({
        title: '',
        description: '',
        technologies: '',
        link: '',
        image: ''
    });

    // Skills Form State
    const [tempSkill, setTempSkill] = useState('');

    // Certificate Form State
    const [tempCertificate, setTempCertificate] = useState({
        title: '',
        description: '',
        skills: '',
        certificateUrl: ''
    });

    // State for managing individual technology inputs for projects
    const [tempTech, setTempTech] = useState('');

    // Function to add a technology to the project
    const addTechnologyToProject = (e) => {
        e.preventDefault();
        if (!tempTech.trim()) return;
        
        // Update the project state with the new technology
        setTempProject(prev => ({
            ...prev,
            technologies: Array.isArray(prev.technologies) 
                ? [...prev.technologies, tempTech.trim()] 
                : [tempTech.trim()]
        }));
        
        // Clear the input
        setTempTech('');
    };

    // Function to remove a technology from the project
    const removeTechnologyFromProject = (index) => {
        setTempProject(prev => {
            const updatedTech = Array.isArray(prev.technologies) 
                ? [...prev.technologies] 
                : prev.technologies.split(',').map(t => t.trim()).filter(Boolean);
            
            updatedTech.splice(index, 1);
            return { ...prev, technologies: updatedTech };
        });
    };

    // New state variables for managing edit/add forms
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [showCertificateForm, setShowCertificateForm] = useState(false);
    const [editingEducation, setEditingEducation] = useState(null);
    const [editingExperience, setEditingExperience] = useState(null);
    const [editingCertificate, setEditingCertificate] = useState(null);

    // Function to fetch portfolio data
    const fetchPortfolioData = async () => {
        try {
            setLoading(true);
            const authAxios = createAuthAxios();
            const response = await authAxios.get(`${apiUrl}/api/portfolios/user/${user._id}`);
            
            if (response.data.success && response.data.portfolio) {
                setPortfolio(response.data.portfolio);
            } else {
                setPortfolio(null);
            }
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            setPortfolio(null);
        } finally {
            setLoading(false);
        }
    };

    // Functions to handle education operations
    const handleEducationUpdate = (updatedPortfolio) => {
        setPortfolio(updatedPortfolio || portfolio);
        setShowEducationModal(false);
    };
    
    const handleEducationRemove = (updatedPortfolio) => {
        setPortfolio(updatedPortfolio || portfolio);
    };

    // Functions to handle experience operations
    const handleExperienceUpdate = (updatedPortfolio) => {
        setPortfolio(updatedPortfolio || portfolio);
        setShowExperienceModal(false);
    };
    
    const handleExperienceRemove = (updatedPortfolio) => {
        setPortfolio(updatedPortfolio || portfolio);
    };

    // Functions to handle certificate operations
    const handleCertificateUpdate = (data) => {
        if (data && data.portfolio) {
            // If we got a portfolio object directly, use it
            setPortfolio(data.portfolio);
        } else {
            // Otherwise refresh from server
            fetchPortfolioData();
        }
        setShowCertificateModal(false);
    };
    
    const handleCertificateRemove = (index) => {
        // Update local state if possible
        if (portfolio && portfolio.certificates) {
            const updatedCertificates = [...portfolio.certificates];
            updatedCertificates.splice(index, 1);
            setPortfolio(prev => ({
                ...prev,
                certificates: updatedCertificates
            }));
        } else {
            // Otherwise refresh from server
            fetchPortfolioData();
        }
    };

    // Functions to handle project operations
    const handleProjectUpdate = (data) => {
        if (data && data.portfolio) {
            // If we got a portfolio object directly, use it
            setPortfolio(data.portfolio);
        } else {
            // Otherwise refresh from server
            fetchPortfolioData();
        }
    };
    
    const handleProjectRemove = (index) => {
        // Update local state if possible
        if (portfolio && portfolio.projects) {
            const updatedProjects = [...portfolio.projects];
            updatedProjects.splice(index, 1);
            setPortfolio(prev => ({
                ...prev,
                projects: updatedProjects
            }));
        } else {
            // Otherwise refresh from server
            fetchPortfolioData();
        }
    };

    // Function to generate and download CV
    const handleGenerateCV = async () => {
        try {
            setIsDownloading(true);
            const authAxios = createAuthAxios();
            
            // Instead of fetching user data, use the user object already available
            const personalInfo = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            };
            
            // Prepare data for CV generation
            const payload = {
                userId: user._id,
                personalInfo,
                education: portfolio.education || [],
                experience: portfolio.experience || [],
                skills: portfolio.skills || [],
                certificates: portfolio.certificates || []
            };
            
            const response = await authAxios.post(`${apiUrl}/api/portfolios/generate-cv`, payload);
            
            if (response.data.success) {
                // Trigger download
                const downloadUrl = response.data.downloadUrl;
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', 'cv.pdf');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setPortfolio(response.data.portfolio);
                
                Swal.fire({
                    icon: 'success',
                    title: 'CV Generated Successfully',
                    text: 'Your CV has been generated and downloaded!',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error generating CV:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to generate CV. Please try again.'
            });
        } finally {
            setIsDownloading(false);
        }
    };

    // Handle step completion in the guide
    const handleStepComplete = (nextStep) => {
        setCurrentStep(nextStep);
        
        // If the user finished the guide
        if (nextStep === 'completed') {
            Swal.fire({
                icon: 'success',
                title: 'Portfolio Complete!',
                text: 'Your portfolio has been successfully set up.',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    // Return the appropriate view based on portfolio existence
    return (
        <Layout breadcrumbTitle="My Portfolio" breadcrumbActive="My Portfolio">
            <style jsx global>{`
                /* Animations and transitions */
                .dashboard-list-block {
                    transition: all 0.3s ease-in-out;
                    transform: translateY(0);
                    opacity: 1;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
                    background: white;
                    margin-bottom: 30px;
                }
                
                .dashboard-list-block:hover {
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                    transform: translateY(-5px);
                }
                
                .skill-tags .badge {
                    transition: all 0.2s ease;
                    padding: 10px 15px;
                    font-size: 14px;
                    margin-right: 8px;
                    margin-bottom: 8px;
                }
                
                .skill-tags .badge:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                /* Animation for section entry */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .dashboard-list-block {
                    animation: fadeInUp 0.5s ease forwards;
                }
                
                .dashboard-list-block:nth-child(2) { animation-delay: 0.1s; }
                .dashboard-list-block:nth-child(3) { animation-delay: 0.2s; }
                .dashboard-list-block:nth-child(4) { animation-delay: 0.3s; }
                .dashboard-list-block:nth-child(5) { animation-delay: 0.4s; }
                .dashboard-list-block:nth-child(6) { animation-delay: 0.5s; }
                
                /* Form animations */
                .form-control, .btn {
                    transition: all 0.2s ease;
                }
                
                .form-control:focus {
                    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
                    border-color: #86b7fe;
                }
                
                /* Button hover effects */
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(13, 110, 253, 0.2);
                }
                
                /* Date picker styling */
                .react-datepicker-wrapper {
                    width: 100%;
                }
                
                .react-datepicker__input-container input {
                    width: 100%;
                    padding: 0.375rem 0.75rem;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.5;
                    color: #212529;
                    background-color: #fff;
                    background-clip: padding-box;
                    border: 1px solid #ced4da;
                    appearance: none;
                    border-radius: 0.25rem;
                    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                }
                
                .react-datepicker__input-container input:focus {
                    color: #212529;
                    background-color: #fff;
                    border-color: #86b7fe;
                    outline: 0;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                
                /* Portfolio item styling */
                .portfolio-item {
                    margin-bottom: 20px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease;
                }
                
                .portfolio-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }
            `}</style>
            {loading ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your portfolio...</p>
                </div>
            ) : hasPortfolio() ? (
                // EXISTING PORTFOLIO VIEW
                <div className="container">
                    <div className="row">
                        {/* Generate CV Button at the top */}
                        <div className="col-12 mb-4 d-flex justify-content-end">
                            <button 
                                className="btn btn-primary btn-lg" 
                                onClick={generateCV}
                                disabled={isGeneratingCV}
                            >
                                {isGeneratingCV ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {cvGenerationStep === 'generating' && 'Generating CV...'}
                                        {cvGenerationStep === 'uploading' && 'Uploading CV...'}
                                        {cvGenerationStep === 'complete' && 'CV Generated!'}
                                    </>
                                ) : (
                                    <>
                                        <i className="fi-rr-file-pdf me-2"></i> Generate CV
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* Portfolio Content */}
                    <div className="row">
                        <div className="col-lg-12">
                            {portfolio && (
                                <>
                                    <EducationSection 
                                        portfolio={portfolio} 
                                        onUpdate={handleEducationUpdate} 
                                        onRemove={handleEducationRemove} 
                                    />
                                    
                                    <ExperienceSection 
                                        portfolio={portfolio} 
                                        onUpdate={handleExperienceUpdate} 
                                        onRemove={handleExperienceRemove} 
                                    />
                                    
                                    <ProjectSection 
                                        portfolio={portfolio} 
                                        userId={user._id}
                                        onUpdate={handleProjectUpdate} 
                                        onRemove={handleProjectRemove} 
                                    />
                                    
                                    <CertificateSection 
                                        portfolio={portfolio}
                                        userId={user._id}
                                        onUpdate={handleCertificateUpdate} 
                                        onRemove={handleCertificateRemove} 
                                    />
                                </>
                            )}
                            
                            {/* Skills Section */}
                            <div className="dashboard-list-block mt-5">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>Skills</h4>
                                    <div className="d-flex">
                                        <input
                                            type="text"
                                            className="form-control me-2"
                                            placeholder="Add a skill"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            list="skillSuggestions"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill();
                                                }
                                            }}
                                        />
                                        <datalist id="skillSuggestions">
                                            {suggestions.skills.map((skill, index) => (
                                                <option key={index} value={skill} />
                                            ))}
                                        </datalist>
                                        <button onClick={handleAddSkill} className="btn btn-primary">
                                            <i className="fi-rr-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Display Skills as Tags */}
                                <div className="skill-tags mb-3">
                                    {portfolio?.skills && portfolio.skills.length > 0 ? (
                                        <div className="d-flex flex-wrap gap-2">
                                            {portfolio.skills.map((skill, index) => (
                                                <span key={index} className="badge bg-light text-dark p-2 d-flex align-items-center">
                                                    {skill}
                                                    <button 
                                                        type="button" 
                                                        className="btn-close ms-2" 
                                                        style={{fontSize: '0.5rem'}} 
                                                        onClick={() => handleRemoveSkill(skill)}
                                                    ></button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 border rounded">
                                            <p className="mb-0 text-muted">No skills added yet. Add skills to highlight your expertise.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Social Links Section */}
                            <div className="dashboard-list-block mt-5">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>Social Links</h4>
                                    <button onClick={() => setShowSocialLinksForm(true)} className="btn btn-primary btn-sm">
                                        <i className="fi-rr-edit me-1"></i> Edit Links
                                    </button>
                                </div>
                                
                                {showSocialLinksForm ? (
                                    <div className="p-4 border rounded shadow-sm mb-4">
                                        <form onSubmit={handleSocialLinksSubmit}>
                                            <div className="mb-3">
                                                <label>LinkedIn URL</label>
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    value={socialLinks.linkedin || ''}
                                                    onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                                                    placeholder="https://linkedin.com/in/yourprofile"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label>GitHub URL</label>
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    value={socialLinks.github || ''}
                                                    onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                                                    placeholder="https://github.com/yourusername"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label>Personal Website</label>
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    value={socialLinks.website || ''}
                                                    onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                                                    placeholder="https://yourwebsite.com"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label>Twitter URL</label>
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    value={socialLinks.twitter || ''}
                                                    onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                                                    placeholder="https://twitter.com/yourusername"
                                                />
                                            </div>
                                            <div className="d-flex justify-content-end gap-2">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary" 
                                                    onClick={() => setShowSocialLinksForm(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary">
                                                    Save Links
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="social-links">
                                        {((portfolio?.socialLinks?.linkedin || portfolio?.socialLinks?.github || 
                                          portfolio?.socialLinks?.website || portfolio?.socialLinks?.twitter)) ? (
                                            <div className="d-flex flex-wrap gap-3">
                                                {portfolio?.socialLinks?.linkedin && (
                                                    <a href={portfolio.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                                        <i className="fi-brands-linkedin me-2"></i>LinkedIn
                                                    </a>
                                                )}
                                                {portfolio?.socialLinks?.github && (
                                                    <a href={portfolio.socialLinks.github} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                                        <i className="fi-brands-github me-2"></i>GitHub
                                                    </a>
                                                )}
                                                {portfolio?.socialLinks?.website && (
                                                    <a href={portfolio.socialLinks.website} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                                        <i className="fi-rr-globe me-2"></i>Website
                                                    </a>
                                                )}
                                                {portfolio?.socialLinks?.twitter && (
                                                    <a href={portfolio.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                                                        <i className="fi-brands-twitter me-2"></i>Twitter
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 border rounded">
                                                <p className="mb-0 text-muted">No social links added yet. Add your professional profiles to connect with others.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* About Me Section */}
                            <div className="dashboard-list-block mt-5">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>About Me</h4>
                                    <button onClick={() => setShowAboutForm(true)} className="btn btn-primary btn-sm">
                                        <i className="fi-rr-edit me-1"></i> Edit About
                                    </button>
                                </div>
                                
                                {showAboutForm ? (
                                    <div className="p-4 border rounded shadow-sm mb-4">
                                        <form onSubmit={handleAboutSubmit}>
                                            <div className="mb-3">
                                                <label>Tell us about yourself</label>
                                                <textarea 
                                                    className="form-control" 
                                                    rows="6"
                                                    value={about || ''}
                                                    onChange={(e) => setAbout(e.target.value)}
                                                    placeholder="Write a brief description about yourself, your background, interests, and career goals..."
                                                ></textarea>
                                            </div>
                                            <div className="d-flex justify-content-end gap-2">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary" 
                                                    onClick={() => setShowAboutForm(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary">
                                                    Save About
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="about-section">
                                        {portfolio?.about ? (
                                            <div className="p-4 border rounded">
                                                <p className="mb-0">{portfolio.about}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 border rounded">
                                                <p className="mb-0 text-muted">No about information added yet. Tell others about yourself to enhance your portfolio.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : wizardActive ? (
                // PORTFOLIO CREATION WIZARD
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-10">
                            {/* Progress indicator */}
                            <div className="card shadow-sm mb-4">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between mb-2">
                                        <h4 className="mb-0">Build Your Portfolio</h4>
                                        <span>Step {wizardStep} of 6</span>
                                    </div>
                                    <div className="progress">
                                        <div 
                                            className="progress-bar" 
                                            role="progressbar" 
                                            style={{width: `${(wizardStep / 6) * 100}%`}} 
                                            aria-valuenow={(wizardStep / 6) * 100} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                    
                                    {/* Step indicator */}
                                    <div className="mt-2">
                                        <span className="badge bg-primary">
                                            {wizardStep === 1 && 'Step 1: Add Education'}
                                            {wizardStep === 2 && 'Step 2: Add Experience'}
                                            {wizardStep === 3 && 'Step 3: Add Projects'}
                                            {wizardStep === 4 && 'Step 4: Add Skills'}
                                            {wizardStep === 5 && 'Step 5: Social Media Links'}
                                            {wizardStep === 6 && 'Step 6: About You'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Wizard Content */}
                            <div className="card shadow-sm mb-4">
                                <div className="card-body p-4">
                                    {/* Step 1: Education Form */}
                                    {wizardStep === 1 && (
                                        <div>
                                            <h5 className="mb-3">Add Education</h5>
                                            <p className="text-muted mb-4">Start by adding your educational background. You can add multiple entries.</p>
                                            
                                            {/* List of added education entries */}
                                            {tempPortfolio.education.length > 0 && (
                                                <div className="mb-4">
                                                    <h6>Added Education</h6>
                                                    <div className="list-group">
                                                        {tempPortfolio.education.map((edu, index) => (
                                                            <div key={index} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <div className="fw-bold">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</div>
                                                                    <div>{edu.school}, {edu.location}</div>
                                                                    <small className="text-muted">
                                                                        {new Date(edu.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - 
                                                                        {edu.currentlyEnrolled ? 'Present' : new Date(edu.endDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})}
                                                                    </small>
                                                                    {edu.description && <p className="mb-0">{edu.description}</p>}
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => {
                                                                        // Remove this education entry
                                                                        setTempPortfolio(prev => {
                                                                            const updatedEducation = [...prev.education];
                                                                            updatedEducation.splice(index, 1);
                                                                            return { ...prev, education: updatedEducation };
                                                                        });
                                                                    }}
                                                                >
                                                                    <i className="fi-rr-trash"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                
                                                // Validate form fields
                                                if (!tempEducation.school || !tempEducation.degree || !tempEducation.fieldOfStudy || !tempEducation.startDate) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'Missing Information',
                                                        text: 'Please fill all the required fields marked with *'
                                                    });
                                                    return;
                                                }
                                                
                                                // Validate dates
                                                if (!tempEducation.currentlyEnrolled && tempEducation.endDate && 
                                                    new Date(tempEducation.endDate) < new Date(tempEducation.startDate)) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'Invalid Date Range',
                                                        text: 'End date cannot be earlier than start date.'
                                                    });
                                                    return;
                                                }
                                                
                                                // Create a copy of the education entry with proper date formatting
                                                const newEducation = {
                                                    ...tempEducation,
                                                    startDate: new Date(tempEducation.startDate).toISOString(),
                                                    endDate: tempEducation.currentlyEnrolled ? null : 
                                                            tempEducation.endDate ? new Date(tempEducation.endDate).toISOString() : null
                                                };
                                                
                                                // Add to temp portfolio
                                                setTempPortfolio(prev => ({
                                                    ...prev,
                                                    education: [...prev.education, newEducation]
                                                }));
                                                
                                                // Reset form
                                                setTempEducation({
                                                    school: '',
                                                    degree: '',
                                                    fieldOfStudy: '',
                                                    startDate: '',
                                                    endDate: '',
                                                    currentlyEnrolled: false,
                                                    description: '',
                                                    location: ''
                                                });
                                            }}>
                                                <div className="mb-3">
                                                    <label>School/Institution*</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        value={tempEducation.school}
                                                        onChange={(e) => setTempEducation({...tempEducation, school: e.target.value})}
                                                        required
                                                        list="schoolSuggestions"
                                                    />
                                                    <datalist id="schoolSuggestions">
                                                        {suggestions.schools.map((school, index) => (
                                                            <option key={index} value={school} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Degree*</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        value={tempEducation.degree}
                                                        onChange={(e) => setTempEducation({...tempEducation, degree: e.target.value})}
                                                        required
                                                        list="degreeSuggestions"
                                                    />
                                                    <datalist id="degreeSuggestions">
                                                        {suggestions.degrees.map((degree, index) => (
                                                            <option key={index} value={degree} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Field of Study*</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        value={tempEducation.fieldOfStudy}
                                                        onChange={(e) => setTempEducation({...tempEducation, fieldOfStudy: e.target.value})}
                                                        required
                                                        list="fieldSuggestions"
                                                    />
                                                    <datalist id="fieldSuggestions">
                                                        {suggestions.fieldsOfStudy.map((field, index) => (
                                                            <option key={index} value={field} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Start Date*</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-control date-input" 
                                                        value={tempEducation.startDate}
                                                        onChange={(e) => setTempEducation({...tempEducation, startDate: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3 form-check">
                                                    <input 
                                                        type="checkbox" 
                                                        className="form-check-input" 
                                                        id="currentlyEnrolled"
                                                        checked={tempEducation.currentlyEnrolled}
                                                        onChange={(e) => setTempEducation({...tempEducation, currentlyEnrolled: e.target.checked, endDate: e.target.checked ? '' : tempEducation.endDate})}
                                                    />
                                                    <label className="form-check-label" htmlFor="currentlyEnrolled">I am currently enrolled</label>
                                                </div>
                                                {!tempEducation.currentlyEnrolled && (
                                                    <div className="mb-3">
                                                        <label>End Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="form-control date-input"
                                                            value={tempEducation.endDate}
                                                            onChange={(e) => setTempEducation({...tempEducation, endDate: e.target.value})}
                                                            min={tempEducation.startDate} // Ensure end date is after start date
                                                        />
                                                    </div>
                                                )}
                                                <div className="mb-3">
                                                    <label>Location</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control"
                                                        value={tempEducation.location}
                                                        onChange={(e) => setTempEducation({...tempEducation, location: e.target.value})}
                                                        list="locationSuggestions"
                                                    />
                                                    <datalist id="locationSuggestions">
                                                        {suggestions.locations.map((location, index) => (
                                                            <option key={index} value={location} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Description</label>
                                                    <textarea 
                                                        className="form-control" 
                                                        rows="3"
                                                        value={tempEducation.description}
                                                        onChange={(e) => setTempEducation({...tempEducation, description: e.target.value})}
                                                    ></textarea>
                                                </div>
                                                <div className="text-end">
                                                    <button type="submit" className="btn btn-primary">
                                                        <i className="fi-rr-plus me-1"></i> Add Education
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Step 2: Experience Form */}
                                    {wizardStep === 2 && (
                                        <div>
                                            {tempPortfolio.experience.length > 0 && (
                                                <div className="mb-4">
                                                    <h5>Added Experience</h5>
                                                    <ul className="list-group mb-4">
                                                        {tempPortfolio.experience.map((exp, index) => (
                                                            <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                                                <div>
                                                                    <div className="fw-bold">{exp.position}</div>
                                                                    <div>{exp.company}, {exp.location}</div>
                                                                    <small className="text-muted">
                                                                        {new Date(exp.startDate).toLocaleDateString('en-US', {year: 'numeric', month: 'short'})} - 
                                                                        {exp.endDate || 'Present'}
                                                                    </small>
                                                                    {exp.description && <p className="mb-0">{exp.description}</p>}
                                                                </div>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => {
                                                                        // Remove this experience entry
                                                                        setTempPortfolio(prev => {
                                                                            const updatedExperience = [...prev.experience];
                                                                            updatedExperience.splice(index, 1);
                                                                            return { ...prev, experience: updatedExperience };
                                                                        });
                                                                    }}
                                                                >
                                                                    <i className="fi-rr-trash"></i>
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                
                                                if (!tempExperience.company || !tempExperience.position || !tempExperience.startDate) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'Missing Information',
                                                        text: 'Please fill in all required fields.'
                                                    });
                                                    return;
                                                }
                                                
                                                // Add current form data to experience array
                                                setTempPortfolio({
                                                    ...tempPortfolio,
                                                    experience: [...tempPortfolio.experience, tempExperience]
                                                });
                                                
                                                // Reset form
                                                setTempExperience({
                                                    company: '',
                                                    position: '',
                                                    startDate: '',
                                                    endDate: '',
                                                    currentlyWorking: false,
                                                    description: '',
                                                    location: ''
                                                });
                                                
                                                // Show success message
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Experience Added',
                                                    text: 'Experience entry has been added to your portfolio.',
                                                    timer: 1500,
                                                    showConfirmButton: false
                                                });
                                            }}>
                                                <h5 className="mb-3">Add New Experience</h5>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label>Company*</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            value={tempExperience.company}
                                                            onChange={(e) => setTempExperience({...tempExperience, company: e.target.value})}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label>Position*</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control"
                                                            value={tempExperience.position}
                                                            onChange={(e) => setTempExperience({...tempExperience, position: e.target.value})}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label>Start Date*</label>
                                                        <input 
                                                            type="date" 
                                                            className="form-control date-input"
                                                            value={tempExperience.startDate}
                                                            onChange={(e) => setTempExperience({...tempExperience, startDate: e.target.value})}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label>End Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="form-control date-input"
                                                            value={tempExperience.endDate}
                                                            onChange={(e) => setTempExperience({...tempExperience, endDate: e.target.value})}
                                                            disabled={tempExperience.currentlyWorking}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Location</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control"
                                                        value={tempExperience.location}
                                                        onChange={(e) => setTempExperience({...tempExperience, location: e.target.value})}
                                                    />
                                                </div>
                                                <div className="mb-3 form-check">
                                                    <input 
                                                        type="checkbox" 
                                                        className="form-check-input" 
                                                        id="currentlyWorking"
                                                        checked={tempExperience.currentlyWorking}
                                                        onChange={(e) => setTempExperience({...tempExperience, currentlyWorking: e.target.checked, endDate: e.target.checked ? '' : tempExperience.endDate})}
                                                    />
                                                    <label className="form-check-label" htmlFor="currentlyWorking">I am currently working here</label>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Description</label>
                                                    <textarea 
                                                        className="form-control"
                                                        rows="3"
                                                        value={tempExperience.description}
                                                        onChange={(e) => setTempExperience({...tempExperience, description: e.target.value})}
                                                    ></textarea>
                                                </div>
                                                <div className="text-end mb-3">
                                                    <button type="submit" className="btn btn-primary">
                                                        <i className="fi-rr-plus me-1"></i> Add Experience
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Step 3: Projects Form */}
                                    {wizardStep === 3 && (
                                        <div>
                                            {tempPortfolio.projects.length > 0 && (
                                                <div className="mb-4">
                                                    <h5>Added Projects</h5>
                                                    <ul className="list-group">
                                                        {tempPortfolio.projects.map((project, index) => (
                                                            <li className="list-group-item" key={index}>
                                                                <div className="d-flex justify-content-between">
                                                                    <div>
                                                                        <strong>{project.title}</strong>
                                                                        <div>{project.description}</div>
                                                                        {project.technologies.length > 0 && (
                                                                            <div className="mt-2">
                                                                                <small className="text-muted">Technologies: {project.technologies.join(', ')}</small>
                                                                            </div>
                                                                        )}
                                                                        {project.link && (
                                                                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn btn-link btn-sm p-0">
                                                                                <i className="fi-rr-link me-1"></i>View Project
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => {
                                                                            const updatedProjects = [...tempPortfolio.projects];
                                                                            updatedProjects.splice(index, 1);
                                                                            setTempPortfolio({...tempPortfolio, projects: updatedProjects});
                                                                        }}
                                                                    >
                                                                        <i className="fi-rr-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {tempPortfolio.projects.length === 0 && (
                                                <div className="alert alert-info">
                                                    Please add at least one project to continue.
                                                </div>
                                            )}
                                            
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                if (!tempProject.title) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'Missing Information',
                                                        text: 'Please provide a project title.'
                                                    });
                                                    return;
                                                }
                                                
                                                // Add project to tempPortfolio with technologies already as an array
                                                // No need to split by comma anymore since we're using individual entries
                                                setTempPortfolio(prev => ({
                                                    ...prev,
                                                    projects: [...prev.projects, {
                                                        ...tempProject,
                                                        technologies: Array.isArray(tempProject.technologies) ? 
                                                            tempProject.technologies : []
                                                    }]
                                                }));
                                                
                                                // Reset form
                                                setTempProject({title: '', description: '', technologies: [], link: '', image: ''});
                                                setTempTech(''); // Also reset the temp tech input
                                                
                                                // Show success message
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Project Added',
                                                    text: 'Your project has been added to your portfolio.',
                                                    timer: 1500,
                                                    showConfirmButton: false
                                                });
                                            }}>
                                                <h5 className="mb-3">Add New Project</h5>
                                                <div className="mb-3">
                                                    <label>Project Title*</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={tempProject.title}
                                                        onChange={(e) => setTempProject({...tempProject, title: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label>Description</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="3"
                                                        value={tempProject.description}
                                                        onChange={(e) => setTempProject({...tempProject, description: e.target.value})}
                                                    ></textarea>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Technologies (comma separated)</label>
                                                    <div className="mb-2">
                                                        {/* Display added technologies as tags */}
                                                        {Array.isArray(tempProject.technologies) && tempProject.technologies.length > 0 && (
                                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                                                {tempProject.technologies.map((tech, index) => (
                                                                    <span key={index} className="badge bg-light text-dark p-2 d-flex align-items-center">
                                                                        {tech}
                                                                        <button 
                                                                            type="button" 
                                                                            className="btn-close ms-2" 
                                                                            style={{fontSize: '0.5rem'}} 
                                                                            onClick={() => removeTechnologyFromProject(index)}
                                                                        ></button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Input for adding new technologies */}
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Add a technology and press Enter"
                                                            value={tempTech}
                                                            onChange={(e) => setTempTech(e.target.value)}
                                                            list="techSuggestions"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addTechnologyToProject(e);
                                                                }
                                                            }}
                                                        />
                                                        <datalist id="techSuggestions">
                                                            {suggestions.technologies.map((tech, index) => (
                                                                <option key={index} value={tech} />
                                                            ))}
                                                        </datalist>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-primary" 
                                                            onClick={addTechnologyToProject}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    <small className="text-muted">Add each technology individually</small>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Project Link</label>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        placeholder="https://..."
                                                        value={tempProject.link}
                                                        onChange={(e) => setTempProject({...tempProject, link: e.target.value})}
                                                    />
                                                </div>
                                                <div className="text-end">
                                                    <button type="submit" className="btn btn-primary">
                                                        <i className="fi-rr-plus me-1"></i> Add Project
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Step 4: Skills Form */}
                                    {wizardStep === 4 && (
                                        <div>
                                            <h5 className="mb-3">Add Skills</h5>
                                            <p className="text-muted mb-4">Add your professional skills to highlight your expertise.</p>
                                            
                                            {/* Display added skills as tags */}
                                            {tempPortfolio.skills.length > 0 && (
                                                <div className="mb-4">
                                                    <h6>Added Skills</h6>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {tempPortfolio.skills.map((skill, index) => (
                                                            <span key={index} className="badge bg-light text-dark p-2 d-flex align-items-center">
                                                                {skill}
                                                                <button 
                                                                    type="button" 
                                                                    className="btn-close ms-2" 
                                                                    style={{fontSize: '0.5rem'}} 
                                                                    onClick={() => {
                                                                        // Remove this skill
                                                                        setTempPortfolio(prev => {
                                                                            const updatedSkills = [...prev.skills];
                                                                            updatedSkills.splice(index, 1);
                                                                            return { ...prev, skills: updatedSkills };
                                                                        });
                                                                    }}
                                                                ></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                if (!tempSkill.trim()) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'Missing Information',
                                                        text: 'Please enter a skill.'
                                                    });
                                                    return;
                                                }
                                                
                                                // Add skill to tempPortfolio
                                                setTempPortfolio(prev => ({
                                                    ...prev,
                                                    skills: [...prev.skills, tempSkill.trim()]
                                                }));
                                                
                                                // Reset input
                                                setTempSkill('');
                                            }}>
                                                <div className="mb-3">
                                                    <label>Add Skill*</label>
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g., JavaScript, React, Project Management"
                                                            value={tempSkill}
                                                            onChange={(e) => setTempSkill(e.target.value)}
                                                            list="skillSuggestions"
                                                            required
                                                        />
                                                        <datalist id="skillSuggestions">
                                                            {suggestions.skills.map((skill, index) => (
                                                                <option key={index} value={skill} />
                                                            ))}
                                                        </datalist>
                                                        <button type="submit" className="btn btn-primary">Add</button>
                                                    </div>
                                                    <small className="text-muted">Press Enter or click Add to add the skill</small>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Step 5: Social Links Form */}
                                    {wizardStep === 5 && (
                                        <div>
                                            <h5 className="mb-3">Add Social Media Links</h5>
                                            <p className="text-muted mb-4">These social media links will appear on your portfolio and resume.</p>
                                            
                                            <form>
                                                <div className="mb-3">
                                                    <label>LinkedIn</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text"><i className="fi-rr-link"></i></span>
                                                        <input
                                                            type="url"
                                                            className="form-control"
                                                            placeholder="https://linkedin.com/in/username"
                                                            value={tempPortfolio.socialLinks.linkedin}
                                                            onChange={(e) => setTempPortfolio({
                                                                ...tempPortfolio,
                                                                socialLinks: {...tempPortfolio.socialLinks, linkedin: e.target.value}
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <label>GitHub</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text"><i className="fi-rr-link"></i></span>
                                                        <input
                                                            type="url"
                                                            className="form-control"
                                                            placeholder="https://github.com/username"
                                                            value={tempPortfolio.socialLinks.github}
                                                            onChange={(e) => setTempPortfolio({
                                                                ...tempPortfolio,
                                                                socialLinks: {...tempPortfolio.socialLinks, github: e.target.value}
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <label>Personal Website</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text"><i className="fi-rr-link"></i></span>
                                                        <input
                                                            type="url"
                                                            className="form-control"
                                                            placeholder="https://yourwebsite.com"
                                                            value={tempPortfolio.socialLinks.website}
                                                            onChange={(e) => setTempPortfolio({
                                                                ...tempPortfolio,
                                                                socialLinks: {...tempPortfolio.socialLinks, website: e.target.value}
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <label>Twitter</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text"><i className="fi-rr-link"></i></span>
                                                        <input
                                                            type="url"
                                                            className="form-control"
                                                            placeholder="https://twitter.com/username"
                                                            value={tempPortfolio.socialLinks.twitter}
                                                            onChange={(e) => setTempPortfolio({
                                                                ...tempPortfolio,
                                                                socialLinks: {...tempPortfolio.socialLinks, twitter: e.target.value}
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="alert alert-info">
                                                    <i className="fi-rr-info me-2"></i>
                                                    Social media links are optional, but they help showcase your professional presence.
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Step 6: About Form */}
                                    {wizardStep === 6 && (
                                        <div>
                                            <h5 className="mb-3">About You</h5>
                                            <p className="text-muted mb-4">Write a professional bio that will appear at the top of your resume.</p>
                                            
                                            <form>
                                                <div className="mb-3">
                                                    <label>Professional Bio</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="5"
                                                        placeholder="Introduce yourself, highlight your expertise and career goals..."
                                                        value={tempPortfolio.about}
                                                        onChange={(e) => setTempPortfolio({...tempPortfolio, about: e.target.value})}
                                                    ></textarea>
                                                </div>
                                                
                                                <div className="alert alert-info">
                                                    <i className="fi-rr-info me-2"></i>
                                                    A well-written bio helps employers understand your professional background and goals.
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Step 7: Certificates Form */}
                                    {wizardStep === 7 && (
                                        <div>
                                            <h5 className="mb-3">Add Certificates</h5>
                                            <p className="text-muted mb-4">Add any relevant certificates to enhance your portfolio. This step is optional - you can skip it if you don't have any certificates to add.</p>
                                            
                                            {/* List of added certificates */}
                                            {tempPortfolio.certificates.length > 0 && (
                                                <div className="mb-4">
                                                    <h6>Added Certificates</h6>
                                                    <div className="list-group">
                                                        {tempPortfolio.certificates.map((cert, index) => (
                                                            <div key={index} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <div className="fw-bold">{cert.title}</div>
                                                                    <small>{cert.description}</small>
                                                                    {cert.skills.length > 0 && (
                                                                        <div className="mt-1">
                                                                            <small className="text-muted">Skills: {cert.skills.join(', ')}</small>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => {
                                                                        // Remove this certificate
                                                                        setTempPortfolio(prev => {
                                                                            const updatedCertificates = [...prev.certificates];
                                                                            updatedCertificates.splice(index, 1);
                                                                            return { ...prev, certificates: updatedCertificates };
                                                                        });
                                                                    }}
                                                                >
                                                                    <i className="fi-rr-trash"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                if (!tempCertificate.title) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'Missing Information',
                                                        text: 'Please provide a certificate title.'
                                                    });
                                                    return;
                                                }
                                                
                                                // Convert comma-separated skills to array
                                                const skillsArray = tempCertificate.skills.split(',').map(s => s.trim()).filter(Boolean);
                                                
                                                // Add to temp portfolio
                                                setTempPortfolio(prev => ({
                                                    ...prev,
                                                    certificates: [...prev.certificates, { ...tempCertificate, skills: skillsArray }]
                                                }));
                                                
                                                // Reset the form
                                                setTempCertificate({ title: '', description: '', skills: '', certificateUrl: '' });
                                                
                                                // Show success message
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'Certificate Added',
                                                    text: 'Certificate has been added to your portfolio.',
                                                    timer: 1500,
                                                    showConfirmButton: false
                                                });
                                            }}>
                                                <h5 className="mb-3">Add New Certificate</h5>
                                                <div className="mb-3">
                                                    <label>Certificate Title*</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={tempCertificate.title}
                                                        onChange={(e) => setTempCertificate({...tempCertificate, title: e.target.value})}
                                                        required
                                                        list="certificateTitleSuggestions"
                                                        placeholder="e.g., AWS Certified Solutions Architect, CompTIA Security+"
                                                    />
                                                    <datalist id="certificateTitleSuggestions">
                                                        {suggestions.certificateTitles.map((title, index) => (
                                                            <option key={index} value={title} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Description</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="3"
                                                        value={tempCertificate.description}
                                                        onChange={(e) => setTempCertificate({...tempCertificate, description: e.target.value})}
                                                    ></textarea>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Skills (comma separated)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="e.g., JavaScript, React, Project Management"
                                                        value={tempCertificate.skills}
                                                        onChange={(e) => setTempCertificate({...tempCertificate, skills: e.target.value})}
                                                        list="certSkillSuggestions"
                                                    />
                                                    <datalist id="certSkillSuggestions">
                                                        {suggestions.skills.map((skill, index) => (
                                                            <option key={index} value={skill} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <div className="mb-3">
                                                    <label>Certificate URL</label>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        placeholder="https://..."
                                                        value={tempCertificate.certificateUrl}
                                                        onChange={(e) => setTempCertificate({...tempCertificate, certificateUrl: e.target.value})}
                                                    />
                                                </div>
                                                <div className="text-end">
                                                    <button type="submit" className="btn btn-primary">
                                                        <i className="fi-rr-plus me-1"></i> Add Certificate
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {/* Navigation buttons */}
                                    <div className="d-flex justify-content-between mt-4">
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={prevStep}
                                            disabled={wizardStep === 1}
                                        >
                                            Back
                                        </button>
                                        
                                        {wizardStep < 7 ? (
                                            <button 
                                                className="btn btn-primary"
                                                onClick={nextStep}
                                                disabled={
                                                    (wizardStep === 1 && tempPortfolio.education.length === 0) ||
                                                    (wizardStep === 2 && tempPortfolio.experience.length === 0) ||
                                                    (wizardStep === 3 && tempPortfolio.projects.length === 0) ||
                                                    (wizardStep === 4 && tempPortfolio.skills.length === 0)
                                                }
                                            >
                                                Next
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn btn-success"
                                                onClick={submitPortfolio}
                                                disabled={loading}
                                            >
                                                {loading ? 'Creating...' : 'Create Portfolio'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // PORTFOLIO CREATION PROMPT
                <div className="container">
                    <div className="row">
                        <div className="col-md-8">
                            <div className="card shadow-sm mb-4">
                                <div className="card-body">
                                    <h4 className="mb-3">Create Your Portfolio</h4>
                                    <p className="mb-4">Create a professional portfolio to showcase your skills and experience to potential employers.</p>
                                    
                                    {currentStep === 'about' && (
                                        <div className="portfolio-form-container mb-4 animate__animated animate__fadeIn">
                                            <h5 className="mb-3">Tell us about yourself</h5>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                
                                                if (about.trim()) {
                                                    submitPortfolio();
                                                    handleStepComplete('education');
                                                }
                                            }}>
                                                <div className="mb-4">
                                                    <textarea 
                                                        className="form-control"
                                                        rows="6"
                                                        value={about}
                                                        onChange={(e) => setAbout(e.target.value)}
                                                        placeholder="Write a short bio describing your professional background, interests, and goals..."
                                                    ></textarea>
                                                    <div className="form-text">This will be displayed at the top of your portfolio.</div>
                                                </div>
                                                <button type="submit" className="btn btn-primary" disabled={!about.trim()}>
                                                    <i className="fi-rr-check me-2"></i> Create Profile & Continue
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                    
                                    {showAlert && (
                                        <div className="alert alert-success animate__animated animate__fadeIn">
                                            <i className="fi-rr-check-circle me-2"></i>
                                            <strong>Portfolio created successfully!</strong> Now add your education, experience, and more.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <PortfolioGuide 
                                currentStep={currentStep}
                                onStepComplete={handleStepComplete}
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* CV Generation Modal */}
            {showCVModal && (
                <div className="fixed-top vw-100 vh-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card shadow-lg border-0" style={{ maxWidth: '500px', width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div className="card-header bg-primary text-white py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="m-0">
                                    <i className="fi-rr-file-pdf me-2"></i>
                                    Your CV is Ready
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    aria-label="Close"
                                    onClick={() => setShowCVModal(false)}
                                ></button>
                            </div>
                        </div>
                        <div className="card-body text-center p-4">
                            <div className="mb-4">
                                <div className="cv-success-icon mb-3">
                                    <i className="fi-rr-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h4>CV Generated Successfully!</h4>
                                <p className="text-secondary mb-4">Your professional CV has been generated and saved to your portfolio.</p>
                            </div>
                            
                            <div className="d-grid gap-3 mb-3">
                                <a
                                    href={cvURL}
                                    className="btn btn-primary btn-lg"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fi-rr-eye me-2"></i>
                                    View Your CV
                                </a>
                                
                                <a
                                    href={cvURL}
                                    className="btn btn-outline-primary"
                                    download={`${user?.firstName || 'My'}_${user?.lastName || ''}_CV.pdf`}
                                >
                                    <i className="fi-rr-download me-2"></i>
                                    Download CV
                                </a>
                            </div>
                            
                            <p className="text-muted small">
                                <i className="fi-rr-info-circle me-1"></i>
                                Your CV is stored locally and can be accessed at any time
                            </p>
                        </div>
                        <div className="card-footer bg-light p-3 text-center">
                            <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setShowCVModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default withAuth(Portfolio);