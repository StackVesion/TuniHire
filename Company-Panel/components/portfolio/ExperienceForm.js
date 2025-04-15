import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import suggestions from '../../data/suggestions.json';
import { createAuthAxios } from '@/utils/authUtils';

const ExperienceForm = ({ portfolioId, experience = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        company: '',
        position: '',
        location: '',
        startDate: null,
        endDate: null,
        description: '',
        current: false
    });

    // If experience is provided, populate the form for editing
    useEffect(() => {
        if (experience) {
            setFormData({
                company: experience.company || '',
                position: experience.position || '',
                location: experience.location || '',
                startDate: experience.startDate ? new Date(experience.startDate) : null,
                endDate: experience.endDate ? new Date(experience.endDate) : null,
                description: experience.description || '',
                current: experience.current || false
            });
        }
    }, [experience]);

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
        if (!formData.company) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Company name is required'
            });
            return false;
        }
        if (!formData.position) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Position is required'
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
                text: 'End date is required unless currently working'
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
            if (experience) {
                // Update existing experience
                const index = experience.index;
                response = await authAxios.put(`http://localhost:5000/api/portfolios/${portfolioId}/experience/${index}`, formData);
            } else {
                // Add new experience
                response = await authAxios.post(`http://localhost:5000/api/portfolios/${portfolioId}/experience`, formData);
            }

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: experience ? 'Experience updated successfully' : 'Experience added successfully'
                });
                onSuccess(response.data.portfolio);
            }
        } catch (error) {
            console.error('Error saving experience:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save experience information'
            });
        }
    };

    return (
        <div className="experience-form p-4 border rounded shadow-sm mb-4">
            <h4>{experience ? 'Edit Experience' : 'Add Experience'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>Company*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="e.g., Google, Microsoft"
                        list="companySuggestions"
                        required
                    />
                    <datalist id="companySuggestions">
                        {suggestions.companies.map((company, index) => (
                            <option key={index} value={company} />
                        ))}
                    </datalist>
                </div>
                <div className="mb-3">
                    <label>Position*</label>
                    <input
                        type="text"
                        className="form-control"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="e.g., Software Engineer, Project Manager"
                        list="positionSuggestions"
                        required
                    />
                    <datalist id="positionSuggestions">
                        {suggestions.positions.map((position, index) => (
                            <option key={index} value={position} />
                        ))}
                    </datalist>
                </div>
                <div className="mb-3">
                    <label>Location</label>
                    <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., San Francisco, CA or Remote"
                        list="locationSuggestions"
                    />
                    <datalist id="locationSuggestions">
                        {suggestions.locations.map((location, index) => (
                            <option key={index} value={location} />
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
                        id="currentJob"
                    />
                    <label className="form-check-label" htmlFor="currentJob">I currently work here</label>
                </div>
                <div className="mb-3">
                    <label>Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe your responsibilities, achievements, etc."
                    ></textarea>
                </div>
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {experience ? 'Update Experience' : 'Add Experience'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExperienceForm;
