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
            
            console.log(`Fetching courses from ${API_BASE_URL}/api/courses?${queryParams}`);
            
            // Make API request
            const response = await authAxios.get(`${API_BASE_URL}/api/courses?${queryParams}`);
            
            if (response.data) {
                setCourses(response.data.courses || []);
                setTotalPages(response.data.pagination?.pages || 1);
                
                // Create pagination array
                const paginationArray = new Array(response.data.pagination?.pages || 1)
                    .fill()
                    .map((_, idx) => idx + 1);
                setPagination(paginationArray);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to load courses. Please try again later.');
            
            // Use mock data as fallback if API fails
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
        const subscriptionLevels = {
            'Free': 0,
            'Golden': 1,
            'Platinum': 2,
            'Master': 3
        };
        
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
                    {/* Search and filter section */}
                    <div className="panel-white mb-30">
                        <div className="box-padding">
                            <div className="row mb-4">
                                <div className="col-lg-8">
                                    <form onSubmit={handleSearch} className="d-flex">
                                        <input
                                            type="text"
                                            className="form-control mr-2"
                                            placeholder="Search courses..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i>
                                        </button>
                                    </form>
                                </div>
                                <div className="col-lg-4 d-flex justify-content-end">
                                    <div className="dropdown mr-2">
                                        <button className="btn btn-outline-primary dropdown-toggle" type="button" data-toggle="dropdown">
                                            {filters.category || 'All Categories'}
                                        </button>
                                        <div className="dropdown-menu">
                                            <button 
                                                className="dropdown-item" 
                                                onClick={() => handleFilterChange('category', '')}
                                            >
                                                All Categories
                                            </button>
                                            {categories.map(category => (
                                                <button 
                                                    key={category} 
                                                    className="dropdown-item" 
                                                    onClick={() => handleFilterChange('category', category)}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="dropdown">
                                        <button className="btn btn-outline-primary dropdown-toggle" type="button" data-toggle="dropdown">
                                            {filters.difficulty ? 
                                                filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1) : 
                                                'All Levels'}
                                        </button>
                                        <div className="dropdown-menu">
                                            <button 
                                                className="dropdown-item" 
                                                onClick={() => handleFilterChange('difficulty', '')}
                                            >
                                                All Levels
                                            </button>
                                            {difficulties.map(difficulty => (
                                                <button 
                                                    key={difficulty} 
                                                    className="dropdown-item" 
                                                    onClick={() => handleFilterChange('difficulty', difficulty)}
                                                >
                                                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Courses grid */}
                            <div className="row">
                                {loading ? (
                                    <div className="col-12 text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3">Loading courses...</p>
                                    </div>
                                ) : error ? (
                                    <div className="col-12">
                                        <div className="alert alert-danger">{error}</div>
                                    </div>
                                ) : courses.length === 0 ? (
                                    <div className="col-12 text-center py-5">
                                        <div className="alert alert-info">
                                            No courses found matching your criteria.
                                        </div>
                                    </div>
                                ) : (
                                    courses.map(course => (
                                        <div className="col-xl-3 col-lg-4 col-md-6 mb-4" key={course._id}>
                                            <div className="course-card" onClick={() => handleCourseClick(course)}>
                                                <div className="course-card-image">
                                                    <img src={course.thumbnail || "/images/courses/default.jpg"} alt={course.title} />
                                                    {/* Subscription badge */}
                                                    <div className={`course-subscription-badge ${course.subscriptionRequired.toLowerCase()}`}>
                                                        {course.subscriptionRequired}
                                                    </div>
                                                </div>
                                                <div className="course-card-content">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="course-category">{course.category}</span>
                                                        <span className={`course-difficulty ${course.difficulty}`}>
                                                            {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                                                        </span>
                                                    </div>
                                                    <h5 className="course-title">{course.title}</h5>
                                                    <p className="course-description">{course.shortDescription || course.description.substring(0, 100) + '...'}</p>
                                                    <div className="course-meta">
                                                        <div className="course-instructor">
                                                            <i className="fas fa-user-tie"></i> {course.instructor.name}
                                                        </div>
                                                        <div className="course-duration">
                                                            <i className="fas fa-clock"></i> {Math.floor(course.duration / 60)} hrs
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Progress bar */}
                                                    {course.progress !== undefined && (
                                                        <div className="course-progress mt-3">
                                                            <div className="progress">
                                                                <div 
                                                                    className="progress-bar" 
                                                                    role="progressbar" 
                                                                    style={{width: `${course.progress}%`}}
                                                                    aria-valuenow={course.progress} 
                                                                    aria-valuemin="0" 
                                                                    aria-valuemax="100">
                                                                    {course.progress}%
                                                                </div>
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <small>{course.progress === 0 ? 'Not started' : 
                                                                       course.progress === 100 ? 'Completed' : 'In progress'}</small>
                                                                {course.progress === 100 && (
                                                                    <small className="text-success">
                                                                        <i className="fas fa-certificate"></i> Certificate earned
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Skills */}
                                                    <div className="course-skills mt-3">
                                                        {course.skills.slice(0, 3).map((skill, index) => (
                                                            <span key={index} className="course-skill-badge">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {course.skills.length > 3 && (
                                                            <span className="course-skill-badge more">
                                                                +{course.skills.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
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
                </div>
            </div>

            <style jsx>{`
                .subscription-banner {
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .course-card {
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
                
                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                
                .course-card-image {
                    position: relative;
                    height: 160px;
                    overflow: hidden;
                }
                
                .course-card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }
                
                .course-card:hover .course-card-image img {
                    transform: scale(1.1);
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
                
                .course-card-content {
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
            `}</style>
        </Layout>
    );
}