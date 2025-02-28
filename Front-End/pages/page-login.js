import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const webcamRef = useRef(null);
    const router = useRouter();
    const [isModelLoaded, setIsModelLoaded] = useState(false);

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
        if (name === "email") setEmail(value);
        if (name === "password") setPassword(value);
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Réinitialiser l'erreur

        if (!faceDescriptor) {
            setError("Veuillez capturer votre visage avant de soumettre.");
            return;
        }

        const requestBody = {
            email,
            password,
            faceDescriptor: faceDescriptor ? Array.from(faceDescriptor) : undefined // ✅ Supprime faceDescriptor si null
        };

        console.log("📤 Données envoyées :", requestBody);

        try {
            const response = await axios.post("http://localhost:5000/api/users/signin", requestBody);
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Erreur de connexion :", error.response?.data?.message || error.message);
            setError(error.response?.data?.message || "Une erreur s'est produite.");
        }
    };

    return (
        <Layout>
            <section className="pt-100 login-register">
                <div className="container">
                    <div className="row login-register-cover">
                        <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                            <div className="text-center">
                                <p className="font-sm text-brand-2">Login</p>
                                <h2 className="mt-10 mb-5 text-brand-1">Welcome Back</h2>
                                <p className="font-sm text-muted mb-30">Access to all features. No credit card required.</p>
                            </div>
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <form className="login-register text-start mt-20" onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input 
                                        className="form-control" 
                                        type="email" 
                                        required 
                                        name="email" 
                                        placeholder="Email" 
                                        value={email} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input 
                                        className="form-control" 
                                        type="password" 
                                        required 
                                        name="password" 
                                        placeholder="Password" 
                                        value={password} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Face ID</label>
                                    <Webcam ref={webcamRef} screenshotFormat="image/png" width="100%" />
                                    <button type="button" className="btn btn-secondary mt-2" onClick={captureFace}>
                                        Capture Face
                                    </button>
                                </div>
                                <div className="form-group">
                                    <button className="btn btn-brand-1 hover-up w-100" type="submit">
                                        Login
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
