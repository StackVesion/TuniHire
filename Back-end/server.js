require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Configure CORS to allow frontend requests
app.use(
    cors({
        origin: "http://localhost:3000", // Allow frontend to access the backend
        methods: "GET,POST,PUT,DELETE", // Allowed methods
        allowedHeaders: "Content-Type,Authorization", // Allowed headers
        credentials: true, // If using cookies or authentication tokens
    })
);

// Handle preflight requests explicitly for all routes
app.options('*', cors()); // Handle preflight requests

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/users/signup", require("./routes/userRoutes"));

// Default route (optional)
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
