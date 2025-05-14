import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import { saveUserData, getCurrentUser } from "../utils/authUtils"

// Detect if we're running in a production environment
const isProduction = process.env.NODE_ENV === 'production';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isProduction ? 'https://tunihire-0fx9.onrender.com' : 'http://localhost:5000');
// Use the vercel URL for frontend redirections in production, localhost in development
const apiUrll = process.env.NEXT_PUBLIC_FRONT_API_URL || (isProduction ? 'https://tunihire-front-end.vercel.app' : 'http://localhost:3000');

// Debug information
console.log('Environment:', process.env.NODE_ENV);
console.log('API URLs:', { apiUrl, apiUrll });

export default function Login() {
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    
    // Check if user is already logged in
    useEffect(() => {        // Check if token is provided in URL for automatic login
        const { token } = router.query;
        
        console.log('Login page loaded with query params:', router.query);
        
        if (token) {
            console.log('Token found in URL, attempting auto-login');
            // Attempt to validate the token and get user data
            axios.get(`${apiUrl}/api/auth/validate-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.data.user) {
                    console.log('Token validated successfully:', response.data.user.role);
                    // Save the token and user data
                    localStorage.setItem('token', token);
                    saveUserData(response.data.user);
                    
                    // Redirect to dashboard
                    router.replace('/');
                }
            })
            .catch(err => {
                console.error('Error validating token:', err);
                setError('Invalid or expired token. Please log in again.');
            });
            return;
        }
        
        // Normal login check
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Redirect based on role
            const role = currentUser.role.toString().toUpperCase();
            
            if (role === 'HR' || role === 'CANDIDATE') {
                router.replace('/');
            } else {
                // For other roles, redirect to main site
                window.location.href = `${apiUrll}`;
            }
        }
    }, [router.query, router]);
    
    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle login form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(`${apiUrl}/api/users/signin`, loginData);
            
            if (response.data.token && response.data.user) {
                console.log('Login successful:', response.data.user.firstName);
                
                // Save user data and token using our auth utility
                saveUserData(response.data.user, response.data.token);
                
                // Check user role for proper redirection
                const role = response.data.user.role.toString().toUpperCase();
                console.log('User role:', role);
                
                if (role === 'HR' || role === 'CANDIDATE') {
                    // Valid roles for Company-Panel - redirect to dashboard
                    router.replace('/');
                } else {
                    // For other roles, redirect to main site
                    window.location.href = `${apiUrll}`;
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <Layout breadcrumbTitle="Login" breadcrumbActive="Login">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-box">
                            <div className="container">
                                <div className="panel-white mb-30">
                                <div className="box-padding">
                                    <div className="login-register">
                                    <div className="row login-register-cover pb-250">
                                        <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                        <div className="form-login-cover">
                                            <div className="text-center">
                                            <p className="font-sm text-brand-2">Welcome back! </p>
                                            <h2 className="mt-10 mb-5 text-brand-1">Member Login</h2>
                                            <p className="font-sm text-muted mb-30">
                                                Access to all features. No credit card required.
                                            </p>
                                            <button className="btn social-login hover-up mb-20">
                                                <img
                                                src="assets/imgs/template/icons/icon-google.svg"
                                                alt="jobbox"
                                                />
                                                <strong>Sign in with Google</strong>
                                            </button>
                                            <div className="divider-text-center">
                                                <span>Or continue with</span>
                                            </div>
                                            </div>
                                            {error && (
                                                <div className="alert alert-danger mb-20" role="alert">
                                                    {error}
                                                </div>
                                            )}
                                            <form
                                            className="login-register text-start mt-20"
                                            onSubmit={handleSubmit}
                                            >
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
                                                value={loginData.email}
                                                onChange={handleChange}
                                                placeholder="example@tunihire.com"
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
                                                value={loginData.password}
                                                onChange={handleChange}
                                                placeholder="************"
                                                />
                                            </div>
                                            <div className="login_footer form-group d-flex justify-content-between">
                                                <label className="cb-container">
                                                <input type="checkbox" />
                                                <span className="text-small">Remember me</span>
                                                <span className="checkmark" />
                                                </label>
                                                <Link className="text-muted" href={`${apiUrll}/reset-password`}>
                                                    Forgot Password
                                                    </Link>
                                            </div>
                                            <div className="form-group">
                                                <button
                                                className="btn btn-brand-1 hover-up w-100"
                                                type="submit"
                                                disabled={loading}
                                                >
                                                {loading ? 'Logging in...' : 'Login'}
                                                </button>
                                            </div>
                                            <div className="text-muted text-center">
                                                Don't have an Account?
                                                <Link href="/register"> Sign up</Link>
                                            </div>
                                            </form>
                                        </div>
                                        <div className="img-2">
                                            <img
                                            src="assets/imgs/page/login-register/img-3.svg"
                                            alt="JobBox"
                                            />
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </Layout>
        </>
    )
}