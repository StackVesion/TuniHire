# TuniHire AI Recommendation Engine

A machine learning-powered recommendation engine for TuniHire that analyzes candidate portfolios, job postings, and historical application data to provide intelligent job matching, ATS pass predictions, and personalized recommendations.

## Key Features

### AI-Powered Recommendations
- **Smart Job Matching**: Compares candidate skills and experience with job requirements using advanced ML algorithms
- **ATS Prediction**: Forecasts likelihood of passing automated tracking systems
- **Competitor Analysis**: Ranks the candidate against other applicants for the same position
- **Personalized Insights**: Identifies strengths and weaknesses specific to each job
- **Better Job Matches**: Suggests alternative jobs with higher match probability
- **Detailed Reports**: Generates comprehensive markdown reports with actionable insights

### Subscription-Aware Recommendations
- **Subscription Tier Bonuses**:
  - **Free**: Base recommendations
  - **Golden**: 10% bonus to match scores and prioritizes some premium job listings
  - **Platinum**: 20% bonus to match scores and balanced premium/standard job recommendations
  - **Master**: 30% bonus to match scores and primarily premium job recommendations
- **Premium Job Filtering**: Higher-tier subscribers receive access to higher quality job recommendations based on:
  - Salary ranges
  - Job titles (senior, lead, manager positions)
  - Market demand

### Self-Training AI System
- **Continuous Learning**: Automatically improves by learning from historical application outcomes
- **Real-time Model Updates**: Records recommendations and outcomes for future training
- **Training History Tracking**: Saves model training data for performance monitoring
- **Fallback Mechanisms**: Uses proven algorithms when insufficient data is available

## Technical Architecture

- **Framework**: Flask-based RESTful API
- **ML Stack**: scikit-learn with RandomForestClassifier and TF-IDF vectorization
- **Database**: MongoDB with fallback to MockDatabase for testing
- **Deployment**: Containerizable for easy integration with the main platform

## API Endpoints

### 1. Get Recommendation
```
GET /api/recommendation?user_id=<user_id>&job_id=<job_id>
```

Returns detailed recommendation for a specific user applying to a specific job:
- Pass percentage (with subscription tier bonus)
- Ranking among other applicants 
- Strengths (matching skills)
- Weaknesses (missing skills)
- Similar jobs that might be better matches
- Comprehensive text report

**Example Response:**
```json
{
  "success": true,
  "data": {
    "pass_percentage": 34.9,
    "base_percentage": 34.9,
    "subscription_tier": "Free",
    "subscription_bonus": 0.0,
    "ranking": {
      "percentile": 100.0,
      "rank": 1,
      "score": 47.53,
      "total_applicants": 2
    },
    "strengths": ["javascript", "react", "git"],
    "weaknesses": ["css", "html", "..."],
    "similar_jobs": [
      {
        "id": "job_id",
        "title": "Full Stack Developer",
        "match_percentage": 74.93,
        "company_name": "Company Name"
      }
    ],
    "text_report": "Markdown formatted detailed report..."
  }
}
```

### 2. Get Better Matches
```
GET /api/better-matches/<user_id>
```

Returns jobs that better match the user's portfolio, with results tailored to their subscription tier.

**Example Response:**
```json
{
  "success": true,
  "subscription_tier": "Golden",
  "data": [
    {
      "id": "job_id",
      "title": "Job Title",
      "match_percentage": 85.7,
      "requirements": ["skill1", "skill2"],
      "location": "Location",
      "company_name": "Company Name"
    }
  ]
}
```

### 3. Health Check
```
GET /api/health
```

Returns the health status of the recommendation service.

### 4. Training Stats
```
GET /api/training/stats
```

Returns statistics about the AI training history and performance.

## Setup and Deployment

### Prerequisites
- Python 3.12+
- MongoDB
- Flask

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Start the service:
   ```
   python run.py
   ```

The service will start by default on port 5001 to avoid conflicts with the main TuniHire backend.

### Environment Variables
- `MONGO_URI`: MongoDB connection string (default: `mongodb://localhost:27017/TuniHireDB`)
- `PORT`: Port for the Flask application (default: 5001)
- `DEBUG`: Enable debug mode (default: True)

## Testing the API

### Using Postman
1. Start the recommendation service: `python run.py`
2. Open Postman and make requests to:
   - `http://localhost:5001/api/recommendation?user_id=<user_id>&job_id=<job_id>`
   - `http://localhost:5001/api/better-matches/<user_id>`
   - `http://localhost:5001/api/health`
   - `http://localhost:5001/api/training/stats`

### Using the Test Script
1. Generate test data: `python test_data_generator.py`
2. Run the test script: `python test_recommendation.py`

## How the Self-Training Model Works

The AI recommendation engine uses a self-improving approach:

1. **Initial Training**: The model starts with a basic RandomForestClassifier trained on features like:
   - Skill match percentages
   - Experience years
   - Education level match
   - Application text similarity

2. **Continuous Learning**:
   - Every recommendation is recorded in the training history
   - When application outcomes are known (accepted/rejected), they're fed back to retrain the model
   - Model performance improves over time as more real-world data is gathered

3. **Training History**:
   - Training runs are recorded in the `training_history` folder
   - Each run contains metadata about the model performance and features
   - The history can be analyzed to track improvement over time

4. **Advanced Features**:
   - TF-IDF vectorization of job descriptions and portfolios for semantic matching
   - Feature importance tracking to identify which factors most influence successful applications
   - Subscription tier awareness to provide enhanced results for premium users

## Integration with TuniHire

The recommendation engine integrates with the main TuniHire platform's subscription system, providing enhanced features for users with premium subscriptions (Golden, Platinum, and Master tiers).

## Monitoring and Maintenance

Monitor the AI performance over time:
1. Check the training history files
2. Use the `/api/training/stats` endpoint
3. Analyze the recommendation accuracy as more data is collected

## Future Improvements

Planned enhancements:
- Deep learning models for improved accuracy
- NLP-based analysis of cover letters
- Industry-specific recommendation models
- Company culture fit analysis
