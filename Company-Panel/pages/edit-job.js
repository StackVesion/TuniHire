import Layout from "@/components/layout/Layout"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import Swal from "sweetalert2"

export default function EditJob() {
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        workplaceType: 'Remote',
        salaryRange: '',
        tags: ''
    })
    const router = useRouter()
    const { id } = router.query

    // Fetch job details when component mounts
    useEffect(() => {
        if (id) {
            fetchJobDetails()
        }
    }, [id])

    const fetchJobDetails = async () => {
        setFetchLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/page-signin')
                return
            }

            const response = await axios.get(`http://localhost:5000/api/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Transform API response to form data format
            const job = response.data
            setFormData({
                title: job.title || '',
                description: job.description || '',
                location: job.location || '',
                workplaceType: job.workplaceType || 'Remote',
                salaryRange: job.salaryRange || '',
                tags: job.requirements ? job.requirements.join(', ') : ''
            })
        } catch (error) {
            console.error('Error fetching job details:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load job details. Please try again.',
            })
            router.push('/my-job-grid')
        } finally {
            setFetchLoading(false)
        }
    }

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
            // Get authentication token
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/page-signin')
                return
            }

            // Get the company ID to ensure we maintain the correct association
            let companyId;
            try {
                // Get the company directly
                const companyResponse = await axios.get('http://localhost:5000/api/companies/user/my-company', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                // The API returns the company inside a 'company' property
                const companyData = companyResponse.data.company || companyResponse.data
                
                if (companyData && companyData._id) {
                    companyId = companyData._id;
                    console.log('Updating job for company:', companyData.name, 'with ID:', companyId);
                } else {
                    console.error('Company data structure:', companyResponse.data);
                }
            } catch (companyError) {
                console.error('Error fetching company:', companyError);
                // Continue with update even if company fetch fails - we'll use the existing companyId
            }
            
            // Prepare job data for update
            const jobData = {
                title: formData.title,
                description: formData.description,
                location: formData.location,
                workplaceType: formData.workplaceType,
                salaryRange: formData.salaryRange,
                requirements: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                // Include companyId only if we retrieved it
                ...(companyId && { companyId })
            }

            // Send update request
            await axios.put(`http://localhost:5000/api/jobs/${id}`, jobData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            Swal.fire({
                icon: 'success',
                title: 'Job Updated!',
                text: 'Your job has been updated successfully',
            })

            // Redirect to my jobs page
            router.push('/my-job-grid')
        } catch (error) {
            console.error('Error updating job:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'Failed to update job. Please try again.',
            })
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <>
            <Layout breadcrumbTitle="Edit Job" breadcrumbActive="Edit Job">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                            <div className="box-padding bg-postjob">
                                <h5 className="icon-edu">Edit Job Details</h5>
                                {fetchLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2">Loading job details...</p>
                                    </div>
                                ) : (
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
                                            Job description *
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
                                            required
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
                                            required
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mt-10 d-flex">
                                        <button 
                                            type="submit" 
                                            className="btn btn-default btn-brand icon-tick mr-5"
                                            disabled={loading}
                                        >
                                            {loading ? 'Updating...' : 'Update Job'}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-primary"
                                            onClick={() => router.push('/my-job-grid')}
                                        >
                                            Cancel
                                        </button>
                                        </div>
                                    </div>
                                    </div>
                                    </form>
                                </div>
                                </div>
                                )}
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
