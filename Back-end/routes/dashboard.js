const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// Apply auth middleware to all dashboard routes
router.use(verifyToken);

// Dashboard routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/employees-by-department', dashboardController.getEmployeesByDepartment);
router.get('/sales-overview', dashboardController.getSalesOverview);
router.get('/attendance-overview', dashboardController.getAttendanceOverview);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/company-registration-trends', dashboardController.getCompanyRegistrationTrends);
router.get('/hr-dashboard', dashboardController.getHrDashboardData);

module.exports = router;
