import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import VerificationMessage from '../components/VerificationMessage';

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        rePassword: "",
        role: "jobseeker", // Default role is jobseeker
        terms: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const webcamRef = useRef(null);
    const router = useRouter();
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [showFaceIdModal, setShowFaceIdModal] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceIdLoading, setFaceIdLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState("");
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    useEffect(() => {
        const loadModels = async () => {
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelLoaded(true);
                console.log("Face recognition models loaded successfully");
            } catch (err) {
                console.error("Error loading models:", err);
                setError("Unable to load face recognition models.");
            }
        };

        loadModels();
    }, []);

    // Password strength checker
    useEffect(() => {
        if (formData.password) {
            const hasLowerCase = /[a-z]/.test(formData.password);
            const hasUpperCase = /[A-Z]/.test(formData.password);
            const hasNumber = /\d/.test(formData.password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
            const isLongEnough = formData.password.length >= 8;
            
            let strength = 0;
            if (hasLowerCase) strength += 1;
            if (hasUpperCase) strength += 1;
            if (hasNumber) strength += 1;
            if (hasSpecialChar) strength += 1;
            if (isLongEnough) strength += 1;
            
            setPasswordStrength(strength);
            
            if (strength < 3) {
                setPasswordFeedback("Weak password. Add uppercase, numbers, or special characters.");
            } else if (strength < 5) {
                setPasswordFeedback("Medium strength. Add more variety for a stronger password.");
            } else {
                setPasswordFeedback("Strong password!");
            }
        } else {
            setPasswordStrength(0);
            setPasswordFeedback("");
        }
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
        
        // Clear any previous error message when user starts typing
        if (error) setError("");
    };

    const captureFace = async () => {
        if (!webcamRef.current || !isModelLoaded) {
            alert("Models are not loaded yet.");
            return;
        }

        setFaceIdLoading(true);
        setFaceDetected(false);
        setError("");

        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) {
            setError("Unable to access webcam.");
            setFaceIdLoading(false);
            return;
        }

        try {
            const detections = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (!detections) {
                setError("No face detected, please try again.");
                setFaceIdLoading(false);
                return;
            }

            setFaceDescriptor(detections.descriptor);
            setFaceDetected(true);
            setFaceIdLoading(false);
            console.log("Face Descriptor captured:", detections.descriptor);
        } catch (err) {
            console.error("Face detection error:", err);
            setError("Unable to detect face. Try again.");
            setFaceIdLoading(false);
        }
    };

    const validateForm = () => {
        if (formData.password !== formData.rePassword) {
            setError("Passwords do not match");
            return false;
        }
        
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }
        
        if (!formData.terms) {
            setError("You must agree to the terms and conditions");
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError("");

        // Ensure all required fields are included
        const userData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            rePassword: formData.rePassword,
            role: formData.role || "jobseeker" // Ensure role is always set
        };

        // NEVER send face descriptor data unless explicitly captured and detected
        // This prevents MongoDB duplicate key errors
        if (faceDescriptor && faceDetected && Array.isArray(faceDescriptor) && faceDescriptor.length > 0) {
            // Only include face data if we have explicitly captured a face
            userData.faceDescriptor = Array.from(faceDescriptor);
            console.log("Including face descriptor in registration data");
        } else {
            // Make sure we're not sending any face-related data
            console.log("No face data included in registration");
            // Explicitly delete these properties to ensure they're not sent
            delete userData.faceDescriptor;
            delete userData.faceId;
        }
        
        console.log("Complete registration data:", { ...userData, password: "[REDACTED]", rePassword: "[REDACTED]" });

        try {
            console.log("Registering user with data:", { ...userData, password: "[REDACTED]" });
            
            const response = await axios.post(
                "http://localhost:5000/api/users/signup", 
                userData,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log("Registration response:", response.data);

            if (response.data.success) {
                setRegisteredEmail(formData.email);
                setShowVerification(true);
            } else {
                setError(response.data.message || "Registration failed");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Registration failed";
            console.error("Registration failed:", errorMessage, error);
            setError(`Registration failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        window.location.href = "http://localhost:5000/auth/google";
    };

    const handleGitHubSignUp = () => {
        window.location.href = "http://localhost:5000/auth/github";
    };
    
    const openFaceIdModal = () => {
        setShowFaceIdModal(true);
        setFaceDetected(false);
        setFaceDescriptor(null);
        setError("");
    };
    
    const closeFaceIdModal = () => {
        setShowFaceIdModal(false);
    };

    return (
        <Layout>
            <section className="pt-100 login-register">
                <div className="container">
                    {!showVerification ? (
                        <div className="row login-register-cover">
                            <div className="col-lg-6 col-md-8 col-sm-12 mx-auto">
                                <div className="card shadow-sm rounded-3 border-0">
                                    <div className="card-body p-4 p-md-5">
                                        <div className="text-center mb-4">
                                            <img src="/assets/imgs/template/logo.svg" alt="TuniHire" className="mb-3" style={{ height: '60px' }} />
                                            <h2 className="mt-2 mb-2 text-brand-1 fw-bold">Create an Account</h2>
                                            <p className="font-sm text-muted mb-4">Join TuniHire and discover new opportunities</p>
                                        </div>
                                        
                                        <div className="social-login-buttons d-flex flex-column gap-2 mb-4">
                                            <button onClick={handleGoogleSignUp} className="btn social-login hover-up d-flex align-items-center justify-content-center gap-2 py-3">
                                                <img src="/assets/imgs/template/icons/icon-google.svg" alt="Google" style={{ width: '20px' }} />
                                                <span>Continue with Google</span>
                                            </button>
                                            <button onClick={handleGitHubSignUp} className="btn social-login hover-up d-flex align-items-center justify-content-center gap-2 py-3">
                                                <img src="/assets/imgs/template/icons/icon-github.svg" alt="GitHub" style={{ width: '20px' }} />
                                                <span>Continue with GitHub</span>
                                            </button>
                                            <button 
                                                onClick={openFaceIdModal} 
                                                className="btn btn-primary hover-up d-flex align-items-center justify-content-center gap-2 py-3"
                                            >
                                                <i className="fas fa-user-circle"></i>
                                                <span>Add Face ID</span>
                                            </button>
                                        </div>
                                        
                                        <div className="divider-text-center mb-4"><span>Or register with email</span></div>
                                        
                                        {error && !showFaceIdModal && (
                                            <div className="alert alert-danger" role="alert">
                                                {error}
                                            </div>
                                        )}
                                        
                                        {faceDetected && !showFaceIdModal && (
                                            <div className="alert alert-success" role="alert">
                                                <i className="fas fa-check-circle me-2"></i>
                                                Face ID has been added to your account
                                            </div>
                                        )}
                                        
                                        <form className="login-register" onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="form-label fw-medium" htmlFor="input-firstname">
                                                            First Name
                                                        </label>
                                                        <input
                                                            className="form-control form-control-lg"
                                                            id="input-firstname"
                                                            type="text"
                                                            required
                                                            name="firstName"
                                                            placeholder="John"
                                                            value={formData.firstName}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <div className="form-group">
                                                        <label className="form-label fw-medium" htmlFor="input-lastname">
                                                            Last Name
                                                        </label>
                                                        <input
                                                            className="form-control form-control-lg"
                                                            id="input-lastname"
                                                            type="text"
                                                            required
                                                            name="lastName"
                                                            placeholder="Doe"
                                                            value={formData.lastName}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group mb-3">
                                                <label className="form-label fw-medium" htmlFor="input-email">
                                                    Email address
                                                </label>
                                                <input
                                                    className="form-control form-control-lg"
                                                    id="input-email"
                                                    type="email"
                                                    required
                                                    name="email"
                                                    placeholder="example@domain.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            
                                            <div className="form-group mb-3">
                                                <label className="form-label fw-medium" htmlFor="input-password">
                                                    Password
                                                </label>
                                                <input
                                                    className="form-control form-control-lg"
                                                    id="input-password"
                                                    type="password"
                                                    required
                                                    name="password"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    autoComplete="new-password"
                                                />
                                                {formData.password && (
                                                    <div className="mt-2">
                                                        <div className="password-strength-meter">
                                                            <div className="progress" style={{ height: '8px' }}>
                                                                <div 
                                                                    className={`progress-bar ${
                                                                        passwordStrength < 3 ? 'bg-danger' : 
                                                                        passwordStrength < 5 ? 'bg-warning' : 'bg-success'
                                                                    }`} 
                                                                    role="progressbar" 
                                                                    style={{ width: `${passwordStrength * 20}%` }} 
                                                                    aria-valuenow={passwordStrength * 20} 
                                                                    aria-valuemin="0" 
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                            <small className="text-muted mt-1 d-block">{passwordFeedback}</small>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="form-group mb-3">
                                                <label className="form-label fw-medium" htmlFor="input-confirm-password">
                                                    Confirm Password
                                                </label>
                                                <input
                                                    className="form-control form-control-lg"
                                                    id="input-confirm-password"
                                                    type="password"
                                                    required
                                                    name="rePassword"
                                                    placeholder="••••••••"
                                                    value={formData.rePassword}
                                                    onChange={handleChange}
                                                    autoComplete="new-password"
                                                />
                                                {formData.password && formData.rePassword && 
                                                 formData.password !== formData.rePassword && (
                                                    <small className="text-danger mt-1 d-block">Passwords do not match</small>
                                                )}
                                            </div>
                                            

                                            
                                            <div className="form-group mb-4">
                                                <div className="form-check">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        id="terms" 
                                                        name="terms"
                                                        checked={formData.terms}
                                                        onChange={handleChange}
                                                        required
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '3px',
                                                            backgroundColor: formData.terms ? '#0d6efd' : '#fff',
                                                            borderColor: '#0d6efd'
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor="terms">
                                                        I agree to the <Link legacyBehavior href="/terms"><a className="text-primary">Terms & Conditions</a></Link>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group mb-4">
                                                <button 
                                                    className="btn btn-primary hover-up w-100 py-3" 
                                                    type="submit" 
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <span>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            Creating Account...
                                                        </span>
                                                    ) : (
                                                        "Create Account"
                                                    )}
                                                </button>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="font-sm text-muted mb-0">
                                                    Already have an account? 
                                                    <Link legacyBehavior href="/page-signin">
                                                        <a className="text-primary ms-1">Sign in</a>
                                                    </Link>
                                                </p>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="row justify-content-center">
                            <div className="col-lg-6 col-md-8">
                                <VerificationMessage email={registeredEmail} />
                            </div>
                        </div>
                    )}
                </div>
            </section>
            
            {/* Modal Face ID */}
            {showFaceIdModal && (
                <div className="modal-faceid">
                    <div className="modal-faceid-content">
                        <div className="modal-faceid-header">
                            <h5 className="modal-title">Add Face ID</h5>
                            <button type="button" className="close" onClick={closeFaceIdModal}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-faceid-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <div className="text-center mb-4">
                                <p>Position your face in front of the camera to set up Face ID</p>
                            </div>
                            <div className="webcam-container">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    width="100%"
                                    height={240}
                                    style={{ 
                                        borderRadius: '8px',
                                        border: faceDetected ? '3px solid green' : '3px solid #ddd'
                                    }}
                                />
                            </div>
                            <div className="d-flex justify-content-center mt-3 mb-3">
                                <button 
                                    className="btn btn-primary me-2" 
                                    onClick={captureFace}
                                    disabled={faceIdLoading}
                                >
                                    {faceIdLoading ? (
                                        <span>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Detecting...
                                        </span>
                                    ) : (
                                        "Capture Face"
                                    )}
                                </button>
                            </div>
                            {faceDetected && (
                                <div className="text-center mb-3">
                                    <div className="alert alert-success">
                                        <i className="fas fa-check-circle me-2"></i>
                                        Face detected successfully
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-faceid-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary me-2" 
                                onClick={closeFaceIdModal}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={closeFaceIdModal}
                                disabled={!faceDetected}
                            >
                                Add Face ID
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .modal-faceid {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-faceid-content {
                    background-color: white;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    position: relative;
                }
                .modal-faceid-header {
                    padding: 15px 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-faceid-body {
                    padding: 20px;
                }
                .modal-faceid-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: flex-end;
                }
                .close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .webcam-container {
                    border-radius: 8px;
                    overflow: hidden;
                }
                .divider-text-center {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: #6c757d;
                }
                .divider-text-center::before,
                .divider-text-center::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid #dee2e6;
                }
                .divider-text-center::before {
                    margin-right: 1rem;
                }
                .divider-text-center::after {
                    margin-left: 1rem;
                }
                .social-login {
                    border: 1px solid #dee2e6;
                    background-color: #fff;
                    transition: all 0.3s ease;
                }
                .social-login:hover {
                    background-color: #f8f9fa;
                    transform: translateY(-3px);
                }
            `}</style>
        </Layout>
    );
}
