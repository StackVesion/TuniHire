const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
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
      const progressRecords = await CourseProgress.find({
        userId: req.user.id,
        courseId: { $in: courseIds }
      });
      
      // Create a map of course ID to progress percentage
      const progressMap = {};
      progressRecords.forEach(record => {
        progressMap[record.courseId.toString()] = record.progressPercentage;
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
      const progress = await CourseProgress.findOne({
        userId: req.user.id,
        courseId: course._id
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
    const userId = req.user.id;
    
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
    let progress = await CourseProgress.findOne({
      userId,
      courseId
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
    progress = new CourseProgress({
      userId,
      courseId,
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
    const userId = req.user.id;
    
    // Find user's progress for this course
    const progress = await CourseProgress.findOne({
      userId,
      courseId
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
          userId,
          courseId,
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
    const userId = req.user.id;
    const { courseId } = req.params;
    
    // Find progress
    const progress = await CourseProgress.findOne({
      userId,
      courseId
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
    const userId = req.user.id;
    
    // Find all certificates for this user
    const certificates = await Certificate.find({ userId })
      .populate('courseId', 'title thumbnail description skills instructor')
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
