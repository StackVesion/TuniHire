import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import Swal from 'sweetalert2';
import { createAuthAxios } from '../utils/authUtils';
import Pagination from "@/components/filter/Pagination";

// Initialize auth axios instance
const authAxios = createAuthAxios();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CoursePage() {
    const router = useRouter();
    
    // State variables
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userSubscription, setUserSubscription] = useState('Free');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        category: '',
        difficulty: '',
        subscription: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Subscription levels for access control
    const subscriptionLevels = {
        'Free': 0,
        'Golden': 1,
        'Platinum': 2,
        'Master': 3
    };
    
    // Pagination settings
    const limit = 8;
    const showPagination = 4;
    const [pagination, setPagination] = useState([]);
    
    // Categories and difficulties for filtering
    const categories = ['Web Development', 'Mobile Development', 'Data Science', 'DevOps', 'Design', 'Business'];
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    
    useEffect(() => {
        // Get user's subscription info from localStorage
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.subscription) {
                setUserSubscription(userData.subscription);
            }
        } catch (e) {
            console.error('Error reading from localStorage:', e);
        }
        
        // Fetch courses
        fetchCourses();
    }, [currentPage, filters, searchTerm]);
    
    // Function to fetch courses from API
    const fetchCourses = async () => {
        setLoading(true);
        try {
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit,
                category: filters.category,
                difficulty: filters.difficulty,
                subscription: filters.subscription,
                search: searchTerm
            });
            
            console.log(`Attempting to fetch courses from ${API_BASE_URL}/api/courses?${queryParams}`);
            
            // Try calling the API with authenticated request to get user-specific data
            try {
                const response = await authAxios.get(`${API_BASE_URL}/api/courses?${queryParams}`);
                
                if (response.data) {
                    console.log('Successfully fetched courses from API');
                    
                    // Get enrollment and certificate data for the user if they're logged in
                    let coursesWithStatus = response.data.courses || [];
                    
                    // If user is authenticated, fetch their progress and certificates
                    if (localStorage.getItem('token')) {
                        try {
                            // Get user's progress for all courses
                            const progressResponse = await authAxios.get(`${API_BASE_URL}/api/courses/user/progress`);
                            const userProgress = progressResponse.data.data || [];
                            
                            // Create maps for fast lookup
                            const progressMap = {};
                            const certificateMap = {};
                            
                            // Try to get user's certificates, but continue if it fails
                            try {
                                const certificatesResponse = await authAxios.get(`${API_BASE_URL}/api/certificates/user`);
                                const userCertificates = certificatesResponse.data?.data || [];
                                
                                // Create certificate mapping
                                console.log('Processing certificate data:', userCertificates);
                                userCertificates.forEach(cert => {
                                    // Handle different certificate data formats
                                    let courseId;
                                    
                                    // If course is a populated object
                                    if (cert.course && typeof cert.course === 'object') {
                                        courseId = cert.course._id;
                                    }
                                    // If course is a string ID
                                    else if (cert.course) {
                                        courseId = cert.course.toString();
                                    }
                                    // Fall back to courseId property if it exists
                                    else if (cert.courseId) {
                                        courseId = cert.courseId.toString();
                                    }
                                    
                                    // Only map if we have a valid course ID and certificate ID
                                    if (courseId && cert._id) {
                                        console.log(`Mapping certificate ${cert._id} to course ${courseId}`);
                                        certificateMap[courseId] = cert._id;
                                    }
                                });
                            } catch (certError) {
                                console.error('Error fetching certificates, continuing without them:', certError);
                                // Continue without certificates
                            }
                            
                            // Process progress data to extract certificates too
                            userProgress.forEach(progress => {
                                if (progress && progress.course && progress.course._id) {
                                    progressMap[progress.course._id] = progress;
                                }
                            });
                            
                            // Update course data with progress information and certificate status
                            coursesWithStatus = coursesWithStatus.map(course => {
                                // Get progress for this course
                                const progress = progressMap[course._id];
                                
                                // Calculate progress percentage if available
                                let progressPercentage = 0;
                                if (progress && progress.completedSteps && course.steps) {
                                    progressPercentage = (progress.completedSteps.length / course.steps.length) * 100;
                                }
                                
                                // Check if course has a certificate - try multiple ID formats
                                // This ensures we catch certificates regardless of ID format issues
                                let certificateId = null;
                                
                                // Try direct lookup first
                                if (certificateMap[course._id]) {
                                    certificateId = certificateMap[course._id];
                                } 
                                // Then try with toString() to handle ObjectID vs string comparisons
                                else if (course._id && certificateMap[course._id.toString()]) {
                                    certificateId = certificateMap[course._id.toString()];
                                }
                                
                                if (certificateId) {
                                    console.log(`Course ${course.title} (${course._id}) has certificate: ${certificateId}`);
                                }
                                
                                return {
                                    ...course,
                                    progress: progressPercentage,
                                    enrolled: progress ? true : false,
                                    completed: progressPercentage === 100,
                                    certificateId: certificateId,
                                    isCertified: !!certificateId
                                };
                            });
                        } catch (progressError) {
                            console.error('Error fetching user progress:', progressError);
                        }
                    }
                    
                    setCourses(coursesWithStatus);
                    setTotalPages(response.data.pagination?.pages || 1);
                    
                    // Create pagination array
                    const paginationArray = new Array(response.data.pagination?.pages || 1)
                        .fill()
                        .map((_, idx) => idx + 1);
                    setPagination(paginationArray);
                }
            } catch (apiError) {
                console.warn('API not available, using mock data', apiError);
                
                // Use mock data since API is not responding
                const mockCourses = generateMockCourses();
                setCourses(mockCourses);
                setTotalPages(Math.ceil(mockCourses.length / limit));
                
                // Create pagination array
                const paginationArray = new Array(Math.ceil(mockCourses.length / limit))
                    .fill()
                    .map((_, idx) => idx + 1);
                setPagination(paginationArray);
            }
        } catch (error) {
            console.error('Error in fetchCourses:', error);
            setError('Failed to load courses. Using sample data instead.');
            
            // Use mock data as fallback
            const mockCourses = generateMockCourses();
            setCourses(mockCourses);
            setTotalPages(Math.ceil(mockCourses.length / limit));
            
            // Create pagination array
            const paginationArray = new Array(Math.ceil(mockCourses.length / limit))
                .fill()
                .map((_, idx) => idx + 1);
            setPagination(paginationArray);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle filter changes
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1); // Reset to first page when filters change
    };
    
    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when search changes
    };
    
    // Pagination functions
    const next = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };
    
    const prev = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };
    
    const handleActive = (page) => {
        setCurrentPage(page);
    };
    
    // Get pagination group for display
    const getPaginationGroup = pagination.slice(
        Math.floor((currentPage - 1) / showPagination) * showPagination,
        Math.floor((currentPage - 1) / showPagination) * showPagination + showPagination
    );
    
    // Handle course click - check subscription before allowing access
    const handleCourseClick = (course) => {
        const userLevel = subscriptionLevels[userSubscription] || 0;
        const requiredLevel = subscriptionLevels[course.subscriptionRequired] || 0;
        
        if (userLevel >= requiredLevel) {
            // User has sufficient subscription, navigate to course details
            router.push(`/course/${course._id}`);
        } else {
            // User doesn't have required subscription, show upgrade prompt
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
                    // Navigate to pricing page
                    router.push('/pricing');
                }
            });
        }
    };
    
    // Generate mock courses for development
    const generateMockCourses = () => {
        return [
            {
                _id: 'c1',
                title: 'Complete Web Development Bootcamp',
                description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more to become a full-stack web developer.',
                shortDescription: 'Comprehensive web development course',
                thumbnail: '/images/courses/web-dev.jpg',
                instructor: { name: 'John Smith' },
                category: 'Web Development',
                skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
                difficulty: 'beginner',
                duration: 1800, // 30 hours
                enrolledUsers: 1250,
                ratings: { average: 4.7, count: 350 },
                subscriptionRequired: 'Free',
                progress: 0
            },
            {
                _id: 'c2',
                title: 'Advanced React Patterns',
                description: 'Master advanced React patterns and state management techniques.',
                shortDescription: 'Take your React skills to the next level',
                thumbnail: '/images/courses/react.jpg',
                instructor: { name: 'Sarah Johnson' },
                category: 'Web Development',
                skills: ['React', 'Redux', 'Context API', 'Hooks'],
                difficulty: 'intermediate',
                duration: 720, // 12 hours
                enrolledUsers: 850,
                ratings: { average: 4.8, count: 210 },
                subscriptionRequired: 'Golden',
                progress: 25
            },
            {
                _id: 'c3',
                title: 'Machine Learning Fundamentals',
                description: 'Learn the basics of machine learning with Python and scikit-learn.',
                shortDescription: 'Your first step into ML',
                thumbnail: '/images/courses/ml.jpg',
                instructor: { name: 'Michael Chen' },
                category: 'Data Science',
                skills: ['Python', 'Machine Learning', 'scikit-learn'],
                difficulty: 'intermediate',
                duration: 900, // 15 hours
                enrolledUsers: 1050,
                ratings: { average: 4.6, count: 280 },
                subscriptionRequired: 'Platinum',
                progress: 75
            },
            {
                _id: 'c4',
                title: 'UI/UX Design Principles',
                description: 'Master the principles of user interface and user experience design.',
                shortDescription: 'Create beautiful and functional designs',
                thumbnail: '/images/courses/design.jpg',
                instructor: { name: 'Emily Davis' },
                category: 'Design',
                skills: ['UI Design', 'UX Design', 'Figma', 'Adobe XD'],
                difficulty: 'beginner',
                duration: 600, // 10 hours
                enrolledUsers: 750,
                ratings: { average: 4.9, count: 180 },
                subscriptionRequired: 'Free',
                progress: 100
            }
        ];
    };

    return (
        <Layout breadcrumbTitle="Courses" breadcrumbActive="Courses">
            {/* Subscription check for free users */}
            {userSubscription === 'Free' && (
                <div className="subscription-banner bg-warning text-dark p-3 mb-4">
                    <div className="container d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">
                                <i className="fas fa-crown mr-2"></i>
                                Upgrade your subscription to access premium courses!
                            </h5>
                            <p className="mb-0">Free users have limited access to courses.</p>
                        </div>
                        <Link href="/pricing">
                            <button className="btn btn-dark">Upgrade Now</button>
                        </Link>
                    </div>
                </div>
            )}
            
            <div className="section-box">
                <div className="container">
                    {/* Filters and Search */}
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white">
                                <div className="panel-head">
                                    <h5>Explore Courses</h5>
                                </div>
                                <div className="panel-body">
                                    <div className="row">
                                        <div className="col-xl-8 col-lg-7">
                                            <div className="row mb-15">
                                                {/* Category filter */}
                                                <div className="col-md-4 mb-15">
                                                    <div className="form-group">
                                                        <label className="form-label" htmlFor="category-filter">
                                                            <i className="fi-rr-filter mr-5"></i>Category
                                                        </label>
                                                        <select 
                                                            className="form-control"
                                                            id="category-filter"
                                                            value={filters.category}
                                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                                        >
                                                            <option value="">All Categories</option>
                                                            {categories.map((category, index) => (
                                                                <option key={index} value={category}>{category}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                {/* Difficulty filter */}
                                                <div className="col-md-4 mb-15">
                                                    <div className="form-group">
                                                        <label className="form-label" htmlFor="difficulty-filter">
                                                            <i className="fi-rr-signal-alt-2 mr-5"></i>Difficulty
                                                        </label>
                                                        <select 
                                                            className="form-control"
                                                            id="difficulty-filter"
                                                            value={filters.difficulty}
                                                            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                                                        >
                                                            <option value="">All Levels</option>
                                                            {difficulties.map((difficulty, index) => (
                                                                <option key={index} value={difficulty}>
                                                                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                {/* Subscription filter */}
                                                <div className="col-md-4 mb-15">
                                                    <div className="form-group">
                                                        <label className="form-label" htmlFor="subscription-filter">
                                                            <i className="fi-rr-crown mr-5"></i>Subscription
                                                        </label>
                                                        <select 
                                                            className="form-control"
                                                            id="subscription-filter"
                                                            value={filters.subscription}
                                                            onChange={(e) => handleFilterChange('subscription', e.target.value)}
                                                        >
                                                            <option value="">All Plans</option>
                                                            <option value="Free">Free</option>
                                                            <option value="Golden">Golden</option>
                                                            <option value="Platinum">Platinum</option>
                                                            <option value="Master">Master</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Search bar */}
                                        <div className="col-xl-4 col-lg-5">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="search-input">
                                                    <i className="fi-rr-zoom-in mr-5"></i>Search Courses
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="search-input"
                                                        placeholder="Search by title, skills, or instructor"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                                                    />
                                                    <div className="input-group-append">
                                                        <button 
                                                            className="btn btn-default btn-icon" 
                                                            type="button"
                                                            onClick={handleSearch}
                                                        >
                                                            <i className="fi-rr-zoom-in"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Display active filters */}
                                    <div className="active-filters">
                                        {Object.entries(filters).filter(([_, value]) => value).length > 0 && (
                                            <div className="d-flex align-items-center mb-10">
                                                <span className="text-small mr-10">Active filters:</span>
                                                <div className="active-filter-badges">
                                                    {filters.category && (
                                                        <span className="badge">
                                                            Category: {filters.category}
                                                            <button 
                                                                className="btn-clear-filter" 
                                                                onClick={() => handleFilterChange('category', '')}
                                                            >
                                                                <i className="fi-rr-cross-small"></i>
                                                            </button>
                                                        </span>
                                                    )}
                                                    {filters.difficulty && (
                                                        <span className="badge">
                                                            Difficulty: {filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1)}
                                                            <button 
                                                                className="btn-clear-filter" 
                                                                onClick={() => handleFilterChange('difficulty', '')}
                                                            >
                                                                <i className="fi-rr-cross-small"></i>
                                                            </button>
                                                        </span>
                                                    )}
                                                    {filters.subscription && (
                                                        <span className="badge">
                                                            Subscription: {filters.subscription}
                                                            <button 
                                                                className="btn-clear-filter" 
                                                                onClick={() => handleFilterChange('subscription', '')}
                                                            >
                                                                <i className="fi-rr-cross-small"></i>
                                                            </button>
                                                        </span>
                                                    )}
                                                    {(filters.category || filters.difficulty || filters.subscription) && (
                                                        <button 
                                                            className="btn btn-xs btn-outline-danger ml-10"
                                                            onClick={() => {
                                                                setFilters({
                                                                    category: '',
                                                                    difficulty: '',
                                                                    subscription: ''
                                                                });
                                                            }}
                                                        >
                                                            Clear All
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {searchTerm && (
                                            <div className="d-flex align-items-center mb-10">
                                                <span className="text-small mr-10">Search:</span>
                                                <span className="badge">
                                                    "{searchTerm}"
                                                    <button 
                                                        className="btn-clear-filter" 
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        <i className="fi-rr-cross-small"></i>
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Courses grid */}
                    <div className="row mt-10">
                        {loading ? (
                            <div className="loader-center">
                                <div className="loader"></div>
                            </div>
                        ) : courses.length > 0 ? (
                            courses.map((course) => (
                                <div key={course._id} className="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-30">
                                    <div 
                                        className={`card-grid-2 card-course ${!course.enrolled && subscriptionLevels[userSubscription] < subscriptionLevels[course.subscriptionRequired] ? 'course-locked' : ''}`} 
                                        onClick={() => course.enrolled ? handleCourseClick(course) : null}
                                    >
                                        <div className="card-grid-2-image-wrap course-card-image position-relative">
                                            {course.thumbnail ? (
                                                <img 
                                                    src={course.thumbnail} 
                                                    alt={course.title} 
                                                    className={`${!course.enrolled && subscriptionLevels[userSubscription] < subscriptionLevels[course.subscriptionRequired] ? 'locked-image' : ''}`}
                                                    onError={(e) => {
                                                        e.target.src = "/assets/imgs/page/dashboard/course-placeholder.jpg";
                                                    }}
                                                />
                                            ) : (
                                                <img 
                                                    src="/assets/imgs/page/dashboard/course-placeholder.jpg" 
                                                    alt={course.title} 
                                                    className={`${!course.enrolled && subscriptionLevels[userSubscription] < subscriptionLevels[course.subscriptionRequired] ? 'locked-image' : ''}`}
                                                />
                                            )}
                                            
                                            {/* Show subscription lock overlay if needed */}
                                            {!course.enrolled && subscriptionLevels[userSubscription] < subscriptionLevels[course.subscriptionRequired] && (
                                                <div className="course-lock-overlay">
                                                    <div className="lock-icon">
                                                        <i className="fi-rr-lock" style={{ fontSize: '24px' }}></i>
                                                        <div className="mt-2">{course.subscriptionRequired} Plan Required</div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Enrollment Status and Completion Badges */}
                                            <div className="course-badge-container">
                                                {course.enrolled && (
                                                    <div className="course-badge enrolled">
                                                        <i className="fi-rr-check-circle mr-5"></i> Enrolled
                                                    </div>
                                                )}
                                                {course.completed && (
                                                    <div className="course-badge completed">
                                                        <i className="fi-rr-diploma mr-5"></i> Completed
                                                    </div>
                                                )}
                                                {course.isCertified && (
                                                    <div className="course-certified-badge">
                                                        <img 
                                                            src="/images/certified-badge.png" 
                                                            alt="Certified" 
                                                            width="50" 
                                                            height="50"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Subscription Badge */}
                                            <div className={`course-subscription-badge ${course.subscriptionRequired.toLowerCase()}`}>
                                                {course.subscriptionRequired}
                                            </div>
                                        </div>
                                        
                                        <div className="card-block-info">
                                            <div className="d-flex justify-content-between mb-5">
                                                <span className="course-category">{course.category}</span>
                                                <span className={`course-difficulty ${course.difficulty}`}>{course.difficulty}</span>
                                            </div>
                                            
                                            <h5 className="course-title"><Link href={`/course/${course._id}`}>{course.title}</Link></h5>
                                            <p className="course-description">{course.shortDescription || course.description}</p>
                                            
                                            {/* Skills Tags */}
                                            <div className="course-skills">
                                                {course.skills && course.skills.slice(0, 3).map((skill, index) => (
                                                    <span key={index} className="course-skill-badge">{skill}</span>
                                                ))}
                                                {course.skills && course.skills.length > 3 && (
                                                    <span className="course-skill-badge more">+{course.skills.length - 3}</span>
                                                )}
                                            </div>
                                            
                                            {/* Progress Bar for Enrolled Courses */}
                                            {course.enrolled && (
                                                <div className="mt-15">
                                                    <div className="progress">
                                                        <div 
                                                            className="progress-bar" 
                                                            role="progressbar" 
                                                            style={{ width: `${course.progress}%` }} 
                                                            aria-valuenow={course.progress} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        ></div>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <small className="text-muted">{Math.round(course.progress)}% Complete</small>
                                                        {course.certificateId && (
                                                            <Link 
                                                                href={`/certificate/${course.certificateId}`} 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log('Navigating to certificate:', course.certificateId);
                                                                }} 
                                                                className="btn-view-certificate"
                                                            >
                                                                View Certificate
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="course-meta mt-10">
                                                <div>
                                                    <i className="fi-rr-user mr-5"></i>{course.instructor?.name || 'Instructor'}
                                                </div>
                                                <div>
                                                    <i className="fi-rr-book-alt mr-5"></i>{course.steps?.length || 0} Lessons
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center mt-50">
                                <img src="/assets/imgs/page/dashboard/no-courses.svg" alt="No courses found" className="mb-20" style={{ maxHeight: '150px' }} />
                                <h3>No courses found</h3>
                                <p className="text-muted">Try adjusting your filters or search terms</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Pagination */}
                    {!loading && courses.length > 0 && (
                        <div className="row">
                            <div className="col-12">
                                <div className="paginations">
                                    <Pagination
                                        getPaginationGroup={getPaginationGroup}
                                        currentPage={currentPage}
                                        pages={totalPages}
                                        next={next}
                                        prev={prev}
                                        handleActive={handleActive}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .subscription-banner {
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .card-grid-2 {
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background-color: #fff;
                }
                
                .card-grid-2:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                
                .card-grid-2-image-wrap {
                    position: relative;
                    height: 160px;
                    overflow: hidden;
                }
                
                .card-grid-2-image-wrap img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }
                
                .card-grid-2:hover .card-grid-2-image-wrap img {
                    transform: scale(1.1);
                }
                
                .course-badge-container {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                }
                
                .course-badge {
                    background-color: #4CAF50;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .course-badge.enrolled {
                    background-color: #4CAF50;
                }
                
                .course-badge.completed {
                    background-color: #9E9E9E;
                }
                
                .course-subscription-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    color: white;
                }
                
                .course-subscription-badge.free {
                    background-color: #4CAF50;
                }
                
                .course-subscription-badge.golden {
                    background-color: #FFC107;
                    color: #212121;
                }
                
                .course-subscription-badge.platinum {
                    background-color: #9E9E9E;
                }
                
                .course-subscription-badge.master {
                    background-color: #3F51B5;
                }
                
                .card-block-info {
                    padding: 20px;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .course-category {
                    background-color: #E3F2FD;
                    color: #1976D2;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .course-difficulty {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .course-difficulty.beginner {
                    background-color: #E8F5E9;
                    color: #388E3C;
                }
                
                .course-difficulty.intermediate {
                    background-color: #FFF8E1;
                    color: #FFA000;
                }
                
                .course-difficulty.advanced {
                    background-color: #FFEBEE;
                    color: #D32F2F;
                }
                
                .course-title {
                    margin-top: 10px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #212121;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    height: 50px;
                }
                
                .course-description {
                    color: #616161;
                    font-size: 14px;
                    margin: 10px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    height: 42px;
                }
                
                .course-meta {
                    display: flex;
                    justify-content: space-between;
                    color: #757575;
                    font-size: 13px;
                    margin-top: auto;
                    padding-top: 10px;
                }
                
                .course-skills {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-top: 10px;
                }
                
                .course-skill-badge {
                    background-color: #f5f5f5;
                    color: #616161;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }
                
                .course-skill-badge.more {
                    background-color: #EEEEEE;
                }
                
                .progress {
                    height: 8px;
                    margin-bottom: 5px;
                }
                
                .progress-bar {
                    background-color: #4CAF50;
                }
                
                .course-lock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                }
                
                .lock-icon {
                    text-align: center;
                }
                
                .locked-image {
                    filter: grayscale(100%) brightness(50%);
                }
                
                .course-locked {
                    cursor: not-allowed;
                }
                
                .active-filters {
                    margin-top: 20px;
                }
                
                .active-filter-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .badge {
                    background-color: #f5f5f5;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #616161;
                    display: flex;
                    align-items: center;
                }
                
                .badge .btn-clear-filter {
                    margin-left: 5px;
                    padding: 0;
                    border: none;
                    background-color: transparent;
                    color: #616161;
                    font-size: 12px;
                    cursor: pointer;
                }
                
                .badge .btn-clear-filter:hover {
                    color: #212121;
                }
                
                .btn-clear-filter i {
                    font-size: 12px;
                }
                
                .btn-view-certificate {
                    font-size: 12px;
                    padding: 5px 10px;
                    border-radius: 20px;
                    border: none;
                    background-color: #4CAF50;
                    color: white;
                    cursor: pointer;
                }
                
                .btn-view-certificate:hover {
                    background-color: #3e8e41;
                }
                
                .course-certified-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 10;
                    transform: rotate(15deg);
                    animation: pulse-badge 2s infinite;
                }
                
                @keyframes pulse-badge {
                    0% { transform: rotate(15deg) scale(1); }
                    50% { transform: rotate(15deg) scale(1.1); }
                    100% { transform: rotate(15deg) scale(1); }
                }
            `}</style>
        </Layout>
    );
}