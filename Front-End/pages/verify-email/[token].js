import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from "../../components/Layout/Layout";

export default function VerifyEmail() {
    const [status, setStatus] = useState('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
    const [email, setEmail] = useState('');
    const router = useRouter();
    const { token } = router.query;

    useEffect(() => {
        if (token) {
            verifyEmail();
        }
    }, [token]);

    const verifyEmail = async () => {
        try {
            console.log("Verifying email with token:", token);
            // Ajout d'un délai pour s'assurer que le serveur a le temps de répondre
            setTimeout(async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/api/users/verify-email/${token}`);
                    
                    console.log("Verification response:", response.data);
                    
                    if (response.data.email) {
                        setEmail(response.data.email);
                    }
                    
                    if (response.data.alreadyVerified) {
                        setIsAlreadyVerified(true);
                    }
                    
                    setStatus('success');
                    
                    // Redirection après 3 secondes
                    setTimeout(() => {
                        router.push('/page-signin');
                    }, 3000);
                } catch (error) {
                    handleError(error);
                }
            }, 1000);
        } catch (error) {
            handleError(error);
        }
    };
    
    const handleError = (error) => {
        console.error('Verification error:', error);
        
        // Analyser l'erreur pour déterminer le message approprié
        if (error.response) {
            console.log("Error response data:", error.response.data);
            setErrorMessage(error.response.data.message || "La vérification a échoué");
            
            if (error.response.data.expired) {
                setIsExpired(true);
            }
        } else {
            setErrorMessage("Une erreur est survenue lors de la connexion au serveur");
        }
        
        setStatus('error');
    };
    
    const handleResendVerification = async () => {
        if (!email) return;
        
        try {
            setStatus('resending');
            const response = await axios.get(`http://localhost:5000/api/users/resend-verification/${email}`);
            console.log("Resend response:", response.data);
            
            setStatus('resent');
            setTimeout(() => {
                router.push('/page-signin');
            }, 3000);
        } catch (error) {
            console.error("Resend error:", error);
            setErrorMessage("Impossible d'envoyer un nouveau lien de vérification");
            setStatus('error');
        }
    };

    return (
        <Layout>
            <div className="container">
                <div className="row justify-content-center mt-100 mb-80">
                    <div className="col-lg-6 text-center">
                        {(status === 'verifying') && (
                            <div className="verification-pending">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h3>Vérification de votre email...</h3>
                                <p>Veuillez patienter pendant que nous vérifions votre adresse email.</p>
                            </div>
                        )}
                        
                        {(status === 'resending') && (
                            <div className="verification-pending">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h3>Envoi d'un nouveau lien...</h3>
                                <p>Veuillez patienter pendant que nous envoyons un nouveau lien de vérification.</p>
                            </div>
                        )}
                        
                        {(status === 'resent') && (
                            <div className="verification-success">
                                <div className="verification-icon text-success">✓</div>
                                <h3>Nouveau lien envoyé !</h3>
                                <p>Un nouveau lien de vérification a été envoyé à votre adresse email. Redirection vers la page de connexion...</p>
                            </div>
                        )}

                        {(status === 'success') && (
                            <div className="verification-success">
                                <div className="verification-icon text-success">✓</div>
                                <h3>{isAlreadyVerified ? "Email déjà vérifié" : "Email vérifié avec succès!"}</h3>
                                <p>{isAlreadyVerified 
                                    ? "Votre email a déjà été vérifié précédemment." 
                                    : "Votre email a été vérifié avec succès."} Redirection vers la page de connexion...</p>
                            </div>
                        )}

                        {(status === 'error') && (
                            <div className="verification-error">
                                <div className="verification-icon text-danger">✕</div>
                                <h3>La vérification a échoué</h3>
                                <p>{errorMessage || "Le lien de vérification est peut-être expiré ou invalide."}</p>
                                {isExpired && (
                                    <p>Vous pouvez demander un nouveau lien de vérification.</p>
                                )}
                                {email && (
                                    <button 
                                        className="btn btn-primary mt-3 me-2"
                                        onClick={handleResendVerification}
                                    >
                                        Demander un nouveau lien
                                    </button>
                                )}
                                <button 
                                    className="btn btn-outline-primary mt-3"
                                    onClick={() => router.push('/page-signin')}
                                >
                                    Aller à la page de connexion
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
