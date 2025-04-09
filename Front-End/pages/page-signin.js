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
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                localStorage.setItem("token", response.data.token);
                
                // Create a user object with necessary information
                const userData = {
                    userId: response.data.userId,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    email: response.data.email,
                    role: response.data.role
                };

                // Store user data
                localStorage.setItem("user", JSON.stringify(userData));
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
                        <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                            <div className="text-center">
                                <p className="font-sm text-brand-2">Welcome back!</p>
                                <h2 className="mt-10 mb-5 text-brand-1">Member Login</h2>
                                <p className="font-sm text-muted mb-30">Access to all features. No credit card required.</p>
                                <button className="btn social-login hover-up mb-20" onClick={handleGoogleSignIn}>
                                    <img src="assets/imgs/template/icons/icon-google.svg" alt="jobbox" />
                                    <strong>Sign in with Google</strong>
                                </button>
                                <button className="btn social-login hover-up mb-20" onClick={handleGitHubSignIn}>
                                    <img src="assets/imgs/template/icons/icon-github.svg" alt="jobbox" />
                                    <strong>Sign in with GitHub</strong>
                                </button>
                                <button 
                                    className="btn social-login hover-up mb-20"
                                    onClick={openFaceIdModal}
                                    style={{ background: "#007bff", color: "white" }}
                                >
                                    <i className="fas fa-user-circle mr-5"></i>
                                    <strong>Sign in with Face ID</strong>
                                </button>
                                <div className="divider-text-center">
                                    <span>Or continue with</span>
                                </div>
                            </div>
                            {error && !showFaceIdModal && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <form className="login-register text-start mt-20" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-1">
                                        Email address *
                                    </label>
                                    <input
                                        className="form-control"
                                        id="input-1"
                                        type="email"
                                        required
                                        name="email"
                                        placeholder="stevenjob@gmail.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-4">
                                        Password *
                                    </label>
                                    <input
                                        className="form-control"
                                        id="input-4"
                                        type="password"
                                        required
                                        name="password"
                                        placeholder="************"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="login_footer form-group d-flex justify-content-between">
                                    <label className="cb-container">
                                        <input type="checkbox" />
                                        <span className="text-small">Remember me</span>
                                        <span className="checkmark" />
                                    </label>
                                    <Link legacyBehavior href="/page-contact">
                                        <a className="text-muted">Forgot Password</a>
                                    </Link>
                                </div>
                                <div className="form-group">
                                    <button 
                                        className="btn btn-brand-1 hover-up w-100" 
                                        type="submit" 
                                        name="login"
                                        disabled={loading}
                                    >
                                        {loading ? "Signing in..." : "Login"}
                                    </button>
                                </div>
                                <div className="text-muted text-center">
                                    Don't have an Account?
                                    <Link legacyBehavior href="/page-register">
                                        <a> Sign up</a>
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Modal Face ID */}
            {showFaceIdModal && (
                <div className="modal-faceid">
                    <div className="modal-faceid-content">
                        <div className="modal-faceid-header">
                            <h5 className="modal-title">Connexion par Face ID</h5>
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
                                <p>Placez votre visage devant la caméra pour vous connecter</p>
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
                                            Détection...
                                        </span>
                                    ) : (
                                        "Capturer le visage"
                                    )}
                                </button>
                            </div>
                            {faceDetected && (
                                <div className="text-center mb-3">
                                    <div className="alert alert-success">
                                        <i className="fas fa-check-circle me-2"></i>
                                        Visage détecté avec succès
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
                                Annuler
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
                                        Connexion...
                                    </span>
                                ) : (
                                    "Se connecter avec Face ID"
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
            `}</style>
        </Layout>
    );
}