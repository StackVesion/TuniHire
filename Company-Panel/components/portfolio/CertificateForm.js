import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import suggestions from '../../data/suggestions.json';
import { createAuthAxios } from '@/utils/authUtils';

const CertificateForm = ({ portfolioId, certificate = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        issuer: '',
        date: null,
        expiration: null,
        noExpiration: false,
        credentialId: '',
        credentialUrl: '',
        description: ''
    });
    
    const [errors, setErrors] = useState({});
    const [titleSuggestions, setTitleSuggestions] = useState([]);
    const [issuerSuggestions, setIssuerSuggestions] = useState([]);
    
    useEffect(() => {
        // If editing an existing certificate, populate the form
        if (certificate) {
            setFormData({
                title: certificate.title || '',
                issuer: certificate.issuer || '',
                date: certificate.date ? new Date(certificate.date) : null,
                expiration: certificate.expiration ? new Date(certificate.expiration) : null,
                noExpiration: certificate.noExpiration || false,
                credentialId: certificate.credentialId || '',
                credentialUrl: certificate.credentialUrl || '',
                description: certificate.description || ''
            });
        }
        
        // Load suggestions
        if (suggestions.certificateTitles) setTitleSuggestions(suggestions.certificateTitles);
        if (suggestions.certificateIssuers) setIssuerSuggestions(suggestions.certificateIssuers);
    }, [certificate]);
    
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
        
        // If no expiration, clear expiration date
        if (name === 'noExpiration' && checked) {
            setFormData(prev => ({ ...prev, expiration: null }));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) newErrors.title = 'Certificate title is required';
        if (!formData.issuer.trim()) newErrors.issuer = 'Certificate issuer is required';
        if (!formData.date) newErrors.date = 'Issue date is required';
        
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
                date: formData.date?.toISOString(),
                expiration: formData.expiration?.toISOString() || null
            };
            
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
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Certificate Title</label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                list="title-suggestions"
                                placeholder="e.g., AWS Certified Solutions Architect"
                            />
                            <datalist id="title-suggestions">
                                {titleSuggestions.map((title, index) => (
                                    <option key={index} value={title} />
                                ))}
                            </datalist>
                            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Issuing Organization</label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.issuer ? 'is-invalid' : ''}`}
                                name="issuer"
                                value={formData.issuer}
                                onChange={handleChange}
                                list="issuer-suggestions"
                                placeholder="e.g., Amazon Web Services"
                            />
                            <datalist id="issuer-suggestions">
                                {issuerSuggestions.map((issuer, index) => (
                                    <option key={index} value={issuer} />
                                ))}
                            </datalist>
                            {errors.issuer && <div className="invalid-feedback">{errors.issuer}</div>}
                        </div>
                    </div>
                </div>
                
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Issue Date</label>
                            <DatePicker
                                selected={formData.date}
                                onChange={(date) => handleDateChange(date, 'date')}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                                placeholderText="Select issue date"
                            />
                            {errors.date && <div className="invalid-feedback">{errors.date}</div>}
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Expiration Date</label>
                            <DatePicker
                                selected={formData.expiration}
                                onChange={(date) => handleDateChange(date, 'expiration')}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className={`form-control`}
                                placeholderText="Select expiration date (if applicable)"
                                disabled={formData.noExpiration}
                            />
                        </div>
                        
                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="noExpiration"
                                name="noExpiration"
                                checked={formData.noExpiration}
                                onChange={handleCheckbox}
                            />
                            <label className="form-check-label" htmlFor="noExpiration">
                                This certificate does not expire
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="row">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Credential ID</label>
                            <input 
                                type="text" 
                                className="form-control"
                                name="credentialId"
                                value={formData.credentialId}
                                onChange={handleChange}
                                placeholder="e.g., ABC123456"
                            />
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label">Credential URL</label>
                            <input 
                                type="url" 
                                className="form-control"
                                name="credentialUrl"
                                value={formData.credentialUrl}
                                onChange={handleChange}
                                placeholder="https://example.com/verify/ABC123456"
                            />
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
                        rows="3"
                        placeholder="Briefly describe what this certificate represents..."
                    ></textarea>
                </div>
                
                {/* Live Preview */}
                <div className="card preview-card mb-4">
                    <div className="card-body">
                        <h5 className="preview-title">Preview</h5>
                        <div className="preview-content">
                            <h5>{formData.title || 'Certificate Title'}</h5>
                            <p className="mb-1">Issued by {formData.issuer || 'Organization'}</p>
                            <p className="text-muted small">
                                Issued: {formData.date ? formData.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Issue Date'}
                                {!formData.noExpiration && formData.expiration ? ` • Expires: ${formData.expiration.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}` : ''}
                                {formData.noExpiration ? ' • No Expiration' : ''}
                            </p>
                            {formData.credentialId && <p className="mb-1 small">Credential ID: {formData.credentialId}</p>}
                            {formData.credentialUrl && <p className="mb-1 small"><a href={formData.credentialUrl} target="_blank" rel="noopener noreferrer">View Credential</a></p>}
                            {formData.description && <p className="mt-2">{formData.description}</p>}
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
