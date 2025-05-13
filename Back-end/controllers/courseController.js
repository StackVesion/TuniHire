const Course = require('../models/Course');
const UserCourseProgress = require('../models/UserCourseProgress');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const mongoose = require('mongoose');

// Test endpoint to check if routes are working
exports.testEndpoint = async (req, res) => {
  try {
    return res.status(200).json({ 
      message: 'Course API is working!',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all courses with filtering and pagination
exports.getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    
    // Build query filters
    const filter = {};
    
    if (req.query.category && req.query.category !== '') {
      filter.category = req.query.category;
    }
    
    if (req.query.difficulty && req.query.difficulty !== '') {
      filter.difficulty = req.query.difficulty;
    }
    
    if (req.query.subscription && req.query.subscription !== '') {
      filter.subscriptionRequired = req.query.subscription;
    }
    
    if (req.query.search && req.query.search !== '') {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'instructor.name': { $regex: req.query.search, $options: 'i' } },
        { skills: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Only show published courses
    filter.isPublished = true;
    
    // Count total courses matching the filter
    const total = await Course.countDocuments(filter);
    
    // Get courses with pagination
    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // If user is authenticated, get their progress for these courses
    let coursesWithProgress = courses;
    
    if (req.user) {
      // Find all progress records for this user for the current courses
      const courseIds = courses.map(course => course._id);
      const progressRecords = await UserCourseProgress.find({
        user: req.user.userId || req.user.id,
        course: { $in: courseIds }
      });
      
      // Create a map of course ID to progress percentage
      const progressMap = {};
      progressRecords.forEach(record => {
        progressMap[record.course.toString()] = record.progressPercentage;
      });
      
      // Add progress to each course
      coursesWithProgress = courses.map(course => {
        const courseObj = course.toObject();
        courseObj.progress = progressMap[course._id.toString()] || 0;
        return courseObj;
      });
    }
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      courses: coursesWithProgress,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get course by ID with user progress if authenticated
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Convert to object for modification
    const courseObj = course.toObject();
    
    // If user is authenticated, get their progress
    if (req.user) {
      const progress = await UserCourseProgress.findOne({
        user: req.user.userId || req.user.id,
        course: course._id
      });
      
      if (progress) {
        courseObj.userProgress = {
          progressPercentage: progress.progressPercentage,
          currentStep: progress.currentStep,
          completed: progress.completed,
          completedAt: progress.completedAt,
          certificateIssued: progress.certificateIssued,
          certificateId: progress.certificateId,
          completedSteps: progress.completedSteps
        };
      } else {
        courseObj.userProgress = null;
      }
    }
    
    res.status(200).json(courseObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new course (admin only)
exports.createCourse = async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update course (admin only)
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete course (admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enroll in a course
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId || req.user.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user has required subscription
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const subscriptionLevels = {
      'Free': 0,
      'Golden': 1,
      'Platinum': 2,
      'Master': 3
    };
    
    const userLevel = subscriptionLevels[user.subscription] || 0;
    const requiredLevel = subscriptionLevels[course.subscriptionRequired] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        message: 'Subscription required',
        requiredSubscription: course.subscriptionRequired,
        currentSubscription: user.subscription 
      });
    }
    
    // Check if already enrolled
    let progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId
    });
    
    // If already enrolled, return the existing progress
    if (progress) {
      // Update last accessed time to show user returned to course
      progress.lastAccessedAt = new Date();
      await progress.save();
      
      return res.status(200).json({ 
        message: 'Continuing course',
        progress: progress,
        resuming: true
      });
    }
    
    // Create progress record for new enrollment
    progress = new UserCourseProgress({
      user: userId,
      course: courseId,
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
      currentStep: 0,
      progressPercentage: 0,
      completed: false,
      completedSteps: []
    });
    
    await progress.save();
    
    // Increment enrolled users count for the course
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledUsers: 1 }
    });
    
    res.status(201).json({ 
      message: 'Successfully enrolled in course',
      progress: progress,
      resuming: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update course progress
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, stepId, completed, score } = req.body;
    const userId = req.user.userId || req.user.id;
    
    // Find user's progress for this course
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    // Get the course to know total steps
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find the step in user's completedSteps array
    const stepIndex = progress.completedSteps.findIndex(
      step => step.stepId.toString() === stepId
    );
    
    const now = new Date();
    
    // If step not found in completedSteps, add it
    if (stepIndex === -1 && completed) {
      progress.completedSteps.push({
        stepId,
        completed,
        completedAt: now,
        score,
        attempts: 1,
        lastAttemptAt: now
      });
    } 
    // Otherwise update existing step
    else if (stepIndex !== -1) {
      if (completed) {
        progress.completedSteps[stepIndex].completed = true;
        progress.completedSteps[stepIndex].completedAt = now;
      }
      
      if (score !== undefined) {
        progress.completedSteps[stepIndex].score = score;
      }
      
      // Increment attempts
      progress.completedSteps[stepIndex].attempts += 1;
      progress.completedSteps[stepIndex].lastAttemptAt = now;
    }
    
    // Update last accessed time
    progress.lastAccessedAt = now;
    
    // Calculate progress percentage
    const totalSteps = course.steps.length;
    const completedStepsCount = progress.completedSteps.filter(step => step.completed).length;
    
    progress.progressPercentage = Math.round((completedStepsCount / totalSteps) * 100);
    
    // Check if course is now completed
    if (progress.progressPercentage === 100 && !progress.completed) {
      progress.completed = true;
      progress.completedAt = now;
      
      // Issue certificate if all steps are completed
      if (!progress.certificateIssued) {
        const certificate = new Certificate({
          user: userId,
          course: courseId,
          issuedDate: now,
          completionDate: now,
          skills: course.skills,
          grade: calculateGrade(progress),
          score: calculateAverageScore(progress)
        });
        
        const savedCertificate = await certificate.save();
        
        // Update progress with certificate info
        progress.certificateIssued = true;
        progress.certificateId = savedCertificate._id;
      }
    }
    
    await progress.save();
    
    res.status(200).json({
      message: 'Progress updated',
      progress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's course progress
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { courseId } = req.params;
    
    // Find progress
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'No progress found for this course' });
    }
    
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all user's certificates
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find all certificates for this user
    const certificates = await Certificate.find({ user: userId })
      .populate('course', 'title thumbnail description skills instructor')
      .sort({ issuedDate: -1 });
    
    res.status(200).json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
function calculateGrade(progress) {
  const avgScore = calculateAverageScore(progress);
  
  if (avgScore >= 90) return 'A';
  if (avgScore >= 80) return 'B';
  if (avgScore >= 70) return 'C';
  if (avgScore >= 60) return 'D';
  return 'F';
}

function calculateAverageScore(progress) {
  const quizScores = progress.completedSteps.filter(step => step.score !== undefined);
  
  if (quizScores.length === 0) return 100; // No quizzes, give full score
  
  const totalScore = quizScores.reduce((sum, step) => sum + step.score, 0);
  return Math.round(totalScore / quizScores.length);
}

// =========== COMPANY PANEL COURSE API ENDPOINTS ===========

/**
 * @desc    Get a specific course with user progress data
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourseWithUserProgress = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.userId || req.user.id;
    console.log(`Getting course ${courseId} for user ${userId}`);

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find user progress for this course
    const userProgress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId
    });

    // Attach user progress to course
    const courseWithProgress = course.toObject();
    courseWithProgress.userProgress = userProgress || null;
    courseWithProgress.enrolled = !!userProgress;

    res.status(200).json({
      success: true,
      data: courseWithProgress
    });
  } catch (error) {
    console.error('Error getting course with user progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Enroll user in a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private
 */
exports.enrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Log authentication data for debugging
    console.log('Auth data:', {
      userExists: !!req.user,
      userId: req.user.userId || req.user.id,
      authHeader: req.headers.authorization ? 'Present' : 'Missing',
      tokenContent: req.user
    });
    
    // Get user ID from the auth middleware
    const userId = req.user.userId || req.user.id;
    console.log(`Enrolling user ${userId} in course ${courseId}`);

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if user is already enrolled
    let userProgress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId
    });

    if (userProgress) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already enrolled in this course',
        userProgress
      });
    }

    // Create new progress record with explicit MongoDB ObjectIds
    const progressData = {
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      startDate: new Date(),
      lastAccessDate: new Date(),
      currentStep: 0,
      progressPercentage: 0,
      completedSteps: []
    };
    
    console.log('Creating progress with data:', progressData);
    
    userProgress = new UserCourseProgress(progressData);
    const savedProgress = await userProgress.save();
    console.log('Progress saved successfully:', savedProgress._id);

    // Increment enrolled users count
    course.enrolledUsers = (course.enrolledUsers || 0) + 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      userProgress: savedProgress
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update course progress
 * @route   POST /api/courses/progress
 * @access  Private
 */
exports.updateCourseProgress = async (req, res) => {
  try {
    const { courseId, stepId, score } = req.body;
    const userId = req.user.userId || req.user.id;
    console.log(`Updating progress for user ${userId} in course ${courseId}, step ${stepId}`);

    if (!courseId || !stepId) {
      return res.status(400).json({ success: false, message: 'Course ID and Step ID are required' });
    }

    // Find the course and user progress
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let userProgress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId
    });

    if (!userProgress) {
      return res.status(404).json({ 
        success: false, 
        message: 'User is not enrolled in this course. Please enroll first.' 
      });
    }

    // Find the step index
    const stepIndex = course.steps.findIndex(step => step._id.toString() === stepId);
    if (stepIndex === -1) {
      return res.status(404).json({ success: false, message: 'Step not found in course' });
    }

    // Add the step to completed steps if not already completed
    if (!userProgress.completedSteps.includes(stepId)) {
      userProgress.completedSteps.push(stepId);
    }

    // Store score if provided (for quiz or test)
    if (score !== null && score !== undefined) {
      if (!userProgress.scores) {
        userProgress.scores = new Map();
      }
      userProgress.scores.set(stepId, score);
    }

    // Update last access date
    userProgress.lastAccessDate = new Date();

    // Update current step to next available step
    if (stepIndex < course.steps.length - 1) {
      userProgress.currentStep = stepIndex + 1;
    }

    // Calculate progress percentage
    userProgress.progressPercentage = Math.round((userProgress.completedSteps.length / course.steps.length) * 100);

    // If all steps are completed, mark as completed and issue certificate
    if (userProgress.completedSteps.length === course.steps.length) {
      userProgress.completionDate = new Date();
      
      // Create certificate if course is completed and certificate doesn't exist yet
      if (!userProgress.certificateId) {
        const certificate = await createCertificate(userId, courseId, userProgress);
        if (certificate) {
          userProgress.certificateId = certificate._id;
        }
      }
    }

    // Save progress
    await userProgress.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      updatedProgress: userProgress
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get user's course progress
 * @route   GET /api/courses/user/progress
 * @access  Private
 */
exports.getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log(`Getting all course progress for user ${userId}`);
    
    // Get all user progress
    const userProgress = await UserCourseProgress.find({ user: userId })
      .populate('course', 'title thumbnail shortDescription subscriptionRequired');

    res.status(200).json({ 
      success: true, 
      count: userProgress.length,
      data: userProgress
    });
  } catch (error) {
    console.error('Error getting user course progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get certificate by ID
 * @route   GET /api/certificates/:id
 * @access  Private
 */
exports.getCertificate = async (req, res) => {
  try {
    const certificateId = req.params.id;
    const userId = req.user.userId || req.user.id;

    const certificate = await Certificate.findOne({
      _id: certificateId,
      user: userId
    }).populate('course', 'title shortDescription skills instructor');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: certificate
    });
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get certificate by course ID
 * @route   GET /api/certificates/course/:courseId
 * @access  Private
 */
exports.getCertificateByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.userId || req.user.id;

    const certificate = await Certificate.findOne({
      course: courseId,
      user: userId
    }).populate('course', 'title shortDescription skills instructor');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: certificate
    });
  } catch (error) {
    console.error('Error getting certificate by course:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Create a certificate for completed course
 * @param   {string} userId User ID
 * @param   {string} courseId Course ID
 * @param   {Object} progress User's course progress
 * @returns {Object} Certificate document
 */
async function createCertificate(userId, courseId, progress) {
  try {
    // Get user and course data
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);
    
    if (!user || !course) return null;
    
    // Calculate grade
    const grade = calculateGrade(progress);
    
    // Create certificate
    const certificate = new Certificate({
      user: userId,
      course: courseId,
      issueDate: new Date(),
      grade,
      completionDate: progress.completionDate || new Date(),
      certificateNumber: `CERT-${Date.now()}-${userId.substring(0, 5)}`,
      courseName: course.title,
      userName: `${user.firstName} ${user.lastName}`,
      skills: course.skills || []
    });
    
    await certificate.save();
    return certificate;
  } catch (error) {
    console.error('Error creating certificate:', error);
    return null;
  }
}
