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
    });

    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [useFaceId, setUseFaceId] = useState(false);
    const webcamRef = useRef(null);
    const [error, setError] = useState("");
    const router = useRouter();
    const [isModelLoaded, setIsModelLoaded] = useState(false);
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
            } catch (err) {
                console.error("Erreur de chargement des modèles :", err);
                setError("Impossible de charger les modèles de reconnaissance faciale.");
            }
        };

        loadModels();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const captureFace = async () => {
        if (!webcamRef.current || !isModelLoaded) {
            alert("Les modèles ne sont pas encore chargés.");
            return;
        }

        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) {
            alert("Impossible d'accéder à la webcam.");
            return;
        }

        try {
            const detections = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (!detections) {
                alert("Aucun visage détecté, veuillez essayer à nouveau.");
                return;
            }

            setFaceDescriptor(detections.descriptor);
            console.log("Face Descriptor capturé :", detections.descriptor);
            alert("Visage capturé avec succès !");
        } catch (err) {
            console.error("Erreur de détection du visage :", err);
            setError("Impossible de détecter le visage. Essayez à nouveau.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Réinitialiser l'erreur

        if (formData.password !== formData.rePassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        // Vérification du Face ID seulement si l'option est activée
        if (useFaceId && !faceDescriptor) {
            setError("Vous avez activé Face ID mais n'avez pas capturé votre visage. Veuillez le capturer ou désactiver l'option Face ID.");
            return;
        }

        const requestBody = {
            ...formData,
            faceDescriptor: useFaceId && faceDescriptor ? Array.from(faceDescriptor) : undefined
        };

        console.log("📤 Données envoyées :", requestBody);

        try {
            const response = await axios.post("http://localhost:5000/api/users/signup", requestBody);
            setRegisteredEmail(formData.email);
            setShowVerification(true);
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            }
        } catch (error) {
            console.error("Erreur d'inscription :", error.response?.data?.message || error.message);
            setError(error.response?.data?.message || "Une erreur s'est produite.");
        }
    };
    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:5000/auth/google";
    };

    const handleGitHubSignIn = () => {
        window.location.href = "http://localhost:5000/auth/github";
    };  

    return (
        <Layout>
             <section className="pt-100 login-register">
                    <div className="container">
                    {!showVerification ? (
                        <div className="row login-register-cover">
                            <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                <div className="text-center">
                                    <p className="font-sm text-brand-2">Register </p>
                                    <h2 className="mt-10 mb-5 text-brand-1">Start for free Today</h2>
                                    <p className="font-sm text-muted mb-30">Access to all features. No credit card required.</p>
                                    <button className="btn social-login hover-up mb-20" onClick={handleGoogleSignIn}>
                                        <img src="assets/imgs/template/icons/icon-google.svg" alt="jobbox" />
                                        <strong>Sign up with Google</strong>
                                    </button>
                                    <button className="btn social-login hover-up mb-20" onClick={handleGitHubSignIn}>
                                        <img src="assets/imgs/template/icons/icon-github.svg" alt="jobbox" />
                                        <strong>Sign up with GitHub</strong>
                                    </button>
                                    <div className="divider-text-center">
                                        <span>Or continue with</span>
                                    </div>
                                </div>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <form className="login-register text-start mt-20" onSubmit={handleSubmit}>
                                {["firstName", "lastName", "email", "password", "rePassword"].map((field, index) => (
                                    <div className="form-group" key={index}>
                                        <label className="form-label">{field.replace(/([A-Z])/g, ' $1').trim()} *</label>
                                        <input 
                                            className="form-control" 
                                            type={field.includes("password") ? "password" : "text"} 
                                            required 
                                            name={field} 
                                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)} 
                                            value={formData[field]} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                ))}
                                <div className="form-group">
                                    <label className="form-label d-flex align-items-center">
                                        <input 
                                            type="checkbox" 
                                            className="me-2" 
                                            checked={useFaceId}
                                            onChange={(e) => setUseFaceId(e.target.checked)}
                                        />
                                        Activer Face ID (optionnel)
                                    </label>
                                </div>
                                {useFaceId && (
                                    <div className="form-group">
                                        <label className="form-label">Face ID</label>
                                        <Webcam ref={webcamRef} screenshotFormat="image/png" width="100%" />
                                        <button type="button" className="btn btn-secondary mt-2" onClick={captureFace}>
                                            Capture Face
                                        </button>
                                        {faceDescriptor && (
                                            <div className="alert alert-success mt-2">
                                                <i className="fas fa-check-circle me-2"></i>
                                                Visage capturé avec succès!
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="form-group">
                                    <button className="btn btn-brand-1 hover-up w-100" type="submit">
                                        Submit & Register
                                    </button>
                                </div>
                            </form>
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
         </Layout>
    );
}
