const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const companyRoutes = require('./company');
const jobRoutes = require('./job');
const applicationRoutes = require('./application');
const dashboardRoutes = require('./dashboard');

router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
