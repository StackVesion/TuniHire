import { useState } from 'react';
import Link from 'next/link';

const PortfolioGuide = ({ currentStep, onStepComplete }) => {
    const steps = [
        { id: 'about', title: 'About You', description: 'Add basic information about yourself' },
        { id: 'education', title: 'Education', description: 'Add your educational background' },
        { id: 'experience', title: 'Experience', description: 'Add your work experience' },
        { id: 'skills', title: 'Skills', description: 'Add your professional skills' },
        { id: 'certificates', title: 'Certificates', description: 'Add your certifications' },
        { id: 'cv', title: 'Generate CV', description: 'Create your professional CV' },
    ];

    // Find current step index
    const currentIndex = steps.findIndex(step => step.id === currentStep);

    return (
        <div className="portfolio-guide-container">
            <div className="card">
                <div className="card-body">
                    <h5 className="mb-4">Portfolio Creation Guide</h5>
                    
                    <div className="progress mb-4">
                        <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${Math.max((currentIndex / (steps.length - 1)) * 100, 10)}%` }} 
                            aria-valuenow={Math.max((currentIndex / (steps.length - 1)) * 100, 10)} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                        >
                            {Math.round(Math.max((currentIndex / (steps.length - 1)) * 100, 10))}%
                        </div>
                    </div>
                    
                    <div className="step-list">
                        {steps.map((step, index) => (
                            <div 
                                key={step.id} 
                                className={`step-item ${index < currentIndex ? 'completed' : ''} ${index === currentIndex ? 'active' : ''}`}
                            >
                                <div className="step-indicator">
                                    {index < currentIndex ? (
                                        <i className="fi-rr-check"></i>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <div className="step-content">
                                    <h6 className="mb-0">{step.title}</h6>
                                    <p className="text-muted small mb-0">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {currentIndex > 0 && currentIndex < steps.length - 1 && (
                        <div className="text-center mt-4">
                            <button 
                                onClick={() => onStepComplete(steps[currentIndex + 1].id)}
                                className="btn btn-primary btn-sm"
                            >
                                Next: {steps[currentIndex + 1].title}
                            </button>
                        </div>
                    )}
                    
                    {currentIndex === steps.length - 1 && (
                        <div className="text-center mt-4">
                            <button 
                                onClick={() => onStepComplete('completed')}
                                className="btn btn-success btn-sm"
                            >
                                Finish
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .portfolio-guide-container {
                    margin-bottom: 30px;
                    position: sticky;
                    top: 20px;
                }
                .step-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .step-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 12px;
                    border-radius: 8px;
                    position: relative;
                    transition: all 0.3s ease;
                }
                .step-item.active {
                    background: rgba(0, 123, 255, 0.1);
                    box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.2);
                }
                .step-item.completed {
                    opacity: 0.7;
                }
                .step-indicator {
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #f0f0f0;
                    color: #555;
                    font-weight: 500;
                }
                .step-item.active .step-indicator {
                    background: #007bff;
                    color: white;
                }
                .step-item.completed .step-indicator {
                    background: #28a745;
                    color: white;
                }
                .step-content {
                    flex: 1;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .step-item {
                    animation: fadeInUp 0.5s ease-out;
                    animation-fill-mode: both;
                }
                .step-item:nth-child(1) { animation-delay: 0.1s; }
                .step-item:nth-child(2) { animation-delay: 0.2s; }
                .step-item:nth-child(3) { animation-delay: 0.3s; }
                .step-item:nth-child(4) { animation-delay: 0.4s; }
                .step-item:nth-child(5) { animation-delay: 0.5s; }
                .step-item:nth-child(6) { animation-delay: 0.6s; }
            `}</style>
        </div>
    );
};

export default PortfolioGuide;
