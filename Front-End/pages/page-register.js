import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        rePassword: "",
    });
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        console.log("Form Data:", formData); // Debugging: Check the form data
    
        if (formData.password !== formData.rePassword) {
            alert("Passwords do not match");
            return;
        }
    
        try {
            const response = await axios.post("http://localhost:5000/api/users/signup", {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                rePassword: formData.rePassword,
            });
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                router.push("/page-signin");
            }
        } catch (error) {
            console.error("Registration failed:", error.response?.data?.message || error.message);
        }
    };

    return (
        <>
            <Layout>
                <section className="pt-100 login-register">
                    <div className="container">
                        <div className="row login-register-cover">
                            <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                <div className="text-center">
                                    <p className="font-sm text-brand-2">Register </p>
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
                                            First Name *
                                        </label>
                                        <input className="form-control" id="input-1" type="text" required name="firstName" placeholder="John" onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="input-2">
                                            Last Name *
                                        </label>
                                        <input className="form-control" id="input-2" type="text" required name="lastName" placeholder="Doe" onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="input-3">
                                            Email *
                                        </label>
                                        <input className="form-control" id="input-3" type="email" required name="email" placeholder="johndoe@gmail.com" onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="input-4">
                                            Password *
                                        </label>
                                        <input className="form-control" id="input-4" type="password" required name="password" placeholder="************" onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="input-5">
                                            Re-Password *
                                        </label>
                                        <input className="form-control" id="input-5" type="password" required name="rePassword" placeholder="************" onChange={handleChange} />
                                    </div>
                                    <div className="login_footer form-group d-flex justify-content-between">
                                        <label className="cb-container">
                                            <input type="checkbox" />
                                            <span className="text-small">Agree our terms and policy</span>
                                            <span className="checkmark" />
                                        </label>
                                        <Link legacyBehavior href="/page-contact">
                                            <a className="text-muted">Lean more</a>
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
        </>
    );
}