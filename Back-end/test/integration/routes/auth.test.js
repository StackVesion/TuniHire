// test/integration/routes/auth.test.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../../../app');
const User = require('../../../models/userModel');

chai.use(chaiHttp);

describe('Auth Routes', () => {
  // Clear users collection before tests
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'candidate'
      };

      const res = await chai.request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('userId');
      
      // Check if user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).to.exist;
      expect(user.firstName).to.equal(userData.firstName);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteUserData = {
        firstName: 'Test',
        // Missing lastName, email, password
        role: 'candidate'
      };

      const res = await chai.request(app)
        .post('/api/auth/register')
        .send(incompleteUserData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });

    it('should return 409 for duplicate email', async () => {
      // Create a user first
      const user = new User({
        firstName: 'Existing',
        lastName: 'User',
        email: 'duplicate@example.com',
        password: 'Password123!',
        role: 'candidate'
      });
      await user.save();

      // Try to register with the same email
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'duplicate@example.com', // Same email
        password: 'Password123!',
        role: 'candidate'
      };

      const res = await chai.request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res).to.have.status(409);
      expect(res.body).to.have.property('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'login@example.com',
        password: 'Password123!',
        role: 'candidate'
      });
      await user.save();
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123!'
      };

      const res = await chai.request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('email', loginData.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const invalidLoginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!'
      };

      const res = await chai.request(app)
        .post('/api/auth/login')
        .send(invalidLoginData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error');
    });

    it('should return 400 for missing credentials', async () => {
      const incompleteLoginData = {
        email: 'login@example.com'
        // Missing password
      };

      const res = await chai.request(app)
        .post('/api/auth/login')
        .send(incompleteLoginData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify user email with valid token', async () => {
      // Create a user with verification token
      const verificationToken = 'valid-token-123';
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'verify@example.com',
        password: 'Password123!',
        role: 'candidate',
        verificationToken
      });
      await user.save();

      const res = await chai.request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message');
      
      // Check if user was verified in database
      const verifiedUser = await User.findOne({ email: 'verify@example.com' });
      expect(verifiedUser.isVerified).to.be.true;
      expect(verifiedUser.verificationToken).to.be.null;
    });

    it('should return 400 for invalid token', async () => {
      const res = await chai.request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });
  });

  // Add more tests for forgot password, reset password, etc.
});
