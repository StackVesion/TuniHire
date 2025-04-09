import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { getToken } from '../utils/authUtils';
import withAuth from '../utils/withAuth';
import axios from 'axios';

function ApplyCompany({ user }) {
    const router = useRouter();
    const [companyData, setCompanyData] = useState({
        name: '',
        email: '',
        website: '',
        category: '',
        numberOfEmployees: '',
        projects: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [existingCompany, setExistingCompany] = useState(null);

    useEffect(() => {
        // User is already provided by withAuth HOC
        // No need to set state as user is passed as prop

        // Check if the user already has a company
        const checkExistingCompany = async () => {
            try {
                const token = getToken();
                if (!token) {
                    console.log('No token found');
                    return;
                }
                
                console.log('Checking company status with token:', token.substring(0, 15) + '...');
                
                // Make API request with proper authorization header
                const response = await axios.get('http://localhost:5000/api/companies/user/my-company', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('Company status response:', response.data);
                
                if (response.data && response.data.company) {
                    setExistingCompany(response.data.company);
                }
            } catch (error) {
                console.log('API Error:', error.message);
                console.log('Status:', error.response?.status);
                console.log('Error details:', error.response?.data);
                
                // If error is 404, it means the user doesn't have a company yet
                if (error.response && error.response.status === 404) {
                    console.log('User does not have a company yet');
                    // This is expected for new users, so don't show an error
                } else {
                    // Only show error for non-404 responses
                    setError('Failed to load company data. Please try again.');
                }
            }
        };

        checkExistingCompany();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = getToken();
            if (!token) {
                setError('Authentication required. Please sign in again.');
                setLoading(false);
                return;
            }
            
            console.log('Submitting company application with token:', token.substring(0, 15) + '...');

            // Format projects as an array
            const formattedData = {
                ...companyData,
                projects: companyData.projects.split(',').map(project => project.trim()).filter(Boolean)
            };
            
            console.log('Submitting company data:', formattedData);

            const response = await axios.post('http://localhost:5000/api/companies', formattedData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Your company application has been submitted and is pending approval.');
            setExistingCompany(response.data.company);
            setLoading(false);
        } catch (error) {
            console.error('Error submitting company application:', error);
            setError(error.response?.data?.message || 'Failed to submit application. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="box-content">
                <div className="bg-white border-bottom mb-10">
                    <div className="row">
                        <div className="col-lg-12 col-md-12">
                            <div className="box-content-inner pt-30 pb-30">
                                <div className="box-heading mb-20">
                                    <h3 className="mt-0 mb-15">Apply for Company</h3>
                                    <div className="box-breadcrumb">
                                        <div className="breadcrumbs">
                                            <ul>
                                                <li><Link href="/dashboard">Dashboard</Link></li>
                                                <li>Apply for Company</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-box">
                            <div className="container">
                                <div className="panel-white mb-30">
                                    <div className="box-padding">
                                        {existingCompany && existingCompany.status === "Pending" && (
                                            <div className="alert alert-warning" role="alert">
                                                <h4 className="alert-heading">Application Under Review</h4>
                                                <p>You already have a pending company application. Your application is currently being reviewed by our team.</p>
                                                <hr />
                                                <p className="mb-0">You will be notified once your application is approved. Thank you for your patience!</p>
                                            </div>
                                        )}

                                        {existingCompany && existingCompany.status === "Approved" && (
                                            <div className="alert alert-success" role="alert">
                                                <h4 className="alert-heading">Application Approved!</h4>
                                                <p>Your company application has been approved. You can now post job listings and manage your company profile.</p>
                                                <hr />
                                                <p className="mb-0">
                                                    <Link href="/post-job" className="btn btn-primary me-3">
                                                        Post a New Job
                                                    </Link>
                                                    <Link href="/company-profile" className="btn btn-outline-primary">
                                                        View Company Profile
                                                    </Link>
                                                </p>
                                            </div>
                                        )}

                                        {(!existingCompany || success) && (
                                            <>
                                                {success && (
                                                    <div className="alert alert-success mb-4" role="alert">
                                                        {success}
                                                    </div>
                                                )}
                                                {error && (
                                                    <div className="alert alert-danger mb-4" role="alert">
                                                        {error}
                                                    </div>
                                                )}
                                                <form onSubmit={handleSubmit}>
                                                    <div className="row">
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-30">
                                                                <label className="font-sm color-text-mutted mb-10">Company Name *</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control" 
                                                                    name="name"
                                                                    value={companyData.name}
                                                                    onChange={handleChange}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-30">
                                                                <label className="font-sm color-text-mutted mb-10">Company Email *</label>
                                                                <input 
                                                                    type="email" 
                                                                    className="form-control" 
                                                                    name="email"
                                                                    value={companyData.email}
                                                                    onChange={handleChange}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-30">
                                                                <label className="font-sm color-text-mutted mb-10">Website</label>
                                                                <input 
                                                                    type="url" 
                                                                    className="form-control" 
                                                                    name="website"
                                                                    value={companyData.website}
                                                                    onChange={handleChange}
                                                                    placeholder="https://yourcompany.com"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-30">
                                                                <label className="font-sm color-text-mutted mb-10">Category</label>
                                                                <select 
                                                                    className="form-control"
                                                                    name="category"
                                                                    value={companyData.category}
                                                                    onChange={handleChange}
                                                                >
                                                                    <option value="">Select Category</option>
                                                                    <option value="Technology">Technology</option>
                                                                    <option value="Finance">Finance</option>
                                                                    <option value="Healthcare">Healthcare</option>
                                                                    <option value="Education">Education</option>
                                                                    <option value="Retail">Retail</option>
                                                                    <option value="Manufacturing">Manufacturing</option>
                                                                    <option value="Services">Services</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-30">
                                                                <label className="font-sm color-text-mutted mb-10">Number of Employees</label>
                                                                <input 
                                                                    type="number" 
                                                                    className="form-control" 
                                                                    name="numberOfEmployees"
                                                                    value={companyData.numberOfEmployees}
                                                                    onChange={handleChange}
                                                                    min="1"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-6 col-md-6">
                                                            <div className="form-group mb-30">
                                                                <label className="font-sm color-text-mutted mb-10">Projects (comma separated)</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control" 
                                                                    name="projects"
                                                                    value={companyData.projects}
                                                                    onChange={handleChange}
                                                                    placeholder="Project 1, Project 2, Project 3"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-12">
                                                            <div className="form-group mt-10">
                                                                <button 
                                                                    type="submit" 
                                                                    className="btn btn-primary"
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? 'Submitting...' : 'Submit Application'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Export with auth HOC - Only allow candidates to access this page
export default withAuth(ApplyCompany, ['candidate']);
