import { useEffect } from "react"
import withAuth from "@/utils/withAuth"
import { useRouter } from 'next/router'

function Home({ user }) {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect based on user role
        if (user) {
            const role = user.role.toString().toUpperCase();
            if (role === 'HR') {
                router.push('/hr-dashboard');
            } else if (role === 'CANDIDATE') {
                router.push('/candidate-dashboard');
            }
        }
    }, [user, router]);
    
    // This component won't render much as it will redirect
    return (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
            <p className="mt-3">Redirecting to your dashboard...</p>
                </div>
    )
}

// Export with auth HOC
// Allow both HR and Candidate roles to access
export default withAuth(Home, ['HR', 'candidate'])