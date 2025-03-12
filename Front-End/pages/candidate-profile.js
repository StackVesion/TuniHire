import Link from "next/link";
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useRouter } from "next/router";
import axios from "axios";

export default function CandidateProfile() {
    const [activeIndex, setActiveIndex] = useState(1);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
                <div>
                    <section className="section-box-2">
                        <div className="container">
                            <div className="banner-hero banner-image-single">
                                <img src="assets/imgs/page/candidates/img.png" alt="jobbox" />
                                <a className="btn-editor" href="#" />
                            </div>
                            <div className="box-company-profile">
                                <div className="image-compay">
                                    {userData.profilePicture ? (
                                        <img src={userData.profilePicture} alt={userData.firstName} />
                                    ) : (
                                        <img src="assets/imgs/page/candidates/candidate-profile.png" alt="profile" />
                                    )}
                                </div>
                                <div className="row mt-10">
                                    <div className="col-lg-8 col-md-12">
                                        <h5 className="f-18">
                                            {userData.firstName} {userData.lastName} 
                                            <span className="card-location font-regular ml-20">
                                                {userData.location || "Location not specified"}
                                            </span>
                                        </h5>
                                        <p className="mt-0 font-md color-text-paragraph-2 mb-15">
                                            {userData.role || "User"} | {userData.email}
                                        </p>
                                    </div>
                                    <div className="col-lg-4 col-md-12 text-lg-end">
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
                                                    <div className="image-profile">
                                                        {userData.profilePicture ? (
                                                            <img src={userData.profilePicture} alt={userData.firstName} />
                                                        ) : (
                                                            <img src="assets/imgs/page/candidates/candidate-profile.png" alt="profile" />
                                                        )}
                                                    </div>
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
                                                <h3 className="mt-0 color-brand-1 mb-50">My Jobs</h3>
                                                <div className="row display-list">
                                                    {/* Contenu de l'onglet My Jobs */}
                                                </div>
                                                <div className="paginations">
                                                    {/* Pagination */}
                                                </div>
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