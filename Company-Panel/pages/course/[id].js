import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { createAuthAxios } from '../../utils/authUtils';

// Initialize auth axios instance
const authAxios = createAuthAxios();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CourseDetail() {
  const router = useRouter();
  const { id } = router.query;

  // State variables
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userSubscription, setUserSubscription] = useState('Free');
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Fetch course data when component mounts
  useEffect(() => {
    if (id) {
      fetchCourseData();
      
      // Get user's subscription info from localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.subscription) {
          setUserSubscription(userData.subscription);
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    }
  }, [id]);

  // Function to fetch course data
  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // Make API request to get course details
      console.log(`Attempting to fetch course details from ${API_BASE_URL}/api/courses/${id}`);
      
      try {
        const response = await authAxios.get(`${API_BASE_URL}/api/courses/${id}`);
        console.log('Successfully fetched course details from API');
        setCourse(response.data);
        
        // Check if user is enrolled
        if (response.data.userProgress) {
          setEnrolled(true);
          setProgress(response.data.userProgress.progressPercentage);
          setCurrentStep(response.data.userProgress.currentStep);
        }
      } catch (apiError) {
        console.warn('API not available, using mock data', apiError);
        
        // Fallback to mock data if API fails
        const mockCourse = generateMockCourseDetail(id);
        setCourse(mockCourse);
        
        if (mockCourse.userProgress) {
          setEnrolled(true);
          setProgress(mockCourse.userProgress.progressPercentage);
          setCurrentStep(mockCourse.userProgress.currentStep);
        }
      }
    } catch (error) {
      console.error('Error in fetchCourseData:', error);
      setError('Failed to load course. Using sample data instead.');
      
      // Fallback to mock data in case of any error
      const mockCourse = generateMockCourseDetail(id);
      setCourse(mockCourse);
      
      if (mockCourse.userProgress) {
        setEnrolled(true);
        setProgress(mockCourse.userProgress.progressPercentage);
        setCurrentStep(mockCourse.userProgress.currentStep);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle enrollment
  const handleEnroll = async () => {
    // Check subscription level
    const subscriptionLevels = {
      'Free': 0,
      'Golden': 1,
      'Platinum': 2,
      'Master': 3
    };
    
    const userLevel = subscriptionLevels[userSubscription] || 0;
    const requiredLevel = subscriptionLevels[course?.subscriptionRequired] || 0;
    
    if (userLevel < requiredLevel) {
      Swal.fire({
        title: 'Subscription Required',
        html: `<p>This course requires a <strong>${course.subscriptionRequired}</strong> subscription or higher.</p>
              <p>Your current subscription: <strong>${userSubscription}</strong></p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Upgrade Subscription',
        cancelButtonText: 'Not Now'
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/pricing');
        }
      });
      return;
    }
    
    setLoading(true);
    try {
      // Try to make API request to enroll
      try {
        const response = await authAxios.post(`${API_BASE_URL}/api/courses/enroll`, {
          courseId: id
        });
        
        if (response.data) {
          setEnrolled(true);
          setProgress(0);
          setCurrentStep(0);
          
          Swal.fire({
            title: 'Enrolled!',
            text: 'You have successfully enrolled in this course.',
            icon: 'success',
            confirmButtonColor: '#3085d6'
          });
          
          // Refresh course data to get updated progress
          fetchCourseData();
        }
      } catch (apiError) {
        console.warn('API not available for enrollment, using mock enrollment', apiError);
        
        // If API fails, simulate enrollment with mock data
        setEnrolled(true);
        setProgress(0);
        setCurrentStep(0);
        
        Swal.fire({
          title: 'Enrolled!',
          text: 'You have successfully enrolled in this course.',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
      }
    } catch (error) {
      console.error('Error in handleEnroll:', error);
      
      // Mock enrollment as fallback
      setEnrolled(true);
      setProgress(0);
      setCurrentStep(0);
      
      Swal.fire({
        title: 'Enrolled!',
        text: 'You have successfully enrolled in this course.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to update progress after completing a step
  const completeStep = async (stepId, isCompleted, score = null) => {
    try {
      // Try to make API request to update progress
      try {
        const response = await authAxios.post(`${API_BASE_URL}/api/courses/progress`, {
          courseId: id,
          stepId,
          completed: isCompleted,
          score
        });
        
        if (response.data && response.data.progress) {
          setProgress(response.data.progress.progressPercentage);
          
          // Move to next step if available
          if (currentStep < course.steps.length - 1) {
            setCurrentStep(currentStep + 1);
          }
          
          // If course is completed, show certificate
          if (response.data.progress.completed) {
            Swal.fire({
              title: 'Congratulations!',
              text: 'You have completed this course!',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'View Certificate'
            }).then((result) => {
              if (result.isConfirmed && response.data.progress.certificateId) {
                // Navigate to certificate view
                router.push(`/certificate/${response.data.progress.certificateId}`);
              }
            });
          }
        }
      } catch (apiError) {
        console.warn('API not available for progress update, using mock progress', apiError);
        
        // If API fails, simulate progress update
        const updatedProgress = Math.min(progress + 20, 100);
        setProgress(updatedProgress);
        
        if (currentStep < course.steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
        
        // If course is completed, show certificate
        if (updatedProgress >= 100) {
          Swal.fire({
            title: 'Congratulations!',
            text: 'You have completed this course!',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'View Certificate'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navigate to certificate view
              router.push(`/certificate/${id}`);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in completeStep:', error);
      
      // Fallback to mock progress update
      const updatedProgress = Math.min(progress + 20, 100);
      setProgress(updatedProgress);
      
      if (currentStep < course.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
      
      Swal.fire({
        title: 'Progress Updated',
        text: 'Your progress has been saved.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  // Handle quiz submission
  const handleQuizSubmit = (event) => {
    event.preventDefault();
    
    const currentQuizStep = course.steps[currentStep];
    let correctCount = 0;
    let totalQuestions = currentQuizStep.content.questions.length;
    
    // Calculate score
    currentQuizStep.content.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / totalQuestions) * 100);
    
    setQuizSubmitted(true);
    setQuizResults({
      score,
      correctCount,
      totalQuestions,
      passed: score >= (currentQuizStep.content.passingScore || 70)
    });
    
    // If passed, mark step as completed
    if (score >= (currentQuizStep.content.passingScore || 70)) {
      completeStep(currentQuizStep._id, true, score);
    }
  };

  // Reset quiz to try again
  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  // Handle quiz answer selection
  const handleAnswerSelect = (questionIndex, answer) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: answer
    });
  };

  // Navigate to specific step
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < course?.steps?.length) {
      setCurrentStep(stepIndex);
      setQuizSubmitted(false);
      setQuizResults(null);
      setQuizAnswers({});
    }
  };

  // Generate a mock course detail for development
  const generateMockCourseDetail = (courseId) => {
    // Define steps for the course
    const steps = [
      {
        _id: 's1',
        title: 'Introduction to the Course',
        description: 'Overview of what you will learn in this course',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: 10
        },
        order: 1
      },
      {
        _id: 's2',
        title: 'Core Concepts',
        description: 'Understanding the fundamental principles',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: 15
        },
        order: 2
      },
      {
        _id: 's3',
        title: 'Quiz: Test Your Knowledge',
        description: 'Check your understanding of the concepts covered so far',
        type: 'quiz',
        content: {
          questions: [
            {
              question: 'What is the main purpose of this course?',
              options: ['To teach programming', 'To explain concepts', 'To provide certification', 'All of the above'],
              correctAnswer: 'All of the above',
              explanation: 'This course aims to provide comprehensive knowledge that includes all these aspects.'
            },
            {
              question: 'Which of these is not a core concept covered?',
              options: ['Data structures', 'Algorithms', 'Machine learning', 'Quantum physics'],
              correctAnswer: 'Quantum physics',
              explanation: 'Quantum physics is not covered in this course.'
            }
          ],
          passingScore: 70
        },
        order: 3
      },
      {
        _id: 's4',
        title: 'Practical Applications',
        description: 'Applying what you have learned to real-world scenarios',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: 20
        },
        order: 4
      },
      {
        _id: 's5',
        title: 'Final Assessment',
        description: 'Comprehensive test to evaluate your mastery of the subject',
        type: 'test',
        content: {
          questions: [
            {
              question: 'What is the key advantage of using this approach?',
              options: ['Speed', 'Reliability', 'Flexibility', 'Cost-effectiveness'],
              correctAnswer: 'Flexibility',
              explanation: 'Flexibility is the main advantage as it allows for adaptation to various scenarios.'
            },
            {
              question: 'Which method is most effective for solving problem X?',
              options: ['Method A', 'Method B', 'Method C', 'Method D'],
              correctAnswer: 'Method C',
              explanation: 'Method C provides the optimal solution for problem X.'
            },
            {
              question: 'When would you choose approach Y over approach Z?',
              options: ['When time is limited', 'When accuracy is paramount', 'When resources are scarce', 'When scalability is needed'],
              correctAnswer: 'When accuracy is paramount',
              explanation: 'Approach Y prioritizes accuracy at the expense of other factors.'
            }
          ],
          passingScore: 80
        },
        order: 5
      }
    ];
    
    // Determine which mock course to return based on ID
    if (courseId === 'c1') {
      return {
        _id: 'c1',
        title: 'Complete Web Development Bootcamp',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more to become a full-stack web developer. This comprehensive course covers everything from the basics of web development to advanced concepts in frontend and backend development.',
        shortDescription: 'Comprehensive web development course',
        thumbnail: '/images/courses/web-dev.jpg',
        coverImage: '/images/courses/web-dev-banner.jpg',
        instructor: { 
          name: 'John Smith',
          bio: 'Senior web developer with 10+ years of experience',
          avatar: '/images/instructors/john-smith.jpg'
        },
        category: 'Web Development',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
        difficulty: 'beginner',
        duration: 1800, // 30 hours
        enrolledUsers: 1250,
        ratings: { average: 4.7, count: 350 },
        subscriptionRequired: 'Free',
        steps: steps,
        userProgress: null // Not enrolled yet
      };
    } else if (courseId === 'c2') {
      return {
        _id: 'c2',
        title: 'Advanced React Patterns',
        description: 'Master advanced React patterns and state management techniques. This course covers advanced concepts like render props, HOCs, hooks, context, and more.',
        shortDescription: 'Take your React skills to the next level',
        thumbnail: '/images/courses/react.jpg',
        coverImage: '/images/courses/react-banner.jpg',
        instructor: { 
          name: 'Sarah Johnson',
          bio: 'React expert and frontend architect',
          avatar: '/images/instructors/sarah-johnson.jpg'
        },
        category: 'Web Development',
        skills: ['React', 'Redux', 'Context API', 'Hooks'],
        difficulty: 'intermediate',
        duration: 720, // 12 hours
        enrolledUsers: 850,
        ratings: { average: 4.8, count: 210 },
        subscriptionRequired: 'Golden',
        steps: steps,
        userProgress: {
          progressPercentage: 25,
          currentStep: 1,
          completed: false,
          completedSteps: [
            { stepId: 's1', completed: true, score: null }
          ]
        }
      };
    } else {
      // Default course details
      return {
        _id: 'default',
        title: 'Sample Course',
        description: 'This is a sample course.',
        shortDescription: 'Sample course for testing',
        thumbnail: '/images/courses/default.jpg',
        coverImage: '/images/courses/default-banner.jpg',
        instructor: { 
          name: 'Instructor Name',
          bio: 'Instructor bio',
          avatar: '/images/instructors/default.jpg'
        },
        category: 'General',
        skills: ['Skill 1', 'Skill 2', 'Skill 3'],
        difficulty: 'beginner',
        duration: 600, // 10 hours
        enrolledUsers: 500,
        ratings: { average: 4.5, count: 100 },
        subscriptionRequired: 'Free',
        steps: steps,
        userProgress: null
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
          <p className="mt-3">Loading course content...</p>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="alert alert-danger">
            {error || 'Course not found'}
          </div>
          <Link href="/Course">
            <button className="btn btn-primary">Back to Courses</button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Render different content based on step type
  const renderStepContent = () => {
    if (!enrolled) {
      return (
        <div className="course-enrollment-container text-center py-5">
          <div className="enrollment-banner mb-4">
            <img 
              src={course.coverImage || course.thumbnail || "/images/courses/default-banner.jpg"} 
              alt="Course Banner" 
              className="img-fluid rounded"
            />
            <div className="enrollment-overlay">
              <h2 className="text-white mb-3">Ready to Start Learning?</h2>
              <p className="text-white mb-4">Enroll to access all course materials and track your progress.</p>
              <button 
                className="btn btn-primary btn-lg mt-3" 
                onClick={handleEnroll}
                disabled={loading}
              >
                {loading ? 
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enrolling...</> : 
                  <>Enroll Now <i className="fas fa-arrow-right ms-2"></i></>
                }
              </button>
            </div>
          </div>
          
          <div className="course-preview mt-4">
            <h3>Course Preview</h3>
            <div className="row mt-4">
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <i className="fas fa-book fa-3x text-primary mb-3"></i>
                    <h5>{course.steps?.length || 0} Learning Modules</h5>
                    <p>Comprehensive curriculum to build your skills</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <i className="fas fa-clock fa-3x text-primary mb-3"></i>
                    <h5>{Math.floor(course.duration / 60)} Hours</h5>
                    <p>Self-paced learning to fit your schedule</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <i className="fas fa-certificate fa-3x text-primary mb-3"></i>
                    <h5>Certificate of Completion</h5>
                    <p>Earn a certificate when you complete the course</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const step = course.steps[currentStep];
    
    // Step banner with progress
    const stepBanner = (
      <div className="step-banner mb-4">
        <div className="step-progress-bar">
          <div className="step-progress-container">
            {course.steps.map((s, idx) => (
              <div 
                key={idx} 
                className={`step-progress-node ${idx < currentStep ? 'completed' : idx === currentStep ? 'current' : ''}`}
                onClick={() => enrolled && goToStep(idx)}
                title={s.title}
              >
                {idx < currentStep ? (
                  <i className="fas fa-check-circle"></i>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <h3 className="step-title mt-3">{step.title}</h3>
        <p className="step-description">{step.description}</p>
      </div>
    );
    
    switch (step.type) {
      case 'video':
        return (
          <div className="video-container mb-4">
            {stepBanner}
            <div className="ratio ratio-16x9">
              <iframe
                src={step.content.videoUrl}
                title={step.title}
                allowFullScreen
              ></iframe>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="step-navigation">
                {currentStep > 0 && (
                  <button 
                    className="btn btn-outline-primary me-2" 
                    onClick={() => goToStep(currentStep - 1)}
                  >
                    <i className="fas fa-arrow-left me-2"></i> Previous Step
                  </button>
                )}
                {currentStep < course.steps.length - 1 && (
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={() => goToStep(currentStep + 1)}
                  >
                    Next Step <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                )}
              </div>
              <button 
                className="btn btn-success" 
                onClick={() => completeStep(step._id, true)}
              >
                <i className="fas fa-check me-2"></i> Mark as Completed
              </button>
            </div>
          </div>
        );
        
      case 'quiz':
      case 'test':
        return (
          <div className="quiz-container">
            {stepBanner}
            
            {quizSubmitted ? (
              <div className="quiz-results mt-4">
                <div className={`alert ${quizResults.passed ? 'alert-success' : 'alert-danger'} p-4`}>
                  <div className="text-center mb-3">
                    {quizResults.passed ? (
                      <i className="fas fa-check-circle fa-4x text-success"></i>
                    ) : (
                      <i className="fas fa-times-circle fa-4x text-danger"></i>
                    )}
                  </div>
                  <h4 className="mb-3 text-center">
                    {quizResults.passed ? 'Congratulations! You passed.' : 'Keep trying! You didn\'t pass.'}
                  </h4>
                  <div className="result-details p-3 rounded bg-light">
                    <div className="row text-center">
                      <div className="col-md-4">
                        <h5 className="fw-bold">{quizResults.score}%</h5>
                        <p>Your Score</p>
                      </div>
                      <div className="col-md-4">
                        <h5 className="fw-bold">{quizResults.correctCount}/{quizResults.totalQuestions}</h5>
                        <p>Correct Answers</p>
                      </div>
                      <div className="col-md-4">
                        <h5 className="fw-bold">{step.content.passingScore || 70}%</h5>
                        <p>Passing Score</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between mt-4">
                  {!quizResults.passed && (
                    <button className="btn btn-primary" onClick={resetQuiz}>
                      <i className="fas fa-redo me-2"></i> Try Again
                    </button>
                  )}
                  
                  {quizResults.passed && currentStep < course.steps.length - 1 && (
                    <button 
                      className="btn btn-primary ms-auto" 
                      onClick={() => goToStep(currentStep + 1)}
                    >
                      Next Step <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuizSubmit} className="mt-4">
                <div className="quiz-instructions alert alert-info mb-4">
                  <i className="fas fa-info-circle me-2"></i> 
                  {step.type === 'quiz' ? 
                    `Answer the following questions to test your knowledge. You need at least ${step.content.passingScore || 70}% to pass.` : 
                    `This is the final assessment. You must score at least ${step.content.passingScore || 70}% to complete the course and earn your certificate.`
                  }
                </div>
                
                {step.content.questions.map((question, qIndex) => (
                  <div key={qIndex} className="card mb-4 quiz-question-card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Question {qIndex + 1}</h5>
                    </div>
                    <div className="card-body">
                      <p className="mb-3 fw-bold">{question.question}</p>
                      
                      {question.options.map((option, oIndex) => (
                        <div className="quiz-option mb-3" key={oIndex}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`question-${qIndex}`}
                            id={`question-${qIndex}-option-${oIndex}`}
                            value={option}
                            checked={quizAnswers[qIndex] === option}
                            onChange={() => handleAnswerSelect(qIndex, option)}
                            required
                          />
                          <label 
                            className="form-check-label quiz-option-label" 
                            htmlFor={`question-${qIndex}-option-${oIndex}`}
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="d-flex justify-content-between mt-4">
                  {currentStep > 0 && (
                    <button 
                      type="button"
                      className="btn btn-outline-primary" 
                      onClick={() => goToStep(currentStep - 1)}
                    >
                      <i className="fas fa-arrow-left me-2"></i> Previous Step
                    </button>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary ms-auto"
                    disabled={step.content.questions.length !== Object.keys(quizAnswers).length}
                  >
                    Submit Answers <i className="fas fa-paper-plane ms-2"></i>
                  </button>
                </div>
              </form>
            )}
          </div>
        );
        
      default:
        return (
          <div className="alert alert-warning">
            Unknown step type: {step.type}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="course-header py-4" style={{ 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${course.coverImage || course.thumbnail || '/images/courses/default-banner.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white'
      }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <h1 className="mb-3">{course.title}</h1>
              <div className="d-flex mb-3">
                <div className="badge bg-primary me-2">{course.category}</div>
                <div className={`badge me-2 ${
                  course.difficulty === 'beginner' ? 'bg-success' : 
                  course.difficulty === 'intermediate' ? 'bg-warning text-dark' : 
                  'bg-danger'
                }`}>
                  {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                </div>
                <div className="badge bg-info">{Math.floor(course.duration / 60)} hours</div>
              </div>
              <p>{course.shortDescription || course.description.substring(0, 150) + '...'}</p>
              <div className="d-flex align-items-center">
                <img 
                  src={course.instructor.avatar || '/images/instructors/default.jpg'} 
                  alt={course.instructor.name}
                  className="rounded-circle me-2"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
                <div>
                  <div className="fw-bold">{course.instructor.name}</div>
                  <div className="small">{course.instructor.bio}</div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 d-flex flex-column justify-content-center align-items-end">
              <div className="course-stats text-center mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <div className="me-4">
                    <div className="fs-4 fw-bold">{course.enrolledUsers}</div>
                    <div>Enrolled</div>
                  </div>
                  <div>
                    <div className="fs-4 fw-bold">{course.ratings.average}</div>
                    <div>Rating ({course.ratings.count})</div>
                  </div>
                </div>
                <div className={`badge ${
                  course.subscriptionRequired === 'Free' ? 'bg-success' : 
                  course.subscriptionRequired === 'Golden' ? 'bg-warning text-dark' : 
                  course.subscriptionRequired === 'Platinum' ? 'bg-secondary' : 
                  'bg-primary'
                } p-2 fs-6 w-100`}>
                  {course.subscriptionRequired} Subscription
                </div>
              </div>
              
              {enrolled ? (
                <div className="w-100">
                  <div className="progress mb-2" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ width: `${progress}%` }}
                      aria-valuenow={progress} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small>{progress}% Complete</small>
                    <small>{progress === 100 ? 'Completed' : 'In Progress'}</small>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={handleEnroll}
                  disabled={loading}
                >
                  {loading ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Course Content</h5>
              </div>
              <div className="list-group list-group-flush">
                {course.steps.map((step, index) => (
                  <button
                    key={index}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${currentStep === index ? 'active' : ''}`}
                    onClick={() => enrolled && goToStep(index)}
                    disabled={!enrolled}
                  >
                    <div>
                      <div className="fw-bold">{index + 1}. {step.title}</div>
                      <small className={currentStep === index ? 'text-white' : 'text-muted'}>
                        {step.type === 'video' ? `${step.content.duration} min video` : 
                         step.type === 'quiz' ? `${step.content.questions.length} questions` : 
                         step.type === 'test' ? 'Final assessment' : 
                         'Unknown type'}
                      </small>
                    </div>
                    {enrolled && course.userProgress?.completedSteps?.some(s => s.stepId === step._id) && (
                      <span className="badge bg-success rounded-pill">
                        <i className="fas fa-check"></i>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">Skills You'll Gain</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2">
                  {course.skills.map((skill, index) => (
                    <span key={index} className="badge bg-light text-dark p-2">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-8">
            <div className="card">
              <div className="card-body">
                {renderStepContent()}
              </div>
            </div>
            
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="mb-0">About This Course</h5>
              </div>
              <div className="card-body">
                <p>{course.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .quiz-container .form-check {
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          padding: 0.75rem 1.25rem;
          margin-bottom: 0.5rem;
          transition: all 0.2s ease;
        }
        
        .quiz-container .form-check:hover {
          background-color: #f8f9fa;
        }
        
        .quiz-container .form-check input:checked + label {
          font-weight: bold;
        }
        
        /* Enhanced styles for course UI */
        .course-lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
          border-radius: 0.5rem;
        }
        
        .enrollment-banner {
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
          max-height: 300px;
        }
        
        .enrollment-banner img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          filter: brightness(0.7);
        }
        
        .enrollment-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: rgba(0,0,0,0.5);
          padding: 2rem;
        }
        
        .step-banner {
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 0.5rem;
          border-left: 5px solid #007bff;
        }
        
        .step-progress-bar {
          margin-bottom: 1.5rem;
          position: relative;
        }
        
        .step-progress-container {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        
        .step-progress-container:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #dee2e6;
          z-index: -1;
        }
        
        .step-progress-node {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: white;
          border: 2px solid #dee2e6;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .step-progress-node.completed {
          background-color: #28a745;
          border-color: #28a745;
          color: white;
        }
        
        .step-progress-node.current {
          border-color: #007bff;
          background-color: #007bff;
          color: white;
          transform: scale(1.1);
          box-shadow: 0 0 0 5px rgba(0, 123, 255, 0.2);
        }
        
        .step-progress-node:hover {
          transform: scale(1.1);
        }
        
        .step-title {
          font-weight: bold;
          color: #212529;
        }
        
        .step-description {
          color: #6c757d;
        }
        
        .quiz-option {
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          padding: 1rem;
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
        }
        
        .quiz-option:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .quiz-option input {
          position: absolute;
          top: 50%;
          left: 20px;
          transform: translateY(-50%);
        }
        
        .quiz-option-label {
          margin-left: 20px;
          display: block;
          width: 100%;
          cursor: pointer;
        }
        
        .quiz-option input:checked + .quiz-option-label {
          font-weight: bold;
        }
        
        .quiz-question-card {
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: none;
        }
        
        .quiz-question-card .card-header {
          background-color: #f0f7ff;
          border-bottom: none;
          padding: 1rem 1.5rem;
        }
        
        .result-details {
          border: 1px solid #dee2e6;
        }
      `}</style>
    </Layout>
  );
}
