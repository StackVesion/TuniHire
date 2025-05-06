from flask import request, jsonify
from app import app
from app.services.recommendation_service import RecommendationService
from app.utils.db_connection import get_db_connection
import os
import json
import datetime
from bson import ObjectId

# Get MongoDB connection
db = get_db_connection()

# Create enhanced recommendation service instance
recommendation_service = RecommendationService(db)

# Configure training history tracking
TRAINING_HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'training_history')
if not os.path.exists(TRAINING_HISTORY_DIR):
    os.makedirs(TRAINING_HISTORY_DIR)
    print(f"Created training history directory: {TRAINING_HISTORY_DIR}")

def log_api_call(endpoint, params, result=None, error=None):
    """Log API calls to track performance and results for self-learning"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_data = {
        "timestamp": timestamp,
        "datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "endpoint": endpoint,
        "params": params,
        "success": error is None,
    }
    
    if error:
        log_data["error"] = str(error)
    
    if result and not error:
        # Store simplified result to avoid huge log files
        simplified_result = {
            "pass_percentage": result.get("pass_percentage"),
            "subscription_tier": result.get("subscription_tier"),
            "subscription_bonus": result.get("subscription_bonus"),
            "ranking_position": result.get("ranking", {}).get("position"),
            "strengths_count": len(result.get("strengths", [])),
            "weaknesses_count": len(result.get("weaknesses", [])),
            "similar_jobs_count": len(result.get("similar_jobs", [])),
        }
        log_data["result"] = simplified_result
    
    # Save to training history directory
    log_file = os.path.join(TRAINING_HISTORY_DIR, f"api_call_{timestamp}.json")
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)
    
    print(f"API call logged to: {log_file}")
    return log_file

@app.route('/api/recommendation', methods=['GET'])
def get_recommendation():
    """
    Endpoint to get recommendation for a user applying to a job
    Requires user_id and job_id as query parameters
    Returns:
    - Pass percentage (likelihood of passing ATS)
    - Ranking compared to other applicants
    - Strengths (skills matching job requirements)
    - Weaknesses (missing skills or experience)
    - Similar job matches
    - Text report with detailed analysis
    - Subscription bonus applied
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
        
        # Log successful API call
        log_file = log_api_call('/api/recommendation', {'user_id': user_id, 'job_id': job_id}, result=result)
        
        # Add training history file path to the result
        result['training_log'] = os.path.basename(log_file)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        # Log error
        log_api_call('/api/recommendation', {'user_id': user_id, 'job_id': job_id}, error=str(e))
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Add an endpoint to get better job matches for a user
@app.route('/api/better-matches/<user_id>', methods=['GET'])
def get_better_matches(user_id):
    """
    Get better job matches for a specific user based on their subscription tier
    Higher tier subscribers (Golden, Platinum, Master) get access to premium job recommendations
    """
    try:
        # Get limit parameter, default to 10
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
        
        # Log successful API call
        log_api_call('/api/better-matches', {'user_id': user_id, 'limit': limit}, result=result)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        # Log error
        log_api_call('/api/better-matches', {'user_id': user_id, 'limit': limit}, error=str(e))
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Add a status endpoint for health checks
@app.route('/api/status', methods=['GET'])
def get_status():
    """Get application health and training status"""
    try:
        model_files = []
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'models')
        
        if os.path.exists(models_dir):
            model_files = os.listdir(models_dir)
        
        training_files = []
        if os.path.exists(TRAINING_HISTORY_DIR):
            training_files = os.listdir(TRAINING_HISTORY_DIR)
        
        collections = []
        try:
            collections = db.list_collection_names()
        except Exception as e:
            collections = [f"Error listing collections: {str(e)}"]
        
        status_data = {
            'status': 'online',
            'models': model_files,
            'training_history': len(training_files),
            'latest_training': training_files[-1] if training_files else None,
            'mongodb_connected': len(collections) > 0,
            'collections': collections,
            'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return jsonify({
            'success': True,
            'data': status_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Add an endpoint to manually retrain the model
@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """Manually retrain the recommendation model"""
    try:
        # Get all applications with confirmed outcomes (Accepted/Rejected)
        applications = list(db.applications.find({'status': {'$in': ['Accepted', 'Rejected']}}))
        portfolios = list(db.portfolios.find())
        jobs = list(db.jobposts.find())
        
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
        
        log_file = os.path.join(TRAINING_HISTORY_DIR, f"manual_training_{timestamp}.json")
        with open(log_file, 'w') as f:
            json.dump(training_log, f, indent=2)
        
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
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Create a route to generate sample data for testing
@app.route('/api/generate-test-data', methods=['POST'])
def generate_test_data():
    """Generate sample data for testing the recommendation engine"""
    from app.utils.test_data_generator import generate_sample_data
    
    try:
        count = int(request.args.get('count', 10))
        data = generate_sample_data(db, count)
        
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
