import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import suggestions from '../../data/suggestions.json';
import { createAuthAxios } from '@/utils/authUtils';

const ProjectForm = ({ portfolioId, project = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        technologies: [],
        link: '',
        image: ''
    });
    
    const [errors, setErrors] = useState({});
    const [newTechnology, setNewTechnology] = useState('');
    
    useEffect(() => {
        // If editing an existing project, populate the form
        if (project) {
            setFormData({
                title: project.title || '',
                description: project.description || '',
                technologies: project.technologies || [],
                link: project.link || '',
                image: project.image || ''
            });
        }
    }, [project]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error for the field being edited
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };
    
    const handleTechnologyChange = (e) => {
        setNewTechnology(e.target.value);
    };
    
    const addTechnology = () => {
        if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
            setFormData({
                ...formData,
                technologies: [...formData.technologies, newTechnology.trim()]
            });
            setNewTechnology('');
        }
    };
    
    const removeTechnology = (index) => {
        const updatedTechnologies = [...formData.technologies];
        updatedTechnologies.splice(index, 1);
        setFormData({
            ...formData,
            technologies: updatedTechnologies
        });
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) newErrors.title = 'Project title is required';
        
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
            
            if (project) {
                // Edit existing project
                response = await authAxios.put(`http://localhost:5000/api/portfolios/${portfolioId}/projects/${project.index}`, formData);
            } else {
                // Add new project
                response = await authAxios.post(`http://localhost:5000/api/portfolios/${portfolioId}/projects`, formData);
            }

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: project ? 'Project updated successfully' : 'Project added successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                onSuccess(response.data.portfolio);
            }
        } catch (error) {
            console.error('Error saving project:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to save project',
                text: error.response?.data?.message || 'An error occurred while saving project details'
            });
        }
    };
    
    return (
        <div className="portfolio-form project-form mb-4">
            <h4 className="mb-3">{project ? 'Edit' : 'Add'} Project</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Project Title</label>
                    <input 
                        type="text" 
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., E-commerce Website"
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Project Link</label>
                    <input 
                        type="url" 
                        className="form-control"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                        placeholder="https://example.com/project"
                    />
                    <div className="form-text">URL to the live project or repository</div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Project Image URL</label>
                    <input 
                        type="url" 
                        className="form-control"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                    />
                    <div className="form-text">URL to an image representing your project</div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe your project, its purpose, and your role..."
                    ></textarea>
                </div>
                
                <div className="mb-4">
                    <label className="form-label">Technologies Used</label>
                    <div className="input-group mb-2">
                        <input 
                            type="text"
                            className="form-control"
                            placeholder="Add technologies used in this project"
                            value={newTechnology}
                            onChange={handleTechnologyChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTechnology();
                                }
                            }}
                        />
                        <button 
                            type="button" 
                            className="btn btn-outline-primary"
                            onClick={addTechnology}
                        >
                            Add
                        </button>
                    </div>
                    
                    {formData.technologies.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {formData.technologies.map((tech, index) => (
                                <span key={index} className="badge bg-light text-dark border d-flex align-items-center">
                                    {tech}
                                    <button 
                                        type="button" 
                                        className="btn-close ms-2" 
                                        style={{ fontSize: '0.6rem' }}
                                        onClick={() => removeTechnology(index)}
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
                            <div className="row">
                                {formData.image && (
                                    <div className="col-md-4">
                                        <img 
                                            src={formData.image} 
                                            alt={formData.title || "Project"} 
                                            className="img-fluid rounded mb-3 mb-md-0"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/150?text=Project+Image";
                                            }}
                                        />
                                    </div>
                                )}
                                <div className={formData.image ? "col-md-8" : "col-12"}>
                                    <h5>{formData.title || 'Project Title'}</h5>
                                    {formData.link && (
                                        <p className="mb-1 small">
                                            <a href={formData.link} target="_blank" rel="noopener noreferrer">
                                                View Project
                                            </a>
                                        </p>
                                    )}
                                    {formData.description && <p className="mt-2">{formData.description}</p>}
                                    {formData.technologies.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-muted mb-1 small">Technologies:</p>
                                            <div className="d-flex flex-wrap gap-1">
                                                {formData.technologies.map((tech, index) => (
                                                    <span key={index} className="badge bg-light text-dark border">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary me-2" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {project ? 'Update' : 'Add'} Project
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

export default ProjectForm;
