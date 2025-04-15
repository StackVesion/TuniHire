import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ExperienceForm from './ExperienceForm';

const ExperienceSection = ({ portfolio, onUpdate, onRemove }) => {
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
        }).then((result) => {
            if (result.isConfirmed) {
                onRemove(index);
            }
        });
    };

    return (
        <div className="dashboard-list-block mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Experience</h4>
                <button onClick={handleAddExperience} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Experience
                </button>
            </div>
            
            {/* Display Experience Form when adding/editing */}
            {showForm && (
                <ExperienceForm 
                    portfolioId={portfolio._id}
                    experience={editingExperience}
                    onSuccess={handleExperienceSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {/* Display Experience List */}
            {portfolio.experience && portfolio.experience.length > 0 ? (
                <ul className="dashboard-list">
                    {portfolio.experience.map((exp, index) => (
                        <li key={index} className="dashboard-list-item">
                            <div className="dashboard-list-item-content">
                                <h5 className="mb-2">{exp.position}</h5>
                                <p className="mb-1">{exp.company}{exp.location ? ` • ${exp.location}` : ''}</p>
                                <p className="text-muted small mb-2">
                                    {new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                                    {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                </p>
                                {exp.description && <p className="mb-0">{exp.description}</p>}
                            </div>
                            <div className="dashboard-list-item-actions">
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
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-4 border rounded">
                    <p className="mb-0 text-muted">No experience added yet. Click "Add Experience" to get started.</p>
                </div>
            )}
        </div>
    );
};

export default ExperienceSection;
