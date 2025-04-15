import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import suggestions from '../../data/suggestions.json';
import { createAuthAxios } from '@/utils/authUtils';

const ExperienceForm = ({ portfolioId, experience = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        position: '',
        company: '',
        location: '',
        startDate: null,
        endDate: null,
        currentlyWorking: false,
        description: '',
    });
    
    const [errors, setErrors] = useState({});
    const [companySuggestions, setCompanySuggestions] = useState([]);
    const [positionSuggestions, setPositionSuggestions] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    
    useEffect(() => {
        // If editing an existing experience entry, populate the form
        if (experience) {
            setFormData({
                position: experience.position || '',
                company: experience.company || '',
                location: experience.location || '',
                startDate: experience.startDate ? new Date(experience.startDate) : null,
                endDate: experience.endDate ? new Date(experience.endDate) : null,
                currentlyWorking: experience.currentlyWorking || false,
                description: experience.description || ''
            });
        }
        
        // Load suggestions
        if (suggestions.companies) setCompanySuggestions(suggestions.companies);
        if (suggestions.positions) setPositionSuggestions(suggestions.positions);
        if (suggestions.locations) setLocationSuggestions(suggestions.locations);
    }, [experience]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error for the field being edited
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };
    
    const handleDateChange = (date, name) => {
        setFormData({ ...formData, [name]: date });
        
        // Clear error for the field being edited
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };
    
    const handleCheckbox = (e) => {
        const { name, checked } = e.target;
        setFormData({ ...formData, [name]: checked });
        
        // If currently working, clear end date
        if (name === 'currentlyWorking' && checked) {
            setFormData(prev => ({ ...prev, endDate: null }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        if (!formData.company.trim()) newErrors.company = 'Company is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.currentlyWorking && !formData.endDate) {
            newErrors.endDate = 'End date is required unless currently working';
        }
        
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
            
            const payload = {
                ...formData,
                startDate: formData.startDate?.toISOString(),
                endDate: formData.endDate?.toISOString() || null
            };
            
            if (experience) {
                // Edit existing experience
                response = await authAxios.put(`http://localhost:5000/api/portfolios/${portfolioId}/experience/${experience.index}`, payload);
            } else {
                // Add new experience
                response = await authAxios.post(`http://localhost:5000/api/portfolios/${portfolioId}/experience`, payload);
            }
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: experience ? 'Experience updated successfully' : 'Experience added successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                onSuccess(response.data.portfolio);
            }
        } catch (error) {
            console.error('Error saving experience:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to save experience',
                text: error.response?.data?.message || 'An error occurred while saving experience details'
            });
        }
    };
    
    return (
        <div className="portfolio-form experience-form mb-4">
            <h4 className="mb-3">{experience ? 'Edit' : 'Add'} Experience</h4>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Position</label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.position ? 'is-invalid' : ''}`}
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                list="position-suggestions"
                                placeholder="e.g., Software Engineer"
                            />
                            <datalist id="position-suggestions">
                                {positionSuggestions.map((position, index) => (
                                    <option key={index} value={position} />
                                ))}
                            </datalist>
                            {errors.position && <div className="invalid-feedback">{errors.position}</div>}
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Company</label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                list="company-suggestions"
                                placeholder="e.g., Google"
                            />
                            <datalist id="company-suggestions">
                                {companySuggestions.map((company, index) => (
                                    <option key={index} value={company} />
                                ))}
                            </datalist>
                            {errors.company && <div className="invalid-feedback">{errors.company}</div>}
                        </div>
                    </div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input 
                        type="text" 
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        list="location-suggestions"
                        placeholder="e.g., San Francisco, CA"
                    />
                    <datalist id="location-suggestions">
                        {locationSuggestions.map((location, index) => (
                            <option key={index} value={location} />
                        ))}
                    </datalist>
                </div>
                
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Start Date</label>
                            <DatePicker
                                selected={formData.startDate}
                                onChange={(date) => handleDateChange(date, 'startDate')}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                placeholderText="Select start date"
                            />
                            {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">End Date</label>
                            <DatePicker
                                selected={formData.endDate}
                                onChange={(date) => handleDateChange(date, 'endDate')}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                                placeholderText="Select end date"
                                disabled={formData.currentlyWorking}
                            />
                            {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                        </div>
                        
                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="currentlyWorking"
                                name="currentlyWorking"
                                checked={formData.currentlyWorking}
                                onChange={handleCheckbox}
                            />
                            <label className="form-check-label" htmlFor="currentlyWorking">
                                I currently work here
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe your role, responsibilities, and achievements..."
                    ></textarea>
                </div>
                
                {/* Live Preview */}
                <div className="card preview-card mb-4">
                    <div className="card-body">
                        <h5 className="preview-title">Preview</h5>
                        <div className="preview-content">
                            <h5>{formData.position || 'Position'}</h5>
                            <p className="mb-1">
                                {formData.company || 'Company'}
                                {formData.location ? `, ${formData.location}` : ''}
                            </p>
                            <p className="text-muted small">
                                {formData.startDate ? formData.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Start Date'}
                                {formData.currentlyWorking ? ' - Present' : formData.endDate ? ` - ${formData.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}` : ''}
                            </p>
                            {formData.description && <p className="mt-2">{formData.description}</p>}
                        </div>
                    </div>
                </div>
                
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary me-2" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {experience ? 'Update' : 'Add'} Experience
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

export default ExperienceForm;
