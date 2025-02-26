import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Signin() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear any previous error message when user starts typing
        if (error) setError("");
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

                // Navigate to home page
                router.push("/");
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

    const handleGoogleSignIn = () => {
        window.location.href = "http://localhost:5000/auth/google";
    };

    const handleGitHubSignIn = () => {
        window.location.href = "http://localhost:5000/auth/github";
    };

    return (
        <>
            <Layout>
                <section className="pt-100 login-register">
                    <div className="container">
                        <div className="row login-register-cover">
                            <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                <div className="text-center">
                                    <p className="font-sm text-brand-2">Welcome back! </p>
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
                                            <a>Sign up</a>
                                        </Link>
                                    </div>
                                </form>
                            </div>
                            <div className="img-1 d-none d-lg-block">
                                <img className="shape-1" src="assets/imgs/page/login-register/img-4.svg" alt="JobBox" />
                            </div>
                            <div className="img-2">
                                <img src="assets/imgs/page/login-register/img-3.svg" alt="JobBox" />
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        </>
    );
}