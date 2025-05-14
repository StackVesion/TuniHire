import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import withAuth from "@/utils/withAuth";
import { createAuthAxios } from "../utils/authUtils";
import Swal from "sweetalert2";
import Head from "next/head";

function ReclamationsPage() {
    const router = useRouter();
    const [reclamations, setReclamations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newReclamation, setNewReclamation] = useState({
        subject: "",
        category: "technical",
        priority: "medium",
        description: ""
    });
    const [formVisible, setFormVisible] = useState(false);
    const authAxios = createAuthAxios();
    
    // Categories and priorities for the dropdown
    const categories = [
        { value: "technical", label: "Technical Issue" },
        { value: "billing", label: "Billing" },
        { value: "account", label: "User Account" },
        { value: "job", label: "Job Offer" },
        { value: "other", label: "Other" }
    ];
    
    const priorities = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" }
    ];
    
    // Status mapping for display
    const statusMap = {
        "pending": { label: "Pending", color: "#ff9800", bgColor: "#fff8e1" },
        "in_progress": { label: "In Progress", color: "#2196f3", bgColor: "#e3f2fd" },
        "resolved": { label: "Resolved", color: "#4caf50", bgColor: "#e8f5e9" },
        "closed": { label: "Closed", color: "#9e9e9e", bgColor: "#f5f5f5" }
    };
    
    // Load reclamations on component mount
    useEffect(() => {
        fetchReclamations();
    }, []);
    
    // Function to fetch reclamations for the current user
    const fetchReclamations = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await authAxios.get('/api/reclamations/user');
            
            if (response.data && response.data.success) {
                setReclamations(response.data.reclamations || []);
            } else {
                throw new Error('Failed to fetch reclamations');
            }
        } catch (error) {
            console.error("Error fetching reclamations:", error);
            setError("Failed to load reclamations. Please try again later.");
        } finally {
            setLoading(false);
        }
    };
    
    // Function to handle input changes for new reclamation
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReclamation(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate the form
        if (!newReclamation.subject || !newReclamation.description) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please fill in all required fields'
            });
            return;
        }
        
        try {
            // Show loading state
            setLoading(true);
            
            // Submit the reclamation
            const response = await authAxios.post('/api/reclamations', newReclamation);
            
            if (response.data && response.data.success) {
                // Reset form and refresh the list
                setNewReclamation({
                    subject: "",
                    category: "technical",
                    priority: "medium",
                    description: ""
                });
                setFormVisible(false);
                fetchReclamations();
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Complaint Submitted',
                    text: 'Your complaint has been submitted successfully!'
                });
            } else {
                throw new Error(response.data?.message || 'Failed to submit complaint');
            }
        } catch (error) {
            console.error("Error submitting reclamation:", error);
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to submit complaint. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Function to view reclamation details
    const viewReclamationDetails = (reclamation) => {
        Swal.fire({
            title: reclamation.subject,
            html: `
                <div style="text-align: left; margin-bottom: 15px;">
                    <div style="margin-bottom: 10px;"><strong>Category:</strong> ${categories.find(c => c.value === reclamation.category)?.label || reclamation.category}</div>
                    <div style="margin-bottom: 10px;"><strong>Priority:</strong> ${priorities.find(p => p.value === reclamation.priority)?.label || reclamation.priority}</div>
                    <div style="margin-bottom: 10px;"><strong>Status:</strong> 
                        <span style="color: ${statusMap[reclamation.status]?.color || '#000'}; 
                                background-color: ${statusMap[reclamation.status]?.bgColor || '#fff'};
                                padding: 3px 8px;
                                border-radius: 12px;
                                font-size: 0.9em;">
                            ${statusMap[reclamation.status]?.label || reclamation.status}
                        </span>
                    </div>
                    <div style="margin-bottom: 10px;"><strong>Created on:</strong> ${new Date(reclamation.createdAt).toLocaleString()}</div>
                    <div style="margin-bottom: 15px;"><strong>Last updated:</strong> ${new Date(reclamation.updatedAt).toLocaleString()}</div>
                    <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                        <strong>Description:</strong>
                        <p>${reclamation.description}</p>
                    </div>
                    ${reclamation.adminResponse ? `
                        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                            <strong>Admin Response:</strong>
                            <p>${reclamation.adminResponse}</p>
                        </div>
                    ` : ''}
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    };
    
    // Helper to format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    // Helper to get status badge
    const getStatusBadge = (status) => {
        const statusInfo = statusMap[status] || { label: status, color: "#000", bgColor: "#f5f5f5" };
        return (
            <span 
                className="badge" 
                style={{ 
                    backgroundColor: statusInfo.bgColor, 
                    color: statusInfo.color,
                    padding: "5px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8em",
                    fontWeight: "500"
                }}
            >
                {statusInfo.label}
            </span>
        );
    };
    
    // Helper to get priority badge
    const getPriorityBadge = (priority) => {
        let color;
        let label;
        
        switch(priority) {
            case "urgent":
                color = "#d32f2f";
                label = "Urgent";
                break;
            case "high":
                color = "#f44336";
                label = "High";
                break;
            case "medium":
                color = "#ff9800";
                label = "Medium";
                break;
            case "low":
                color = "#4caf50";
                label = "Low";
                break;
            default:
                color = "#9e9e9e";
                label = priority;
        }
        
        return (
            <span 
                className="badge" 
                style={{ 
                    backgroundColor: `${color}20`, 
                    color: color,
                    padding: "5px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8em",
                    fontWeight: "500"
                }}
            >
                <i className="fi-rr-flag me-1"></i>
                {label}
            </span>
        );
    };

    return (
        <Layout breadcrumbTitle="Complaints" breadcrumbActive="Complaint Management">
            <Head>
                <title>Complaint Management | TuniHire</title>
                <style jsx global>{`
                    .card-reclamation:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    }
                    .card-reclamation {
                        transition: all 0.3s ease;
                        cursor: pointer;
                    }
                    .form-reclamation {
                        background-color: #f9fafb;
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 30px;
                        border: 1px solid #e5e7eb;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    }
                    .btn-toggle-form {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    }
                    .no-reclamations {
                        background-color: #f9fafb;
                        border-radius: 10px;
                        padding: 40px 20px;
                        text-align: center;
                        border: 1px dashed #e5e7eb;
                    }
                    .reclamation-title {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 250px;
                    }
                    .complaints-list {
                        margin-top: 30px;
                    }
                    .section-title {
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid #eaeaea;
                    }
                    .reclamation-card-content {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    .reclamation-description {
                        flex-grow: 1;
                        margin-bottom: 15px;
                    }
                    .badge-container {
                        display: inline-flex;
                        align-items: center;
                        margin-right: 10px;
                    }
                `}</style>
            </Head>

            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="panel-white mb-30">
                            <div className="box-padding">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="mb-0">{formVisible ? "Submit Complaint" : "My Complaints"}</h4>
                                    <button 
                                        className={`btn ${formVisible ? 'btn-outline-secondary' : 'btn-primary'} btn-toggle-form`}
                                        onClick={() => setFormVisible(!formVisible)}
                                    >
                                        <i className={`fi-rr-${formVisible ? 'arrow-left' : 'plus'}`}></i>
                                        {formVisible ? 'Back to Complaints' : 'New Complaint'}
                                    </button>
                                </div>

                                {/* Form for new reclamation */}
                                {formVisible && (
                                    <div className="form-reclamation">
                                        <h5 className="mb-3 section-title">Submit a new complaint</h5>
                                        <form onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Subject <span className="text-danger">*</span></label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        name="subject"
                                                        value={newReclamation.subject}
                                                        onChange={handleInputChange}
                                                        placeholder="Title of your complaint"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <label className="form-label">Category</label>
                                                    <select 
                                                        className="form-control" 
                                                        name="category"
                                                        value={newReclamation.category}
                                                        onChange={handleInputChange}
                                                    >
                                                        {categories.map(category => (
                                                            <option key={category.value} value={category.value}>
                                                                {category.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <label className="form-label">Priority</label>
                                                    <select 
                                                        className="form-control" 
                                                        name="priority"
                                                        value={newReclamation.priority}
                                                        onChange={handleInputChange}
                                                    >
                                                        {priorities.map(priority => (
                                                            <option key={priority.value} value={priority.value}>
                                                                {priority.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-12 mb-4">
                                                    <label className="form-label">Description <span className="text-danger">*</span></label>
                                                    <textarea 
                                                        className="form-control" 
                                                        name="description"
                                                        value={newReclamation.description}
                                                        onChange={handleInputChange}
                                                        rows="5"
                                                        placeholder="Describe your issue in detail..."
                                                        required
                                                    ></textarea>
                                                </div>
                                                <div className="col-12 d-flex">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-primary me-2"
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Submitting...' : 'Submit Complaint'}
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => setFormVisible(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}
                                
                                {/* Show complaints list only when form is not visible */}
                                {!formVisible && (
                                    <>
                                        {/* Loading state */}
                                        {loading && (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2">Loading complaints...</p>
                                            </div>
                                        )}
                                        
                                        {/* Error state */}
                                        {error && !loading && (
                                            <div className="alert alert-danger" role="alert">
                                                <i className="fi-rr-exclamation me-2"></i>
                                                {error}
                                            </div>
                                        )}
                                        
                                        {/* Display reclamations */}
                                        {!loading && !error && (
                                            <div className="complaints-list">
                                                {reclamations.length > 0 ? (
                                                    <div className="row">
                                                        {reclamations.map(reclamation => (
                                                            <div className="col-lg-6 col-md-12 mb-4" key={reclamation._id}>
                                                                <div 
                                                                    className="card card-reclamation border-0 shadow-sm h-100" 
                                                                    onClick={() => viewReclamationDetails(reclamation)}
                                                                >
                                                                    <div className="card-body reclamation-card-content">
                                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                                            <h5 className="card-title mb-0 reclamation-title" title={reclamation.subject}>
                                                                                {reclamation.subject}
                                                                            </h5>
                                                                            {getStatusBadge(reclamation.status)}
                                                                        </div>
                                                                        <div className="d-flex flex-wrap mb-3">
                                                                            <div className="badge-container">
                                                                                <i className="fi-rr-calendar me-1 text-muted"></i>
                                                                                <span className="text-muted">
                                                                                    {formatDate(reclamation.createdAt)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="badge-container">
                                                                                {getPriorityBadge(reclamation.priority)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mb-3">
                                                                            <span className="badge bg-light text-dark me-2">
                                                                                <i className="fi-rr-folder me-1"></i>
                                                                                {categories.find(c => c.value === reclamation.category)?.label}
                                                                            </span>
                                                                        </div>
                                                                        <p className="card-text reclamation-description">
                                                                            {reclamation.description.length > 120
                                                                                ? `${reclamation.description.substring(0, 120)}...`
                                                                                : reclamation.description}
                                                                        </p>
                                                                        <div className="mt-auto text-end">
                                                                            <button className="btn btn-sm btn-outline-primary">
                                                                                View Details <i className="fi-rr-arrow-right ms-1"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="no-reclamations">
                                                        <img 
                                                            src="/assets/imgs/page/dashboard/no-data.svg" 
                                                            alt="No complaints" 
                                                            style={{ maxHeight: '150px', marginBottom: '20px' }}
                                                        />
                                                        <h5>No complaints yet</h5>
                                                        <p className="text-muted">
                                                            You haven't submitted any complaints yet. Use the "New Complaint" button to create one.
                                                        </p>
                                                        <button 
                                                            className="btn btn-primary mt-3"
                                                            onClick={() => setFormVisible(true)}
                                                        >
                                                            <i className="fi-rr-plus me-2"></i>
                                                            Create my first complaint
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default withAuth(ReclamationsPage); 