# TuniHire AI Recommendation Engine

An advanced Flask-based microservice for analyzing job applicant portfolios, providing AI-powered recommendations, and intelligently matching candidates with optimal job opportunities.

## Features

- **Self-Learning AI System**: Continuously improves recommendation accuracy by learning from application outcomes
- **Smart ATS Simulation**: Calculates pass percentage through ML-based analysis of skills, experience, and education
- **Candidate Ranking**: Compares applicants against each other for specific job positions
- **Strength/Weakness Analysis**: Identifies matching qualifications and improvement areas
- **Detailed Text Reports**: Generates comprehensive markdown reports with actionable insights
- **Smart Job Matching**: Recommends better-fit positions based on portfolio analysis

## Project Structure

```
Recommendation-Ai/
├── app/
│   ├── models/              # Trained ML models are stored here
│   ├── services/
│   │   └── recommendation_service.py
│   └── utils/
│       ├── db_connection.py
│       └── portfolio_analyzer.py
├── app.py                   # Main Flask application
├── requirements.txt
└── README.md
```

## Technology Stack

- **Flask**: Web framework for API endpoints
- **MongoDB**: Database integration via PyMongo
- **Machine Learning**: 
  - TensorFlow for neural network capabilities
  - scikit-learn for classification and text vectorization
  - Joblib for model persistence
- **Natural Language Processing**: For skill extraction and matching
- **Self-Training Algorithms**: For continuous improvement based on job application outcomes

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

### 1. Get Job Application Recommendation

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
    ],
    "text_report": "## Applicant Analysis Report for John Doe\n**Job Position:** Frontend Developer\n..."
  }
}
```

### 2. Get Better Job Matches

**Endpoint:** `/api/better-matches/<user_id>`

**Method:** GET

**Parameters:**
- `limit` (optional) - Maximum number of job matches to return (default: 10)

**Example Request:**
```
GET /api/better-matches/6123456789abcdef01234567?limit=5
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6123456789abcdef01234569",
      "title": "Senior Frontend Developer",
      "company_id": "6123456789abcdef0123456a",
      "company_name": "TechCorp Inc",
      "match_percentage": 92.5
    },
    {
      "id": "6123456789abcdef0123456b",
      "title": "Full Stack Developer",
      "company_id": "6123456789abcdef0123456c",
      "company_name": "InnoTech Solutions",
      "match_percentage": 88.3
    }
  ]
}
```

## Self-Training Capabilities

The recommendation engine improves over time through:

1. **Learning from Application Results**: The system analyzes successful and unsuccessful job applications to refine its prediction models.

2. **Portfolio Similarity Analysis**: Uses TF-IDF vectorization and cosine similarity to find patterns in successful applicants' portfolios.

3. **Continuous Model Training**: Each recommendation generates data points that are used to enhance future predictions.

4. **Intelligent Feature Extraction**: Automatically extracts relevant skills and qualifications from textual data.

5. **Model Persistence**: Trained models are saved to disk, maintaining improvements across application restarts.

## Integration with TuniHire

This service integrates with the TuniHire application, using the following MongoDB collections:
- `users`
- `portfolios`
- `jobposts`
- `applications`
- `companies`

## Text Report Format

The text_report field provides a detailed markdown-formatted analysis including:

- Candidate summary with match percentage
- ATS system analysis
- Key strengths with skill matches
- Areas for improvement with missing skills
- Better job matches based on skills and experience
- Improvement suggestions

The report is designed to be both human-readable and suitable for rendering in a web interface.
