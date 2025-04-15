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
        description: '',
        credentialId: '',
        credentialUrl: '',
        hasExpiration: false
    });

    // If certificate is provided, populate the form for editing
    useEffect(() => {
        if (certificate) {
            setFormData({
                title: certificate.title || '',
                issuer: certificate.issuer || '',
                date: certificate.date ? new Date(certificate.date) : null,
                expiration: certificate.expiration ? new Date(certificate.expiration) : null,
                description: certificate.description || '',
                credentialId: certificate.credentialId || '',
                credentialUrl: certificate.credentialUrl || '',
                hasExpiration: certificate.expiration ? true : false
            });
        }
    }, [certificate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // If hasExpiration is unchecked, clear expiration date
        if (name === 'hasExpiration' && !checked) {
            setFormData(prev => ({ ...prev, expiration: null }));
        }
    };

    const handleDateChange = (date, field) => {
        setFormData(prev => ({ ...prev, [field]: date }));
    };

    const validateForm = () => {
        if (!formData.title) {
            Swal.fire({
                icon: 'error',
                title: 'Certificate title is required'
            });
            return false;
        }
        if (!formData.issuer) {
            Swal.fire({
                icon: 'error',
                title: 'Issuing organization is required'
            });
            return false;
        }
        if (!formData.date) {
            Swal.fire({
                icon: 'error',
                title: 'Issue date is required'
            });
            return false;
        }
        if (formData.hasExpiration && !formData.expiration) {
            Swal.fire({
                icon: 'error',
                title: 'Expiration date is required if certificate expires'
            });
            return false;
        }
        if (formData.date && formData.expiration && formData.date > formData.expiration) {
            Swal.fire({
                icon: 'error',
                title: 'Expiration date cannot be earlier than issue date'
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const authAxios = createAuthAxios();
        try {
            let response;
            if (certificate) {
                // Update existing certificate
                const index = certificate.index;
                response = await authAxios.put(`http://localhost:5000/api/portfolios/certificates/${index}`, {
                    userId: localStorage.getItem('userId'),
                    certificate: formData
                });
            } else {
                // Add new certificate
                response = await authAxios.post(`http://localhost:5000/api/portfolios/certificates`, {
                    userId: localStorage.getItem('userId'),
                    certificate: formData
                });
            }

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: certificate ? 'Certificate updated successfully' : 'Certificate added successfully'
                });
                onSuccess(response.data);
            }
        } catch (error) {
            console.error('Error saving certificate:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to save certificate information'
            });
        }
    };

    return (
        <div className="certificate-form p-4 border rounded shadow-sm mb-4">
            <h4>{certificate ? 'Edit Certificate' : 'Add Certificate'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>Certificate Title*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., AWS Certified Solutions Architect"
                        list="certificateTitleSuggestions"
                        required
                    />
                    <datalist id="certificateTitleSuggestions">
                        {suggestions.certificateTitles.map((title, index) => (
                            <option key={index} value={title} />
                        ))}
                    </datalist>
                </div>
                <div className="mb-3">
                    <label>Issuing Organization*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="issuer"
                        value={formData.issuer}
                        onChange={handleChange}
                        placeholder="e.g., Amazon Web Services, Microsoft"
                        required
                    />
                </div>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label>Issue Date*</label>
                        <DatePicker
                            selected={formData.date}
                            onChange={(date) => handleDateChange(date, 'date')}
                            className="form-control date-input"
                            dateFormat="MM/yyyy"
                            showMonthYearPicker
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label>Expiration Date{!formData.hasExpiration ? ' (Not required)' : '*'}</label>
                        <DatePicker
                            selected={formData.expiration}
                            onChange={(date) => handleDateChange(date, 'expiration')}
                            className="form-control date-input"
                            dateFormat="MM/yyyy"
                            showMonthYearPicker
                            disabled={!formData.hasExpiration}
                            required={formData.hasExpiration}
                        />
                    </div>
                </div>
                <div className="mb-3 form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        name="hasExpiration"
                        checked={formData.hasExpiration}
                        onChange={handleChange}
                        id="hasExpiration"
                    />
                    <label className="form-check-label" htmlFor="hasExpiration">This certificate has an expiration date</label>
                </div>
                <div className="mb-3">
                    <label>Credential ID</label>
                    <input
                        type="text"
                        className="form-control"
                        name="credentialId"
                        value={formData.credentialId}
                        onChange={handleChange}
                        placeholder="e.g., ABC123456"
                    />
                </div>
                <div className="mb-3">
                    <label>Credential URL</label>
                    <input
                        type="url"
                        className="form-control"
                        name="credentialUrl"
                        value={formData.credentialUrl}
                        onChange={handleChange}
                        placeholder="e.g., https://example.com/verify/ABC123456"
                    />
                </div>
                <div className="mb-3">
                    <label>Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe what you learned, skills acquired, etc."
                    ></textarea>
                </div>
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {certificate ? 'Update Certificate' : 'Add Certificate'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CertificateForm;
