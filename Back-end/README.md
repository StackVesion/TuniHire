# TuniHire Back-end

## Overview

The Back-end component serves as the core API server for the TuniHire platform, handling business logic, authentication, database operations, and integration with other services.

## Technologies

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **JWT**: JSON Web Tokens for authentication
- **Axios**: HTTP client for API calls
- **Multer**: File upload handling

## Architecture

The Back-end follows a modular MVC (Model-View-Controller) architecture:

- **Models**: MongoDB schemas for data entities
- **Controllers**: Business logic implementation
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, error handling, and request processing
- **Config**: Environment and database configuration
- **Utils**: Utility functions and helpers

## Key Features

- **User Authentication**: JWT-based authentication for candidates, companies, and admins
- **Job Posting Management**: Creating, updating, and searching job listings
- **Application Processing**: Handling job applications and their lifecycle
- **Meeting Management**: Setting up and managing virtual interviews
- **Bot Integration**: Connecting with AI bots for interview and preparation sessions
- **File Management**: Handling uploads for resumes, profile photos, and company logos
- **AI Service Integration**: Communication with AI services for recommendations and verification

## API Endpoints

The API provides endpoints for:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Companies**: `/api/companies/*`
- **Jobs**: `/api/jobs/*`
- **Applications**: `/api/applications/*`
- **Meetings**: `/api/meetings/*`
- **Bots**: `/api/bots/*`
- **Portfolios**: `/api/portfolios/*`
- **Certificates**: `/api/certificates/*`

## Configuration

Configuration is managed through environment variables in a `.env` file. Key configurations include:

- **PORT**: Default 5000
- **MONGODB_URI**: MongoDB connection string
- **JWT_SECRET**: Secret for JWT token signing
- **AI_SERVICE_URL**: URL for the AI service (default: http://localhost:5001)
- **BASE_URL**: Base URL for file access

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with required environment variables.

3. Run the development server:
   ```
   npm run dev
   ```

4. For production:
   ```
   npm start
   ```

## Database Seeding

The Back-end includes scripts for generating test data:

```
node test-data.js
```

This creates sample users, companies, jobs, and applications for testing purposes.

## Integration Points

- **AI-Service**: Face verification and other AI capabilities
- **Recommendation-AI**: Job recommendation algorithms
- **Bot Service**: Interview bot and preparation bot (runs on port 8080)

## File Structure

```
Back-end/
├── config/               # Configuration files
├── controllers/          # API controllers
├── middleware/           # Express middleware
├── models/               # MongoDB schemas
├── routes/               # API routes
├── utils/                # Utility functions
├── uploads/              # Uploaded files
├── server.js             # Main entry point
├── package.json          # Dependencies
└── .env                  # Environment variables
```
