import { useState } from 'react';
import Swal from 'sweetalert2';
import ExperienceForm from './ExperienceForm';
import { createAuthAxios } from '@/utils/authUtils';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ExperienceSection = ({ portfolio, userId, onUpdate, onRemove }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    
    const handleAddExperience = () => {
        setEditingExperience(null);
        setShowForm(true);
    };
    
    const handleEditExperience = (experience, index) => {
        setEditingExperience({ ...experience, index });
        setShowForm(true);
    };
    
    const handleExperienceSuccess = (updatedPortfolio) => {
        onUpdate(updatedPortfolio);
        setShowForm(false);
        setEditingExperience(null);
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
                        `${apiUrl}/api/portfolios/${portfolio._id}/experience/${index}`
                    );
                    
                    if (response.data.success) {
                        // Call onRemove to update local state
                        onRemove(index);
                        
                        // Show success message
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Experience entry has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        
                        // Ensure we reload the portfolio data
                        if (response.data.portfolio) {
                            onUpdate(response.data.portfolio);
                        }
                    }
                } catch (error) {
                    console.error('Error removing experience:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete experience entry'
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
                <h4>Experience</h4>
                <button onClick={handleAddExperience} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Experience
                </button>
            </div>
            
            {showForm && (
                <ExperienceForm 
                    portfolioId={portfolio._id}
                    experience={editingExperience}
                    onSuccess={handleExperienceSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {portfolio.experience && portfolio.experience.length > 0 ? (
                <div className="experience-timeline">
                    {portfolio.experience.map((exp, index) => (
                        <div key={index} className="experience-item animate__animated animate__fadeIn">
                            <div className="experience-card">
                                <div className="experience-content">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="mb-1">{exp.title}</h5>
                                            <h6 className="text-primary mb-2">{exp.company}</h6>
                                            <p className="text-muted mb-2">
                                                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                            </p>
                                            {exp.location && <p className="mb-2"><i className="fi-rr-marker me-1"></i> {exp.location}</p>}
                                            {exp.description && <p className="mb-0">{exp.description}</p>}
                                        </div>
                                        <div className="experience-badge">
                                            <i className="fi-rr-briefcase experience-icon"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="experience-actions mt-3 pt-3 border-top">
                                    <div className="d-flex justify-content-end">
                                        <button 
                                            onClick={() => handleEditExperience(exp, index)}
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
                    <p className="mb-0 text-muted">No experience added yet. Click "Add Experience" to get started.</p>
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
                .experience-timeline {
                    position: relative;
                }
                .experience-item {
                    position: relative;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px dashed #e9ecef;
                }
                .experience-item:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }
                .experience-card {
                    background-color: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                    transition: all 0.3s ease;
                }
                .experience-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
                }
                .experience-badge {
                    background-color: #e9ecef;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .experience-icon {
                    color: #007bff;
                    font-size: 1.2rem;
                }
                .experience-actions {
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                }
                .experience-card:hover .experience-actions {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default ExperienceSection;
