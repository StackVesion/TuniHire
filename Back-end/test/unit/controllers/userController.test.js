// test/unit/controllers/userController.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

// Import the controller and model
const userController = require('../../../controllers/userController');
const User = require('../../../models/userModel');

describe('User Controller', () => {
  
  beforeEach(() => {
    // Create stubs before each test
    this.req = {
      body: {},
      params: {},
      query: {},
      user: {}
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

  describe('registerUser', () => {
    it('should return 400 if required fields are missing', async () => {
      // Prepare test data
      this.req.body = {
        email: 'test@example.com',
        // Password is missing
      };

      // Call the function
      await userController.registerUser(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(400)).to.be.true;
    });

    it('should register a new user successfully', async () => {
      // Prepare test data
      this.req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'candidate'
      };

      // Stub User.findOne to return null (no existing user)
      const findOneStub = sinon.stub(User, 'findOne').resolves(null);
      
      // Stub User.create to return a user object
      const createStub = sinon.stub(User, 'create').resolves({
        _id: new mongoose.Types.ObjectId(),
        ...this.req.body,
        password: 'hashedPassword'
      });

      // Call the function
      await userController.registerUser(this.req, this.res, this.next);

      // Assert the response
      expect(findOneStub.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(this.res.status.calledWith(201)).to.be.true;
    });

    it('should return 409 if user with email already exists', async () => {
      // Prepare test data
      this.req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'Password123!'
      };

      // Stub User.findOne to return an existing user
      sinon.stub(User, 'findOne').resolves({
        _id: new mongoose.Types.ObjectId(),
        email: 'existing@example.com'
      });

      // Call the function
      await userController.registerUser(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(409)).to.be.true;
    });
  });

  describe('loginUser', () => {
    it('should return 400 if email or password is missing', async () => {
      // Prepare test data
      this.req.body = {
        email: 'test@example.com',
        // Password is missing
      };

      // Call the function
      await userController.loginUser(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(400)).to.be.true;
    });

    it('should return 401 if user not found', async () => {
      // Prepare test data
      this.req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      // Stub User.findOne to return null (no user found)
      sinon.stub(User, 'findOne').resolves(null);

      // Call the function
      await userController.loginUser(this.req, this.res, this.next);

      // Assert the response
      expect(this.res.status.calledWith(401)).to.be.true;
    });

    // More tests would be added for successful login, password verification, etc.
  });

  // Add more test cases for other user controller methods
});
