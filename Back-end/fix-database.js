// Script to fix the MongoDB database by removing problematic indexes
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/TuniHireDB';

async function fixDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.log('Using connection string:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB successfully');

    // Get the database and users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // List all collections to verify we're connected
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // List all indexes on the users collection
    console.log('Current indexes on users collection:');
    const indexes = await usersCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Try to drop the problematic indexes
    try {
      console.log('Attempting to drop faceId_1 index...');
      await usersCollection.dropIndex('faceId_1');
      console.log('Successfully dropped faceId_1 index');
    } catch (error) {
      console.log('Error dropping faceId_1 index:', error.message);
    }

    try {
      console.log('Attempting to drop faceDescriptor_1 index...');
      await usersCollection.dropIndex('faceDescriptor_1');
      console.log('Successfully dropped faceDescriptor_1 index');
    } catch (error) {
      console.log('Error dropping faceDescriptor_1 index:', error.message);
    }

    // List indexes again to confirm they were dropped
    console.log('Current indexes after dropping:');
    const updatedIndexes = await usersCollection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));

    console.log('Database fix completed');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
fixDatabase();
