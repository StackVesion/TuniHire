import Layout from "@/components/layout/Layout"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/router"
import Swal from "sweetalert2"
import Link from "next/link"
import withAuth from "@/utils/withAuth"
import { getToken, createAuthAxios } from "@/utils/authUtils"

function Portfolio({ user }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [portfolio, setPortfolio] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    
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
    const [skillInput, setSkillInput] = useState('');
    
    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [isFileUploading, setIsFileUploading] = useState(false);
    
    // Modal states
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [showExperienceModal, setShowExperienceModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItemId, setCurrentItemId] = useState(null);
    
    // State variables for step-by-step guide
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const guideSteps = [
        { step: 1, title: 'Upload CV', description: 'Upload your CV to showcase your professional background.', target: 'cv-section' },
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
            const endpoint = `http://localhost:5000/api/portfolios/${portfolio._id}`;
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
    
    // Fetch portfolio data on component mount
    useEffect(() => {
        const fetchPortfolioData = async () => {
            try {
                setLoading(true);
                const token = getToken();
                
                if (!token) {
                    console.error('No auth token found');
                    setLoading(false);
                    return;
                }
                
                // First try the endpoint test to find the working endpoint
                await testApiEndpoints();
                
                // If portfolio data was loaded by the test function, we're done
                if (portfolio && portfolio._id) {
                    // Only get certificates if we have a portfolio
                    try {
                        console.log('Attempting to fetch certificates...');
                        const authAxios = createAuthAxios();
                        
                        // Try to load certificates but don't break if the endpoint doesn't exist
                        try {
                            const certificatesResponse = await authAxios.get(`http://localhost:5000/api/certificates/user/${user._id}`);
                            setCertificates(certificatesResponse.data);
                            console.log('Certificates loaded successfully');
                        } catch (certError) {
                            console.log('Certificates endpoint not available:', certError.message);
                            // Initialize with empty certificates array
                            setCertificates([]);
                        }
                    } catch (err) {
                        console.error('Error in certificates section:', err);
                        // Continue even if certificates fetch fails
                        setCertificates([]);
                    }
                    
                    setLoading(false);
                    return;
                }
                
                // If no portfolio found via the test, create an empty portfolio object for the UI
                // and show the guide dialog
                setShowAlert(true);
                setPortfolio({
                    userId: user._id,
                    cvFile: null,
                    education: [],
                    experience: [],
                    skills: [],
                    certificates: []
                });
                
                // Show guided setup dialog
                Swal.fire({
                    title: 'Create Your Portfolio',
                    text: 'Let\'s build your professional portfolio step by step!',
                    icon: 'info',
                    confirmButtonText: 'Get Started',
                    showClass: {
                        popup: 'animate__animated animate__fadeInDown'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutUp'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Guide user to add CV first
                        Swal.fire({
                            title: 'Step 1: Upload Your CV',
                            text: 'Start by uploading your CV document to showcase your professional background.',
                            icon: 'info',
                            confirmButtonText: 'Got it!'
                        });
                    }
                });
                
            } catch (err) {
                console.error('Error in fetchPortfolioData:', err);
                // Create an empty portfolio object for the UI
                setShowAlert(true);
                setPortfolio({
                    userId: user._id,
                    cvFile: null,
                    education: [],
                    experience: [],
                    skills: [],
                    certificates: []
                });
                
                // Show friendly error dialog
                Swal.fire({
                    title: 'Let\'s Create Your Portfolio',
                    text: 'It looks like you don\'t have a portfolio yet. Let\'s create one together!',
                    icon: 'info',
                    confirmButtonText: 'Start Building'
                });
            }
            
            setLoading(false);
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
    
    // Debug function to test API endpoints
    const testApiEndpoints = async () => {
        try {
            const token = getToken();
            if (!token || !user || !user._id) {
                console.error('Missing token or user ID for API test');
                return;
            }
            
            // Testing different endpoint formats
            const endpoints = [
                `http://localhost:5000/api/users/${user._id}/portfolio`,
                `http://localhost:5000/api/portfolio/user/${user._id}`,
                `http://localhost:5000/api/portfolios/user/${user._id}`,
                `http://localhost:5000/api/portfolio/${user._id}`,
            ];
            
            console.log('Testing portfolio endpoints...');
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Testing endpoint: ${endpoint}`);
                    const authAxios = createAuthAxios();
                    const response = await authAxios.get(endpoint);
                    console.log(`SUCCESS: ${endpoint}`, response.data);
                    // If we found a working endpoint, use it to fetch the data
                    if (response.data) {
                        setPortfolio(response.data);
                        setShowAlert(false);
                        break;
                    }
                } catch (err) {
                    console.log(`FAILED: ${endpoint}`, err.response?.status);
                }
            }
        } catch (err) {
            console.error('Error in API endpoint test:', err);
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
    
    // CV file upload handler
    const handleCVUpload = async () => {
        if (!selectedFile) {
            Swal.fire({
                icon: 'error',
                title: 'No file selected',
                text: 'Please select a PDF file to upload'
            });
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
            Swal.fire({
                icon: 'error',
                title: 'File too large',
                text: 'Please select a file smaller than 5MB'
            });
            return;
        }

        if (selectedFile.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid file type',
                text: 'Please select a PDF file'
            });
            return;
        }

        try {
            setIsFileUploading(true);
            
            // Create FormData for Cloudinary upload
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', 'ml_default');
            formData.append('cloud_name', 'dop2pji6u');
            
            // Upload file directly to Cloudinary
            const cloudinaryResponse = await axios.post(
                'https://api.cloudinary.com/v1_1/dop2pji6u/upload',
                formData
            );
            
            if (cloudinaryResponse.data && cloudinaryResponse.data.secure_url) {
                // Now update the portfolio with the Cloudinary URL
                const authAxios = createAuthAxios();
                
                // Create CV file object with Cloudinary details
                const cvFileData = {
                    path: cloudinaryResponse.data.secure_url,
                    originalname: selectedFile.name,
                    fileType: selectedFile.type,
                    fileSize: selectedFile.size,
                    publicId: cloudinaryResponse.data.public_id,
                    updatedAt: new Date().toISOString()
                };
                
                let portfolioId = portfolio?._id;
                
                // If portfolio doesn't exist, create one first
                if (!portfolioId) {
                    console.log('Portfolio does not exist yet, creating one...');
                    try {
                        const createResponse = await authAxios.post(
                            'http://localhost:5000/api/portfolios/',
                            { 
                                userId: user._id,
                                cvFile: null, // Will update this next
                                education: [],
                                experience: [],
                                skills: []
                            }
                        );
                        
                        if (createResponse.data && createResponse.data._id) {
                            console.log('New portfolio created with ID:', createResponse.data._id);
                            portfolioId = createResponse.data._id;
                            setPortfolio(createResponse.data);
                        } else {
                            throw new Error('Failed to create portfolio');
                        }
                    } catch (createError) {
                        console.error('Error creating portfolio:', createError);
                        throw new Error('Failed to create portfolio: ' + (createError.message || 'Unknown error'));
                    }
                }
                
                if (!portfolioId) {
                    throw new Error('Portfolio ID is undefined, cannot update CV');
                }
                
                // Update portfolio with CV info
                console.log(`Updating portfolio ${portfolioId} with CV info`);
                const portfolioResponse = await authAxios.put(
                    `http://localhost:5000/api/portfolios/update-cv/${portfolioId}`,
                    { cvFile: cvFileData }
                );
                
                if (portfolioResponse.data.success) {
                    // Update local state
                    setPortfolio(prevPortfolio => ({
                        ...prevPortfolio,
                        cvFile: cvFileData
                    }));
                    
                    setSelectedFile(null);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'CV uploaded successfully',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    
                    // If this was part of the guided setup, move to next step
                    if (activeGuideStep === 1) {
                        showNextGuideStep();
                    }
                } else {
                    throw new Error('Failed to update portfolio');
                }
            } else {
                throw new Error('File upload failed');
            }
        } catch (error) {
            console.error('Error uploading CV:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload failed',
                text: error.message || 'An error occurred while uploading the CV'
            });
        } finally {
            setIsFileUploading(false);
        }
    };

    // Handle CV deletion
    const handleDeleteCV = async () => {
        Swal.fire({
            title: 'Delete CV',
            text: 'Are you sure you want to delete your CV?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const authAxios = createAuthAxios();
                    
                    // If we have a public ID, try to delete from Cloudinary
                    if (portfolio?.cvFile?.publicId) {
                        try {
                            await axios.post(
                                'https://api.cloudinary.com/v1_1/dop2pji6u/image/destroy',
                                {
                                    public_id: portfolio.cvFile.publicId,
                                    api_key: '336648628524354',
                                    signature: '', // You would need to generate this on your backend securely
                                    timestamp: new Date().getTime() / 1000
                                }
                            );
                        } catch (cloudinaryError) {
                            console.error('Error deleting from Cloudinary (continuing anyway):', cloudinaryError);
                            // Continue anyway - we'll still remove from portfolio
                        }
                    }
                    
                    // Update portfolio to remove CV
                    const response = await authAxios.put(
                        'http://localhost:5000/api/portfolios/update',
                        { cvFile: null }
                    );
                    
                    if (response.data.success) {
                        setPortfolio(prevPortfolio => ({
                            ...prevPortfolio,
                            cvFile: null
                        }));
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'CV deleted successfully',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    console.error('Error deleting CV:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete CV'
                    });
                }
            }
        });
    };
    
    // Education handlers
    const handleEducationChange = (e) => {
        const { name, value } = e.target;
        setEducationForm(prev => ({
            ...prev,
            [name]: value
        }));
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
        try {
            const authAxios = createAuthAxios();
            
            // Validate form
            if (!educationForm.school || !educationForm.degree || !educationForm.fieldOfStudy || !educationForm.startDate) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Information',
                    text: 'Please fill in all required fields.'
                });
                return;
            }
            
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
        setEducationForm(portfolio.education[index]);
        setIsEditing(true);
        setCurrentItemId(index);
        setShowEducationModal(true);
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
        setExperienceForm({
            ...experienceForm,
            [e.target.name]: e.target.value
        });
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
        try {
            const authAxios = createAuthAxios();
            
            // Validate form
            if (!experienceForm.company || !experienceForm.position || !experienceForm.startDate) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Information',
                    text: 'Please fill in all required fields.'
                });
                return;
            }
            
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
        setExperienceForm(portfolio.experience[index]);
        setIsEditing(true);
        setCurrentItemId(index);
        setShowExperienceModal(true);
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
    
    // Handlers for skills section
    const addSkill = async (e) => {
        e.preventDefault();
        if (!skillInput.trim()) return;
        
        try {
            const authAxios = createAuthAxios();
            
            const updatedSkills = [...(portfolio.skills || []), skillInput.trim()];
            
            const response = await authAxios.put(
                'http://localhost:5000/api/portfolios/update-skills',
                { skills: updatedSkills }
            );
            
            if (response.data.success) {
                setPortfolio(prev => ({
                    ...prev,
                    skills: updatedSkills
                }));
                setSkillInput('');
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Skill added successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to add skill'
            });
        }
    };

    const removeSkill = async (index) => {
        try {
            const authAxios = createAuthAxios();
            
            const updatedSkills = [...portfolio.skills];
            updatedSkills.splice(index, 1);
            
            const response = await authAxios.put(
                'http://localhost:5000/api/portfolios/update-skills',
                { skills: updatedSkills }
            );
            
            if (response.data.success) {
                setPortfolio(prev => ({
                    ...prev,
                    skills: updatedSkills
                }));
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Skill removed successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error removing skill:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to remove skill'
            });
        }
    };

    // Calculate completion percentage
    const calculatePortfolioProgress = () => {
        if (!portfolio) return 0;
        
        let completedItems = 0;
        let totalItems = 4; // CV, Education, Experience, Skills
        
        if (portfolio.cvFile) completedItems++;
        if (portfolio.education && portfolio.education.length > 0) completedItems++;
        if (portfolio.experience && portfolio.experience.length > 0) completedItems++;
        if (portfolio.skills && portfolio.skills.length > 0) completedItems++;
        
        return Math.round((completedItems / totalItems) * 100);
    };
    
    // Get text for completion status
    const calculatePortfolioCompletionText = () => {
        const progress = calculatePortfolioProgress();
        
        if (progress === 0) return 'Not started';
        if (progress === 100) return 'Complete';
        if (progress < 50) return 'Just getting started';
        if (progress < 75) return 'Making good progress';
        return 'Almost there';
    };
    
    // Date formatter helper
    const getFormattedDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // Year extractor helper
    const getYearFromDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.getFullYear();
    };
    
    return (
        <Layout breadcrumbTitle="My Portfolio" breadcrumbActive="My Portfolio">
            <div className="row">
                <div className="col-lg-12">
                    <div className="section-box">
                        <div className="container">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading portfolio data...</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Introduction Card & Guide Progress */}
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="dashboard-box">
                                                <div className="headline">
                                                    <h3><i className="icon-line-awesome-info-circle"></i> Portfolio Setup Guide</h3>
                                                    {guideSteps && activeGuideStep > 0 && activeGuideStep <= guideSteps.length && (
                                                        <div className="guide-progress-info">
                                                            <span className="badge badge-primary">Step {activeGuideStep} of {guideSteps.length}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portfolio Progress Section */}
                                    <div className="panel-white mb-30" id="progress-section">
                                        <div className="box-padding">
                                            <h5>Portfolio Completion</h5>
                                            <div className="progress-bar-portfolio mb-30">
                                                <div className="progress-label">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="font-md color-text-mutted">{calculatePortfolioCompletionText()}</span>
                                                        <span className="font-md color-brand-1">{calculatePortfolioProgress()}%</span>
                                                    </div>
                                                    <div className="progress">
                                                        <div 
                                                            className="progress-bar" 
                                                            role="progressbar" 
                                                            style={{width: `${calculatePortfolioProgress()}%`}} 
                                                            aria-valuenow={calculatePortfolioProgress()} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                <div className="guide-steps">
                                                    <h6 className="mb-3">Complete Your Portfolio</h6>
                                                    <div className="steps-container">
                                                        <div 
                                                            className={`step mb-3 p-3 rounded d-flex align-items-center ${activeGuideStep === 1 ? 'active bg-light border-primary' : portfolio?.cvFile ? 'completed' : ''}`}
                                                            onClick={() => setActiveGuideStep(1)}
                                                        >
                                                            <div className="step-number me-3">
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${portfolio?.cvFile ? 'bg-success text-white' : activeGuideStep === 1 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '30px', height: '30px' }}>
                                                                    {portfolio?.cvFile ? <i className="fi-rr-check"></i> : '1'}
                                                                </div>
                                                            </div>
                                                            <div className="step-content">
                                                                <h6 className="mb-0">Upload Your CV</h6>
                                                                <small className="text-muted">Upload your professional CV to showcase your background</small>
                                                            </div>
                                                            <div className="ms-auto">
                                                                {portfolio?.cvFile ? (
                                                                    <span className="badge bg-success">Completed</span>
                                                                ) : activeGuideStep === 1 ? (
                                                                    <span className="badge bg-primary">In Progress</span>
                                                                ) : (
                                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveGuideStep(1)}>Start</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div 
                                                            className={`step mb-3 p-3 rounded d-flex align-items-center ${activeGuideStep === 2 ? 'active bg-light border-primary' : portfolio?.education?.length > 0 ? 'completed' : ''}`}
                                                            onClick={() => setActiveGuideStep(2)}
                                                        >
                                                            <div className="step-number me-3">
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${portfolio?.education?.length > 0 ? 'bg-success text-white' : activeGuideStep === 2 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '30px', height: '30px' }}>
                                                                    {portfolio?.education?.length > 0 ? <i className="fi-rr-check"></i> : '2'}
                                                                </div>
                                                            </div>
                                                            <div className="step-content">
                                                                <h6 className="mb-0">Add Education</h6>
                                                                <small className="text-muted">Enter your educational background and qualifications</small>
                                                            </div>
                                                            <div className="ms-auto">
                                                                {portfolio?.education?.length > 0 ? (
                                                                    <span className="badge bg-success">Completed</span>
                                                                ) : activeGuideStep === 2 ? (
                                                                    <span className="badge bg-primary">In Progress</span>
                                                                ) : (
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-primary" 
                                                                        onClick={() => setActiveGuideStep(2)}
                                                                        disabled={!portfolio?.cvFile}
                                                                    >
                                                                        {!portfolio?.cvFile ? 'Complete Previous Step First' : 'Start'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div 
                                                            className={`step mb-3 p-3 rounded d-flex align-items-center ${activeGuideStep === 3 ? 'active bg-light border-primary' : portfolio?.experience?.length > 0 ? 'completed' : ''}`}
                                                            onClick={() => setActiveGuideStep(3)}
                                                        >
                                                            <div className="step-number me-3">
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${portfolio?.experience?.length > 0 ? 'bg-success text-white' : activeGuideStep === 3 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '30px', height: '30px' }}>
                                                                    {portfolio?.experience?.length > 0 ? <i className="fi-rr-check"></i> : '3'}
                                                                </div>
                                                            </div>
                                                            <div className="step-content">
                                                                <h6 className="mb-0">Add Work Experience</h6>
                                                                <small className="text-muted">Share your professional work history and achievements</small>
                                                            </div>
                                                            <div className="ms-auto">
                                                                {portfolio?.experience?.length > 0 ? (
                                                                    <span className="badge bg-success">Completed</span>
                                                                ) : activeGuideStep === 3 ? (
                                                                    <span className="badge bg-primary">In Progress</span>
                                                                ) : (
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-primary" 
                                                                        onClick={() => setActiveGuideStep(3)}
                                                                        disabled={!portfolio?.education || portfolio.education.length === 0}
                                                                    >
                                                                        {!portfolio?.education || portfolio.education.length === 0 ? 'Complete Previous Step First' : 'Start'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div 
                                                            className={`step mb-3 p-3 rounded d-flex align-items-center ${activeGuideStep === 4 ? 'active bg-light border-primary' : portfolio?.skills?.length > 0 ? 'completed' : ''}`}
                                                            onClick={() => setActiveGuideStep(4)}
                                                        >
                                                            <div className="step-number me-3">
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${portfolio?.skills?.length > 0 ? 'bg-success text-white' : activeGuideStep === 4 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '30px', height: '30px' }}>
                                                                    {portfolio?.skills?.length > 0 ? <i className="fi-rr-check"></i> : '4'}
                                                                </div>
                                                            </div>
                                                            <div className="step-content">
                                                                <h6 className="mb-0">Add Skills</h6>
                                                                <small className="text-muted">List your key skills and competencies</small>
                                                            </div>
                                                            <div className="ms-auto">
                                                                {portfolio?.skills?.length > 0 ? (
                                                                    <span className="badge bg-success">Completed</span>
                                                                ) : activeGuideStep === 4 ? (
                                                                    <span className="badge bg-primary">In Progress</span>
                                                                ) : (
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-primary" 
                                                                        onClick={() => setActiveGuideStep(4)}
                                                                        disabled={!portfolio?.experience || portfolio.experience.length === 0}
                                                                    >
                                                                        {!portfolio?.experience || portfolio.experience.length === 0 ? 'Complete Previous Step First' : 'Start'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {calculatePortfolioProgress() === 100 && (
                                                        <div className="alert alert-success mt-4">
                                                            <h6><i className="fi-rr-check-circle me-2"></i>Congratulations!</h6>
                                                            <p className="mb-0">You've completed your portfolio setup. Your profile is now more attractive to potential employers.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* CV Upload Section */}
                                        <div className="panel-white mb-30" id="cv-section">
                                            <div className={`box-padding ${activeGuideStep === 1 ? 'border border-primary rounded' : ''}`}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5><i className="fi-rr-file-pdf me-2"></i>Upload your CV</h5>
                                                    {portfolio?.cvFile && (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={handleDeleteCV}
                                                        >
                                                            <i className="fi-rr-trash me-2"></i>Delete CV
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {activeGuideStep === 1 && !portfolio?.cvFile && (
                                                    <div className="alert alert-info mt-3">
                                                        <small>
                                                            <i className="fi-rr-info me-1"></i>
                                                            <strong>Step 1:</strong> Upload your CV to showcase your professional background. This is an essential part of your portfolio.
                                                        </small>
                                                    </div>
                                                )}
                                                
                                                {portfolio?.cvFile ? (
                                                    <div className="mt-20">
                                                        <div className="box-cv-preview">
                                                            <div className="row">
                                                                <div className="col-6">
                                                                    <span className="font-md color-brand-1">{portfolio.cvFile.originalname || 'Your CV'}</span>
                                                                </div>
                                                                <div className="col-3 text-center">
                                                                    <span className="font-xs color-text-mutted">{getFormattedDate(portfolio.cvFile.updatedAt)}</span>
                                                                </div>
                                                                <div className="col-3 text-end">
                                                                    <a href={`http://localhost:5000/${portfolio.cvFile.path}`} className="btn btn-sm btn-primary" target="_blank" rel="noreferrer">
                                                                        <i className="fi-rr-eye me-5"></i>View
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-20">
                                                        <div className="box-file-upload">
                                                            <div className="form-group">
                                                                <div className="form-input">
                                                                    <input
                                                                        type="file"
                                                                        className="form-control input-file-upload"
                                                                        id="cv-upload"
                                                                        accept="application/pdf"
                                                                        disabled={isFileUploading}
                                                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="btn btn-default"
                                                                onClick={handleCVUpload}
                                                                disabled={!selectedFile || isFileUploading}
                                                            >
                                                                {isFileUploading ? (
                                                                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...</>
                                                                ) : (
                                                                    <>Upload CV</>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <small className="text-muted">Max file size: 5MB. Accepted format: PDF</small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Education Section */}
                                        <div className="panel-white mb-30" id="education-section">
                                            <div className={`box-padding ${activeGuideStep === 2 ? 'border border-primary rounded' : ''}`}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="icon-edu">Education</h5>
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => setShowEducationModal(true)}
                                                    >
                                                        <i className="fi-rr-plus me-2"></i>Add Education
                                                    </button>
                                                </div>
                                                
                                                {activeGuideStep === 2 && (!portfolio?.education || portfolio.education.length === 0) && (
                                                    <div className="alert alert-info mt-3">
                                                        <small>
                                                            <i className="fi-rr-info me-1"></i>
                                                            <strong>Step 2:</strong> Add your educational background to highlight your qualifications.
                                                        </small>
                                                    </div>
                                                )}

                                                {portfolio?.education?.length > 0 ? (
                                                    <div className="mt-20">
                                                        {portfolio.education.map((edu, index) => (
                                                            <div key={index} className="item-timeline">
                                                                <div className="timeline-year">
                                                                    <span>{new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}</span>
                                                                </div>
                                                                <div className="timeline-info">
                                                                    <h6>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h6>
                                                                    <p>{edu.institution}</p>
                                                                    {edu.description && <p className="mt-2">{edu.description}</p>}
                                                                </div>
                                                                <div className="timeline-actions">
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-primary me-2" 
                                                                        onClick={() => handleEditEducation(index)}
                                                                    >
                                                                        <i className="fi-rr-edit me-1"></i>Edit
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-sm btn-outline-danger" 
                                                                        onClick={() => handleDeleteEducation(index)}
                                                                    >
                                                                        <i className="fi-rr-trash me-1"></i>Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-20 text-center py-4 bg-light rounded">
                                                        <p className="mb-0">No education entries yet. Add your first education entry to improve your portfolio.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Experience Section */}
                                        <div className="panel-white mb-30" id="experience-section">
                                            <div className={`box-padding ${activeGuideStep === 3 ? 'border border-primary rounded' : ''}`}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="icon-edu">Work &amp; Experience</h5>
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => setShowExperienceModal(true)}
                                                    >
                                                        <i className="fi-rr-plus me-2"></i>Add Experience
                                                    </button>
                                                </div>
                                                
                                                {activeGuideStep === 3 && (!portfolio?.experience || portfolio.experience.length === 0) && (
                                                    <div className="alert alert-info mt-3">
                                                        <small>
                                                            <i className="fi-rr-info me-1"></i>
                                                            <strong>Step 3:</strong> Add your work experience to showcase your professional journey. This helps employers see your practical skills and experience.
                                                        </small>
                                                    </div>
                                                )}
                                                
                                                {portfolio?.experience?.length > 0 ? (
                                                    <div className="mt-20">
                                                        {portfolio.experience.map((exp, index) => (
                                                            <div key={index} className="item-timeline">
                                                                <div className="timeline-year">
                                                                    <span>
                                                                        {new Date(exp.startDate).getFullYear()} - {exp.currentlyWorking ? 'Present' : new Date(exp.endDate).getFullYear()}
                                                                    </span>
                                                                </div>
                                                                <div className="timeline-info">
                                                                    <h5 className="color-brand-1 mb-10">
                                                                        {exp.company}
                                                                    </h5>
                                                                    <p className="color-text-paragraph-2 mb-15">
                                                                        <strong>{exp.position}</strong>
                                                                        {exp.location && <span className="ms-2"><i className="fi-rr-marker me-1"></i>{exp.location}</span>}
                                                                    </p>
                                                                    {exp.description && (
                                                                        <p className="color-text-paragraph-2 mb-15">
                                                                            {exp.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="timeline-actions">
                                                                    <button 
                                                                        className="btn btn-editor" 
                                                                        onClick={() => handleEditExperience(index)}
                                                                        title="Edit"
                                                                    >
                                                                        <i className="fi-rr-edit"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-remove" 
                                                                        onClick={() => handleDeleteExperience(index)}
                                                                        title="Delete"
                                                                    >
                                                                        <i className="fi-rr-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-20 text-center py-4 bg-light rounded">
                                                        <p className="mb-0">No experience entries yet. Add your work experience to strengthen your portfolio.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Skills Section */}
                                        <div className="panel-white mb-30" id="skills-section">
                                            <div className={`box-padding ${activeGuideStep === 4 ? 'border border-primary rounded' : ''}`}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="icon-edu">Skills</h5>
                                                </div>
                                                
                                                {activeGuideStep === 4 && (!portfolio?.skills || portfolio.skills.length === 0) && (
                                                    <div className="alert alert-info mt-3">
                                                        <small>
                                                            <i className="fi-rr-info me-1"></i>
                                                            <strong>Step 4:</strong> Add your key skills to highlight your strengths and abilities. This will make your profile more attractive to employers.
                                                        </small>
                                                    </div>
                                                )}
                                                
                                                <div className="row mt-30">
                                                    <div className="col-lg-12">
                                                        <div className="form-group">
                                                            <form onSubmit={addSkill}>
                                                                <div className="input-group mb-3">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        placeholder="Enter a skill (e.g., JavaScript, Project Management)"
                                                                        value={skillInput}
                                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                                    />
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        type="submit"
                                                                        disabled={!skillInput.trim()}
                                                                    >
                                                                        <i className="fi-rr-plus me-1"></i>Add
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                        
                                                        <div className="skills-list mt-20">
                                                            {portfolio?.skills?.length > 0 ? (
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {portfolio.skills.map((skill, index) => (
                                                                        <div key={index} className="skill-tag p-2 bg-light rounded-pill d-flex align-items-center">
                                                                            <span className="me-2">{skill}</span>
                                                                            <button
                                                                                className="btn btn-sm btn-icon text-danger"
                                                                                onClick={() => removeSkill(index)}
                                                                                title="Remove skill"
                                                                            >
                                                                                <i className="fi-rr-cross-small"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-3 bg-light rounded">
                                                                    <p className="mb-0 text-muted">No skills added yet. Use the field above to add your skills.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {portfolio?.skills?.length > 0 && activeGuideStep === 4 && (
                                                            <div className="mt-3 text-end">
                                                                <button 
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={showNextGuideStep}
                                                                >
                                                                    Continue to Next Step <i className="fi-rr-arrow-right ms-1"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Education Modal */}
                                        {showEducationModal && (
                                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                                <div className="modal-dialog modal-lg">
                                                    <div className="modal-content">
                                                        <div className="modal-header">
                                                            <h5 className="modal-title">{isEditing ? 'Edit Education' : 'Add Education'}</h5>
                                                            <button type="button" className="btn-close" onClick={() => setShowEducationModal(false)}></button>
                                                        </div>
                                                        <div className="modal-body">
                                                            <div className="row">
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">School/University *</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="school" 
                                                                            value={educationForm.school} 
                                                                            onChange={handleEducationChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Location</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="location" 
                                                                            value={educationForm.location} 
                                                                            onChange={handleEducationChange} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Degree *</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="degree" 
                                                                            value={educationForm.degree} 
                                                                            onChange={handleEducationChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Field of Study *</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="fieldOfStudy" 
                                                                            value={educationForm.fieldOfStudy} 
                                                                            onChange={handleEducationChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Start Date *</label>
                                                                        <input 
                                                                            type="date" 
                                                                            className="form-control" 
                                                                            name="startDate" 
                                                                            value={educationForm.startDate} 
                                                                            onChange={handleEducationChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">End Date</label>
                                                                        <input 
                                                                            type="date" 
                                                                            className="form-control" 
                                                                            name="endDate" 
                                                                            value={educationForm.endDate} 
                                                                            onChange={handleEducationChange} 
                                                                            disabled={educationForm.currentlyEnrolled} 
                                                                        />
                                                                    </div>
                                                                    <div className="form-check mb-3">
                                                                        <input 
                                                                            className="form-check-input" 
                                                                            type="checkbox" 
                                                                            id="currentlyEnrolled" 
                                                                            checked={educationForm.currentlyEnrolled} 
                                                                            onChange={handleEducationCheckbox} 
                                                                        />
                                                                        <label className="form-check-label" htmlFor="currentlyEnrolled">
                                                                            Currently Enrolled
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div className="col-12">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Description</label>
                                                                        <textarea 
                                                                            className="form-control" 
                                                                            name="description" 
                                                                            value={educationForm.description} 
                                                                            onChange={handleEducationChange} 
                                                                            rows="3"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="modal-footer">
                                                            <button type="button" className="btn btn-secondary" onClick={() => setShowEducationModal(false)}>Cancel</button>
                                                            <button type="button" className="btn btn-primary" onClick={handleAddEducation}>{isEditing ? 'Update' : 'Add'}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Experience Modal */}
                                        {showExperienceModal && (
                                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                                <div className="modal-dialog modal-lg">
                                                    <div className="modal-content">
                                                        <div className="modal-header">
                                                            <h5 className="modal-title">{isEditing ? 'Edit Experience' : 'Add Experience'}</h5>
                                                            <button type="button" className="btn-close" onClick={() => setShowExperienceModal(false)}></button>
                                                        </div>
                                                        <div className="modal-body">
                                                            <div className="row">
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Company *</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="company" 
                                                                            value={experienceForm.company} 
                                                                            onChange={handleExperienceChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Location</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="location" 
                                                                            value={experienceForm.location} 
                                                                            onChange={handleExperienceChange} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Position *</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="form-control" 
                                                                            name="position" 
                                                                            value={experienceForm.position} 
                                                                            onChange={handleExperienceChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Start Date *</label>
                                                                        <input 
                                                                            type="date" 
                                                                            className="form-control" 
                                                                            name="startDate" 
                                                                            value={experienceForm.startDate} 
                                                                            onChange={handleExperienceChange} 
                                                                            required 
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">End Date</label>
                                                                        <input 
                                                                            type="date" 
                                                                            className="form-control" 
                                                                            name="endDate" 
                                                                            value={experienceForm.endDate} 
                                                                            onChange={handleExperienceChange} 
                                                                            disabled={experienceForm.currentlyWorking} 
                                                                        />
                                                                    </div>
                                                                    <div className="form-check mb-3">
                                                                        <input 
                                                                            className="form-check-input" 
                                                                            type="checkbox" 
                                                                            id="currentlyWorking" 
                                                                            checked={experienceForm.currentlyWorking} 
                                                                            onChange={handleExperienceCheckbox} 
                                                                        />
                                                                        <label className="form-check-label" htmlFor="currentlyWorking">
                                                                            Currently Working
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div className="col-12">
                                                                    <div className="form-group mb-3">
                                                                        <label className="form-label">Description</label>
                                                                        <textarea 
                                                                            className="form-control" 
                                                                            name="description" 
                                                                            value={experienceForm.description} 
                                                                            onChange={handleExperienceChange} 
                                                                            rows="3"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="modal-footer">
                                                            <button type="button" className="btn btn-secondary" onClick={() => setShowExperienceModal(false)}>Cancel</button>
                                                            <button type="button" className="btn btn-primary" onClick={handleAddExperience}>{isEditing ? 'Update' : 'Add'}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                )}

                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default withAuth(Portfolio);