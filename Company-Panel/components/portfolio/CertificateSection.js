import { useState } from 'react';
import Swal from 'sweetalert2';
import CertificateForm from './CertificateForm';
import ItemPagination from './ItemPagination';
import { createAuthAxios } from '@/utils/authUtils';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

    const handleFormSuccess = (updatedPortfolio) => {
        onUpdate(updatedPortfolio);
        setShowForm(false);
        setEditingCertificate(null);
    };

    const handleRemoveCertificate = async (index) => {
        try {
            const authAxios = createAuthAxios();
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
                        const response = await authAxios.delete(
                            `${apiUrl}/api/portfolios/${portfolio._id}/certificates/${index}`
                        );

                        if (response.data.success) {
                            onRemove(index);
                            Swal.fire({
                                icon: 'success',
                                title: 'Deleted!',
                                text: 'Certificate has been deleted.',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        }
                    } catch (error) {
                        console.error('Error deleting certificate:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to delete certificate'
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error deleting certificate:', error);
        }
    };

    // Certificate item renderer for pagination
    const renderCertificateItem = (certificate, localIndex) => {
        const index = portfolio.certificates.findIndex(c => c === certificate);
        return (
            <div key={localIndex} className="certificate-card-container animate__animated animate__fadeIn">
                <div className="card certificate-card h-100">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 className="card-title">{certificate.title}</h5>
                                <h6 className="card-subtitle mb-2 text-muted">
                                    {certificate.date && (
                                        <span className="ms-2">
                                            ({new Date(certificate.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })})
                                        </span>
                                    )}
                                </h6>
                            </div>
                            <div className="certificate-badge">
                                <i className="fi-rr-diploma certificate-icon"></i>
                            </div>
                        </div>
                        
                        {certificate.description && (
                            <p className="card-text mt-3">{certificate.description}</p>
                        )}
                        
                        {certificate.skills && certificate.skills.length > 0 && (
                            <div className="mt-3">
                                <p className="text-muted mb-1 small">Related skills:</p>
                                <div className="d-flex flex-wrap gap-1">
                                    {certificate.skills.map((skill, i) => (
                                        <span key={i} className="badge bg-light text-dark border">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {certificate.credentialURL && (
                            <div className="mt-3">
                                <a 
                                    href={certificate.credentialURL} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    <i className="fi-rr-link me-1"></i> View Certificate
                                </a>
                            </div>
                        )}
                        {certificate.certificateUrl && !certificate.credentialURL && (
                            <div className="mt-3">
                                <a 
                                    href={certificate.certificateUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    <i className="fi-rr-link me-1"></i> View Certificate
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="card-footer">
                        <div className="d-flex justify-content-end">
                            <button 
                                onClick={() => handleEditCertificate(certificate, index)} 
                                className="btn btn-sm btn-outline-primary me-2"
                            >
                                <i className="fi-rr-edit"></i>
                            </button>
                            <button 
                                onClick={() => handleRemoveCertificate(index)} 
                                className="btn btn-sm btn-outline-danger"
                            >
                                <i className="fi-rr-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-list-block section-block mt-5">
            <div className="section-header d-flex justify-content-between align-items-center mb-4">
                <h4>Certifications</h4>
                <button onClick={handleAddCertificate} className="btn btn-primary btn-sm">
                    <i className="fi-rr-plus me-1"></i> Add Certificate
                </button>
            </div>

            {showForm && (
                <CertificateForm
                    portfolioId={portfolio._id}
                    certificate={editingCertificate}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {portfolio.certificates && portfolio.certificates.length > 0 ? (
                <div className="certificate-display-container">
                    <ItemPagination
                        items={portfolio.certificates}
                        renderItem={renderCertificateItem}
                        itemsPerPage={2}
                        autoScroll={true}
                        autoScrollInterval={3000}
                    />
                </div>
            ) : (
                <div className="text-center py-4 border rounded">
                    <p className="mb-0 text-muted">No certifications added yet. Click "Add Certificate" to get started.</p>
                </div>
            )}

            <style jsx>{`
                .certificate-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border-radius: 8px;
                    overflow: hidden;
                    width: 100%;
                    margin: 0 auto;
                }
                .certificate-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                }
                .certificate-badge {
                    background-color: #f8f9fa;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 10px;
                }
                .certificate-icon {
                    color: #007bff;
                    font-size: 1.2rem;
                }
                .section-block {
                    position: relative;
                    padding: 25px;
                    border-radius: 10px;
                    background-color: white;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
                    margin-bottom: 30px;
                }
                .section-header {
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 25px;
                }
                .section-header h4 {
                    font-weight: 600;
                    margin-bottom: 0;
                    color: #333;
                }
                .certificate-card-container {
                    min-height: 300px;
                }
                .certificate-display-container {
                    margin: 0 auto;
                    max-width: 900px;
                }
            `}</style>
        </div>
    );
};

export default CertificateSection;
