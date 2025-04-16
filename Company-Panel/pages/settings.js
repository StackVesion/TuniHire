import Layout from "@/components/layout/Layout"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import Swal from "sweetalert2"
import { getToken, getCurrentUser, createAuthAxios } from "../utils/authUtils"
import withAuth from "@/utils/withAuth"

function Settings() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [company, setCompany] = useState(null)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        website: '',
        logo: null,
        description: '',
        category: '',
        numberOfEmployees: '',
        location: '',
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
    })
    const [logoPreview, setLogoPreview] = useState(null)
    const router = useRouter()
    const authAxios = createAuthAxios()

    // Fetch company data on component mount
    useEffect(() => {
        fetchCompanyData()
    }, [])

    // Function to fetch company data
    const fetchCompanyData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Use authAxios instance to ensure proper token handling and refresh capability
            const response = await authAxios.get('/api/companies/user/my-company')
            
            console.log('Company data fetched:', response.data)
            
            if (response.data.success && response.data.company) {
                setCompany(response.data.company)
                
                // Initialize form data with company details
                setFormData({
                    name: response.data.company.name || '',
                    email: response.data.company.email || '',
                    phone: response.data.company.phone || '',
                    website: response.data.company.website || '',
                    logo: null, // Will be handled by file input
                    description: response.data.company.description || '',
                    category: response.data.company.category || '',
                    numberOfEmployees: response.data.company.numberOfEmployees || '',
                    location: response.data.company.location || '',
                    facebook: response.data.company.socialLinks?.facebook || '',
                    twitter: response.data.company.socialLinks?.twitter || '',
                    instagram: response.data.company.socialLinks?.instagram || '',
                    linkedin: response.data.company.socialLinks?.linkedin || ''
                })
                
                // Set logo preview if it exists
                if (response.data.company.logo) {
                    setLogoPreview(response.data.company.logo)
                }
            }
        } catch (err) {
            console.error('Error fetching company data:', err)
            
            if (err.response && err.response.status === 404) {
                setError("You don't have a company yet. Please create one first.")
            } else if (err.response && err.response.status === 400) {
                setError("Authentication error. Please login again.")
                router.push('/login')
            } else {
                setError("Failed to load company data: " + (err.response?.data?.message || err.message))
            }
        } finally {
            setLoading(false)
        }
    }

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle logo file selection
    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData(prev => ({
                ...prev,
                logo: file
            }))
            
            // Create preview URL
            const previewUrl = URL.createObjectURL(file)
            setLogoPreview(previewUrl)
        }
    }

    // Handle logo deletion
    const handleDeleteLogo = () => {
        setFormData(prev => ({
            ...prev,
            logo: null
        }))
        setLogoPreview(null)
    }

    // Submit form data to update company
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!company || !company._id) {
            Swal.fire({
                icon: 'error',
                title: 'No Company Found',
                text: 'You need to create a company before editing details.',
                confirmButtonText: 'Create Company'
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/apply-company')
                }
            })
            return
        }
        
        try {
            setSaving(true)
            
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
            
            // Create FormData object for file upload
            const formDataToSend = new FormData()
            formDataToSend.append('name', formData.name)
            formDataToSend.append('email', formData.email)
            if (formData.phone) formDataToSend.append('phone', formData.phone)
            if (formData.website) formDataToSend.append('website', formData.website)
            if (formData.description) formDataToSend.append('description', formData.description)
            if (formData.category) formDataToSend.append('category', formData.category)
            if (formData.numberOfEmployees) formDataToSend.append('numberOfEmployees', formData.numberOfEmployees)
            if (formData.location) formDataToSend.append('location', formData.location)
            
            // Add social links
            const socialLinks = {}
            if (formData.facebook) socialLinks.facebook = formData.facebook
            if (formData.twitter) socialLinks.twitter = formData.twitter
            if (formData.instagram) socialLinks.instagram = formData.instagram
            if (formData.linkedin) socialLinks.linkedin = formData.linkedin
            
            formDataToSend.append('socialLinks', JSON.stringify(socialLinks))
            
            // Add logo file if it exists
            if (formData.logo) {
                formDataToSend.append('logo', formData.logo)
            }
            
            // Send update request
            const response = await authAxios.put(
                `/api/companies/${company._id}`,
                formDataToSend,
                {
                    headers: { 
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )
            
            console.log('Company updated:', response.data)
            
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Company details updated successfully!',
            })
            
            // Refresh company data
            fetchCompanyData()
            
        } catch (err) {
            console.error('Error updating company:', err)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Failed to update company: " + (err.response?.data?.message || err.message),
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Layout breadcrumbTitle="Company Settings" breadcrumbActive="Settings">
                <div className="row">
                    <div className="col-xxl-9 col-xl-8 col-lg-8">
                        <div className="section-box">
                            <div className="container">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="alert alert-warning my-4">
                                        <p>{error}</p>
                                        <div className="mt-3">
                                            <button onClick={() => router.push('/apply-company')} className="btn btn-primary me-2">
                                                Create Company Profile
                                            </button>
                                            <button onClick={() => router.push('/')} className="btn btn-outline-primary">
                                                Go to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="panel-white mb-30">
                                        <div className="box-padding">
                                            <h6 className="color-text-paragraph-2">Update your company profile</h6>
                                            
                                            <form onSubmit={handleSubmit}>
                                                <div className="box-profile-image">
                                                    <div className="img-profile">
                                                        <img 
                                                            src={logoPreview || "assets/imgs/page/dashboard/img3.png"} 
                                                            alt="Company Logo"
                                                            style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                    <div className="info-profile">
                                                        <label className="btn btn-default mb-2">
                                                            Company Logo / Brand
                                                            <input 
                                                                type="file" 
                                                                name="logo" 
                                                                accept="image/*" 
                                                                onChange={handleLogoChange} 
                                                                style={{ display: 'none' }}
                                                            />
                                                        </label>
                                                        {logoPreview && (
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-link" 
                                                                onClick={handleDeleteLogo}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="row">
                                                    <div className="col-lg-6 col-md-6">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Company Name *
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="name"
                                                                value={formData.name}
                                                                onChange={handleChange}
                                                                placeholder="Company Name"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-6">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Email *
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleChange}
                                                                placeholder="company@example.com"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-6">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Contact number
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleChange}
                                                                placeholder="Phone number"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-6">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Website
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="website"
                                                                value={formData.website}
                                                                onChange={handleChange}
                                                                placeholder="https://www.yourcompany.com"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-6">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Category / Industry
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="category"
                                                                value={formData.category}
                                                                onChange={handleChange}
                                                                placeholder="e.g. Technology, Healthcare, Finance"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 col-md-6">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Number of Employees
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="number"
                                                                name="numberOfEmployees"
                                                                value={formData.numberOfEmployees}
                                                                onChange={handleChange}
                                                                placeholder="e.g. 10, 50, 100+"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Location
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="location"
                                                                value={formData.location}
                                                                onChange={handleChange}
                                                                placeholder="e.g. New York, USA"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Description / About
                                                            </label>
                                                            <textarea
                                                                className="form-control"
                                                                name="description"
                                                                value={formData.description}
                                                                onChange={handleChange}
                                                                rows="5"
                                                                placeholder="Describe your company..."
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-lg-12">
                                                        <div className="mt-0 mb-4">
                                                            <h6>Social Links</h6>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-lg-12">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Facebook
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="facebook"
                                                                value={formData.facebook}
                                                                onChange={handleChange}
                                                                placeholder="https://www.facebook.com/yourcompany"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Twitter
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="twitter"
                                                                value={formData.twitter}
                                                                onChange={handleChange}
                                                                placeholder="https://twitter.com/yourcompany"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                Instagram
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="instagram"
                                                                value={formData.instagram}
                                                                onChange={handleChange}
                                                                placeholder="https://www.instagram.com/yourcompany"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12">
                                                        <div className="form-group mb-30">
                                                            <label className="font-sm color-text-mutted mb-10">
                                                                LinkedIn
                                                            </label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                name="linkedin"
                                                                value={formData.linkedin}
                                                                onChange={handleChange}
                                                                placeholder="https://www.linkedin.com/company/yourcompany"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-lg-12">
                                                        <div className="form-group mt-20">
                                                            <button 
                                                                type="submit" 
                                                                className="btn btn-default btn-brand icon-tick"
                                                                disabled={saving}
                                                            >
                                                                {saving ? 'Saving...' : 'Save Changes'}
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
            </Layout>
        </>
    )
}

// Export with auth HOC
// Allow HR users to access the settings page
export default withAuth(Settings, ['HR'])