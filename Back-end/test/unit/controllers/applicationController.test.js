// test/unit/controllers/applicationController.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

// Import the controller and models
const applicationController = require('../../../controllers/applicationController');
const Application = require('../../../models/applicationModel');
const User = require('../../../models/userModel');
const JobPost = require('../../../models/jobPostModel');

describe('Application Controller', () => {
  
  beforeEach(() => {
    // Create stubs before each test
    this.req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: 'candidate'
      }
    };
    
    this.res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis()
    };

    this.next = sinon.stub();
  });

  afterEach(() => {
    // Restore all stubs after each test
    sinon.restore();
  });

  describe('applyForJob', () => {
    it('should return 400 if job ID is missing', async () => {
      // No jobId in request
      this.req.body = { coverLetter: 'I am interested in this position' };

      // Call the function
      await applicationController.applyForJob(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(400)).to.be.true;
    });

    it('should return 404 if job does not exist', async () => {
      // Set up request with non-existent job ID
      const jobId = new mongoose.Types.ObjectId();
      this.req.body = { 
        jobId: jobId.toString(),
        coverLetter: 'I am interested in this position'
      };

      // Stub JobPost.findById to return null (no job found)
      sinon.stub(JobPost, 'findById').resolves(null);

      // Call the function
      await applicationController.applyForJob(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(404)).to.be.true;
    });

    it('should return 409 if user already applied for the job', async () => {
      // Set up request
      const jobId = new mongoose.Types.ObjectId();
      const userId = this.req.user._id;
      
      this.req.body = { 
        jobId: jobId.toString(),
        coverLetter: 'I am interested in this position'
      };

      // Stub JobPost.findById to return a job
      sinon.stub(JobPost, 'findById').resolves({
        _id: jobId,
        title: 'Software Developer',
        companyId: new mongoose.Types.ObjectId()
      });

      // Stub Application.findOne to return an existing application
      sinon.stub(Application, 'findOne').resolves({
        _id: new mongoose.Types.ObjectId(),
        userId,
        jobId
      });

      // Call the function
      await applicationController.applyForJob(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(409)).to.be.true;
    });

    it('should create an application successfully', async () => {
      // Set up request
      const jobId = new mongoose.Types.ObjectId();
      const userId = this.req.user._id;
      
      this.req.body = { 
        jobId: jobId.toString(),
        coverLetter: 'I am interested in this position'
      };

      // Stub JobPost.findById to return a job
      sinon.stub(JobPost, 'findById').resolves({
        _id: jobId,
        title: 'Software Developer',
        companyId: new mongoose.Types.ObjectId()
      });

      // Stub Application.findOne to return null (no existing application)
      sinon.stub(Application, 'findOne').resolves(null);
      
      // Stub Application.create to return a new application
      const createStub = sinon.stub(Application, 'create').resolves({
        _id: new mongoose.Types.ObjectId(),
        userId,
        jobId,
        status: 'pending',
        coverLetter: 'I am interested in this position',
        createdAt: new Date()
      });

      // Call the function
      await applicationController.applyForJob(this.req, this.res, this.next);

      // Assert the response
      expect(createStub.calledOnce).to.be.true;
      expect(this.res.status.calledWith(201)).to.be.true;
    });
  });

  describe('getUserApplications', () => {
    it('should return user applications', async () => {
      // Setup
      const userId = this.req.user._id;
      
      // Mock applications data
      const mockApplications = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          jobId: new mongoose.Types.ObjectId(),
          status: 'pending',
          job: { title: 'Software Developer' },
          company: { name: 'Tech Company' }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          jobId: new mongoose.Types.ObjectId(),
          status: 'rejected',
          job: { title: 'Product Manager' },
          company: { name: 'Tech Company' }
        }
      ];

      // Stub Application.find
      sinon.stub(Application, 'find').returns({
        populate: sinon.stub().returns({
          populate: sinon.stub().resolves(mockApplications)
        })
      });

      // Call the function
      await applicationController.getUserApplications(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(200)).to.be.true;
      expect(this.res.json.calledWith(sinon.match.has('applications'))).to.be.true;
    });
  });

  describe('updateApplicationStatus', () => {
    it('should return 403 if user is not a company representative', async () => {
      // Set user role to candidate
      this.req.user.role = 'candidate';
      
      // Call the function
      await applicationController.updateApplicationStatus(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(403)).to.be.true;
    });

    it('should update application status successfully', async () => {
      // Setup
      const applicationId = new mongoose.Types.ObjectId();
      const companyId = new mongoose.Types.ObjectId();
      
      this.req.user.role = 'company';
      this.req.user.companyId = companyId;
      this.req.params.id = applicationId.toString();
      this.req.body = { status: 'accepted' };

      // Mock application
      const mockApplication = {
        _id: applicationId,
        status: 'pending',
        jobId: new mongoose.Types.ObjectId(),
        job: { companyId }
      };

      // Stub Application.findById
      sinon.stub(Application, 'findById').returns({
        populate: sinon.stub().resolves(mockApplication)
      });

      // Stub application.save
      const saveStub = sinon.stub().resolves({
        ...mockApplication,
        status: 'accepted'
      });
      
      mockApplication.save = saveStub;

      // Call the function
      await applicationController.updateApplicationStatus(this.req, this.res, this.next);

      // Assert the response
      expect(saveStub.calledOnce).to.be.true;
      expect(this.res.status.calledWith(200)).to.be.true;
    });

    it('should return 404 if application not found', async () => {
      // Setup
      this.req.user.role = 'company';
      this.req.user.companyId = new mongoose.Types.ObjectId();
      this.req.params.id = new mongoose.Types.ObjectId().toString();
      this.req.body = { status: 'accepted' };

      // Stub Application.findById to return null
      sinon.stub(Application, 'findById').returns({
        populate: sinon.stub().resolves(null)
      });

      // Call the function
      await applicationController.updateApplicationStatus(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(404)).to.be.true;
    });
  });

  // Add more test cases for other application controller methods
});
