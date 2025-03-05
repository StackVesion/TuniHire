import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from "../../components/Layout/Layout";

export default function VerifyEmail() {
    const [status, setStatus] = useState('verifying');
    const router = useRouter();
    const { token } = router.query;

    useEffect(() => {
        if (token) {
            verifyEmail();
        }
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/verify-email/${token}`);
            setStatus('success');
            setTimeout(() => {
                router.push('/page-signin');
            }, 3000);
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
        }
    };

    return (
        <Layout>
            <div className="container">
                <div className="row justify-content-center mt-100 mb-80">
                    <div className="col-lg-6 text-center">
                        {status === 'verifying' && (
                            <div className="verification-pending">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h3>Verifying your email...</h3>
                                <p>Please wait while we verify your email address.</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="verification-success">
                                <div className="verification-icon text-success">✓</div>
                                <h3>Email Verified Successfully!</h3>
                                <p>Your email has been verified. Redirecting to login page...</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="verification-error">
                                <div className="verification-icon text-danger">✕</div>
                                <h3>Verification Failed</h3>
                                <p>The verification link may have expired or is invalid.</p>
                                <button 
                                    className="btn btn-primary mt-3"
                                    onClick={() => router.push('/page-signin')}
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
