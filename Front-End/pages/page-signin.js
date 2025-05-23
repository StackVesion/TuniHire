import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export default function Signin() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false
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
    const [rememberMeError, setRememberMeError] = useState('');


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
                console.error("Erreur de chargement des modèles :", err);
                setError("Impossible de charger les modèles de reconnaissance faciale.");
            }
        };

        loadModels();
    }, []);

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
            alert("Les modèles ne sont pas encore chargés.");
            return;
        }

        setFaceIdLoading(true);
        setFaceDetected(false);
        setError("");

        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) {
            setError("Impossible d'accéder à la webcam.");
            setFaceIdLoading(false);
            return;
        }
        

        try {
            const detections = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (!detections) {
                setError("Aucun visage détecté, veuillez essayer à nouveau.");
                setFaceIdLoading(false);
                return;
            }

            setFaceDescriptor(detections.descriptor);
            setFaceDetected(true);
            setFaceIdLoading(false);
            console.log("Face Descriptor capturé :", detections.descriptor);
        } catch (err) {
            console.error("Erreur de détection du visage :", err);
            setError("Impossible de détecter le visage. Essayez à nouveau.");
            setFaceIdLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
if (!formData.rememberMe) {
  setRememberMeError("Please check 'Remember me' before signing in.");
  return;
} else {
  setRememberMeError(""); // Clear if no error
}
        setLoading(true);
        setError("");

        try {
            console.log("Attempting sign in with:", formData.email);
            
            const response = await axios.post(
                "http://localhost:5000/api/users/signin", 
                {
                    email: formData.email,
                    password: formData.password,
                },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log("Sign-in response:", response.data);

            if (response.data.token) {
                // Store token
                const storage = formData.rememberMe ? localStorage : sessionStorage;
                storage.setItem("token", response.data.token);
                
                // Create a user object with necessary information
                const userData = {
                    userId: response.data.userId,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    email: response.data.email,
                    role: response.data.role
                };

                // Store user data
                storage.setItem("user", JSON.stringify(userData));
                console.log("User data stored:", userData);

                // Navigate to the same page or home page
                router.push(router.query.redirect || "/");
            } else {
                setError("Authentication failed: No token received");
                console.error("No token in response");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Sign-in failed";
            console.error("Sign-in failed:", errorMessage, error);
            setError(`Sign-in failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFaceLogin = async (e) => {
        if (e) e.preventDefault();
        
        if (!faceDescriptor) {
            setError("Veuillez d'abord capturer votre visage.");
            return;
        }

        setFaceIdLoading(true);
        setError("");

        const requestBody = {
            faceDescriptor: Array.from(faceDescriptor)
        };

        console.log("Sending face data for authentication...");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/users/signin/faceid", 
                requestBody, 
                { withCredentials: true }
            );
            
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                const userData = {
                    userId: response.data.userId,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    email: response.data.email,
                    role: response.data.role,
                    faceId: true
                };
                localStorage.setItem("user", JSON.stringify(userData));
                
                // Fermer la modal et rediriger
                setShowFaceIdModal(false);
                router.push(router.query.redirect || "/");
            }
        } catch (error) {
            console.error("Face ID login error:", error.response?.data?.message || error.message);
            setError(error.response?.data?.message || "Erreur d'authentification par Face ID.");
        } finally {
            setFaceIdLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:5000/auth/google";
    };

    const handleGitHubSignIn = () => {
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
                    <div className="row login-register-cover">
                        <div className="col-lg-6 col-md-8 col-sm-12 mx-auto">
                            <div className="card shadow-sm rounded-3 border-0">
                                <div className="card-body p-4 p-md-5">
                                    <div className="text-center mb-4">
                                        <img src="/assets/imgs/template/logo.svg" alt="TuniHire" className="mb-3" style={{ height: '60px' }} />
                                        <h2 className="mt-2 mb-2 text-brand-1 fw-bold">Welcome Back</h2>
                                        <p className="font-sm text-muted mb-4">Sign in to access your account and explore opportunities</p>
                                    </div>
                                    
                                    <div className="social-login-buttons d-flex flex-column gap-2 mb-4">
                                        <button onClick={handleGoogleSignIn} className="btn social-login hover-up d-flex align-items-center justify-content-center gap-2 py-3">
                                            <img src="/assets/imgs/template/icons/icon-google.svg" alt="Google" style={{ width: '20px' }} />
                                            <span>Continue with Google</span>
                                        </button>
                                        <button onClick={handleGitHubSignIn} className="btn social-login hover-up d-flex align-items-center justify-content-center gap-2 py-3">
                                            <img src="/assets/imgs/template/icons/icon-github.svg" alt="GitHub" style={{ width: '20px' }} />
                                            <span>Continue with GitHub</span>
                                        </button>
                                        <button 
                                            onClick={openFaceIdModal} 
                                            className="btn btn-primary hover-up d-flex align-items-center justify-content-center gap-2 py-3"
                                        >
                                            <i className="fas fa-user-circle"></i>
                                            <span>Sign in with Face ID</span>
                                        </button>
                                    </div>
                                    
                                    <div className="divider-text-center mb-4"><span>Or sign in with email</span></div>
                                    
                                    {error && !showFaceIdModal && (
                                        <div className="alert alert-danger" role="alert">
                                            {error}
                                        </div>
                                    )}
                                    
                                    <form className="login-register" onSubmit={handleSubmit}>
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
                                            />
                                            <div className="d-flex justify-content-end mt-2">
                                                <Link legacyBehavior href="/page-contact">
                                                    <a className="text-primary small">Forgot Password?</a>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="form-group mb-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    id="remember-me" 
                                                    name="rememberMe"
                                                    checked={formData.rememberMe}
                                                    onChange={handleChange}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '3px',
                                                        backgroundColor: formData.rememberMe ? '#0d6efd' : '#fff',
                                                        borderColor: '#0d6efd'
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor="remember-me">
                                                    Remember me
                                                </label>
                                            </div>
                                               {rememberMeError && (
                                        <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                                            {rememberMeError}
                                        </div>
                                        )}
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
                                                        Signing in...
                                                    </span>
                                                ) : (
                                                    "Sign In"
                                                )}
                                            </button>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-sm text-muted mb-0">
                                                Don't have an account? 
                                                <Link legacyBehavior href="/page-register">
                                                    <a className="text-primary ms-1">Sign up</a>
                                                </Link>
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            
            {/* Modal Face ID */}
            {showFaceIdModal && (
                <div className="modal-faceid">
                    <div className="modal-faceid-content">
                        <div className="modal-faceid-header">
                            <h5 className="modal-title">Face ID Authentication</h5>
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
                                <p>Position your face in front of the camera to sign in</p>
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
                                onClick={handleFaceLogin}
                                disabled={!faceDetected || faceIdLoading}
                            >
                                {faceIdLoading ? (
                                    <span>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Signing in...
                                    </span>
                                ) : (
                                    "Sign in with Face ID"
                                )}
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
                .form-check-input:checked {
                    background-color: #0d6efd !important;
                    border-color: #0d6efd !important;
                }
                .form-check-input:focus {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
            `}</style>
        </Layout>
    );
}
