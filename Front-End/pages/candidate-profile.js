import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout/Layout";
import { useRouter } from "next/router";
import axios from "axios";
import Modal from 'react-bootstrap/Modal';

export default function CandidateProfile() {
    const [activeIndex, setActiveIndex] = useState(1);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    // Verification related states
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [verificationError, setVerificationError] = useState("");
    const [stream, setStream] = useState(null);
    const [verificationImage, setVerificationImage] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        experienceYears: "",
        skills: [],
        projects: [],
        education: [],
        languagePreferences: [],
        projectsText: "",
        educationText: ""
    });
    const [newSkill, setNewSkill] = useState("");
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const router = useRouter();

    // Ajouter une fonction pour récupérer les données complètes du profil
    const fetchCompleteProfileData = async () => {
        try {
            setLoading(true); // Show loading indicator
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Vous devez être connecté pour voir votre profil");
                setLoading(false);
                return;
            }
            
            console.log("Fetching profile data with token:", token);
            
            try {
                const response = await axios.get(
                    "http://localhost:5000/api/users/profile",
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log("Profile data received:", response.data);
                
                if (response.status === 200 && response.data.user) {
                    // Mettre à jour le state avec les données complètes
                    setUserData(response.data.user);
                    
                    // Mettre à jour le localStorage
                    localStorage.setItem("user", JSON.stringify(response.data.user));
                    
                    // Mettre à jour le formulaire avec les données complètes
                    const projectsText = response.data.user.projects && Array.isArray(response.data.user.projects) 
                        ? response.data.user.projects.map(p => typeof p === 'object' ? p.title : p).join(", ")
                        : "";
                        
                    const educationText = response.data.user.education && Array.isArray(response.data.user.education)
                        ? response.data.user.education.map(e => typeof e === 'object' ? e.degree : e).join(", ")
                        : "";
                        
                    setProfileForm({
                        firstName: response.data.user.firstName || "",
                        lastName: response.data.user.lastName || "",
                        phone: response.data.user.phone || "",
                        experienceYears: response.data.user.experienceYears || "",
                        skills: response.data.user.skills || [],
                        projects: response.data.user.projects || [],
                        education: response.data.user.education || [],
                        languagePreferences: response.data.user.languagePreferences || [],
                        projectsText,
                        educationText
                    });
                } else {
                    console.error("Unexpected response format:", response);
                    setError("Format de réponse inattendu");
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
                if (error.response) {
                    console.error("Server response:", error.response.data);
                    console.error("Status code:", error.response.status);
                    
                    if (error.response.status === 404) {
                        console.error("API endpoint not found. Check server implementation.");
                        setError("API non disponible. Veuillez réessayer plus tard.");
                    } else if (error.response.status === 401) {
                        setError("Session expirée. Veuillez vous reconnecter.");
                        setTimeout(() => {
                            localStorage.removeItem("token");
                            router.push("/page-signin");
                        }, 2000);
                    } else {
                        setError(`Erreur serveur: ${error.response.data.message || error.response.statusText}`);
                    }
                } else if (error.request) {
                    console.error("No response received:", error.request);
                    setError("Le serveur ne répond pas. Vérifiez votre connexion.");
                } else {
                    console.error("Error setting up request:", error.message);
                    setError(`Erreur de requête: ${error.message}`);
                }
            }
        } catch (err) {
            console.error("Generic error in fetchCompleteProfileData:", err);
            setError("Une erreur inattendue s'est produite");
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    // Fonction pour gérer le téléchargement de la photo de profil
    const handleProfilePictureUpload = async (file) => {
        setUploadingPhoto(true);
        setError("");
        setSuccess("");
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Vous devez être connecté pour effectuer cette action");
                setUploadingPhoto(false);
                return;
            }
            
            const formData = new FormData();
            formData.append("profilePicture", file);
            
            const response = await axios.post(
                "http://localhost:5000/api/users/upload-profile-picture",
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.status === 200) {
                // Update user data with the new profile picture URL
                const updatedUserData = {...userData, profilePicture: response.data.profilePicture};
                setUserData(updatedUserData);
                localStorage.setItem("user", JSON.stringify(updatedUserData));
                setSuccess("Photo de profil mise à jour avec succès");
                
                // Refresh profile data after upload
                fetchCompleteProfileData();
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            if (error.response) {
                setError(`Erreur: ${error.response.data.message || error.response.statusText}`);
            } else {
                setError("Une erreur est survenue lors du téléchargement de la photo de profil");
            }
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Handle opening verification modal
    const openVerificationModal = () => {
        setVerificationError("");
        setVerificationSuccess(false);
        setShowVerificationModal(true);
        setTimeout(() => {
            startCamera();
        }, 500);
    };

    // Handle closing verification modal and cleanup
    const closeVerificationModal = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setVerificationImage(null);
        setShowVerificationModal(false);
    };

    // Start camera stream
    const startCamera = async () => {
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" }, 
                audio: false 
            });
            
            setStream(videoStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = videoStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setVerificationError("Failed to access your camera. Please ensure you have granted camera access permission.");
        }
    };

    // Capture image from camera
    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/png');
        setVerificationImage(imageDataUrl);
    };

    // Submit verification to server
    const submitVerification = async () => {
        if (!verificationImage) {
            setVerificationError("Please capture an image first");
            return;
        }

        try {
            setVerifying(true);
            setVerificationError("");
            
            const token = localStorage.getItem("token");
            if (!token) {
                setVerificationError("You must be logged in to verify your profile");
                setVerifying(false);
                return;
            }
            
            // Convert base64 image to blob for sending
            const base64Response = await fetch(verificationImage);
            const blob = await base64Response.blob();
            
            // Create a File object from the blob
            const imageFile = new File([blob], "verification.png", { type: "image/png" });
            
            const formData = new FormData();
            formData.append("verificationImage", imageFile);
            
            console.log("Sending verification image with token:", token.substring(0, 10) + "...");
            
            const response = await axios.post(
                "http://localhost:5000/api/users/verify-profile",
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // Don't set Content-Type with FormData, axios will set it automatically with boundary
                    }
                }
            );
            
            if (response.status === 200) {
                setVerificationSuccess(true);
                
                // Update user data with verification status
                const updatedUserData = {...userData, isVerified: true, verifiedAt: new Date()};
                setUserData(updatedUserData);
                localStorage.setItem("user", JSON.stringify(updatedUserData));
                
                setTimeout(() => {
                    closeVerificationModal();
                    setSuccess("Your profile has been verified successfully!");
                    fetchCompleteProfileData(); // Refresh profile data
                }, 2000);
            }
        } catch (error) {
            console.error("Error verifying profile:", error);
            if (error.response) {
                setVerificationError(`Error: ${error.response.data.message || error.response.statusText}`);
            } else {
                setVerificationError("Failed to verify your profile. Please try again later.");
            }
        } finally {
            setVerifying(false);
        }
    };

    // Récupération des infos utilisateur depuis localStorage
    useEffect(() => {
        const getUserData = () => {
            try {
                const userJSON = localStorage.getItem("user");
                if (!userJSON) {
                    router.push("/page-signin");
                    return null;
                }
                return JSON.parse(userJSON);
            } catch (error) {
                console.error("Error parsing user data:", error);
                return null;
            }
        };

        // Check for activeTab query parameter and set the active tab
        if (router.query.activeTab) {
            const tabIndex = parseInt(router.query.activeTab);
            if (!isNaN(tabIndex) && tabIndex >= 1 && tabIndex <= 3) {
                setActiveIndex(tabIndex);
            }
        }

        const user = getUserData();
        if (user) {
            setUserData(user);
            
            // Initialiser le formulaire de profil avec les données utilisateur existantes
            const projectsText = user.projects && Array.isArray(user.projects) 
                ? user.projects.map(p => typeof p === 'object' ? p.title : p).join(", ")
                : "";
                
            const educationText = user.education && Array.isArray(user.education)
                ? user.education.map(e => typeof e === 'object' ? e.degree : e).join(", ")
                : "";
                
            setProfileForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || "",
                experienceYears: user.experienceYears || "",
                skills: user.skills || [],
                projects: user.projects || [],
                education: user.education || [],
                languagePreferences: user.languagePreferences || [],
                projectsText,
                educationText
            });

            // Récupérer les données complètes du profil depuis le backend
            fetchCompleteProfileData();
        } else {
            setLoading(false);
        }
    }, [router]);

    const handleOnClick = (index) => {
        setActiveIndex(index);
    };

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    // Gérer l'ajout de compétences
    const handleAddSkill = () => {
        if (newSkill && !profileForm.skills.includes(newSkill)) {
            const updatedSkills = [...profileForm.skills, newSkill];
            setProfileForm({ ...profileForm, skills: updatedSkills });
            setNewSkill("");
        }
    };

    // Gérer la suppression de compétences
    const handleRemoveSkill = (skillToRemove) => {
        const updatedSkills = profileForm.skills.filter(skill => skill !== skillToRemove);
        setProfileForm({ ...profileForm, skills: updatedSkills });
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Vous devez être connecté pour effectuer cette action");
                return;
            }
            
            // Format projects as objects for the API
            const formattedProjects = profileForm.projectsText
                ? profileForm.projectsText.split(',').map(item => ({
                    title: item.trim(),
                    description: '',
                    technologies: []
                }))
                : [];

            // Format education as objects for the API
            const formattedEducation = profileForm.educationText
                ? profileForm.educationText.split(',').map(item => ({
                    degree: item.trim(),
                    institution: '',
                    yearCompleted: null
                }))
                : [];
                
            const formattedData = {
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                phone: profileForm.phone,
                experienceYears: profileForm.experienceYears ? Number(profileForm.experienceYears) : 0,
                skills: profileForm.skills || [],
                projects: formattedProjects,
                education: formattedEducation,
                languagePreferences: profileForm.languagePreferences || []
            };
            
            console.log("Sending profile data:", formattedData);
            console.log("Using token:", token);
            
            try {
                const response = await axios.put(
                    "http://localhost:5000/api/users/update-profile",
                    formattedData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.status === 200) {
                    setSuccess("Profil mis à jour avec succès");
                    
                    // Mettre à jour les données utilisateur avec TOUTES les données retournées
                    const updatedUser = response.data.user;
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    setUserData(updatedUser);
                    
                    // Récupérer les données fraîches après la mise à jour
                    fetchCompleteProfileData();
                }
            } catch (axiosError) {
                console.error("Full error object:", axiosError);
                if (axiosError.response) {
                    console.error("Error response data:", axiosError.response.data);
                    console.error("Error response status:", axiosError.response.status);
                    console.error("Error response headers:", axiosError.response.headers);
                    setError(`Error: ${axiosError.response.data.message || axiosError.response.statusText}`);
                } else if (axiosError.request) {
                    console.error("Error request made but no response:", axiosError.request);
                    setError("No response received from server. Please check your connection.");
                } else {
                    console.error("Error setting up request:", axiosError.message);
                    setError(`Error setting up request: ${axiosError.message}`);
                }
            }
        } catch (err) {
            console.error("Generic error:", err);
            setError("An unexpected error occurred");
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        // Vérifier que les nouveaux mots de passe correspondent
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("Les nouveaux mots de passe ne correspondent pas");
            return;
        }
        
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setError("Veuillez remplir tous les champs du formulaire");
            return;
        }
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Vous devez être connecté pour effectuer cette action");
                return;
            }
            
            try {
                const response = await axios.put(
                    "http://localhost:5000/api/users/change-password",
                    {
                        currentPassword: passwordForm.currentPassword,
                        newPassword: passwordForm.newPassword
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.status === 200) {
                    setSuccess("Mot de passe modifié avec succès");
                    setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                    });
                }
            } catch (axiosError) {
                console.error("Password change error:", axiosError);
                
                if (axiosError.response) {
                    // Server responded with an error
                    const { status, data } = axiosError.response;
                    
                    if (status === 400) {
                        // 400 typically means incorrect current password
                        // Only show alert, don't set error state
                        alert("Le mot de passe actuel est incorrect");
                        // Return early to prevent the error from being displayed elsewhere
                        return;
                    } 
                    else if (status === 401) {
                        // 401 means unauthorized (token issues)
                        setError("Session expirée. Veuillez vous reconnecter");
                        alert("Session expirée. Vous allez être redirigé vers la page de connexion");
                        setTimeout(() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            router.push("/page-signin");
                        }, 2000);
                    }
                    else {
                        // Any other error
                        setError(data.message || "Une erreur est survenue lors du changement de mot de passe");
                    }
                } else {
                    setError("Impossible de communiquer avec le serveur");
                }
            }
        } catch (err) {
            console.error("Generic error:", err);
            setError("Une erreur inattendue s'est produite");
        }
    };

    // Fonction pour déterminer la couleur du statut de candidature
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'warning';
            case 'reviewing':
                return 'info';
            case 'interviewed':
                return 'primary';
            case 'accepted':
                return 'success';
            case 'rejected':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    // Récupérer les emplois postulés par l'utilisateur
    useEffect(() => {
        const fetchAppliedJobs = async () => {
            if (!userData || !userData._id) return;
            
            try {
                setLoadingJobs(true);
                const token = localStorage.getItem("token");
                
                if (!token) {
                    console.error("No token found");
                    return;
                }
                
                const response = await axios.get(
                    "http://localhost:5000/api/applications/user",
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.data) {
                    console.log("Applied jobs:", response.data);
                    setAppliedJobs(response.data);
                }
            } catch (error) {
                console.error("Error fetching applied jobs:", error);
            } finally {
                setLoadingJobs(false);
            }
        };
        
        if (activeIndex === 2) {
            fetchAppliedJobs();
        }
    }, [userData, activeIndex]);

    if (loading) {
        return (
            <Layout>
                <div className="container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!userData) {
        return (
            <Layout>
                <div className="container text-center py-5">
                    <h3>Please sign in to view your profile</h3>
                    <Link legacyBehavior href="/page-signin">
                        <a className="btn btn-primary mt-3">Sign In</a>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <>
            <Layout>
                {/* Verification Modal */}
                <Modal 
                    show={showVerificationModal} 
                    onHide={closeVerificationModal}
                    centered
                    size="lg"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Verify Your Profile</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="text-center mb-4">
                            <p>Profile verification helps employers trust your identity and increases your chances of getting hired.</p>
                        </div>
                        
                        {verificationError && (
                            <div className="alert alert-danger mb-3">
                                {verificationError}
                            </div>
                        )}
                        
                        {verificationSuccess ? (
                            <div className="text-center">
                                <div className="success-animation">
                                    <div className="checkmark">
                                        <svg className="checkmark_success" height="70" viewBox="0 0 48 48" width="70">
                                            <path fill="#43A047" d="M24 4C12.95 4 4 12.95 4 24c0 11.04 8.95 20 20 20 11.04 0 20-8.96 20-20 0-11.05-8.96-20-20-20zm-4 30L10 24l2.83-2.83L20 28.34l15.17-15.17L38 16 20 34z" />
                                        </svg>
                                    </div>
                                </div>
                                <h4 className="mt-3 mb-4">Verification Successful!</h4>
                                <p>Your profile has been verified. A verification badge will now appear on your profile.</p>
                            </div>
                        ) : verificationImage ? (
                            <div>
                                <div className="text-center mb-3">
                                    <img 
                                        src={verificationImage} 
                                        alt="Verification" 
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '300px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px'
                                        }} 
                                    />
                                </div>
                                <div className="d-flex justify-content-center mt-4">
                                    <button 
                                        className="btn btn-outline-secondary me-2" 
                                        onClick={() => {
                                            setVerificationImage(null);
                                            startCamera();
                                        }}
                                    >
                                        Retake
                                    </button>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={submitVerification}
                                        disabled={verifying}
                                    >
                                        {verifying ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Verifying...
                                            </>
                                        ) : "Submit for Verification"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="camera-container" style={{ 
                                    width: '100%', 
                                    height: '400px',
                                    position: 'relative',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '8px',
                                    overflow: 'hidden' 
                                }}>
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover' 
                                        }} 
                                    />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </div>
                                <div className="text-center mt-4">
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={captureImage}
                                    >
                                        Take Photo
                                    </button>
                                </div>
                                <div className="text-muted mt-3">
                                    <small>
                                        <i className="fi-rr-info me-1"></i>
                                        Please center your face in the frame and ensure good lighting for best results.
                                    </small>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                </Modal>

                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-image-single">
                                <img src="assets/imgs/page/candidates/img.png" alt="jobbox" />
                                <a className="btn-editor" href="#" />
                            </div>
                            <div className="box-company-profile">
                                <div className="image-compay" style={{ maxWidth: '120px', maxHeight: '120px', overflow: 'hidden' }}>
                                    {userData.profilePicture ? (
                                        <img 
                                            src={userData.profilePicture} 
                                            alt={userData.firstName} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <img 
                                            src="assets/imgs/page/candidates/candidate-profile.png" 
                                            alt="profile" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                                <div className="row mt-10">
                                    <div className="col-lg-8 col-md-12">
                                        <h5 className="f-18">
                                            {userData.firstName} {userData.lastName} 
                                            {userData.isVerified && (
                                                <span className="verified-badge ml-10" title="Verified Profile">
                                                    <i className="fi-rr-check-circle" style={{ 
                                                        color: '#0099ff',
                                                        fontSize: '18px',
                                                        marginRight: '5px',
                                                        verticalAlign: 'middle'
                                                    }}></i>
                                                    <span style={{
                                                        fontSize: '14px',
                                                        color: '#0099ff',
                                                        fontWeight: 'normal',
                                                        verticalAlign: 'middle'
                                                    }}>Verified</span>
                                                </span>
                                            )}
                                            <span className="card-location font-regular ml-20">
                                                {userData.location || "Location not specified"}
                                            </span>
                                        </h5>
                                        <p className="mt-0 font-md color-text-paragraph-2 mb-15">
                                            {userData.role || "User"} | {userData.email}
                                        </p>
                                    </div>
                                    <div className="col-lg-4 col-md-12 text-lg-end">
                                        {!userData.isVerified ? (
                                            <button 
                                                className="btn btn-success btn-default mr-15" 
                                                onClick={openVerificationModal}
                                            >
                                                <i className="fi-rr-user-check mr-5"></i>
                                                Verify Profile
                                            </button>
                                        ) : (
                                            <span className="badge bg-success-light text-success p-2 mr-15">
                                                <i className="fi-rr-check-circle mr-5"></i>
                                                Verified on {new Date(userData.verifiedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                        <Link legacyBehavior href="/page-contact">
                                            <a className="btn btn-preview-icon btn-apply btn-apply-big">Edit Profile</a>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="border-bottom pt-10 pb-10" />
                        </div>
                    </section>
                    <section className="section-box mt-50">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-3 col-md-4 col-sm-12">
                                    <div className="box-nav-tabs nav-tavs-profile mb-5">
                                        <ul className="nav" role="tablist">
                                            <li>
                                                <a className={`btn btn-border aboutus-icon mb-20 ${activeIndex === 1 ? 'active' : ''}`} onClick={() => handleOnClick(1)}>
                                                    My Profile
                                                </a>
                                            </li>
                                            <li>
                                                <a className={`btn btn-border recruitment-icon mb-20 ${activeIndex === 2 ? 'active' : ''}`} onClick={() => handleOnClick(2)}>
                                                    My Jobs
                                                </a>
                                            </li>
                                            <li>
                                                <a className={`btn btn-border people-icon mb-20 ${activeIndex === 3 ? 'active' : ''}`} onClick={() => handleOnClick(3)}>
                                                    Saved Jobs
                                                </a>
                                            </li>
                                        </ul>
                                        <div className="border-bottom pt-10 pb-10" />
                                        <div className="mt-20 mb-20">
                                            <Link legacyBehavior href="#">
                                                <a className="link-red">Delete Account</a>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-9 col-md-8 col-sm-12 col-12 mb-50">
                                    {error && (
                                        <div className="alert alert-danger mb-20" role="alert">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="alert alert-success mb-20" role="alert">
                                            {success}
                                        </div>
                                    )}
                                    <div className="content-single">
                                        <div className="tab-content">
                                            {/* Tab 1: My Profile */}
                                            <div className={`tab-pane fade ${activeIndex === 1 ? 'show active' : ''}`}>
                                                <h3 className="mt-0 mb-15 color-brand-1">My Account</h3>
                                                <Link legacyBehavior href="#">
                                                    <a className="font-md color-text-paragraph-2">Update your profile</a>
                                                </Link>

                                                <div className="mt-35 mb-40 box-info-profie">
                                                    <div className="image-profile" style={{position: 'relative'}}>
                                                        {userData.profilePicture ? (
                                                            <img src={userData.profilePicture} alt={userData.firstName} />
                                                        ) : (
                                                            <img src="assets/imgs/page/candidates/candidate-profile.png" alt="profile" />
                                                        )}
                                                        
                                                        <div className="upload-button" style={{
                                                            position: 'absolute',
                                                            bottom: '10px',
                                                            right: '10px',
                                                            background: 'rgba(0,0,0,0.5)',
                                                            borderRadius: '50%',
                                                            width: '40px',
                                                            height: '40px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}>
                                                            <label htmlFor="profile-upload" style={{cursor: 'pointer', margin: '0'}}>
                                                                <i className="fi-rr-camera" style={{color: 'white', fontSize: '18px'}}></i>
                                                            </label>
                                                            <input 
                                                                id="profile-upload" 
                                                                type="file" 
                                                                accept="image/*"
                                                                style={{display: 'none'}}
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        setSelectedFile(e.target.files[0]);
                                                                        handleProfilePictureUpload(e.target.files[0]);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {uploadingPhoto && (
                                                        <div className="text-center mt-3">
                                                            <div className="spinner-border text-primary" role="status">
                                                                <span className="visually-hidden">Uploading...</span>
                                                            </div>
                                                            <p className="text-muted mt-2">Uploading your photo...</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <form className="row form-contact" onSubmit={updateProfile}>
                                                    <div className="col-lg-6 col-md-12">
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">First Name *</label>
                                                            <input 
                                                                className="form-control" 
                                                                type="text" 
                                                                name="firstName"
                                                                value={profileForm.firstName}
                                                                onChange={handleProfileChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Last Name *</label>
                                                            <input 
                                                                className="form-control" 
                                                                type="text" 
                                                                name="lastName"
                                                                value={profileForm.lastName}
                                                                onChange={handleProfileChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Email *</label>
                                                            <input 
                                                                className="form-control" 
                                                                type="text" 
                                                                value={userData.email}
                                                                disabled
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Contact number</label>
                                                            <input 
                                                                className="form-control" 
                                                                type="text" 
                                                                name="phone"
                                                                value={profileForm.phone}
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Years of Experience</label>
                                                            <input 
                                                                className="form-control" 
                                                                type="number" 
                                                                min="0"
                                                                name="experienceYears"
                                                                value={profileForm.experienceYears}
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Projects (comma separated)</label>
                                                            <textarea 
                                                                className="form-control" 
                                                                rows={3} 
                                                                name="projectsText"
                                                                value={profileForm.projectsText || ""}
                                                                onChange={(e) => setProfileForm({...profileForm, projectsText: e.target.value})}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Education (comma separated)</label>
                                                            <textarea 
                                                                className="form-control" 
                                                                rows={3} 
                                                                name="educationText"
                                                                value={profileForm.educationText || ""}
                                                                onChange={(e) => setProfileForm({...profileForm, educationText: e.target.value})}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="font-sm color-text-mutted mb-10">Language Preferences (comma separated)</label>
                                                            <textarea 
                                                                className="form-control" 
                                                                rows={3} 
                                                                name="languagePreferences"
                                                                value={profileForm.languagePreferences ? profileForm.languagePreferences.join(", ") : ""}
                                                                onChange={(e) => {
                                                                    const languagesArray = e.target.value.split(",").map(item => item.trim());
                                                                    setProfileForm({...profileForm, languagePreferences: languagesArray});
                                                                }}
                                                            />
                                                        </div>
                                                        
                                                        <div className="mt-20">
                                                            <button type="submit" className="btn btn-apply-big font-md font-bold">Save Profile</button>
                                                        </div>
                                                        
                                                        <div className="border-bottom pt-10 pb-10 mb-30" />
                                                        <h6 className="color-orange mb-20">Change your password</h6>
                                                        <div className="row">
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">Current Password</label>
                                                                    <input 
                                                                        className="form-control" 
                                                                        type="password" 
                                                                        name="currentPassword"
                                                                        value={passwordForm.currentPassword}
                                                                        onChange={handlePasswordChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-6">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">New Password</label>
                                                                    <input 
                                                                        className="form-control" 
                                                                        type="password" 
                                                                        name="newPassword"
                                                                        value={passwordForm.newPassword}
                                                                        onChange={handlePasswordChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-12">
                                                                <div className="form-group">
                                                                    <label className="font-sm color-text-mutted mb-10">Confirm New Password</label>
                                                                    <input 
                                                                        className="form-control" 
                                                                        type="password" 
                                                                        name="confirmPassword"
                                                                        value={passwordForm.confirmPassword}
                                                                        onChange={handlePasswordChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="border-bottom pt-10 pb-10" />
                                                        
                                                        <div className="box-button mt-15">
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-outline btn-apply-big font-md font-bold ml-10"
                                                                onClick={changePassword}
                                                            >
                                                                Change Password
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-12">
                                                        <div className="box-skills">
                                                            <h5 className="mt-0 color-brand-1">Skills</h5>
                                                            <div className="form-contact">
                                                                <div className="form-group d-flex">
                                                                    <input 
                                                                        className="form-control search-icon" 
                                                                        type="text" 
                                                                        placeholder="E.g. Angular, Laravel..."
                                                                        value={newSkill}
                                                                        onChange={(e) => setNewSkill(e.target.value)}
                                                                        onKeyPress={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                handleAddSkill();
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-primary ml-10" 
                                                                        onClick={handleAddSkill}
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="box-tags mt-30">
                                                                {profileForm.skills && profileForm.skills.map((skill, index) => (
                                                                    <span key={index} className="btn btn-grey-small mr-10 mb-10">
                                                                        {skill}
                                                                        <i 
                                                                            className="fi-rr-cross small ml-5" 
                                                                            style={{cursor: 'pointer'}} 
                                                                            onClick={() => handleRemoveSkill(skill)}
                                                                        ></i>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="mt-40">
                                                                <span className="card-info font-sm color-text-paragraph-2">You can add up to 15 skills</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                            
                                            {/* Tab 2: My Jobs */}
                                            <div className={`tab-pane fade ${activeIndex === 2 ? 'show active' : ''}`}>
                                                <h3 className="mt-0 color-brand-1 mb-50">My Applied Jobs</h3>
                                                
                                                {loadingJobs ? (
                                                    <div className="text-center py-5">
                                                        <div className="spinner-border text-primary" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                        <p className="mt-2">Loading your applications...</p>
                                                    </div>
                                                ) : appliedJobs.length === 0 ? (
                                                    <div className="text-center py-5">
                                                        <div className="mb-20">
                                                            <img src="assets/imgs/page/candidates/no-data.png" alt="No applications" style={{ maxHeight: '150px' }} />
                                                        </div>
                                                        <h6 className="mb-20">You haven't applied to any jobs yet</h6>
                                                        <p className="mb-20">Start exploring available positions and apply to find your dream job</p>
                                                        <Link legacyBehavior href="/jobs-grid">
                                                            <a className="btn btn-default">Find Jobs</a>
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="row display-list">
                                                        {appliedJobs.map((application) => (
                                                            <div className="col-xl-12 col-12" key={application._id}>
                                                                <div className="card-grid-2 hover-up">
                                                                    <div className="row">
                                                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                                                            <div className="card-grid-2-image-left">
                                                                                <div className="image-box">
                                                                                    <img src="assets/imgs/brands/brand-1.png" alt="jobBox" />
                                                                                </div>
                                                                                <div className="right-info">
                                                                                    <Link legacyBehavior href={`/job-details?id=${application.job._id}`}>
                                                                                        <a className="name-job">{application.job.title}</a>
                                                                                    </Link>
                                                                                    <span className="location-small">{application.job.location}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-lg-6 col-md-6 col-sm-12 text-md-end">
                                                                            <div className="mt-4 mt-md-0">
                                                                                <span className={`btn btn-${getStatusColor(application.status)} btn-sm tags-link`}>{application.status}</span>
                                                                                <span className="card-text-price ml-10">
                                                                                    Applied on: {new Date(application.createdAt).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="card-block-info">
                                                                        <div className="mt-5">
                                                                            <span className="card-briefcase">{application.job.workplaceType}</span>
                                                                            <span className="card-time">
                                                                                <span>{application.job.salaryRange || 'Salary not specified'}</span>
                                                                            </span>
                                                                        </div>
                                                                        <p className="font-sm color-text-paragraph mt-10">
                                                                            {application.job.description && application.job.description.length > 150 
                                                                                ? `${application.job.description.substring(0, 150)}...` 
                                                                                : application.job.description}
                                                                        </p>
                                                                        <div className="card-2-bottom mt-20">
                                                                            <div className="row">
                                                                                <div className="col-lg-7 col-7">
                                                                                    <div className="mt-5">
                                                                                        {application.job.requirements && application.job.requirements.slice(0, 3).map((req, index) => (
                                                                                            <span className="btn btn-grey-small mr-5" key={index}>{req}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-lg-5 col-5 text-end">
                                                                                    <Link legacyBehavior href={`/job-details?id=${application.job._id}`}>
                                                                                        <a className="btn btn-apply-now">View Details</a>
                                                                                    </Link>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Tab 3: Saved Jobs */}
                                            <div className={`tab-pane fade ${activeIndex === 3 ? 'show active' : ''}`}>
                                                <h3 className="mt-0 color-brand-1 mb-50">Saved Jobs</h3>
                                                <div className="row">
                                                    {/* Contenu de l'onglet Saved Jobs */}
                                                </div>
                                                <div className="paginations">
                                                    {/* Pagination */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="section-box mt-50 mb-20">
                        <div className="container">
                            <div className="box-newsletter">
                                <div className="row">
                                    <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                        <img src="assets/imgs/template/newsletter-left.png" alt="joxBox" />
                                    </div>
                                    <div className="col-lg-12 col-xl-6 col-12">
                                        <h2 className="text-md-newsletter text-center">
                                            New Things Will Always
                                            <br /> Update Regularly
                                        </h2>
                                        <div className="box-form-newsletter mt-40">
                                            <form className="form-newsletter">
                                                <input className="input-newsletter" type="text" placeholder="Enter your email here" />
                                                <button className="btn btn-default font-heading icon-send-letter">Subscribe</button>
                                            </form>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-12 text-center d-none d-xl-block">
                                        <img src="assets/imgs/template/newsletter-right.png" alt="joxBox" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </Layout>
        </>
    );
}