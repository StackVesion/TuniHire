import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import "react-datepicker/dist/react-datepicker.css";
import suggestions from '../../data/suggestions.json';
import { createAuthAxios } from '@/utils/authUtils';

const CertificateForm = ({ portfolioId, certificate = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        skills: [],
        certificateUrl: ''
    });
    
    const [errors, setErrors] = useState({});
    const [titleSuggestions, setTitleSuggestions] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    
    useEffect(() => {
        // If editing an existing certificate, populate the form
        if (certificate) {
            setFormData({
                title: certificate.title || '',
                description: certificate.description || '',
                skills: certificate.skills || [],
                certificateUrl: certificate.certificateUrl || ''
            });
        }
        
        // Load suggestions
        if (suggestions.certificateTitles) setTitleSuggestions(suggestions.certificateTitles);
    }, [certificate]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error for the field being edited
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };
    
    const handleSkillChange = (e) => {
        setNewSkill(e.target.value);
    };
    
    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData({
                ...formData,
                skills: [...formData.skills, newSkill.trim()]
            });
            setNewSkill('');
        }
    };
    
    const removeSkill = (index) => {
        const updatedSkills = [...formData.skills];
        updatedSkills.splice(index, 1);
        setFormData({
            ...formData,
            skills: updatedSkills
        });
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) newErrors.title = 'Certificate title is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            const authAxios = createAuthAxios();
            let response;
            
            // Format payload to match exactly what the backend expects
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                skills: formData.skills,
                certificateUrl: formData.certificateUrl.trim()
            };
            
            console.log('Sending certificate payload:', payload);
            
            if (certificate) {
                // Edit existing certificate
                response = await authAxios.put(`http://localhost:5000/api/portfolios/${portfolioId}/certificates/${certificate.index}`, payload);
            } else {
                // Add new certificate
                response = await authAxios.post(`http://localhost:5000/api/portfolios/${portfolioId}/certificates`, payload);
            }

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: certificate ? 'Certificate updated successfully' : 'Certificate added successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                onSuccess(response.data.portfolio);
            }
        } catch (error) {
            console.error('Error saving certificate:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to save certificate',
                text: error.response?.data?.message || 'An error occurred while saving certificate details'
            });
        }
    };
    
    return (
        <div className="portfolio-form certificate-form mb-4">
            <h4 className="mb-3">{certificate ? 'Edit' : 'Add'} Certificate</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Certificate Title</label>
                    <input 
                        type="text" 
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., AWS Certified Solutions Architect"
                        list="certificate-titles"
                    />
                    <datalist id="certificate-titles">
                        {titleSuggestions.map((title, index) => (
                            <option key={index} value={title} />
                        ))}
                    </datalist>
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Certificate URL</label>
                    <input 
                        type="url" 
                        className="form-control"
                        name="certificateUrl"
                        value={formData.certificateUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/certificate"
                    />
                    <div className="form-text">URL to your certificate if available online</div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Brief description of what the certificate covers..."
                    ></textarea>
                </div>
                
                <div className="mb-4">
                    <label className="form-label">Skills Covered</label>
                    <div className="input-group mb-2">
                        <input 
                            type="text"
                            className="form-control"
                            placeholder="Add skills covered by this certificate"
                            value={newSkill}
                            onChange={handleSkillChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSkill();
                                }
                            }}
                        />
                        <button 
                            type="button" 
                            className="btn btn-outline-primary"
                            onClick={addSkill}
                        >
                            Add
                        </button>
                    </div>
                    
                    {formData.skills.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {formData.skills.map((skill, index) => (
                                <span key={index} className="badge bg-light text-dark border d-flex align-items-center">
                                    {skill}
                                    <button 
                                        type="button" 
                                        className="btn-close ms-2" 
                                        style={{ fontSize: '0.6rem' }}
                                        onClick={() => removeSkill(index)}
                                    ></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Live Preview */}
                <div className="card preview-card mb-4">
                    <div className="card-body">
                        <h5 className="preview-title">Preview</h5>
                        <div className="preview-content">
                            <h5>{formData.title || 'Certificate Title'}</h5>
                            {formData.certificateUrl && (
                                <p className="mb-1 small">
                                    <a href={formData.certificateUrl} target="_blank" rel="noopener noreferrer">
                                        View Certificate
                                    </a>
                                </p>
                            )}
                            {formData.description && <p className="mt-2">{formData.description}</p>}
                            {formData.skills.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-muted mb-1 small">Skills:</p>
                                    <div className="d-flex flex-wrap gap-1">
                                        {formData.skills.map((skill, index) => (
                                            <span key={index} className="badge bg-light text-dark border">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary me-2" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {certificate ? 'Update' : 'Add'} Certificate
                    </button>
                </div>
            </form>
            
            <style jsx>{`
                .preview-card {
                    background-color: #f8f9fa;
                    border: 1px dashed #ccc;
                }
                .preview-title {
                    font-size: 0.875rem;
                    color: #6c757d;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #dee2e6;
                    padding-bottom: 5px;
                }
                .preview-content {
                    padding: 10px;
                    background: white;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
            `}</style>
        </div>
    );
};

export default CertificateForm;
