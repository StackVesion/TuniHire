import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { createAuthAxios } from '@/utils/authUtils';
import Swal from 'sweetalert2';

const CVPreviewModal = ({ show, onHide, portfolio, onSaveSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [generationStep, setGenerationStep] = useState('preparing');
    
    // Generate PDF when the modal is shown
    useEffect(() => {
        if (show) {
            generatePDF();
        }
    }, [show]);
    
    const generatePDF = async () => {
        setLoading(true);
        setGenerating(true);
        setGenerationStep('preparing');
        
        try {
            // Step 1: Prepare data
            setGenerationStep('formatting');
            await new Promise(resolve => setTimeout(resolve, 500)); // Just for visual effect
            
            // Step 2: Generate PDF
            setGenerationStep('generating');
            const authAxios = createAuthAxios();
            const response = await authAxios.post(
                `http://localhost:5000/api/portfolios/generate-cv`, 
                { userId: portfolio.userId }
            );
            
            // Step 3: Get the PDF URL
            if (response.data.success) {
                setPdfUrl(response.data.pdfUrl);
                setGenerationStep('complete');
            } else {
                throw new Error('Failed to generate CV');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Generation Failed',
                text: 'Failed to generate CV. Please try again.'
            });
            onHide();
        } finally {
            setGenerating(false);
            setLoading(false);
        }
    };
    
    const handleSave = async () => {
        setUploading(true);
        setGenerationStep('uploading');
        
        try {
            // Upload to Cloudinary
            const authAxios = createAuthAxios();
            const uploadResponse = await authAxios.post(
                `http://localhost:5000/api/portfolios/${portfolio._id}/upload-cv`,
                { pdfUrl: pdfUrl }
            );
            
            if (uploadResponse.data.success) {
                setGenerationStep('saved');
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'CV Saved!',
                    text: 'Your CV has been successfully generated and saved to your portfolio.'
                });
                
                // Call the success callback with the updated portfolio
                if (onSaveSuccess) {
                    onSaveSuccess(uploadResponse.data.portfolio);
                }
                
                // Close the modal
                onHide();
            } else {
                throw new Error('Failed to save CV');
            }
        } catch (error) {
            console.error('Error uploading CV:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: 'Failed to save CV to your portfolio. Please try again.'
            });
        } finally {
            setUploading(false);
        }
    };
    
    const renderGenerationSteps = () => {
        return (
            <div className="generation-steps mb-3">
                <div className="step-item">
                    <div className={`step-circle ${generationStep === 'preparing' ? 'active' : generationStep !== 'preparing' ? 'completed' : ''}`}>
                        {generationStep === 'preparing' ? <Spinner animation="border" size="sm" /> : '✓'}
                    </div>
                    <div className="step-label">Preparing Data</div>
                </div>
                <div className="step-line"></div>
                
                <div className="step-item">
                    <div className={`step-circle ${generationStep === 'formatting' ? 'active' : generationStep === 'generating' || generationStep === 'complete' || generationStep === 'uploading' || generationStep === 'saved' ? 'completed' : ''}`}>
                        {generationStep === 'formatting' ? <Spinner animation="border" size="sm" /> : generationStep === 'formatting' || generationStep === 'generating' || generationStep === 'complete' || generationStep === 'uploading' || generationStep === 'saved' ? '✓' : ''}
                    </div>
                    <div className="step-label">Formatting Template</div>
                </div>
                <div className="step-line"></div>
                
                <div className="step-item">
                    <div className={`step-circle ${generationStep === 'generating' ? 'active' : generationStep === 'complete' || generationStep === 'uploading' || generationStep === 'saved' ? 'completed' : ''}`}>
                        {generationStep === 'generating' ? <Spinner animation="border" size="sm" /> : generationStep === 'complete' || generationStep === 'uploading' || generationStep === 'saved' ? '✓' : ''}
                    </div>
                    <div className="step-label">Generating PDF</div>
                </div>
                <div className="step-line"></div>
                
                <div className="step-item">
                    <div className={`step-circle ${generationStep === 'uploading' ? 'active' : generationStep === 'saved' ? 'completed' : ''}`}>
                        {generationStep === 'uploading' ? <Spinner animation="border" size="sm" /> : generationStep === 'saved' ? '✓' : ''}
                    </div>
                    <div className="step-label">Saving to Portfolio</div>
                </div>
            </div>
        );
    };
    
    return (
        <Modal 
            show={show} 
            onHide={onHide}
            size="lg"
            centered
            backdrop="static"
            keyboard={!generating && !uploading}
        >
            <Modal.Header closeButton={!generating && !uploading}>
                <Modal.Title>CV Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading || generating ? (
                    <div className="text-center py-5">
                        <div className="mb-3">
                            <Spinner animation="border" variant="primary" />
                        </div>
                        <h4 className="mb-4">Generating your CV</h4>
                        {renderGenerationSteps()}
                    </div>
                ) : (
                    <>
                        {uploading && (
                            <div className="upload-overlay">
                                <Spinner animation="border" variant="light" />
                                <p>Uploading to Cloudinary...</p>
                            </div>
                        )}
                        <div className="pdf-container">
                            <iframe 
                                src={`${pdfUrl}#toolbar=0`} 
                                title="CV Preview" 
                                width="100%" 
                                height="500px" 
                                className="pdf-iframe"
                            />
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={onHide}
                    disabled={generating || uploading}
                >
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSave}
                    disabled={generating || uploading || !pdfUrl}
                >
                    {uploading ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                            <span className="ms-2">Saving...</span>
                        </>
                    ) : 'Save to Portfolio'}
                </Button>
            </Modal.Footer>
            
            <style jsx>{`
                .pdf-container {
                    width: 100%;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .pdf-iframe {
                    border: none;
                }
                .upload-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    z-index: 1000;
                }
                .generation-steps {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 2rem;
                }
                .step-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                }
                .step-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #f8f9fa;
                    border: 2px solid #dee2e6;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .step-circle.active {
                    border-color: #007bff;
                    background-color: #e7f1ff;
                }
                .step-circle.completed {
                    border-color: #28a745;
                    background-color: #e7ffe7;
                    color: #28a745;
                }
                .step-label {
                    font-size: 0.875rem;
                    color: #6c757d;
                    text-align: center;
                    max-width: 100px;
                }
                .step-line {
                    flex-grow: 1;
                    height: 2px;
                    background-color: #dee2e6;
                    position: relative;
                    z-index: 1;
                }
            `}</style>
        </Modal>
    );
};

export default CVPreviewModal;
