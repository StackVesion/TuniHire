import Layout from "@/components/layout/Layout"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import Swal from "sweetalert2"
import { getToken, getCurrentUser } from "../utils/authUtils"

export default function Home() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        workplaceType: 'Remote',
        salaryRange: '',
        tags: ''
    })
    const router = useRouter()

    // Check authentication on page load
    useEffect(() => {
        const token = getToken()
        if (!token) {
            router.replace('/login')
        }
    }, [router])

    const handleChange = (e) => {
        const { name, value } = e.target
        
        // Additional validation for salary - ensure it's a number
        if (name === 'salaryRange' && value !== '') {
            const numValue = parseFloat(value)
            if (isNaN(numValue)) return // Don't update if not a valid number
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Get token using the utility function instead of direct localStorage access
            const token = getToken()
            if (!token) {
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication Error',
                    text: 'Your session has expired. Please sign in again.',
                })
                router.push('/login')
                return
            }

            // Get user data using utility function
            const userData = getCurrentUser()
            if (!userData) {
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication Error',
                    text: 'Please sign in again to continue',
                })
                router.push('/login')
                return
            }

            // Directly get the company where the user is HR (createdBy field)
            let companyId;
            try {
                // Get the company directly from my-company endpoint
                const companyResponse = await axios.get('http://localhost:5000/api/companies/user/my-company', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                // The API returns the company inside a 'company' property
                const companyData = companyResponse.data.company || companyResponse.data
                
                if (!companyData || !companyData._id) {
                    console.error('Company data structure:', companyResponse.data)
                    Swal.fire({
                        icon: 'error',
                        title: 'Company Required',
                        text: 'No company found associated with your account',
                    })
                    router.push('/my-job-grid')
                    return
                }
                
                console.log('Creating job for company:', companyData.name, 'with ID:', companyData._id)
                companyId = companyData._id;
            } catch (error) {
                console.error('Error fetching company:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to retrieve company information. Please try again.',
                })
                setLoading(false);
                return;
            }

            // Prepare job data for submission
            const jobData = {
                title: formData.title,
                description: formData.description,
                location: formData.location,
                workplaceType: formData.workplaceType,
                salaryRange: formData.salaryRange,
                requirements: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                companyId: companyId
            }

            // Submit job data to API
            const response = await axios.post('http://localhost:5000/api/jobs', jobData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            Swal.fire({
                icon: 'success',
                title: 'Job Posted!',
                text: 'Your job has been posted successfully',
            })

            // Redirect to my jobs page
            router.push('/my-job-grid')
        } catch (error) {
            console.error('Error posting job:', error)
            // Check for specific authentication errors
            if (error.response?.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication Error',
                    text: 'Your session has expired. Please sign in again.',
                })
                router.push('/login')
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.error || 'Failed to post job. Please try again.',
                })
            }
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <>
            <Layout breadcrumbTitle="My Profile" breadcrumbActive="My Profile">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                            <div className="box-padding bg-postjob">
                                <h5 className="icon-edu">Tell us about your role</h5>
                                <div className="row mt-30">
                                <div className="col-lg-9">
                                    <form onSubmit={handleSubmit}>
                                    <div className="row">
                                    <div className="col-lg-12">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Job title *
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Senior Product Designer"
                                            required
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Add your job description *
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            rows={8}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Describe the job responsibilities, requirements, and benefits"
                                            required
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Job location
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder='e.g. "New York City" or "San Francisco"'
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Workplace type *
                                        </label>
                                        <select 
                                            className="form-control"
                                            name="workplaceType"
                                            value={formData.workplaceType}
                                            onChange={handleChange}
                                        >
                                            <option value="Remote">Remote</option>
                                            <option value="Office">Office</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Salary
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="0"
                                                step="100"
                                                name="salaryRange"
                                                value={formData.salaryRange}
                                                onChange={handleChange}
                                                placeholder="2000"
                                                required
                                            />
                                        </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Tags (optional)
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleChange}
                                            placeholder="Figma, UI/UX, Sketch..."
                                        />
                                        </div>
                                    </div>

                                    <div className="col-lg-12">
                                        <div className="form-group mt-10">
                                        <button 
                                            type="submit" 
                                            className="btn btn-default btn-brand icon-tick"
                                            disabled={loading}
                                        >
                                            {loading ? 'Posting...' : 'Post New Job'}
                                        </button>
                                        </div>
                                    </div>
                                    </div>
                                </form>
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