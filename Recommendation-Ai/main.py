import os
import logging
from flask import Flask, request, jsonify
from bson import ObjectId
import json
import datetime
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import application components
from app.utils.db_connection import get_db_connection
from app.services.recommendation_service import RecommendationService
from app.utils.test_data_generator import generate_sample_data

# Initialize Flask app
app = Flask(__name__)

# Create paths for models and training history
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'app', 'models')
TRAINING_DIR = os.path.join(BASE_DIR, 'training_history')

# Create necessary directories
for directory in [MODELS_DIR, TRAINING_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)
        logger.info(f"Created directory: {directory}")

# Connect to MongoDB
db = get_db_connection()
logger.info(f"Connected to MongoDB database: {db.name}")

# Initialize recommendation service
recommendation_service = RecommendationService(db)

def log_api_call(endpoint, params, result=None, error=None):
    """Log API calls to track model performance and results"""
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
            "subscription_tier": result.get("subscription_tier", "Free"),
            "subscription_bonus": result.get("subscription_bonus", 0),
            "strengths_count": len(result.get("strengths", [])),
            "weaknesses_count": len(result.get("weaknesses", [])),
            "similar_jobs_count": len(result.get("similar_jobs", []))
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
    Get AI-powered recommendation for a user applying to a job
    
    Query parameters:
    - user_id: The MongoDB ObjectId of the user
    - job_id: The MongoDB ObjectId of the job posting
    
    Returns:
    - pass_percentage: ATS pass likelihood (0-100%)
    - ranking: Position compared to other applicants
    - strengths: List of matching skills/qualifications
    - weaknesses: List of missing skills/qualifications
    - similar_jobs: List of better matching job postings
    - text_report: Detailed analysis in markdown format
    - subscription_tier: User's subscription level
    - subscription_bonus: Bonus applied based on subscription
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
    - limit: Maximum number of jobs to return (default: 10)
    
    Returns job recommendations with enhanced results for premium subscribers
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
                'description': job.get('description', '')[:150] + '...' if job.get('description') else '',
                'match_percentage': score,
                'salary_range': job.get('salaryRange', ''),
                'location': job.get('location', ''),
                'workplace_type': job.get('workplaceType', 'Remote'),
                'requirements': job.get('requirements', [])[:5]  # Only include first 5 requirements
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
    """Get API status and training information"""
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
            collection_counts = {}
            for collection in collections:
                collection_counts[collection] = db[collection].count_documents({})
        except Exception as e:
            collection_counts = {"error": str(e)}
        
        status_data = {
            'status': 'online',
            'api_version': '1.0',
            'models': model_files,
            'training_history': len(training_files),
            'mongodb_connected': len(collections) > 0,
            'collections': collection_counts,
            'subscription_tiers': {
                'Free': 'Base recommendations',
                'Golden': '10% ATS score bonus',
                'Platinum': '20% ATS score bonus',
                'Master': '30% ATS score bonus',
            },
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
    Manually retrain the ML model with all application data
    
    This endpoint forces a complete retraining of the recommendation model
    using all historical application data (Accepted/Rejected applications)
    """
    try:
        # Get all applications with confirmed outcomes
        applications = list(db.applications.find({'status': {'$in': ['Accepted', 'Rejected']}}))
        portfolios = list(db.portfolios.find())
        jobs = list(db.jobposts.find())
        
        if not applications or not portfolios or not jobs:
            return jsonify({
                'success': False,
                'message': 'Not enough data for training. Use /api/generate-test-data to create sample data.'
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
                'portfolios_count': len(portfolios),
                'jobs_count': len(jobs),
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
    Generate sample data for testing the recommendation system
    
    Query parameters:
    - count: Number of sample entries to generate (default: 20)
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
    # Check if we have data and generate sample data if needed
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
            
            logger.info(f"Training initial model with {len(applications)} applications...")
            recommendation_service.analyzer.train_on_application_results(
                applications, portfolios, jobs, force_retrain=True
            )
            recommendation_service.analyzer.save_models()
    except Exception as e:
        logger.error(f"Error during initialization: {str(e)}")
    
    # Get port and debug settings
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Print startup information
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
    
    print("\nSubscription Tier Benefits:")
    print("- Free: Base recommendations")
    print("- Golden: 10% ATS score bonus + Some premium job recommendations")
    print("- Platinum: 20% ATS score bonus + More premium job recommendations")
    print("- Master: 30% ATS score bonus + Mostly premium job recommendations")
    print("="*80 + "\n")
    
    # Run the Flask application
    app.run(debug=debug, host='0.0.0.0', port=port)
