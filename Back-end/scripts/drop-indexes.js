// Script to drop problematic indexes from MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/TuniHireDB';

async function dropIndexes() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get the User collection
    const db = mongoose.connection.db;
    const userCollection = db.collection('users');

    // List all indexes
    console.log('Listing all indexes on users collection:');
    const indexes = await userCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the problematic indexes
    console.log('Dropping faceDescriptor_1 index...');
    try {
      await userCollection.dropIndex('faceDescriptor_1');
      console.log('Successfully dropped faceDescriptor_1 index');
    } catch (error) {
      console.log('Error dropping faceDescriptor_1 index:', error.message);
    }

    console.log('Dropping faceId_1 index...');
    try {
      await userCollection.dropIndex('faceId_1');
      console.log('Successfully dropped faceId_1 index');
    } catch (error) {
      console.log('Error dropping faceId_1 index:', error.message);
    }

    // List indexes again to confirm they were dropped
    console.log('Current indexes after dropping:');
    const updatedIndexes = await userCollection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));

    console.log('Index cleanup completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
dropIndexes();
