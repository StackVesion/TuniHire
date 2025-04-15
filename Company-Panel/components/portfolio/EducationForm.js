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
        description: '',
        current: false
    });

    // If education is provided, populate the form for editing
    useEffect(() => {
        if (education) {
            setFormData({
                school: education.school || '',
                degree: education.degree || '',
                fieldOfStudy: education.fieldOfStudy || '',
                startDate: education.startDate ? new Date(education.startDate) : null,
                endDate: education.endDate ? new Date(education.endDate) : null,
                description: education.description || '',
                current: education.current || false
            });
        }
    }, [education]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // If current is checked, clear end date
        if (name === 'current' && checked) {
            setFormData(prev => ({ ...prev, endDate: null }));
        }
    };

    const handleDateChange = (date, field) => {
        setFormData(prev => ({ ...prev, [field]: date }));
    };

    const validateForm = () => {
        if (!formData.school) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'School name is required'
            });
            return false;
        }
        if (!formData.degree) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Degree is required'
            });
            return false;
        }
        if (!formData.fieldOfStudy) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Field of study is required'
            });
            return false;
        }
        if (!formData.startDate) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Start date is required'
            });
            return false;
        }
        if (!formData.current && !formData.endDate) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'End date is required unless currently studying'
            });
            return false;
        }
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'End date cannot be earlier than start date'
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
            if (education) {
                // Update existing education
                const index = education.index;
                response = await authAxios.put(`http://localhost:5000/api/portfolios/${portfolioId}/education/${index}`, formData);
            } else {
                // Add new education
                response = await authAxios.post(`http://localhost:5000/api/portfolios/${portfolioId}/education`, formData);
            }

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: education ? 'Education updated successfully' : 'Education added successfully'
                });
                onSuccess(response.data.portfolio);
            }
        } catch (error) {
            console.error('Error saving education:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save education information'
            });
        }
    };

    return (
        <div className="education-form p-4 border rounded shadow-sm mb-4">
            <h4>{education ? 'Edit Education' : 'Add Education'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>School/University*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        placeholder="e.g., Stanford University"
                        list="schoolSuggestions"
                        required
                    />
                    <datalist id="schoolSuggestions">
                        {suggestions.schools.map((school, index) => (
                            <option key={index} value={school} />
                        ))}
                    </datalist>
                </div>
                <div className="mb-3">
                    <label>Degree*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="degree"
                        value={formData.degree}
                        onChange={handleChange}
                        placeholder="e.g., Bachelor's, Master's, PhD"
                        list="degreeSuggestions"
                        required
                    />
                    <datalist id="degreeSuggestions">
                        {suggestions.degrees.map((degree, index) => (
                            <option key={index} value={degree} />
                        ))}
                    </datalist>
                </div>
                <div className="mb-3">
                    <label>Field of Study*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="fieldOfStudy"
                        value={formData.fieldOfStudy}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science, Business Administration"
                        list="fieldSuggestions"
                        required
                    />
                    <datalist id="fieldSuggestions">
                        {suggestions.fieldsOfStudy.map((field, index) => (
                            <option key={index} value={field} />
                        ))}
                    </datalist>
                </div>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label>Start Date*</label>
                        <DatePicker
                            selected={formData.startDate}
                            onChange={(date) => handleDateChange(date, 'startDate')}
                            className="form-control date-input"
                            dateFormat="MM/yyyy"
                            showMonthYearPicker
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label>End Date{formData.current ? ' (Not required)' : '*'}</label>
                        <DatePicker
                            selected={formData.endDate}
                            onChange={(date) => handleDateChange(date, 'endDate')}
                            className="form-control date-input"
                            dateFormat="MM/yyyy"
                            showMonthYearPicker
                            disabled={formData.current}
                            required={!formData.current}
                        />
                    </div>
                </div>
                <div className="mb-3 form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        name="current"
                        checked={formData.current}
                        onChange={handleChange}
                        id="currentEducation"
                    />
                    <label className="form-check-label" htmlFor="currentEducation">I am currently studying here</label>
                </div>
                <div className="mb-3">
                    <label>Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe your studies, achievements, etc."
                    ></textarea>
                </div>
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {education ? 'Update Education' : 'Add Education'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EducationForm;
