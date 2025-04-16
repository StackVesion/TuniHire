// test/unit/models/userModel.test.js
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const User = require('../../../models/userModel');

describe('User Model', () => {
  it('should create a new user with valid data', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'candidate'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).to.exist;
    expect(savedUser.firstName).to.equal(userData.firstName);
    expect(savedUser.lastName).to.equal(userData.lastName);
    expect(savedUser.email).to.equal(userData.email);
    expect(savedUser.role).to.equal(userData.role);
    // Password should be hashed, so it won't equal the input
    expect(savedUser.password).to.not.equal(userData.password);
  });

  it('should require email field', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      password: 'Password123!',
      role: 'candidate'
    };

    const user = new User(userData);
    
    try {
      await user.save();
      // If save succeeds without required field, this should fail
      expect.fail('Validation should have failed');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors.email).to.exist;
    }
  });

  it('should not allow duplicate emails', async () => {
    // First user
    const userData1 = {
      firstName: 'Test',
      lastName: 'User',
      email: 'duplicate@example.com',
      password: 'Password123!',
      role: 'candidate'
    };

    // Second user with same email
    const userData2 = {
      firstName: 'Another',
      lastName: 'User',
      email: 'duplicate@example.com',
      password: 'Password456!',
      role: 'candidate'
    };

    const user1 = new User(userData1);
    await user1.save();

    const user2 = new User(userData2);
    
    try {
      await user2.save();
      // If save succeeds with duplicate email, this should fail
      expect.fail('Validation should have failed');
    } catch (error) {
      expect(error).to.exist;
      expect(error.code).to.equal(11000); // MongoDB duplicate key error code
    }
  });

  it('should validate email format', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email',
      password: 'Password123!',
      role: 'candidate'
    };

    const user = new User(userData);
    
    try {
      await user.save();
      // If save succeeds with invalid email, this should fail
      expect.fail('Validation should have failed');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors.email).to.exist;
    }
  });

  it('should validate password strength', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'weak', // Too short
      role: 'candidate'
    };

    const user = new User(userData);
    
    try {
      await user.save();
      // If save succeeds with weak password, this should fail
      expect.fail('Validation should have failed');
    } catch (error) {
      expect(error).to.be.an.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors.password).to.exist;
    }
  });

  it('should set default values', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'candidate'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.isVerified).to.equal(false);
    expect(savedUser.createdAt).to.exist;
    expect(savedUser.active).to.equal(true);
  });

  // Add more test cases for model methods, password hashing, etc.
});
