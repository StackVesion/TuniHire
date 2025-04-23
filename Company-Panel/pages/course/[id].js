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

  // Function to get badge color based on subscription level
  const getBadgeColor = (subscriptionLevel) => {
    switch (subscriptionLevel) {
      case 'Free':
        return 'success';
      case 'Golden':
        return 'warning';
      case 'Platinum':
        return 'secondary';
      case 'Master':
        return 'primary';
      default:
        return 'light';
    }
  };

  // Function to check if user has proper subscription access
  const checkSubscriptionAccess = (requiredSubscription, userSubscription) => {
    const subscriptionLevels = {
      'Free': 0,
      'Golden': 1,
      'Platinum': 2,
      'Master': 3
    };
    
    const userLevel = subscriptionLevels[userSubscription] || 0;
    const requiredLevel = subscriptionLevels[requiredSubscription] || 0;
    
    return userLevel >= requiredLevel;
  };

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
          setProgress(response.data.userProgress.progressPercentage || 0);
          
          // Important: Set the current step to where the user left off
          if (response.data.userProgress.currentStep !== undefined) {
            setCurrentStep(response.data.userProgress.currentStep);
          }
        }
      } catch (apiError) {
        console.warn('API not available, using mock data', apiError);
        
        // Fallback to mock data if API fails
        const mockCourse = generateMockCourseDetail(id);
        setCourse(mockCourse);
        
        if (mockCourse.userProgress) {
          setEnrolled(true);
          setProgress(mockCourse.userProgress.progressPercentage || 0);
          setCurrentStep(mockCourse.userProgress.currentStep || 0);
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
        setProgress(mockCourse.userProgress.progressPercentage || 0);
        setCurrentStep(mockCourse.userProgress.currentStep || 0);
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
        confirmButtonText: 'Upgrade Now',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Navigate to subscription page
          router.push('/Pricing');
        }
      });
      return;
    }
    
    // Show loading state
    Swal.fire({
      title: 'Enrolling...',
      text: 'Please wait while we enroll you in this course.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      // Try to make API request to enroll
      try {
        const response = await authAxios.post(`${API_BASE_URL}/api/courses/enroll`, {
          courseId: id
        });
        
        Swal.fire({
          title: 'Enrolled Successfully!',
          text: 'You are now enrolled in this course. You can start learning right away!',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
        
        // Update local state to reflect enrollment
        setEnrolled(true);
        
        // If response contains progress information, update state
        if (response.data && response.data.progress) {
          setProgress(response.data.progress.progressPercentage || 0);
          
          if (response.data.progress.currentStep !== undefined) {
            setCurrentStep(response.data.progress.currentStep);
          }
        } else {
          // Initialize with 0 progress
          setProgress(0);
          setCurrentStep(0);
        }
        
        // Refresh course data to get latest progress
        fetchCourseData();
        
      } catch (apiError) {
        console.warn('API not available for enrollment, using mock enrollment', apiError);
        
        // If API fails, simulate enrollment
        Swal.fire({
          title: 'Enrolled Successfully!',
          text: 'You are now enrolled in this course. You can start learning right away!',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
        
        // Update local state
        setEnrolled(true);
        setProgress(0);
        setCurrentStep(0);
        
        // Create a mock progress entry in the course object
        const updatedCourse = {
          ...course,
          userProgress: {
            userId: JSON.parse(localStorage.getItem('user') || '{}')._id || 'user123',
            courseId: id,
            currentStep: 0,
            completedSteps: [],
            progressPercentage: 0,
            completed: false
          }
        };
        
        setCourse(updatedCourse);
      }
    } catch (error) {
      console.error('Error in handleEnroll:', error);
      
      Swal.fire({
        title: 'Enrollment Failed',
        text: 'There was an error enrolling you in this course. Please try again later.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
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
          score,
          currentStep: currentStep
        });
        
        if (response.data && response.data.progress) {
          setProgress(response.data.progress.progressPercentage);
          
          // Update current step in state
          if (response.data.progress.currentStep !== undefined) {
            setCurrentStep(response.data.progress.currentStep);
          } else if (currentStep < course.steps.length - 1 && isCompleted) {
            // Only move to next step if current step is completed
            setCurrentStep(currentStep + 1);
          }
          
          // If course is completed, show certificate
          if (response.data.progress.completed) {
            // All steps must be completed to get certificate
            const allStepsCompleted = response.data.progress.completedSteps &&
              response.data.progress.completedSteps.length === course.steps.length;
            
            if (allStepsCompleted) {
              Swal.fire({
                title: 'Congratulations!',
                text: 'You have completed this course successfully! You can now view and download your certificate.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'View Certificate'
              }).then((result) => {
                if (result.isConfirmed && response.data.progress.certificateId) {
                  // Navigate to certificate view
                  router.push(`/certificate/${response.data.progress.certificateId}`);
                }
              });
            } else {
              Swal.fire({
                title: 'Almost There!',
                text: 'You need to complete all steps to receive your certificate.',
                icon: 'info',
                confirmButtonColor: '#3085d6',
              });
            }
          } else {
            // Show simple success notification for step completion
            Swal.fire({
              title: 'Step Completed!',
              text: 'Your progress has been saved successfully.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      } catch (apiError) {
        console.warn('API not available for progress update, using mock progress', apiError);
        
        // If API fails, simulate progress update but with more accurate tracking
        const completedStepsCount = Math.floor((progress / 100) * course.steps.length) + 1;
        const updatedProgress = Math.min((completedStepsCount / course.steps.length) * 100, 100);
        setProgress(updatedProgress);
        
        // Only move to next step if current is complete and not the last one
        if (currentStep < course.steps.length - 1 && isCompleted) {
          setCurrentStep(currentStep + 1);
        }
        
        // If course is completed, show certificate
        if (completedStepsCount >= course.steps.length) {
          Swal.fire({
            title: 'Congratulations!',
            text: 'You have completed this course! You can now view and download your certificate.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'View Certificate'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navigate to certificate view
              router.push(`/certificate/${id}`);
            }
          });
        } else {
          Swal.fire({
            title: 'Step Completed!',
            text: 'Your progress has been saved.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      }
    } catch (error) {
      console.error('Error in completeStep:', error);
      
      // Fallback to mock progress update with better constraints
      const completedStepsCount = Math.floor((progress / 100) * course.steps.length) + 1;
      const updatedProgress = Math.min((completedStepsCount / course.steps.length) * 100, 100);
      setProgress(updatedProgress);
      
      // Only move to next step if not the last one
      if (currentStep < course.steps.length - 1 && isCompleted) {
        setCurrentStep(currentStep + 1);
      }
      
      Swal.fire({
        title: 'Progress Updated',
        text: 'Your progress has been saved.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
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
    // Check if attempting to navigate to a future step (not yet unlocked)
    if (stepIndex > currentStep) {
      Swal.fire({
        title: 'Step Locked',
        text: 'Please complete the current step first before proceeding.',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    // Only allow navigation to completed steps or the current step
    setCurrentStep(stepIndex);
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
                  idx + 1
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
        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${course.coverImage || course.thumbnail || "/images/courses/default-banner.jpg"})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="display-5 fw-bold mb-2">{course.title}</h1>
              
              <div className="d-flex align-items-center mb-3">
                {course.instructor && (
                  <div className="me-4 d-flex align-items-center">
                    <i className="fas fa-user-tie me-2"></i>
                    <span>{course.instructor.name}</span>
                  </div>
                )}
                
                <div className="me-4 d-flex align-items-center">
                  <i className="fas fa-clock me-2"></i>
                  <span>{course.duration || '2 hours'}</span>
                </div>
                
                <div className="d-flex align-items-center">
                  <i className="fas fa-signal me-2"></i>
                  <span>{course.difficulty || 'Intermediate'}</span>
                </div>
              </div>
              
              <div className="d-flex flex-wrap mb-3">
                {course.skills && course.skills.map((skill, index) => (
                  <span key={index} className="badge bg-light text-dark me-2 mb-2 p-2">
                    <i className="fas fa-check-circle me-1 text-primary"></i> {skill}
                  </span>
                ))}
              </div>
              
              <div className="mb-3 d-flex align-items-center">
                <div className="subscription-badge me-3">
                  <span className={`badge bg-${getBadgeColor(course.subscriptionRequired)} p-2`}>
                    <i className="fas fa-crown me-1"></i> {course.subscriptionRequired || 'Free'}
                  </span>
                </div>
                
                <div className="category-badge me-3">
                  <span className="badge bg-light text-dark p-2">
                    <i className="fas fa-folder me-1"></i> {course.category || 'Development'}
                  </span>
                </div>
                
                {enrolled && (
                  <div className="progress-badge">
                    <div className="progress" style={{ height: '10px', width: '150px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${progress}%` }} 
                        aria-valuenow={progress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <small className="text-white">{progress}% Complete</small>
                  </div>
                )}
              </div>
              
              <p className="lead mb-0">{course.description}</p>
            </div>
            
            <div className="col-md-4 text-center text-md-end mt-4 mt-md-0">
              {/* If not enrolled and has proper subscription, show enroll button */}
              {!enrolled && checkSubscriptionAccess(course.subscriptionRequired, userSubscription) && (
                <button 
                  className="btn btn-primary btn-lg fw-bold py-3 px-5" 
                  onClick={handleEnroll}
                >
                  <i className="fas fa-graduation-cap me-2"></i> Enroll Now
                </button>
              )}
              
              {/* If not enrolled and doesn't have proper subscription, show upgrade button */}
              {!enrolled && !checkSubscriptionAccess(course.subscriptionRequired, userSubscription) && (
                <div>
                  <div className="alert alert-warning py-3 mb-3 d-flex align-items-center">
                    <i className="fas fa-lock me-3 fa-2x"></i>
                    <div>
                      <div className="fw-bold">Subscription Required</div>
                      <div>This course requires a {course.subscriptionRequired} subscription</div>
                    </div>
                  </div>
                  <Link href="/Pricing">
                    <button className="btn btn-warning btn-lg fw-bold py-3 px-5">
                      <i className="fas fa-crown me-2"></i> Upgrade Subscription
                    </button>
                  </Link>
                </div>
              )}
              
              {/* If enrolled, show continue button */}
              {enrolled && (
                <div>
                  <div className="alert alert-success mb-3 d-flex align-items-center">
                    <i className="fas fa-check-circle me-3 fa-2x"></i>
                    <div>
                      <div className="fw-bold">You're Enrolled!</div>
                      {progress > 0 ? (
                        <div>Continue from where you left off ({progress}% complete)</div>
                      ) : (
                        <div>Start your learning journey</div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="btn btn-success btn-lg fw-bold py-3 px-5"
                    onClick={() => {
                      // Go directly to the currentStep (where user left off)
                      goToStep(currentStep);
                      
                      // Scroll to course content
                      document.querySelector('.course-sidebar')?.scrollIntoView({
                        behavior: 'smooth'
                      });
                    }}
                  >
                    <i className="fas fa-play-circle me-2"></i> 
                    {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {enrolled && (
        <div className="container py-5">
          <div className="row">
            <div className="col-lg-4 mb-4">
              <div className="course-sidebar sticky-top" style={{ top: '2rem' }}>
                <div className="card mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Course Progress</h5>
                  </div>
                  <div className="card-body">
                    <div className="progress mb-3" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${progress}%` }} 
                        aria-valuenow={progress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between mb-4">
                      <div><i className="fas fa-check-circle me-1"></i> {progress}% Complete</div>
                      <div>{progress === 100 ? 'Completed' : 'In Progress'}</div>
                    </div>
                    
                    <div className="steps-list">
                      {course.steps.map((step, index) => (
                        <div 
                          key={index}
                          className={`step-item d-flex align-items-center p-2 mb-2 ${currentStep === index ? 'active' : ''} ${index < currentStep ? 'completed' : ''} ${index > currentStep ? 'locked' : ''}`}
                          onClick={() => goToStep(index)}
                        >
                          <div className="step-number me-3">
                            {index < currentStep ? (
                              <i className="fas fa-check-circle text-success"></i>
                            ) : index === currentStep ? (
                              <i className="fas fa-play-circle text-primary"></i>
                            ) : (
                              <i className="fas fa-lock text-secondary"></i>
                            )}
                          </div>
                          <div className="step-info">
                            <div className="step-title">{step.title}</div>
                            <div className="step-type small">
                              {step.type === 'video' && <><i className="fas fa-video me-1"></i> Video</>}
                              {step.type === 'quiz' && <><i className="fas fa-question-circle me-1"></i> Quiz</>}
                              {step.type === 'test' && <><i className="fas fa-file-alt me-1"></i> Test</>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {progress === 100 && (
                      <div className="mt-4 text-center">
                        <Link href={`/certificate/${course._id}`}>
                          <button className="btn btn-success">
                            <i className="fas fa-award me-2"></i> View Certificate
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card instructor-card">
                  <div className="card-body">
                    <h5 className="card-title mb-3">Instructor</h5>
                    <div className="d-flex align-items-center mb-3">
                      <img 
                        src={course.instructor.avatar || '/images/instructors/default.jpg'} 
                        alt={course.instructor.name}
                        className="rounded-circle me-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-1">{course.instructor.name}</h6>
                        <div className="text-muted small">{course.instructor.title || 'Course Instructor'}</div>
                      </div>
                    </div>
                    <p className="small mb-0">{course.instructor.bio || 'Expert instructor with years of experience in teaching.'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-8">
              {/* Step progress bar */}
              <div className="step-progress-bar mb-4">
                <div className="step-progress-container">
                  {course.steps.map((step, index) => (
                    <div 
                      key={index}
                      className={`step-progress-node ${index < currentStep ? 'completed' : index === currentStep ? 'current' : ''}`}
                      onClick={() => goToStep(index)}
                      title={`${step.title} (${index < currentStep ? 'Completed' : index === currentStep ? 'Current' : 'Locked'})`}
                    >
                      {index < currentStep ? (
                        <i className="fas fa-check"></i>
                      ) : (
                        index + 1
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Current step content */}
              <div className="step-banner mb-4">
                <h3 className="step-title mb-2">{course.steps[currentStep].title}</h3>
                <p className="step-description mb-3">{course.steps[currentStep].description}</p>
                <div className="d-flex align-items-center small">
                  <div className="badge bg-primary me-2">
                    {course.steps[currentStep].type.charAt(0).toUpperCase() + course.steps[currentStep].type.slice(1)}
                  </div>
                  <div>Step {currentStep + 1} of {course.steps.length}</div>
                </div>
              </div>
              
              {renderStepContent()}
              
              {/* Navigation buttons */}
              <div className="step-navigation d-flex justify-content-between mt-4">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                >
                  <i className="fas fa-arrow-left me-2"></i> Previous Step
                </button>
                
                {currentStep < course.steps.length - 1 ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      // Check if current step is completed before allowing to proceed
                      const stepComplete = course.userProgress?.completedSteps?.includes(course.steps[currentStep]._id);
                      
                      if (!stepComplete && course.steps[currentStep].type === 'video') {
                        // For video steps, mark as complete when clicking next
                        completeStep(course.steps[currentStep]._id, true);
                      } else if (!stepComplete && (course.steps[currentStep].type === 'quiz' || course.steps[currentStep].type === 'test')) {
                        // For quiz/test steps, can't proceed until submitted and passed
                        Swal.fire({
                          title: 'Step Incomplete',
                          text: `Please complete and pass the ${course.steps[currentStep].type} before proceeding to the next step.`,
                          icon: 'warning',
                          confirmButtonColor: '#3085d6'
                        });
                        return;
                      }
                      
                      goToStep(currentStep + 1);
                    }}
                  >
                    Next Step <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                ) : (
                  <button 
                    className="btn btn-success" 
                    onClick={() => {
                      // Check if all steps are completed
                      const allStepsCompleted = course.steps.every((step) => 
                        course.userProgress?.completedSteps?.includes(step._id)
                      );
                      
                      if (allStepsCompleted) {
                        router.push(`/certificate/${course._id}`);
                      } else {
                        Swal.fire({
                          title: 'Course Incomplete',
                          text: 'You need to complete all steps to receive your certificate.',
                          icon: 'info',
                          confirmButtonColor: '#3085d6'
                        });
                      }
                    }}
                  >
                    <i className="fas fa-award me-2"></i> Get Certificate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .step-item {
          border-radius: 0.5rem;
          background-color: #f8f9fa;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .step-item:hover {
          background-color: #e9ecef;
        }
        
        .step-item.active {
          background-color: #e7f1ff;
          border-left: 3px solid #007bff;
        }
        
        .step-item.completed {
          background-color: #e9fff5;
        }
        
        .step-item.locked {
          background-color: #f8f9fa;
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .sticky-top {
          position: sticky;
          top: 100px;
        }
      `}</style>
    </Layout>
  );
}
