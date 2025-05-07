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
  const [certificateLoading, setCertificateLoading] = useState(false);

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
      
      // Get user's subscription info from localStorage and API
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.subscription) {
          setUserSubscription(userData.subscription);
        }
        
        // Also fetch the latest subscription data from API
        fetchUserSubscription();
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        fetchUserSubscription();
      }
    }
  }, [id]);

  // Function to fetch the latest user subscription data
  const fetchUserSubscription = async () => {
    try {
      const response = await authAxios.get(`${API_BASE_URL}/api/subscriptions/user-subscription`);
      if (response.data && response.data.subscription) {
        setUserSubscription(response.data.subscription);
        console.log(`User subscription fetched: ${response.data.subscription}`);
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
    }
  };

  // Fetch course details from API
  const fetchCourseData = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to fetch course details from ${API_BASE_URL}/api/courses/${id}`);
      
      // Fetch course data with auth header
      const response = await authAxios.get(`${API_BASE_URL}/api/courses/${id}`);
      
      if (response.data && response.data.success) {
        console.log('Course data received:', response.data);
        
        // API returned success with data property
        const courseData = response.data.data;
        setCourse(courseData);
        
        // If user progress exists, update state
        if (courseData.userProgress) {
          setEnrolled(true);
          setProgress(courseData.userProgress.progressPercentage || 0);
          setCurrentStep(courseData.userProgress.currentStep || 0);
        } else {
          setEnrolled(false);
          setProgress(0);
          setCurrentStep(0);
        }
      } else {
        // Handle API response without success flag (legacy format)
        if (response.data) {
          setCourse(response.data);
          
          if (response.data.userProgress) {
            setEnrolled(true);
            setProgress(response.data.userProgress.progressPercentage || 0);
            setCurrentStep(response.data.userProgress.currentStep || 0);
          } else {
            setEnrolled(false);
          }
        } else {
          setError('Invalid API response format');
        }
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      
      let errorMessage = 'Failed to load course. Please try again later.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle enrollment
  const handleEnroll = async () => {
    // Check subscription access before enrollment
    if (course && !checkSubscriptionAccess(course.subscriptionRequired, userSubscription)) {
      Swal.fire({
        title: 'Subscription Required',
        html: `This course requires a <b>${course.subscriptionRequired}</b> subscription or higher.<br>
              Your current subscription is <b>${userSubscription}</b>.<br><br>
              Would you like to upgrade your subscription?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Upgrade Subscription',
        cancelButtonText: 'Not Now',
        backdrop: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/pricing');
        }
      });
      return;
    }
    
    // Show loading state
    Swal.fire({
      title: 'Enrolling...',
      text: 'Please wait while we process your enrollment',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });
    
    // User has appropriate subscription, attempt to enroll
    try {
      console.log(`Attempting to enroll in course ${id}`);
      const response = await authAxios.post(`${API_BASE_URL}/api/courses/${id}/enroll`);
      
      if (response.data && response.data.success) {
        // Show success message
        Swal.fire({
          title: 'Enrolled Successfully!',
          text: 'You have been successfully enrolled in this course. Start learning now!',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
        
        // Update local state with the new progress data
        setCourse(prevCourse => {
          const updatedCourse = { ...prevCourse };
          updatedCourse.userProgress = response.data.userProgress;
          return updatedCourse;
        });
        
        // Set enrolled state to true
        setEnrolled(true);
        
        // Set progress based on response
        if (response.data.userProgress && response.data.userProgress.progressPercentage) {
          setProgress(response.data.userProgress.progressPercentage);
        }
        
        // Update current step if needed
        if (response.data.userProgress && response.data.userProgress.currentStep !== undefined) {
          setCurrentStep(response.data.userProgress.currentStep);
        }
      } else {
        // API returned success:false with a message
        throw new Error(response.data.message || 'Unknown enrollment error');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      // Handle already enrolled case
      if (error.response && error.response.status === 400 && 
          error.response.data.message && error.response.data.message.includes('already enrolled')) {
        
        // User is already enrolled, update UI to reflect this
        setEnrolled(true);
        
        if (error.response.data.userProgress) {
          setCourse(prevCourse => {
            const updatedCourse = { ...prevCourse };
            updatedCourse.userProgress = error.response.data.userProgress;
            return updatedCourse;
          });
          
          setProgress(error.response.data.userProgress.progressPercentage || 0);
          setCurrentStep(error.response.data.userProgress.currentStep || 0);
        }
        
        // Show already enrolled message
        Swal.fire({
          title: 'Already Enrolled',
          text: 'You are already enrolled in this course. Continue your learning journey!',
          icon: 'info',
          confirmButtonColor: '#3085d6'
        });
        
        return;
      }
      
      // Display the specific error message from the API if available
      let errorMessage = 'There was an error enrolling in this course. Please try again.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Enrollment Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      // Only refresh if not already showing loading
      if (Swal.isLoading()) {
        Swal.close();
      }
      
      // Refresh course data to get the latest progress information
      fetchCourseData();
    }
  };

  // Function to mark a step as completed and progress to next step
  const completeStep = async () => {
    try {
      setLoading(true);
      
      // Get current step information
      const stepId = course.steps[currentStep]._id;
      let score = null;
      
      // If this is a quiz/test, calculate score from answers
      if ((course.steps[currentStep].type === 'quiz' || course.steps[currentStep].type === 'test') && quizAnswers.length > 0) {
        score = calculateQuizScore();
      }
      
      // Call API to update progress
      const response = await authAxios.post(`${API_BASE_URL}/api/courses/progress`, {
        courseId: id,
        stepId: stepId,
        score: score
      });
      
      if (response.data && response.data.success) {
        // Update course with latest progress data
        setCourse(prevCourse => {
          const updatedCourse = { ...prevCourse };
          updatedCourse.userProgress = response.data.updatedProgress;
          return updatedCourse;
        });
        
        // Update progress percentage
        if (response.data.updatedProgress && response.data.updatedProgress.progressPercentage) {
          setProgress(response.data.updatedProgress.progressPercentage);
        }
        
        // Show success message
        Swal.fire({
          title: 'Step Completed!',
          text: response.data.message || 'You have successfully completed this step!',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
        
        // Move to next step if available
        if (currentStep < course.steps.length - 1) {
          setCurrentStep(currentStep + 1);
          // Reset quiz answers for next step
          setQuizAnswers([]);
          setQuizSubmitted(false);
        } else {
          // Course completed
          Swal.fire({
            title: 'Course Completed!',
            text: 'Congratulations! You have completed the entire course. You can now access your certificate.',
            icon: 'success',
            confirmButtonColor: '#3085d6'
          });
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'There was an error saving your progress. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle quiz submission
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
      completeStep();
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
    if (!course) return;
    
    // Validate step index
    if (stepIndex < 0 || stepIndex >= course.steps.length) {
      console.error('Invalid step index:', stepIndex);
      return;
    }
    
    // Check if the user can access this step (previous steps must be completed)
    const completedSteps = course.userProgress?.completedSteps || [];
    
    // Can always go back to previous steps
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
      return;
    }
    
    // For moving forward, check that all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.includes(course.steps[i]._id)) {
        Swal.fire({
          title: 'Step Locked',
          text: 'You must complete all previous steps before accessing this one.',
          icon: 'warning',
          confirmButtonColor: '#3085d6'
        });
        return;
      }
    }
    
    // Update current step in user progress
    setCurrentStep(stepIndex);
    
    // If moving to a step, reset quiz state
    if (course.steps[stepIndex].type === 'quiz' || course.steps[stepIndex].type === 'test') {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResults(null);
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
    if (!course || !course.steps || currentStep >= course.steps.length) {
      return <div className="alert alert-danger">Invalid step</div>;
    }
    
    const step = course.steps[currentStep];
    const isStepCompleted = course.userProgress?.completedSteps?.includes(step._id);
    const canAutoComplete = step.type === 'video';
    
    switch (step.type) {
      case 'video':
        return (
          <div className="video-container">
            <div className="card shadow-sm border-0 rounded-lg overflow-hidden mb-4">
              <div className="card-body p-0 position-relative">
                {/* Video embed with responsive wrapper */}
                <div className="video-wrapper" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={step.content.videoUrl}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '8px' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
              <div className="card-footer bg-light d-flex justify-content-between align-items-center p-3">
                <div>
                  <i className="fas fa-clock me-2 text-primary"></i>
                  <span className="text-muted">{step.content.duration} min</span>
                </div>
                {!isStepCompleted && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={completeStep}
                  >
                    <i className="fas fa-check me-2"></i> Mark as Completed
                  </button>
                )}
                {isStepCompleted && (
                  <div className="badge bg-success px-3 py-2">
                    <i className="fas fa-check-circle me-1"></i> Completed
                  </div>
                )}
              </div>
            </div>
            
            <div className="card shadow-sm border-0 rounded-lg mt-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2 text-primary"></i>
                  Description
                </h5>
              </div>
              <div className="card-body">
                <p className="mb-0">{step.description}</p>
              </div>
            </div>
          </div>
        );
        
      case 'quiz':
      case 'test':
        const isQuiz = step.type === 'quiz';
        const questions = step.content.questions || [];
        const passingScore = step.content.passingScore || 70;
        const userScore = course.userProgress?.scores?.[step._id] || 0;
        const isPassed = userScore >= passingScore;
        
        if (quizSubmitted) {
          // Show quiz results
          return (
            <div className="quiz-results">
              <div className={`alert ${isPassed ? 'alert-success' : 'alert-danger'} d-flex align-items-center mb-4`}>
                <div className="d-flex align-items-center justify-content-center me-3" 
                  style={{ width: '60px', height: '60px', borderRadius: '50%', background: isPassed ? '#d1e7dd' : '#f8d7da' }}>
                  <i className={`fas fa-${isPassed ? 'check' : 'times'} fa-2x text-${isPassed ? 'success' : 'danger'}`}></i>
                </div>
                <div>
                  <h4 className="alert-heading mb-1">{isPassed ? 'Congratulations!' : 'Try Again'}</h4>
                  <p className="mb-0">
                    {isPassed 
                      ? `You passed the ${isQuiz ? 'quiz' : 'test'} with a score of ${quizResults.score}%.` 
                      : `You didn't pass this time. Your score was ${quizResults.score}%. You need ${passingScore}% to pass.`}
                  </p>
                </div>
              </div>
              
              <div className="card shadow-sm border-0 rounded-lg mb-4">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {course.steps[currentStep]?.title}
                  </h5>
                  <div>
                    <span className="badge bg-primary px-3 py-2">Score: {quizResults.score}%</span>
                  </div>
                </div>
                <div className="card-body">
                  {questions.map((question, idx) => {
                    const userAnswer = quizAnswers[idx];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={idx} className="question-result mb-4 pb-4 border-bottom">
                        <div className="d-flex align-items-start mb-3">
                          <div className={`badge bg-${isCorrect ? 'success' : 'danger'} me-3 px-2 py-2`} style={{ minWidth: '30px' }}>
                            <i className={`fas fa-${isCorrect ? 'check' : 'times'}`}></i>
                          </div>
                          <div>
                            <h6 className="mb-0">Question {idx + 1}</h6>
                            <p className="mb-0">{question.question}</p>
                          </div>
                        </div>
                        
                        <div className="ms-5">
                          <div className="mb-2">
                            <strong>Your answer:</strong> {userAnswer || 'No answer'}
                          </div>
                          <div className="mb-2">
                            <strong>Correct answer:</strong> {question.correctAnswer}
                          </div>
                          {question.explanation && (
                            <div className="explanation p-3 bg-light rounded">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="card-footer bg-light">
                  {!isPassed && (
                    <button 
                      className="btn btn-primary w-100"
                      onClick={resetQuiz}
                    >
                      <i className="fas fa-redo me-2"></i> Try Again
                    </button>
                  )}
                  {isPassed && !isStepCompleted && (
                    <button 
                      className="btn btn-success w-100"
                      onClick={completeStep}
                    >
                      <i className="fas fa-check-circle me-2"></i> Complete {isQuiz ? 'Quiz' : 'Test'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        } else {
          // Show quiz questions
          return (
            <div className="quiz-container">
              <div className="card shadow-sm border-0 rounded-lg mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    {course.steps[currentStep]?.title}
                  </h5>
                </div>
                <div className="card-body">
                  <p className="mb-4">{course.steps[currentStep]?.description}</p>
                  <div className="alert alert-info d-flex align-items-center">
                    <i className="fas fa-info-circle fa-lg me-3"></i>
                    <div>
                      <strong>Instructions:</strong> Select the best answer for each question. You need {passingScore}% to pass.
                    </div>
                  </div>
                  
                  <form onSubmit={handleQuizSubmit} className="mt-4">
                    {questions.map((question, idx) => (
                      <div key={idx} className="question-item mb-4 pb-4 border-bottom">
                        <h6 className="mb-3">
                          <span className="badge bg-primary me-2">{idx + 1}</span>
                          {question.question}
                        </h6>
                        <div className="options ms-4">
                          {question.options.map((option, optIdx) => (
                            <div key={optIdx} className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`question-${idx}`}
                                id={`question-${idx}-option-${optIdx}`}
                                value={option}
                                checked={quizAnswers[idx] === option}
                                onChange={() => handleAnswerSelect(idx, option)}
                              />
                              <label className="form-check-label" htmlFor={`question-${idx}-option-${optIdx}`}>
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="d-grid gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary py-2"
                        disabled={Object.keys(quizAnswers).length !== questions.length}
                      >
                        <i className="fas fa-paper-plane me-2"></i>
                        Submit {isQuiz ? 'Quiz' : 'Test'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          );
        }
        
      default:
        return <div className="alert alert-warning">Unknown step type: {step.type}</div>;
    }
  };

  // Render the course detail UI
  return (
    <Layout headTitle={course ? `${course.title} - TuniHire` : 'Loading Course'}>
      {loading ? (
        <div className="container text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading course details...</p>
        </div>
      ) : error ? (
        <div className="container p-5">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      ) : course ? (
        <div className="container py-5">
          {/* Course Header with Banner */}
          <div className="course-header mb-5">
            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="position-relative">
                <img 
                  src={course.coverImage || '/assets/imgs/page/dashboard/courses-banner.jpg'} 
                  alt={course.title} 
                  className="w-100" 
                  style={{ height: '240px', objectFit: 'cover' }}
                />
                <div className="position-absolute" style={{ 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  padding: '30px 20px 20px'
                }}>
                  <div className="d-flex align-items-center">
                    <div>
                      <h1 className="display-6 text-white mb-2">{course.title}</h1>
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-white-50">
                          <i className="fas fa-user-graduate me-1"></i> {course.enrolledUsers} enrolled
                        </span>
                        <span className="text-white-50">
                          <i className="fas fa-layer-group me-1"></i> {course.difficulty}
                        </span>
                        <div className={`badge bg-${getBadgeColor(course.subscriptionRequired)} px-3 py-2`}>
                          {course.subscriptionRequired} Plan
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-4 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-clock text-primary me-2"></i>
                        <span>{course.duration} minutes</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-list-check text-primary me-2"></i>
                        <span>{course.steps.length} steps</span>
                      </div>
                      {course.skills && course.skills.length > 0 && (
                        <div className="d-flex align-items-center">
                          <i className="fas fa-code text-primary me-2"></i>
                          <span>{course.skills.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <p className="lead">{course.shortDescription}</p>
                  </div>
                  <div className="col-md-4">
                    <div className="text-md-end">
                      {!enrolled ? (
                        <button 
                          className="btn btn-primary btn-lg"
                          onClick={handleEnroll}
                        >
                          <i className="fas fa-graduation-cap me-2"></i> Enroll Now
                        </button>
                      ) : (
                        <div>
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
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">{progress}% complete</span>
                            {progress === 100 && (
                              <Link href={`/certificate/${course._id}`} className="btn btn-sm btn-outline-success">
                                <i className="fas fa-award me-1"></i> View Certificate
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course content section */}
          {enrolled && (
            <div className="row">
              {/* Steps sidebar */}
              <div className="col-md-4 mb-4 mb-md-0">
                <div className="card shadow-sm border-0 rounded-lg sticky-top" style={{ top: '100px' }}>
                  <div className="card-header bg-light">
                    <h5 className="mb-0">
                      <i className="fas fa-list-ol me-2 text-primary"></i>
                      Course Content
                    </h5>
                  </div>
                  <div className="list-group list-group-flush">
                    {course.steps.map((step, index) => {
                      const isCompleted = course.userProgress?.completedSteps?.includes(step._id);
                      const isActive = currentStep === index;
                      const isLocked = !isCompleted && index > 0 && !course.userProgress?.completedSteps?.includes(course.steps[index - 1]._id);
                      
                      // Determine the appropriate icon based on step type and completion status
                      let icon = 'fa-circle';
                      if (step.type === 'video') icon = 'fa-play-circle';
                      if (step.type === 'quiz') icon = 'fa-question-circle';
                      if (step.type === 'test') icon = 'fa-clipboard-check';
                      
                      if (isCompleted) icon = 'fa-check-circle';
                      if (isLocked) icon = 'fa-lock';
                      
                      return (
                        <div 
                          key={step._id} 
                          className={`list-group-item list-group-item-action ${isActive ? 'active' : ''} ${isCompleted ? 'list-group-item-success' : ''} ${isLocked ? 'disabled' : ''}`}
                          onClick={() => !isLocked && goToStep(index)}
                          style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <i className={`fas ${icon} me-3 ${isActive ? 'text-white' : isCompleted ? 'text-success' : 'text-primary'}`}></i>
                              <div>
                                <div className={`${isActive ? 'text-white' : ''}`}>
                                  Step {index + 1}: {step.title}
                                </div>
                                <div className={`small ${isActive ? 'text-white-50' : 'text-muted'}`}>
                                  {step.type.charAt(0).toUpperCase() + step.type.slice(1)} • 
                                  {step.type === 'video' ? ` ${step.content.duration} min` : 
                                   ` ${step.content.questions?.length || 0} questions`}
                                </div>
                              </div>
                            </div>
                            {isCompleted && !isActive && (
                              <span className="badge rounded-pill bg-success">
                                <i className="fas fa-check"></i>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Current step content */}
              <div className="col-md-8">
                <div className="card shadow-sm border-0 rounded-lg">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {course.steps[currentStep]?.title}
                    </h5>
                    <div>Step {currentStep + 1} of {course.steps.length}</div>
                  </div>
                  
                  <div className="card-body p-4">
                    {renderStepContent()}
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="card-footer bg-light d-flex justify-content-between py-3">
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
                            completeStep();
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
                        onClick={async () => {
                          // Check if all steps are completed
                          const allStepsCompleted = course.steps.every((step) => 
                            course.userProgress?.completedSteps?.includes(step._id)
                          );
                          
                          if (allStepsCompleted) {
                            // Show loading animation
                            Swal.fire({
                              title: 'Generating Certificate',
                              text: 'Please wait while we prepare your certificate...',
                              allowOutsideClick: false,
                              didOpen: () => {
                                Swal.showLoading();
                              }
                            });
                            
                            try {
                              // Check if user already has a certificate for this course
                              const certificateCheckResponse = await authAxios.get(`${API_BASE_URL}/api/certificates/verify/${course._id}`);
                              
                              if (certificateCheckResponse.data && certificateCheckResponse.data.exists) {
                                // Certificate already exists, show it
                                console.log('Certificate exists response:', certificateCheckResponse.data);
                                Swal.close();
                                
                                // Use certificateId or _id, whichever is available
                                const certId = certificateCheckResponse.data.certificateId || certificateCheckResponse.data._id;
                                
                                if (certId) {
                                  console.log('Redirecting to certificate page with ID:', certId);
                                  router.push(`/certificate/${certId}`);
                                } else {
                                  console.error('Certificate ID not found in response:', certificateCheckResponse.data);
                                  Swal.fire({
                                    title: 'Error',
                                    text: 'Certificate found but ID is missing. Please try again.',
                                    icon: 'error'
                                  });
                                }
                                return;
                              }
                              
                              console.log('Creating certificate for course:', course._id);
                              console.log('User from localStorage:', JSON.parse(localStorage.getItem('user') || '{}'));
                              
                              // Create certificate
                              const certResponse = await authAxios.post(`${API_BASE_URL}/api/certificates`, {
                                courseId: course._id,
                                courseName: course.title,
                                skills: course.skills || [],
                                score: 100, // Default score for completion
                                grade: 'A' // Default grade for completion
                              });
                              
                              console.log('Certificate creation response:', certResponse.data);
                              
                              if (certResponse.data && certResponse.data._id) {
                                // Show success animation
                                Swal.fire({
                                  title: 'Congratulations!',
                                  text: 'You have successfully completed this course!',
                                  icon: 'success',
                                  confirmButtonColor: '#3085d6',
                                  showConfirmButton: true,
                                  backdrop: `
                                    rgba(0,0,123,0.4)
                                    url("/images/confetti.gif")
                                    center top
                                    no-repeat
                                  `,
                                  customClass: {
                                    popup: 'certificate-popup'
                                  }
                                }).then((result) => {
                                  // Navigate to certificate page
                                  router.push(`/certificate/${certResponse.data._id}`);
                                });
                                
                                // Update course data to show certificate badge
                                setCourse({
                                  ...course,
                                  isCertified: true,
                                  certificateId: certResponse.data._id
                                });
                              } else {
                                throw new Error('Failed to create certificate');
                              }
                            } catch (error) {
                              console.error('Error creating certificate:', error);
                              Swal.fire({
                                title: 'Error',
                                text: 'There was a problem generating your certificate. Please try again.',
                                icon: 'error',
                                confirmButtonColor: '#3085d6'
                              });
                            }
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
        </div>
      ) : (
        <div className="container text-center p-5">
          <div className="alert alert-warning">
            Course not found
          </div>
        </div>
      )}
            <style jsx>{`
        .step-item {
          border-radius: 0.5rem;
          background-color: #f8f9fa;
          cursor: pointer;
          transition: all 0.2s ease;
{{ ... }}
        }
        
        .badge.rounded-pill {
          border-radius: 50rem;
        }
        
        .certificate-popup {
          animation: scaleUp 0.5s ease-in-out;
        }
        
        @keyframes scaleUp {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .certified-course-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          transform: rotate(15deg);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: rotate(15deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.1); }
          100% { transform: rotate(15deg) scale(1); }
        }
      `}</style>
    </Layout>
  );
}
