import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import suggestions from '../../data/suggestions.json';
import { createAuthAxios } from '@/utils/authUtils';

const EducationForm = ({ portfolioId, education = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startDate: null,
        endDate: null,
        currentlyEnrolled: false,
        description: '',
        location: ''
    });
    
    const [errors, setErrors] = useState({});
    const [schoolSuggestions, setSchoolSuggestions] = useState([]);
    const [degreeSuggestions, setDegreeSuggestions] = useState([]);
    const [fieldSuggestions, setFieldSuggestions] = useState([]);
    
    useEffect(() => {
        // If editing an existing education entry, populate the form
        if (education) {
            setFormData({
                school: education.school || '',
                degree: education.degree || '',
                fieldOfStudy: education.fieldOfStudy || '',
                startDate: education.startDate ? new Date(education.startDate) : null,
                endDate: education.endDate ? new Date(education.endDate) : null,
                currentlyEnrolled: education.currentlyEnrolled || false,
                description: education.description || '',
                location: education.location || ''
            });
        }
        
        // Load suggestions
        if (suggestions.schools) setSchoolSuggestions(suggestions.schools);
        if (suggestions.degrees) setDegreeSuggestions(suggestions.degrees);
        if (suggestions.fieldsOfStudy) setFieldSuggestions(suggestions.fieldsOfStudy);
    }, [education]);
    
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
        
        // If currently enrolled, clear end date
        if (name === 'currentlyEnrolled' && checked) {
            setFormData(prev => ({ ...prev, endDate: null }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.school.trim()) newErrors.school = 'School is required';
        if (!formData.degree.trim()) newErrors.degree = 'Degree is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.currentlyEnrolled && !formData.endDate) {
            newErrors.endDate = 'End date is required unless currently enrolled';
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
            
            if (education) {
                // Edit existing education
                response = await authAxios.put(`http://localhost:5000/api/portfolios/${portfolioId}/education/${education.index}`, payload);
            } else {
                // Add new education
                response = await authAxios.post(`http://localhost:5000/api/portfolios/${portfolioId}/education`, payload);
            }
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: education ? 'Education updated successfully' : 'Education added successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                onSuccess(response.data.portfolio);
            }
        } catch (error) {
            console.error('Error saving education:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to save education',
                text: error.response?.data?.message || 'An error occurred while saving education details'
            });
        }
    };
    
    return (
        <div className="portfolio-form education-form mb-4">
            <h4 className="mb-3">{education ? 'Edit' : 'Add'} Education</h4>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">School</label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.school ? 'is-invalid' : ''}`}
                                name="school"
                                value={formData.school}
                                onChange={handleChange}
                                list="school-suggestions"
                                placeholder="e.g., Harvard University"
                            />
                            <datalist id="school-suggestions">
                                {schoolSuggestions.map((school, index) => (
                                    <option key={index} value={school} />
                                ))}
                            </datalist>
                            {errors.school && <div className="invalid-feedback">{errors.school}</div>}
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input 
                                type="text" 
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., Boston, MA"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Degree</label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.degree ? 'is-invalid' : ''}`}
                                name="degree"
                                value={formData.degree}
                                onChange={handleChange}
                                list="degree-suggestions"
                                placeholder="e.g., Bachelor of Science"
                            />
                            <datalist id="degree-suggestions">
                                {degreeSuggestions.map((degree, index) => (
                                    <option key={index} value={degree} />
                                ))}
                            </datalist>
                            {errors.degree && <div className="invalid-feedback">{errors.degree}</div>}
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Field of Study</label>
                            <input 
                                type="text" 
                                className="form-control"
                                name="fieldOfStudy"
                                value={formData.fieldOfStudy}
                                onChange={handleChange}
                                list="field-suggestions"
                                placeholder="e.g., Computer Science"
                            />
                            <datalist id="field-suggestions">
                                {fieldSuggestions.map((field, index) => (
                                    <option key={index} value={field} />
                                ))}
                            </datalist>
                        </div>
                    </div>
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
                                disabled={formData.currentlyEnrolled}
                            />
                            {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                        </div>
                        
                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="currentlyEnrolled"
                                name="currentlyEnrolled"
                                checked={formData.currentlyEnrolled}
                                onChange={handleCheckbox}
                            />
                            <label className="form-check-label" htmlFor="currentlyEnrolled">
                                Currently Enrolled
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
                        placeholder="Describe your program, achievements, etc."
                    ></textarea>
                </div>
                
                {/* Live Preview */}
                <div className="card preview-card mb-4">
                    <div className="card-body">
                        <h5 className="preview-title">Preview</h5>
                        <div className="preview-content">
                            <h5>{formData.degree || 'Degree'}</h5>
                            <p className="mb-1">
                                {formData.school || 'School'}
                                {formData.location ? `, ${formData.location}` : ''}
                            </p>
                            <p className="text-muted small">
                                {formData.startDate ? formData.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Start Date'}
                                {formData.currentlyEnrolled ? ' - Present' : formData.endDate ? ` - ${formData.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}` : ''}
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
                        {education ? 'Update' : 'Add'} Education
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

export default EducationForm;
