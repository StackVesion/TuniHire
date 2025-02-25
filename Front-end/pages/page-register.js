import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

export default function Register() {
    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        username: "",
        password: "",
        rePassword: "",
    });
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
        setFormData({
            ...formData,
            [name]: value,
        });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.rePassword) {
            alert("Passwords do not match");
            return;
        }

        const requestBody = {
            fullname: formData.fullname,
            email: formData.email,
            username: formData.username,
            password: formData.password,
        };

        if (faceDescriptor) {
            requestBody.faceDescriptor = Array.from(faceDescriptor); // Convert to simple array
        }

        try {
            const response = await fetch("http://localhost:5000/api/users/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration error");
            }

            alert("Registration successful");
            router.push("/page-signin");

        } catch (error) {
            console.error("Registration error:", error);
            alert(error.message);
        }
    };

    return (
        <Layout>
            <section className="pt-100 login-register">
                <div className="container">
                    <div className="row login-register-cover">
                        <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                            <div className="text-center">
                                <p className="font-sm text-brand-2">Register</p>
                                <h2 className="mt-10 mb-5 text-brand-1">Start for free Today</h2>
                                <p className="font-sm text-muted mb-30">Access to all features. No credit card required.</p>
                                <button className="btn social-login hover-up mb-20">
                                    <img src="assets/imgs/template/icons/icon-google.svg" alt="jobbox" />
                                    <strong>Sign up with Google</strong>
                                </button>
                                <div className="divider-text-center">
                                    <span>Or continue with</span>
                                </div>
                            </div>
                            <form className="login-register text-start mt-20" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-1">
                                        Full Name *
                                    </label>
                                    <input className="form-control" id="input-1" type="text" required name="fullname" placeholder="Steven Job" value={formData.fullname} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-2">
                                        Email *
                                    </label>
                                    <input className="form-control" id="input-2" type="email" required name="email" placeholder="stevenjob@gmail.com" value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-3">
                                        Username *
                                    </label>
                                    <input className="form-control" id="input-3" type="text" required name="username" placeholder="stevenjob" value={formData.username} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-4">
                                        Password *
                                    </label>
                                    <input className="form-control" id="input-4" type="password" required name="password" placeholder="************" value={formData.password} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-5">
                                        Re-Password *
                                    </label>
                                    <input className="form-control" id="input-5" type="password" required name="rePassword" placeholder="************" value={formData.rePassword} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Face ID</label>
                                    <Webcam ref={webcamRef} screenshotFormat="image/png" width="100%" />
                                    <button type="button" className="btn btn-secondary mt-2" onClick={captureFace}>
                                        Capture Face
                                    </button>
                                </div>
                                <div className="login_footer form-group d-flex justify-content-between">
                                    <label className="cb-container">
                                        <input type="checkbox" />
                                        <span className="text-small">Agree our terms and policy</span>
                                        <span className="checkmark" />
                                    </label>
                                    <Link legacyBehavior href="/page-contact">
                                        <a className="text-muted">Learn more</a>
                                    </Link>
                                </div>
                                <div className="form-group">
                                    <button className="btn btn-brand-1 hover-up w-100" type="submit" name="login">
                                        Submit &amp; Register
                                    </button>
                                </div>
                                <div className="text-muted text-center">
                                    Already have an account?
                                    <Link legacyBehavior href="/page-signin">
                                        <a>Sign in</a>
                                    </Link>
                                </div>
                            </form>
                        </div>
                        <div className="img-1 d-none d-lg-block">
                            <img className="shape-1" src="assets/imgs/page/login-register/img-1.svg" alt="JobBox" />
                        </div>
                        <div className="img-2">
                            <img src="assets/imgs/page/login-register/img-2.svg" alt="JobBox" />
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
