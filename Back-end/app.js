const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for front-end communication
app.use(cors());

// Register dashboard routes
app.use('/api/dashboard', require('./routes/dashboard'));

// ...existing code...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});