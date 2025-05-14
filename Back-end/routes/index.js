const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const companyRoutes = require('./company');
const jobRoutes = require('./jobRoutes');
const applicationRoutes = require('./applicationRoutes');
const dashboardRoutes = require('./dashboard');
const blogRoutes = require('./blogRoutes');
const apiRoutes = require('./apiRoutes');
const aiRoutes = require('./aiRoutes');
const reclamationRoutes = require('./reclamationRoutes');

router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/blogs', blogRoutes);
router.use('/api', apiRoutes);
router.use('/ai', aiRoutes);
router.use('/reclamations', reclamationRoutes);

module.exports = router;
