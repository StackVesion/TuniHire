# TuniHire Recommendation AI

A Flask-based microservice for analyzing job applicant portfolios and providing AI-powered recommendations.

## Features

- Compare candidate portfolios with job requirements
- Calculate ATS pass percentage based on skill matching
- Rank applicants against each other for specific job positions
- Identify strengths and weaknesses in candidates' portfolios
- Suggest similar job postings that match candidates' skills

## Project Structure

```
Recommendation Ai/
├── app/
│   ├── models/
│   ├── services/
│   │   └── recommendation_service.py
│   └── utils/
│       ├── db_connection.py
│       └── portfolio_analyzer.py
├── app.py
├── requirements.txt
└── README.md
```

## Setup and Installation

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure MongoDB connection:
   - By default, the application connects to a local MongoDB instance
   - Set the MONGO_URI environment variable to change the connection string

3. Run the application:
   ```
   python app.py
   ```

## API Endpoints

### Get Recommendation

**Endpoint:** `/api/recommendation`

**Method:** GET

**Parameters:**
- `user_id` - MongoDB ObjectId of the user
- `job_id` - MongoDB ObjectId of the job posting

**Example Request:**
```
GET /api/recommendation?user_id=6123456789abcdef01234567&job_id=6123456789abcdef01234568
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "pass_percentage": 85.5,
    "ranking": {
      "score": 78.2,
      "rank": 3,
      "total_applicants": 15,
      "percentile": 80.0
    },
    "strengths": [
      "javascript",
      "react",
      "node.js"
    ],
    "weaknesses": [
      "typescript",
      "aws"
    ],
    "similar_jobs": [
      {
        "id": "6123456789abcdef01234569",
        "title": "Senior Frontend Developer",
        "company_id": "6123456789abcdef0123456a",
        "company_name": "TechCorp Inc",
        "match_percentage": 92.5
      }
    ]
  }
}
```

## Integration with TuniHire

This service is designed to integrate with the TuniHire application, using the existing MongoDB database structure. It reads from the following collections:
- `users`
- `portfolios`
- `jobposts`
- `applications`
- `companies`
