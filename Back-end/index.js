require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const cors = require('cors'); // Import cors
const path = require('path');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// If you want to restrict the origins, you can do it like this:
// app.use(cors({ origin: 'http://localhost:3000' }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/portfolios", portfolioRoutes);

// Explicit route for PDF files to ensure proper content-type
app.get('/uploads/resumes/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'uploads', 'resumes', filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
