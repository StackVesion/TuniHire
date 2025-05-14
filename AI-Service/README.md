# TuniHire AI Service

## Overview

The AI Service is a Python-based microservice that provides various artificial intelligence capabilities to the TuniHire platform, including face verification, natural language processing, and other AI-powered functionalities.

## Technology Stack

- **Python**: Core programming language
- **Flask**: Web framework for API endpoints
- **OpenCV/Face Recognition**: Face verification capabilities
- **OpenAI**: Natural language processing
- **PyTorch/Transformers**: Machine learning models
- **MongoDB**: Data storage for AI models and processed results
- **JWT**: Authentication token validation

## Key Features

- **Face Verification**: Compare user photos with ID documents for identity verification
- **Natural Language Processing**: Text analysis for job descriptions and resumes
- **Skill Extraction**: Identify skills from candidate profiles and job postings
- **AI-powered ATS (Applicant Tracking System)**: Advanced application filtering

## API Endpoints

- **`/api/face/verify`**: Face verification service
- **`/api/nlp/analyze`**: Text analysis service
- **`/api/ats/match`**: ATS matching service
- **`/`**: Health check endpoint

## Dependencies

The service relies on several Python packages:
- flask
- flask-cors
- numpy
- pandas
- scikit-learn
- transformers
- torch
- python-dotenv
- pymongo
- face_recognition
- opencv-python
- openai

## Setup and Installation

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/tunihire_ai
   JWT_SECRET=yoursecretkey
   OPENAI_API_KEY=your_openai_api_key
   PORT=5001
   HOST=0.0.0.0
   ```

4. Run the service:
   ```bash
   python app.py
   ```

## Directory Structure

```
AI-Service/
├── app.py                 # Main Flask application
├── requirements.txt       # Dependencies
├── .env                   # Environment variables
├── models/                # ML model files
├── services/              # Service modules
│   ├── face_recognition/  # Face verification service
│   ├── nlp/               # NLP services
│   └── ats/               # ATS matching service
├── utils/                 # Utility functions
├── uploads/               # Uploaded files for processing
└── tests/                 # Test files
```

## Integration with Other Services

The AI Service integrates with:
- **Back-end API** (port 5000): For data retrieval and storage
- **Front-End** (port 3000): For face verification features
- **Company-Panel** (port 3001): For ATS features

## Development and Testing

To run tests:
```bash
pytest
```

For development mode with auto-reload:
```bash
FLASK_ENV=development python app.py
```

## Deployment Considerations

- This service requires significant CPU/GPU resources for the face recognition and ML models
- Consider deploying with Gunicorn for production
- Memory requirements may be high for larger AI models
- Ensure proper firewall rules to allow connections only from trusted services
