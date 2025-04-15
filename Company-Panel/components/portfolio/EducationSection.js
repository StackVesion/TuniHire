import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import EducationForm from './EducationForm';

const EducationSection = ({ portfolio, onUpdate, onRemove }) => {
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
        }).then((result) => {
            if (result.isConfirmed) {
                onRemove(index);
            }
        });
    };

    return (
        <div className="dashboard-list-block mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Education</h4>
                <button onClick={handleAddEducation} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Education
                </button>
            </div>
            
            {/* Display Education Form when adding/editing */}
            {showForm && (
                <EducationForm 
                    portfolioId={portfolio._id}
                    education={editingEducation}
                    onSuccess={handleEducationSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {/* Display Education List */}
            {portfolio.education && portfolio.education.length > 0 ? (
                <ul className="dashboard-list">
                    {portfolio.education.map((edu, index) => (
                        <li key={index} className="dashboard-list-item">
                            <div className="dashboard-list-item-content">
                                <h5 className="mb-2">{edu.school}</h5>
                                <p className="mb-1">{edu.degree} in {edu.fieldOfStudy}</p>
                                <p className="text-muted small mb-2">
                                    {new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                                    {edu.current ? 'Present' : new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                </p>
                                {edu.description && <p className="mb-0">{edu.description}</p>}
                            </div>
                            <div className="dashboard-list-item-actions">
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
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-4 border rounded">
                    <p className="mb-0 text-muted">No education added yet. Click "Add Education" to get started.</p>
                </div>
            )}
        </div>
    );
};

export default EducationSection;
