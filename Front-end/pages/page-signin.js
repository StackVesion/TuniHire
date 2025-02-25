/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout/Layout";
import Link from "next/link";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

export default function Signin() {
    const [formData, setFormData] = useState({ emailOrUsername: "", password: "" });
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const webcamRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        };
        loadModels();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const captureFace = async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        const img = new Image();
        img.src = imageSrc;

        img.onload = async () => {
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (!detections) {
                alert("No face detected");
                return;
            }
            setFaceDescriptor(detections.descriptor);
        };
    };

    const handleEmailPasswordSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/users/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.emailOrUsername,
                    password: formData.password,
                }),
            });

            if (response.ok) {
                alert("Sign-in successful");
                router.push("/index-2");
            } else {
                const errorData = await response.json();
                alert(errorData.message);
            }
        } catch (error) {
            console.error("Error during email/password sign-in:", error);
            alert("Failed to sign in with email and password. Please try again.");
        }
    };

    const handleFaceIdSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/users/signInWithFaceId", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ faceDescriptor }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Logged in user:", data.email);  // Log the user's email
                alert("Sign-in successful");
                router.push("/index-2");
            } else {
                const errorData = await response.json();
                alert(errorData.message);
            }
        } catch (error) {
            console.error("Error during Face ID sign-in:", error);
            alert("Failed to sign in with Face ID. Please try again.");
        }
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
                            </div>
                            <form className="login-register text-start mt-20" onSubmit={handleEmailPasswordSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Username or Email *</label>
                                    <input className="form-control" type="text" required name="emailOrUsername" placeholder="Steven Job" value={formData.emailOrUsername} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input className="form-control" type="password" required name="password" placeholder="************" value={formData.password} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <button className="btn btn-brand-1 hover-up w-100" type="submit">Login</button>
                                </div>
                            </form>
                            <div className="divider-text-center mt-4">
                                <span>Or sign in with Face ID</span>
                            </div>
                            <form className="login-register text-start mt-20" onSubmit={handleFaceIdSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Face ID</label>
                                    <Webcam ref={webcamRef} screenshotFormat="image/png" width="100%" />
                                    <button type="button" className="btn btn-secondary mt-2" onClick={captureFace}>
                                        Capture Face
                                    </button>
                                </div>
                                <div className="form-group">
                                    <button className="btn btn-brand-1 hover-up w-100" type="submit">Login with Face ID</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
