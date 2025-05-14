import { useState } from 'react';
import Swal from 'sweetalert2';
import EducationForm from './EducationForm';
import { createAuthAxios } from '@/utils/authUtils';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const EducationSection = ({ portfolio, userId, onUpdate, onRemove }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingEducation, setEditingEducation] = useState(null);
    
    const handleAddEducation = () => {
        setEditingEducation(null);
        setShowForm(true);
    };
    
    const handleEditEducation = (education, index) => {
        setEditingEducation({ ...education, index });
        setShowForm(true);
    };
    
    const handleEducationSuccess = (updatedPortfolio) => {
        onUpdate(updatedPortfolio);
        setShowForm(false);
        setEditingEducation(null);
    };
    
    const handleRemove = (index) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const authAxios = createAuthAxios();
                    const response = await authAxios.delete(
                        `${apiUrl}/api/portfolios/${portfolio._id}/education/${index}`
                    );
                    
                    if (response.data.success) {
                        // Call onRemove to update local state
                        onRemove(index);
                        
                        // Show success message
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Education entry has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        
                        // Ensure we reload the portfolio data
                        if (response.data.portfolio) {
                            onUpdate(response.data.portfolio);
                        }
                    }
                } catch (error) {
                    console.error('Error removing education:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete education entry'
                    });
                }
            }
        });
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    return (
        <div className="dashboard-list-block section-block mt-5">
            <div className="section-header d-flex justify-content-between align-items-center mb-4">
                <h4>Education</h4>
                <button onClick={handleAddEducation} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Education
                </button>
            </div>
            
            {showForm && (
                <EducationForm 
                    portfolioId={portfolio._id}
                    education={editingEducation}
                    onSuccess={handleEducationSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {portfolio.education && portfolio.education.length > 0 ? (
                <div className="education-timeline">
                    {portfolio.education.map((edu, index) => (
                        <div key={index} className="education-item animate__animated animate__fadeIn">
                            <div className="education-card">
                                <div className="education-content">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="mb-1">{edu.degree}</h5>
                                            <h6 className="text-primary mb-2">{edu.institution}</h6>
                                            <p className="text-muted mb-2">
                                                {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                                            </p>
                                            {edu.field && <p className="mb-2">Field of Study: {edu.field}</p>}
                                            {edu.description && <p className="mb-0">{edu.description}</p>}
                                        </div>
                                        <div className="education-badge">
                                            <i className="fi-rr-graduation-cap education-icon"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="education-actions mt-3 pt-3 border-top">
                                    <div className="d-flex justify-content-end">
                                        <button 
                                            onClick={() => handleEditEducation(edu, index)}
                                            className="btn btn-sm btn-outline-primary me-2"
                                        >
                                            <i className="fi-rr-edit"></i>
                                        </button>
                                        <button 
                                            onClick={() => handleRemove(index)}
                                            className="btn btn-sm btn-outline-danger"
                                        >
                                            <i className="fi-rr-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 border rounded">
                    <p className="mb-0 text-muted">No education added yet. Click "Add Education" to get started.</p>
                </div>
            )}
            
            <style jsx>{`
                .section-block {
                    position: relative;
                    padding: 25px;
                    border-radius: 10px;
                    background-color: white;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
                    margin-bottom: 30px;
                }
                .section-header {
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 25px;
                }
                .section-header h4 {
                    font-weight: 600;
                    margin-bottom: 0;
                    color: #333;
                }
                .education-timeline {
                    position: relative;
                }
                .education-item {
                    position: relative;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px dashed #e9ecef;
                }
                .education-item:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }
                .education-card {
                    background-color: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                    transition: all 0.3s ease;
                }
                .education-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
                }
                .education-badge {
                    background-color: #e9ecef;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .education-icon {
                    color: #007bff;
                    font-size: 1.2rem;
                }
                .education-actions {
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                }
                .education-card:hover .education-actions {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default EducationSection;
