import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

const ProfileVerificationModal = ({ show, onHide, onVerificationSuccess }) => {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCapturing, setIsCapturing] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [cameraPermission, setCameraPermission] = useState('pending'); // 'pending', 'granted', 'denied'

    // Camera constraints
    const videoConstraints = {
        width: 480,
        height: 480,
        facingMode: "user"
    };

    // Effect to check camera permissions
    useEffect(() => {
        if (show) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(() => setCameraPermission('granted'))
                .catch((err) => {
                    console.error('Camera permission error:', err);
                    setCameraPermission('denied');
                    setError('Camera access was denied. Please enable camera access and try again.');
                });
        }
    }, [show]);

    // Function to capture image
    const captureImage = useCallback(() => {
        setCountdown(3);
        
        const countdownInterval = setInterval(() => {
            setCountdown(prevCount => {
                if (prevCount <= 1) {
                    clearInterval(countdownInterval);
                    
                    // Take the picture
                    const imageSrc = webcamRef.current?.getScreenshot();
                    if (imageSrc) {
                        setCapturedImage(imageSrc);
                        setIsCapturing(false);
                    } else {
                        setError('Failed to capture image. Please try again.');
                    }
                    return null;
                }
                return prevCount - 1;
            });
        }, 1000);
    }, [webcamRef]);

    // Function to retake the photo
    const retakePhoto = () => {
        setCapturedImage(null);
        setIsCapturing(true);
        setError(null);
    };

    // Function to submit the verification
    const submitVerification = async () => {
        if (!capturedImage) {
            setError('Please capture your photo first');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Convert base64 image to a Blob
            const base64Data = capturedImage.split(',')[1];
            const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
            
            // Create FormData and append the image
            const formData = new FormData();
            formData.append('verificationImage', blob, 'verification.jpg');

            // Get the token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please sign in again.');
            }

            // Send the verification request to the server
            const response = await axios.post(
                '/api/auth/verify-profile', 
                formData, 
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Handle success
            if (response.status === 200) {
                onVerificationSuccess(response.data.user);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to verify profile');
        } finally {
            setIsUploading(false);
        }
    };

    // Function to close modal and reset state
    const handleClose = () => {
        setCapturedImage(null);
        setIsCapturing(true);
        setError(null);
        setIsUploading(false);
        setCameraPermission('pending');
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            size="lg"
            className="verification-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>Profile Verification</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-4">
                    <p className="mb-3">
                        Verify your account by taking a photo of yourself. This helps us ensure 
                        the authenticity of profiles on our platform.
                    </p>
                    
                    {error && (
                        <div className="alert alert-danger">{error}</div>
                    )}

                    {cameraPermission === 'denied' && (
                        <div className="alert alert-warning">
                            <i className="fi-rr-exclamation mr-2"></i>
                            Camera access is required for verification. Please allow camera access in your browser settings.
                        </div>
                    )}

                    {cameraPermission === 'granted' && (
                        <div className="verification-camera-container">
                            {isCapturing ? (
                                <div className="camera-wrapper">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={videoConstraints}
                                        className="verification-camera"
                                    />
                                    {countdown && (
                                        <div className="countdown-overlay">
                                            <div className="countdown-number">{countdown}</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="captured-image-container">
                                    <img 
                                        src={capturedImage} 
                                        alt="Verification" 
                                        className="captured-image"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {cameraPermission === 'pending' && (
                        <div className="d-flex justify-content-center my-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button 
                    className="btn btn-outline-primary" 
                    onClick={handleClose}
                    disabled={isUploading}
                >
                    Cancel
                </button>
                
                {isCapturing ? (
                    <button 
                        className="btn btn-primary" 
                        onClick={captureImage}
                        disabled={cameraPermission !== 'granted' || countdown !== null}
                    >
                        {countdown !== null ? `Taking photo in ${countdown}...` : 'Take Photo'}
                    </button>
                ) : (
                    <>
                        <button 
                            className="btn btn-outline-secondary" 
                            onClick={retakePhoto}
                            disabled={isUploading}
                        >
                            Retake Photo
                        </button>
                        <button 
                            className="btn btn-success" 
                            onClick={submitVerification}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit for Verification'
                            )}
                        </button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default ProfileVerificationModal;