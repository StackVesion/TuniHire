import os
import sys
import json
import datetime
from flask import Flask, request, jsonify
from bson import ObjectId
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set up directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'app', 'models')
TRAINING_DIR = os.path.join(BASE_DIR, 'training_history')

# Create directories if they don't exist
for directory in [MODELS_DIR, TRAINING_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)
        logger.info(f"Created directory: {directory}")

# Import our recommendation engine components
sys.path.insert(0, BASE_DIR)
from app.utils.db_connection import get_db_connection
from app.services.recommendation_service import RecommendationService
from app.utils.test_data_generator import generate_sample_data

# Initialize Flask app
app = Flask(__name__)

# Connect to MongoDB
db = get_db_connection()
logger.info(f"Connected to MongoDB database: {db.name}")

# Create recommendation service
recommendation_service = RecommendationService(db)

def log_api_call(endpoint, params, result=None, error=None):
    """Log API calls to training history for model improvement"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_data = {
        "timestamp": timestamp,
        "datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "endpoint": endpoint,
        "params": params,
        "success": error is None
    }
    
    if error:
        log_data["error"] = str(error)
    
    if result and not error:
        # Store simplified result to avoid huge log files
        simplified_result = {
            "pass_percentage": result.get("pass_percentage"),
            "subscription_tier": result.get("subscription_tier"),
            "subscription_bonus": result.get("subscription_bonus"),
            "strengths_count": len(result.get("strengths", [])) if "strengths" in result else 0,
            "weaknesses_count": len(result.get("weaknesses", [])) if "weaknesses" in result else 0
        }
        log_data["result"] = simplified_result
    
    log_file = os.path.join(TRAINING_DIR, f"api_call_{timestamp}.json")
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)
    
    logger.info(f"API call logged to: {log_file}")
    return log_file

@app.route('/api/recommendation', methods=['GET'])
def get_recommendation():
    """
    Get a detailed AI recommendation for a user applying to a job
    
    Required query parameters:
    - user_id: MongoDB ObjectId of the user
    - job_id: MongoDB ObjectId of the job
    
    Returns:
    - pass_percentage: Likelihood of passing ATS (0-100)
    - base_percentage: Raw ATS score before subscription bonus
    - subscription_tier: User's subscription level (Free, Golden, Platinum, Master)
    - subscription_bonus: Percentage bonus applied based on subscription
    - ranking: Position compared to other applicants
    - strengths: List of skills/qualifications that match the job
    - weaknesses: List of missing skills/qualifications
    - similar_jobs: List of better matching job recommendations
    - text_report: Detailed markdown formatted text report
    """
    user_id = request.args.get('user_id')
    job_id = request.args.get('job_id')
    
    if not user_id or not job_id:
        error_msg = 'Both user_id and job_id are required'
        log_api_call('/api/recommendation', {'user_id': user_id, 'job_id': job_id}, error=error_msg)
        return jsonify({
            'success': False,
            'message': error_msg
        }), 400
    
    try:
        result = recommendation_service.generate_recommendation(user_id, job_id)
        log_api_call('/api/recommendation', {'user_id': user_id, 'job_id': job_id}, result=result)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        logger.error(f"Error generating recommendation: {str(e)}")
        log_api_call('/api/recommendation', {'user_id': user_id, 'job_id': job_id}, error=str(e))
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/better-matches/<user_id>', methods=['GET'])
def get_better_matches(user_id):
    """
    Get job recommendations that better match a user's portfolio
    
    Path parameter:
    - user_id: MongoDB ObjectId of the user
    
    Query parameters:
    - limit: Maximum number of recommendations to return (default: 10)
    
    Returns:
    - List of job recommendations with match scores, company info, and subscription details
    """
    try:
        limit = int(request.args.get('limit', 10))
        
        # Get user data to check subscription tier
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_data:
            error_msg = f"User with ID {user_id} not found"
            log_api_call('/api/better-matches', {'user_id': user_id, 'limit': limit}, error=error_msg)
            return jsonify({
                'success': False,
                'message': error_msg
            }), 404
            
        # Get subscription tier
        subscription_tier = user_data.get('subscription', 'Free')
        
        # Get user portfolio
        user_portfolio = db.portfolios.find_one({'userId': ObjectId(user_id)})
        if not user_portfolio:
            error_msg = f"Portfolio for user with ID {user_id} not found"
            log_api_call('/api/better-matches', {'user_id': user_id, 'limit': limit}, error=error_msg)
            return jsonify({
                'success': False,
                'message': error_msg
            }), 404
        
        # Get all available jobs
        available_jobs = list(db.jobposts.find())
        
        # Use subscription-aware job matching
        recommended_jobs = recommendation_service._find_subscription_appropriate_jobs(
            user_portfolio, 
            available_jobs, 
            subscription_tier
        )
        
        # Limit the results
        recommended_jobs = recommended_jobs[:limit]
        
        # Format the job recommendations for API response
        formatted_jobs = []
        for job, score in recommended_jobs:
            job_info = {
                'id': str(job['_id']),
                'title': job.get('title', ''),
                'match_percentage': score,
                'subscription_tier': subscription_tier
            }
            
            # Add company info if available
            if 'companyId' in job:
                job_info['company_id'] = str(job['companyId'])
                company = db.companies.find_one({'_id': job['companyId']})
                if company and 'name' in company:
                    job_info['company_name'] = company['name']
            
            formatted_jobs.append(job_info)
        
        result = {
            'jobs': formatted_jobs,
            'subscription_tier': subscription_tier,
            'count': len(formatted_jobs)
        }
        
        log_api_call('/api/better-matches', {'user_id': user_id, 'limit': limit}, result=result)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error finding better matches: {str(e)}")
        log_api_call('/api/better-matches', {'user_id': user_id, 'limit': limit}, error=str(e))
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get API and model status information"""
    try:
        model_files = []
        if os.path.exists(MODELS_DIR):
            model_files = os.listdir(MODELS_DIR)
        
        training_files = []
        if os.path.exists(TRAINING_DIR):
            training_files = os.listdir(TRAINING_DIR)
        
        collections = []
        try:
            collections = db.list_collection_names()
        except Exception as e:
            collections = [f"Error listing collections: {str(e)}"]
        
        # Check if we have training data
        collection_counts = {}
        for collection in collections:
            collection_counts[collection] = db[collection].count_documents({})
        
        has_training_data = (
            collection_counts.get('applications', 0) > 0 and
            collection_counts.get('portfolios', 0) > 0 and
            collection_counts.get('jobposts', 0) > 0
        )
        
        status_data = {
            'status': 'online',
            'models': model_files,
            'models_count': len(model_files),
            'training_history': len(training_files),
            'mongodb_connected': len(collections) > 0,
            'collections': collection_counts,
            'has_training_data': has_training_data,
            'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return jsonify({
            'success': True,
            'data': status_data
        })
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """
    Manually retrain the ML model with all available application data
    
    This endpoint forces a complete retraining of the model using all
    historical application data with known outcomes (Accepted/Rejected)
    """
    try:
        # Get all applications with confirmed outcomes (Accepted/Rejected)
        applications = list(db.applications.find({'status': {'$in': ['Accepted', 'Rejected']}}))
        portfolios = list(db.portfolios.find())
        jobs = list(db.jobposts.find())
        
        if not applications or not portfolios or not jobs:
            return jsonify({
                'success': False,
                'message': 'Not enough data for training. Generate test data first.'
            }), 400
        
        logger.info(f"Retraining model with {len(applications)} applications...")
        
        # Retrain the model
        training_stats = recommendation_service.analyzer.train_on_application_results(
            applications, portfolios, jobs, force_retrain=True
        )
        
        # Save the model
        model_path = recommendation_service.analyzer.save_models()
        
        # Log the training
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        training_log = {
            "timestamp": timestamp,
            "datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "event": "manual_retrain",
            "model_path": model_path,
            "applications_count": len(applications),
            "training_stats": training_stats
        }
        
        log_file = os.path.join(TRAINING_DIR, f"manual_training_{timestamp}.json")
        with open(log_file, 'w') as f:
            json.dump(training_log, f, indent=2)
        
        logger.info(f"Model training complete, saved to {model_path}")
        
        return jsonify({
            'success': True,
            'data': {
                'message': 'Model retrained successfully',
                'applications_used': len(applications),
                'model_path': model_path,
                'training_log': os.path.basename(log_file)
            }
        })
    except Exception as e:
        logger.error(f"Error retraining model: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/generate-test-data', methods=['POST'])
def generate_test_data():
    """
    Generate sample data for testing the recommendation engine
    
    Query parameters:
    - count: Number of sample entries to generate (default: 10)
    - clear: Whether to clear existing data first (default: false)
    """
    try:
        count = int(request.args.get('count', 20))
        clear = request.args.get('clear', 'false').lower() == 'true'
        
        # Optionally clear existing data
        if clear:
            logger.info("Clearing existing database data...")
            db.users.delete_many({})
            db.portfolios.delete_many({})
            db.companies.delete_many({})
            db.jobposts.delete_many({})
            db.applications.delete_many({})
        
        logger.info(f"Generating {count} sample entries for testing...")
        data = generate_sample_data(db, count)
        
        # Retrain the model with the new data
        if data.get('message') == 'Sample data generated successfully':
            logger.info("Training model with newly generated data...")
            applications = list(db.applications.find({'status': {'$in': ['Accepted', 'Rejected']}}))
            portfolios = list(db.portfolios.find())
            jobs = list(db.jobposts.find())
            
            training_stats = recommendation_service.analyzer.train_on_application_results(
                applications, portfolios, jobs, force_retrain=True
            )
            
            # Save the model
            model_path = recommendation_service.analyzer.save_models()
            data['training'] = {
                'applications_used': len(applications),
                'model_saved': model_path
            }
        
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Error generating test data: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Get the port and debug mode from environment variables
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Check if we have data, generate sample data if needed
    try:
        # Check for existing data
        has_data = all([
            db.users.count_documents({}) > 0,
            db.portfolios.count_documents({}) > 0,
            db.jobposts.count_documents({}) > 0,
            db.applications.count_documents({}) > 0
        ])
        
        if not has_data:
            logger.info("No data found in database. Generating sample data...")
            generate_sample_data(db, count=20)
            logger.info("Sample data generated successfully")
            
            # Train the model with the generated data
            applications = list(db.applications.find({'status': {'$in': ['Accepted', 'Rejected']}}))
            portfolios = list(db.portfolios.find())
            jobs = list(db.jobposts.find())
            
            logger.info(f"Training model with {len(applications)} applications...")
            training_stats = recommendation_service.analyzer.train_on_application_results(
                applications, portfolios, jobs, force_retrain=True
            )
            
            # Save the model
            model_path = recommendation_service.analyzer.save_models()
            logger.info(f"Model training complete, saved to {model_path}")
    except Exception as e:
        logger.error(f"Error initializing data: {str(e)}")
    
    # Print the API information
    print("\n" + "="*80)
    print("TuniHire AI Recommendation Engine")
    print("="*80)
    print(f"API running at: http://localhost:{port}")
    print("\nEndpoints:")
    print("- GET /api/recommendation?user_id=<user_id>&job_id=<job_id>")
    print("- GET /api/better-matches/<user_id>")
    print("- GET /api/status")
    print("- POST /api/retrain")
    print("- POST /api/generate-test-data")
    print(f"\nTraining history: {TRAINING_DIR}")
    print(f"ML Models: {MODELS_DIR}")
    
    print("\nSubscription Tier Benefits:")
    print("- Free: Base recommendations")
    print("- Golden: 10% ATS score bonus + Some premium job recommendations")
    print("- Platinum: 20% ATS score bonus + More premium job recommendations")
    print("- Master: 30% ATS score bonus + Mostly premium job recommendations")
    
    print("\nAPI Ready for Postman Testing")
    print("="*80 + "\n")
    
    # Run the Flask application
    app.run(debug=debug, host='0.0.0.0', port=port)
