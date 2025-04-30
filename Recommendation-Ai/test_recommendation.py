"""
Test script for the TuniHire AI Recommendation Engine
This script demonstrates the capabilities of the recommendation system
"""
from bson import ObjectId
from app.utils.db_connection import get_db_connection
from app.services.recommendation_service import RecommendationService
import os
import json
from datetime import datetime, timedelta

def generate_sample_data():
    """Generate sample data for testing when database is empty"""
    # Sample user data
    user = {
        "_id": ObjectId(),
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "candidate",
        "subscription": "Golden",
        "skills": ["javascript", "react", "node.js", "mongodb", "express"]
    }
    
    # Sample company data
    company = {
        "_id": ObjectId(),
        "name": "TechCorp Inc",
        "description": "Leading tech company",
        "industry": "Technology"
    }
    
    # Sample job postings
    jobs = [
        {
            "_id": ObjectId(),
            "title": "Frontend Developer",
            "description": "We are looking for a skilled frontend developer with experience in React.",
            "requirements": ["javascript", "react", "css", "html", "redux"],
            "salaryRange": "$80K-100K",
            "companyId": company["_id"]
        },
        {
            "_id": ObjectId(),
            "title": "Backend Developer",
            "description": "Join our team as a Node.js backend developer.",
            "requirements": ["javascript", "node.js", "express", "mongodb", "api"],
            "salaryRange": "$90K-110K",
            "companyId": company["_id"]
        },
        {
            "_id": ObjectId(),
            "title": "Full Stack Developer",
            "description": "Full stack role with focus on MERN stack.",
            "requirements": ["react", "node.js", "mongodb", "express", "javascript", "typescript"],
            "salaryRange": "$100K-120K",
            "companyId": company["_id"]
        }
    ]
    
    # Sample portfolio
    portfolio = {
        "_id": ObjectId(),
        "userId": user["_id"],
        "skills": ["javascript", "react", "node.js", "css", "html"],
        "education": [
            {
                "school": "Tech University",
                "degree": "Bachelor of Science",
                "fieldOfStudy": "Computer Science",
                "startDate": datetime.now() - timedelta(days=1825),  # 5 years ago
                "endDate": datetime.now() - timedelta(days=1095),    # 3 years ago
                "currentlyEnrolled": False
            }
        ],
        "experience": [
            {
                "company": "Web Solutions Ltd",
                "position": "Junior Developer",
                "startDate": datetime.now() - timedelta(days=1095),  # 3 years ago
                "endDate": datetime.now() - timedelta(days=365),     # 1 year ago
                "currentlyWorking": False,
                "description": "Worked on frontend development using React"
            },
            {
                "company": "Tech Innovators",
                "position": "Frontend Developer",
                "startDate": datetime.now() - timedelta(days=365),   # 1 year ago
                "endDate": None,
                "currentlyWorking": True,
                "description": "Working on React applications with Redux"
            }
        ],
        "projects": [
            {
                "title": "E-commerce Website",
                "description": "Built a full-stack e-commerce website",
                "technologies": ["react", "node.js", "mongodb", "express"]
            }
        ]
    }
    
    # Sample other user for comparison
    other_user = {
        "_id": ObjectId(),
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "role": "candidate",
        "skills": ["javascript", "angular", "python", "django"]
    }
    
    # Sample portfolio for other user
    other_portfolio = {
        "_id": ObjectId(),
        "userId": other_user["_id"],
        "skills": ["javascript", "angular", "python", "django"],
        "education": [
            {
                "school": "Code Academy",
                "degree": "Web Development Bootcamp",
                "fieldOfStudy": "Web Development",
                "startDate": datetime.now() - timedelta(days=730),   # 2 years ago
                "endDate": datetime.now() - timedelta(days=550),     # 1.5 years ago
                "currentlyEnrolled": False
            }
        ],
        "experience": [
            {
                "company": "DevShop",
                "position": "Junior Developer",
                "startDate": datetime.now() - timedelta(days=550),   # 1.5 years ago
                "endDate": None,
                "currentlyWorking": True,
                "description": "Working on Angular applications"
            }
        ]
    }
    
    # Sample application
    application = {
        "_id": ObjectId(),
        "userId": user["_id"],
        "jobId": jobs[0]["_id"],  # Applying to Frontend Developer position
        "coverLetter": "I am interested in the frontend developer position...",
        "status": "Pending"
    }
    
    # Sample other application
    other_application = {
        "_id": ObjectId(),
        "userId": other_user["_id"],
        "jobId": jobs[0]["_id"],  # Also applying to Frontend Developer position
        "coverLetter": "I would like to apply for the frontend developer role...",
        "status": "Pending"
    }
    
    return {
        "user": user,
        "other_user": other_user,
        "company": company,
        "jobs": jobs,
        "portfolio": portfolio,
        "other_portfolio": other_portfolio,
        "application": application,
        "other_application": other_application
    }

def setup_test_data(db):
    """Set up test data in the database if needed"""
    # Check if we already have data
    user_count = db.users.count_documents({})
    
    if user_count == 0:
        # Generate and insert sample data
        data = generate_sample_data()
        
        # Insert data into collections
        db.users.insert_one(data["user"])
        db.users.insert_one(data["other_user"])
        db.companies.insert_one(data["company"])
        db.jobposts.insert_many(data["jobs"])
        db.portfolios.insert_one(data["portfolio"])
        db.portfolios.insert_one(data["other_portfolio"])
        db.applications.insert_one(data["application"])
        db.applications.insert_one(data["other_application"])
        
        return data
    else:
        # Get existing data
        user = db.users.find_one({})
        portfolio = db.portfolios.find_one({"userId": user["_id"]})
        job = db.jobposts.find_one({})
        
        return {
            "user": user,
            "portfolio": portfolio,
            "job": job
        }

def test_recommendation_engine():
    """Test the recommendation engine with sample data"""
    # Get database connection
    db = get_db_connection()
    
    # Set up test data
    data = setup_test_data(db)
    
    # Initialize recommendation service
    recommendation_service = RecommendationService(db)
    
    # Test the recommendation service
    print("Testing recommendation service...")
    
    # Get user and job IDs
    user_id = str(data.get("user", {}).get("_id", ""))
    
    # Get first job
    if "jobs" in data and data["jobs"]:
        job_id = str(data["jobs"][0]["_id"])
    else:
        job_id = str(data.get("job", {}).get("_id", ""))
    
    print(f"Getting recommendation for user {user_id} and job {job_id}")
    
    try:
        # Generate recommendation
        result = recommendation_service.generate_recommendation(user_id, job_id)
        
        # Print the recommendation results
        print("\n=== Recommendation Results ===")
        print(f"Pass Percentage: {result['pass_percentage']}%")
        print(f"Ranking: {result['ranking']['rank']} out of {result['ranking']['total_applicants']}")
        print(f"Percentile: {result['ranking']['percentile']}%")
        
        print("\nStrengths:")
        for strength in result['strengths'][:5]:  # Show top 5 strengths
            print(f"- {strength}")
        
        print("\nWeaknesses:")
        for weakness in result['weaknesses'][:5]:  # Show top 5 weaknesses
            print(f"- {weakness}")
        
        print("\nSimilar Jobs:")
        for job in result['similar_jobs']:
            print(f"- {job['title']} - {job['match_percentage']}% match")
        
        print("\nText Report Preview (first 500 chars):")
        print(result['text_report'][:500] + "...")
        
        return result
    except Exception as e:
        print(f"Error testing recommendation service: {str(e)}")
        return None

if __name__ == "__main__":
    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
    
    # Run the test
    test_recommendation_engine()
