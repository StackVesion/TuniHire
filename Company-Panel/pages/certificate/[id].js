import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { createAuthAxios } from '../../utils/authUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Initialize auth axios instance
const authAxios = createAuthAxios();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CertificatePage() {
  const router = useRouter();
  const { id } = router.query;

  // State variables
  const [certificate, setCertificate] = useState(null);
  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch certificate data when component mounts
  useEffect(() => {
    if (id) {
      fetchCertificateData();
      // Get user info from local storage
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    }
  }, [id]);

  // Function to fetch certificate data
  const fetchCertificateData = async () => {
    setLoading(true);
    try {
      // Try to get certificate from API
      try {
        console.log(`Fetching certificate from ${API_BASE_URL}/api/certificates/${id}`);
        const response = await authAxios.get(`${API_BASE_URL}/api/certificates/${id}`);
        setCertificate(response.data);
        
        // Also fetch the course data
        if (response.data.courseId) {
          const courseResponse = await authAxios.get(`${API_BASE_URL}/api/courses/${response.data.courseId}`);
          setCourse(courseResponse.data);
        }
      } catch (apiError) {
        console.warn('API not available for certificates, using mock data', apiError);
        // Use mock data as fallback
        const mockData = generateMockCertificate(id);
        setCertificate(mockData.certificate);
        setCourse(mockData.course);
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      setError('Failed to load certificate. Please try again later.');
      
      // Fallback to mock data
      const mockData = generateMockCertificate(id);
      setCertificate(mockData.certificate);
      setCourse(mockData.course);
    } finally {
      setLoading(false);
    }
  };

  // Function to download certificate as PDF
  const downloadCertificate = () => {
    const element = document.getElementById('certificate-container');
    
    if (!element) return;
    
    html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      
      // A4 size: 210 x 297 mm
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      
      // Calculate dimensions to maintain aspect ratio
      let imgWidth = pdfWidth - 20; // 10mm margin on each side
      let imgHeight = imgWidth / ratio;
      
      // If height exceeds page height, adjust dimensions
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * ratio;
      }
      
      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`TuniHire_Certificate_${certificate.certificateNumber || id}.pdf`);
      
      Swal.fire({
        title: 'Success!',
        text: 'Certificate downloaded successfully',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
    });
  };

  // Generate a mock certificate for development/testing
  const generateMockCertificate = (certificateId) => {
    // Determine which mock data to return based on ID
    if (certificateId === 'c1') {
      return {
        certificate: {
          _id: 'c1',
          certificateNumber: 'TH-2025-ABCDE-1234',
          userId: 'u1',
          courseId: 'course1',
          issuedDate: new Date().toISOString(),
          completionDate: new Date().toISOString(),
          skills: ['HTML', 'CSS', 'JavaScript', 'React'],
          grade: 'A',
          score: 95,
          status: 'issued'
        },
        course: {
          _id: 'course1',
          title: 'Web Development Fundamentals',
          description: 'Learn the core fundamentals of web development',
          instructor: {
            name: 'John Smith'
          }
        }
      };
    } else {
      return {
        certificate: {
          _id: 'default',
          certificateNumber: 'TH-2025-12345-6789',
          userId: 'u1',
          courseId: 'course2',
          issuedDate: new Date().toISOString(),
          completionDate: new Date().toISOString(),
          skills: ['Skill 1', 'Skill 2', 'Skill 3'],
          grade: 'B',
          score: 85,
          status: 'issued'
        },
        course: {
          _id: 'course2',
          title: 'Sample Course',
          description: 'This is a sample course',
          instructor: {
            name: 'Instructor Name'
          }
        }
      };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading certificate...</p>
        </div>
      </Layout>
    );
  }

  if (error || !certificate || !course) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="alert alert-danger">
            {error || 'Certificate not found'}
          </div>
          <Link href="/Course">
            <button className="btn btn-primary">Back to Courses</button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="certificate-page py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold">Certificate of Completion</h1>
            <p className="lead">Congratulations on completing the course!</p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-md-10">
              <div className="certificate-actions d-flex justify-content-end mb-3">
                <button 
                  className="btn btn-primary me-2" 
                  onClick={downloadCertificate}
                >
                  <i className="fas fa-download me-2"></i> Download PDF
                </button>
                <Link href={`/course/${certificate.courseId}`}>
                  <button className="btn btn-outline-primary">
                    <i className="fas fa-arrow-left me-2"></i> Back to Course
                  </button>
                </Link>
              </div>
              
              <div 
                id="certificate-container" 
                className="certificate-container p-5 bg-white shadow-lg border"
                style={{ borderRadius: '10px' }}
              >
                <div className="certificate-header text-center mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="logo">
                      <img src="/images/logo/logo.svg" alt="TuniHire Logo" height="60" />
                    </div>
                    <div className="certificate-number">
                      <span className="text-muted">Certificate #: </span>
                      <span className="fw-bold">{certificate.certificateNumber}</span>
                    </div>
                  </div>
                  <h2 className="certificate-title display-6">Certificate of Completion</h2>
                </div>
                
                <div className="certificate-body text-center mb-5">
                  <p className="mb-4">This is to certify that</p>
                  <h3 className="recipient-name display-5 fw-bold mb-4">
                    {user?.fullname || user?.firstName + ' ' + user?.lastName || 'Student Name'}
                  </h3>
                  <p className="mb-4">has successfully completed the course</p>
                  <h4 className="course-name display-6 fw-bold mb-4" style={{ color: '#007bff' }}>
                    {course.title}
                  </h4>
                  <p className="course-description mb-4">
                    {course.description.substring(0, 120)}...
                  </p>
                  
                  <div className="certificate-details mt-5">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="certificate-detail-item">
                          <div className="detail-icon mb-2">
                            <i className="fas fa-calendar-alt fa-2x text-primary"></i>
                          </div>
                          <div className="detail-label text-muted">Completion Date</div>
                          <div className="detail-value fw-bold">
                            {new Date(certificate.completionDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="certificate-detail-item">
                          <div className="detail-icon mb-2">
                            <i className="fas fa-award fa-2x text-primary"></i>
                          </div>
                          <div className="detail-label text-muted">Grade</div>
                          <div className="detail-value fw-bold">
                            {certificate.grade} ({certificate.score}%)
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="certificate-detail-item">
                          <div className="detail-icon mb-2">
                            <i className="fas fa-user-tie fa-2x text-primary"></i>
                          </div>
                          <div className="detail-label text-muted">Instructor</div>
                          <div className="detail-value fw-bold">
                            {course.instructor.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="certificate-skills my-5">
                  <h5 className="text-center mb-3">Skills Acquired</h5>
                  <div className="d-flex justify-content-center flex-wrap">
                    {certificate.skills.map((skill, index) => (
                      <span key={index} className="badge bg-light text-dark m-1 p-2">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="certificate-footer mt-5">
                  <div className="row align-items-center">
                    <div className="col-md-6 text-center">
                      <div className="signature mb-2">
                        <img src="/images/signature.png" alt="Signature" height="60" />
                      </div>
                      <div className="signature-name fw-bold">Ahmed Ben Ali</div>
                      <div className="signature-title text-muted">CEO, TuniHire</div>
                    </div>
                    <div className="col-md-6 text-center">
                      <div className="qr-code mb-2">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://tunihire.com/verify-certificate/${certificate.certificateNumber}`} 
                          alt="Verification QR Code" 
                          height="100" 
                        />
                      </div>
                      <div className="verification-text text-muted">
                        Scan to verify certificate authenticity
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="certificate-info mt-5">
                <div className="card">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Certificate Information</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <h6>Course Details</h6>
                          <p><strong>Title:</strong> {course.title}</p>
                          <p><strong>Instructor:</strong> {course.instructor.name}</p>
                          <p><strong>Category:</strong> {course.category || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <h6>Certificate Details</h6>
                          <p><strong>Certificate ID:</strong> {certificate.certificateNumber}</p>
                          <p><strong>Issued Date:</strong> {new Date(certificate.issuedDate).toLocaleDateString()}</p>
                          <p><strong>Status:</strong> <span className="badge bg-success">{certificate.status}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h6>Share Your Achievement</h6>
                      <div className="d-flex mt-2">
                        <button className="btn btn-outline-primary me-2">
                          <i className="fab fa-linkedin"></i> LinkedIn
                        </button>
                        <button className="btn btn-outline-primary me-2">
                          <i className="fab fa-facebook"></i> Facebook
                        </button>
                        <button className="btn btn-outline-primary">
                          <i className="fab fa-twitter"></i> Twitter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .certificate-container {
          background-image: url('/images/certificate-bg.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          overflow: hidden;
          min-height: 650px;
        }
        
        .certificate-container:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          z-index: 0;
        }
        
        .certificate-container > * {
          position: relative;
          z-index: 1;
        }
        
        .certificate-title {
          position: relative;
          display: inline-block;
        }
        
        .certificate-title:after {
          content: '';
          position: absolute;
          width: 100px;
          height: 3px;
          background-color: #007bff;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .recipient-name {
          font-family: 'Playfair Display', serif;
          color: #333;
        }
        
        .certificate-detail-item {
          padding: 1rem;
          border-radius: 8px;
          background-color: rgba(248, 249, 250, 0.7);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .signature {
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 10px;
          width: 80%;
          margin: 0 auto;
        }
      `}</style>
    </Layout>
  );
}
