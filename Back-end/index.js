require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const cors = require('cors'); // Import cors

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// If you want to restrict the origins, you can do it like this:
// app.use(cors({ origin: 'http://localhost:3000' }));

// Routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
