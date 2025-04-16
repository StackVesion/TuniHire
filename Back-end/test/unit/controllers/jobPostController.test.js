// test/unit/controllers/jobPostController.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

// Import the controller and model
const jobPostController = require('../../../controllers/jobPostController');
const JobPost = require('../../../models/jobPostModel');
const Company = require('../../../models/companyModel');

describe('Job Post Controller', () => {
  
  beforeEach(() => {
    // Create stubs before each test
    this.req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: 'company'
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

  describe('createJobPost', () => {
    it('should return 400 if required fields are missing', async () => {
      // Prepare test data with missing fields
      this.req.body = {
        title: 'Software Developer',
        // Other required fields missing
      };

      // Call the function
      await jobPostController.createJob(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(400)).to.be.true;
    });

    it('should create a job post successfully', async () => {
      // Prepare test data
      const companyId = new mongoose.Types.ObjectId();
      this.req.user.companyId = companyId;
      this.req.body = {
        title: 'Software Developer',
        description: 'Full-stack development position',
        requirements: ['JavaScript', 'Node.js', 'React'],
        location: 'Remote',
        salary: '60000-80000',
        jobType: 'Full-time',
        companyId: companyId
      };

      // Stub Company.findById to return a company
      sinon.stub(Company, 'findById').resolves({
        _id: companyId,
        name: 'Test Company',
        active: true
      });
      
      // Stub JobPost.create to return a job post
      const createStub = sinon.stub(JobPost, 'create').resolves({
        _id: new mongoose.Types.ObjectId(),
        ...this.req.body,
        createdAt: new Date()
      });

      // Call the function
      await jobPostController.createJob(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(201)).to.be.true;
      expect(createStub.calledOnce).to.be.true;
    });

    it('should return 403 if user is not a company representative', async () => {
      // Set user role to candidate
      this.req.user.role = 'candidate';
      
      // Call the function
      await jobPostController.createJob(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(403)).to.be.true;
    });
  });

  describe('getAllJobs', () => {
    it('should return all active job posts', async () => {
      // Mock job posts data
      const mockJobs = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Software Developer',
          company: { name: 'Tech Company' }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Product Manager',
          company: { name: 'Tech Company' }
        }
      ];

      // Stub JobPost.find to return mock jobs
      const findStub = sinon.stub(JobPost, 'find').returns({
        populate: sinon.stub().returns({
          limit: sinon.stub().returns({
            skip: sinon.stub().resolves(mockJobs)
          })
        })
      });

      // Stub JobPost.countDocuments to return count
      sinon.stub(JobPost, 'countDocuments').resolves(2);

      // Call the function
      await jobPostController.getAllJobs(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(200)).to.be.true;
      expect(this.res.json.calledOnce).to.be.true;
    });
  });

  describe('getJobById', () => {
    it('should return a job post when valid ID is provided', async () => {
      // Create a job ID
      const jobId = new mongoose.Types.ObjectId();
      this.req.params.id = jobId.toString();

      // Mock job data
      const mockJob = {
        _id: jobId,
        title: 'Software Developer',
        description: 'Full-stack development position',
        company: { name: 'Tech Company' }
      };

      // Stub JobPost.findById
      sinon.stub(JobPost, 'findById').returns({
        populate: sinon.stub().resolves(mockJob)
      });

      // Call the function
      await jobPostController.getJobById(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(200)).to.be.true;
      expect(this.res.json.calledWith(sinon.match.hasNested('job._id', jobId))).to.be.true;
    });

    it('should return 404 when job post is not found', async () => {
      // Create a non-existent job ID
      this.req.params.id = new mongoose.Types.ObjectId().toString();

      // Stub JobPost.findById to return null
      sinon.stub(JobPost, 'findById').returns({
        populate: sinon.stub().resolves(null)
      });

      // Call the function
      await jobPostController.getJobById(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(404)).to.be.true;
    });
  });

  // Add more test cases for other job post controller methods
});
