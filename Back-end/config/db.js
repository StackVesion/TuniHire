require('dotenv').config();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Check if MONGO_URI is defined
        if (!process.env.MONGO_URI) {
            console.warn('MONGO_URI is not defined in environment variables');
            console.warn('Using default MongoDB connection string: mongodb://localhost:27017/tunihire');
            
            // Set a default MongoDB URI if not provided
            process.env.MONGO_URI = 'mongodb://localhost:27017/tunihire';
        }
        
        // Set mongoose options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        };
        
        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Don't exit the process, allow the application to continue
        // process.exit(1);
        return null;
    }
};

module.exports = connectDB;
