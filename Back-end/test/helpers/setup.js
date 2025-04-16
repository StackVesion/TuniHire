// test/helpers/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// This will create an in-memory MongoDB server for testing
let mongoServer;

// Connect to the in-memory database before tests
before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and close the in-memory database after tests
after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Export any test utilities
module.exports = {
  // Any helper functions can go here
};
