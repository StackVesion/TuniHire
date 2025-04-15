import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CertificateForm from './CertificateForm';
import { createAuthAxios } from '@/utils/authUtils';

const CertificateSection = ({ portfolio, userId, onUpdate, onRemove }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState(null);

    const handleAddCertificate = () => {
        setEditingCertificate(null);
        setShowForm(true);
    };

    const handleEditCertificate = (certificate, index) => {
        setEditingCertificate({ ...certificate, index });
        setShowForm(true);
    };

    const handleCertificateSuccess = (response) => {
        // Certificate endpoint may return different structure
        if (response.portfolio) {
            onUpdate(response.portfolio);
        } else {
            // Force a refresh
            onUpdate(null, true);
        }
        setShowForm(false);
        setEditingCertificate(null);
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
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const authAxios = createAuthAxios();
                    const response = await authAxios.delete(`http://localhost:5000/api/portfolios/${portfolio._id}/certificates/${index}`);
                    
                    if (response.data.success) {
                        onRemove(index);
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Your certificate has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    console.error('Error removing certificate:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete certificate'
                    });
                }
            }
        });
    };

    return (
        <div className="dashboard-list-block mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Certificates</h4>
                <button onClick={handleAddCertificate} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Certificate
                </button>
            </div>
            
            {/* Display Certificate Form when adding/editing */}
            {showForm && (
                <CertificateForm 
                    portfolioId={portfolio._id}
                    certificate={editingCertificate}
                    onSuccess={handleCertificateSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
            
            {/* Display Certificate List */}
            {portfolio.certificates && portfolio.certificates.length > 0 ? (
                <ul className="dashboard-list">
                    {portfolio.certificates.map((cert, index) => (
                        <li key={index} className="dashboard-list-item portfolio-item">
                            <div className="dashboard-list-item-content">
                                <h5 className="mb-2">{cert.title}</h5>
                                <p className="mb-1">Issued by {cert.issuer}</p>
                                <p className="text-muted small mb-2">
                                    Issued: {new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                    {cert.expiration && ` • Expires: ${new Date(cert.expiration).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}
                                </p>
                                {cert.credentialId && <p className="mb-1 small">Credential ID: {cert.credentialId}</p>}
                                {cert.credentialUrl && (
                                    <p className="mb-1 small">
                                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                                            View Credential
                                        </a>
                                    </p>
                                )}
                            </div>
                            <div className="dashboard-list-item-actions">
                                <button 
                                    onClick={() => handleEditCertificate(cert, index)} 
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
                    <p className="mb-0 text-muted">No certificates added yet. Click "Add Certificate" to get started.</p>
                </div>
            )}
        </div>
    );
};

export default CertificateSection;
