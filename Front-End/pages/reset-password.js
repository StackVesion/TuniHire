/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
import Layout from "../components/Layout/Layout";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

export default function ResetPassword() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [hasToken, setHasToken] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        // Check if we have a token in the URL
        if (router.isReady) {
            const { token } = router.query;
            if (token) {
                setHasToken(true);
                setToken(token);
                verifyToken(token);
            }
        }
    }, [router.isReady, router.query]);

    const verifyToken = async (token) => {
        setVerifying(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verify-reset-token?token=${token}`);
            
            if (response.data.success && response.data.valid) {
                setTokenValid(true);
            } else {
                setError("Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.");
            }
        } catch (error) {
            console.error("Token verification error:", error);
            setError("Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.");
        } finally {
            setVerifying(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/forgot-password`, { email });
            
            if (response.data.success) {
                setMessage("Un lien de réinitialisation a été envoyé à votre adresse email si celle-ci est associée à un compte.");
                toast.success("Email de réinitialisation envoyé");
                // Clear the form
                setEmail("");
            } else {
                toast.error(response.data.message || "Une erreur est survenue");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error(error.response?.data?.message || "Une erreur est survenue lors de la demande de réinitialisation");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        // Check if passwords match
        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }
        
        // Password strength validation
        if (password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/reset-password`, {
                token,
                newPassword: password
            });
            
            if (response.data.success) {
                toast.success("Votre mot de passe a été réinitialisé avec succès");
                // Redirect to login page after successful password reset
                setTimeout(() => {
                    router.push("/page-signin");
                }, 1500);
            } else {
                toast.error(response.data.message || "Une erreur est survenue");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error(error.response?.data?.message || "Une erreur est survenue lors de la réinitialisation du mot de passe");
        } finally {
            setLoading(false);
        }
    };

    // Render request reset form (when no token is present)
    const renderRequestResetForm = () => (
        <>
            <div className="text-center">
                <p className="font-sm text-brand-2">Mot de passe oublié</p>
                <h2 className="mt-10 mb-5 text-brand-1">Réinitialiser votre mot de passe</h2>
                <p className="font-sm text-muted mb-30">Entrez l'adresse email associée à votre compte et nous vous enverrons un lien pour réinitialiser votre mot de passe</p>
            </div>
            <form className="login-register text-start mt-20" onSubmit={handleEmailSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="input-1">
                        Adresse email *
                    </label>
                    <input 
                        className="form-control" 
                        id="input-1" 
                        type="email" 
                        required 
                        name="email" 
                        placeholder="exemple@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                {message && (
                    <div className="alert alert-success mt-2">{message}</div>
                )}
                <div className="form-group">
                    <button 
                        className="btn btn-brand-1 hover-up w-100" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? "Envoi en cours..." : "Continuer"}
                    </button>
                </div>
                <div className="text-muted text-center">
                    Vous n'avez pas de compte?
                    <Link legacyBehavior href="/page-signin">
                        <a> S'inscrire</a>
                    </Link>
                </div>
            </form>
        </>
    );

    // Render reset password form (when valid token is present)
    const renderResetPasswordForm = () => (
        <>
            <div className="text-center">
                <p className="font-sm text-brand-2">Réinitialisation du mot de passe</p>
                <h2 className="mt-10 mb-5 text-brand-1">Définir un nouveau mot de passe</h2>
                <p className="font-sm text-muted mb-30">Veuillez saisir votre nouveau mot de passe ci-dessous</p>
            </div>
            
            {verifying ? (
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-2">Vérification du lien de réinitialisation...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                    <div className="mt-3">
                        <button 
                            onClick={() => router.push("/reset-password")}
                            className="btn btn-outline-primary"
                        >
                            Demander un nouveau lien
                        </button>
                    </div>
                </div>
            ) : tokenValid ? (
                <form className="login-register text-start mt-20" onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Nouveau mot de passe *
                        </label>
                        <input 
                            className="form-control" 
                            id="password" 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            minLength={8}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm-password">
                            Confirmer le mot de passe *
                        </label>
                        <input 
                            className="form-control" 
                            id="confirm-password" 
                            type="password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="********"
                            minLength={8}
                        />
                    </div>
                    <div className="form-group">
                        <button 
                            className="btn btn-brand-1 hover-up w-100" 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
                        </button>
                    </div>
                </form>
            ) : null}
        </>
    );

    return (
        <>
            <Layout>
                <section className="pt-100 login-register">
                    <div className="container">
                        <div className="row login-register-cover">
                            <div className="col-lg-4 col-md-6 col-sm-12 mx-auto">
                                {hasToken ? renderResetPasswordForm() : renderRequestResetForm()}
                                
                                <div className="text-muted text-center mt-4">
                                    <Link legacyBehavior href="/page-signin">
                                        <a>Retour à la connexion</a>
                                    </Link>
                                </div>
                            </div>
                            <div className="img-1 d-none d-lg-block">
                                <img className="shape-1" src="assets/imgs/page/login-register/img-5.svg" alt="JobBox" />
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