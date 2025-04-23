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
      // Until the API is ready, use mock data
      // const response = await authAxios.get(`${API_BASE_URL}/api/courses/${id}`);
      // setCourse(response.data);
      
      // Temporary: Use mock course data
      const mockCourse = generateMockCourseDetail(id);
      setCourse(mockCourse);
      
      // Check if user is enrolled
      if (mockCourse.userProgress) {
        setEnrolled(true);
        setProgress(mockCourse.userProgress.progressPercentage);
        setCurrentStep(mockCourse.userProgress.currentStep);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course. Please try again later.');
      
      // Temporary: Use mock course data on error
      const mockCourse = generateMockCourseDetail(id);
      setCourse(mockCourse);
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
      // Uncomment when API is ready
      /* const response = await authAxios.post(`${API_BASE_URL}/api/courses/enroll`, {
        courseId: id
      });
      
      if (response.data) {
        setEnrolled(true);
        setProgress(0);
        setCurrentStep(0);
      } */
      
      // Mock enrollment for now
      setEnrolled(true);
      setProgress(0);
      setCurrentStep(0);
      
      Swal.fire({
        title: 'Enrolled!',
        text: 'You have successfully enrolled in this course.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to enroll in this course. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to update progress after completing a step
  const completeStep = async (stepId, isCompleted, score = null) => {
    try {
      // Uncomment when API is ready
      /* const response = await authAxios.post(`${API_BASE_URL}/api/courses/progress`, {
        courseId: id,
        stepId,
        completed: isCompleted,
        score
      });
      
      if (response.data && response.data.progress) {
        setProgress(response.data.progress.progressPercentage);
      } */
      
      // Mock progress update
      const updatedProgress = Math.min(progress + 20, 100); // Increment by 20%, max 100%
      setProgress(updatedProgress);
      
      // Move to next step if available
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
    } catch (error) {
      console.error('Error updating progress:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update progress. Please try again.',
        icon: 'error',
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
          <h3>Enroll to start learning</h3>
          <p>Get access to all course materials and track your progress.</p>
          <button 
            className="btn btn-primary btn-lg mt-3" 
            onClick={handleEnroll}
            disabled={loading}
          >
            {loading ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>
      );
    }

    const step = course.steps[currentStep];
    
    switch (step.type) {
      case 'video':
        return (
          <div className="video-container mb-4">
            <div className="ratio ratio-16x9">
              <iframe
                src={step.content.videoUrl}
                title={step.title}
                allowFullScreen
              ></iframe>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <h5>{step.title}</h5>
                <p className="text-muted">Duration: {step.content.duration} minutes</p>
              </div>
              <button 
                className="btn btn-success" 
                onClick={() => completeStep(step._id, true)}
              >
                Mark as Completed
              </button>
            </div>
          </div>
        );
        
      case 'quiz':
      case 'test':
        return (
          <div className="quiz-container">
            <h4>{step.title}</h4>
            <p>{step.description}</p>
            
            {quizSubmitted ? (
              <div className="quiz-results mt-4">
                <div className={`alert ${quizResults.passed ? 'alert-success' : 'alert-danger'}`}>
                  <h5 className="mb-3">
                    {quizResults.passed ? 'Congratulations!' : 'Try Again'}
                  </h5>
                  <p>You scored {quizResults.score}% ({quizResults.correctCount} out of {quizResults.totalQuestions} correct)</p>
                  <p>Passing score: {step.content.passingScore || 70}%</p>
                </div>
                
                {!quizResults.passed && (
                  <button className="btn btn-primary mt-3" onClick={resetQuiz}>
                    Try Again
                  </button>
                )}
                
                {quizResults.passed && currentStep < course.steps.length - 1 && (
                  <button 
                    className="btn btn-primary mt-3" 
                    onClick={() => goToStep(currentStep + 1)}
                  >
                    Next Step
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleQuizSubmit} className="mt-4">
                {step.content.questions.map((question, qIndex) => (
                  <div key={qIndex} className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Question {qIndex + 1}</h5>
                    </div>
                    <div className="card-body">
                      <p className="mb-3">{question.question}</p>
                      
                      {question.options.map((option, oIndex) => (
                        <div className="form-check mb-2" key={oIndex}>
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
                            className="form-check-label" 
                            htmlFor={`question-${qIndex}-option-${oIndex}`}
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={step.content.questions.length !== Object.keys(quizAnswers).length}
                >
                  Submit Answers
                </button>
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
      `}</style>
    </Layout>
  );
}
