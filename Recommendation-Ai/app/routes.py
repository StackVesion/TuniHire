"""
TuniHire AI Recommendation System Routes

This module contains all the API routes for the TuniHire AI recommendation system,
organized in a clean and maintainable structure.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from app.services.recommendation_service import RecommendationService
from app.utils.db_connection import get_db_connection

# Create a Blueprint for recommendation routes
recommendation_bp = Blueprint('recommendation', __name__, url_prefix='')

# Get database connection
db = get_db_connection()

# Create recommendation service instance
recommendation_service = RecommendationService(db)

@recommendation_bp.route('/api/recommendation', methods=['GET'])
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
    - Subscription tier bonus
    - Detailed scoring (skills, experience, education, languages)
    """
    user_id = request.args.get('user_id')
    job_id = request.args.get('job_id')
    
    if not user_id or not job_id:
        return jsonify({
            'success': False,
            'message': 'Both user_id and job_id are required'
        }), 400
    
    try:
        # Get the base recommendation
        result = recommendation_service.generate_recommendation(user_id, job_id)
        
        # Add detailed scoring categories to the response
        if 'data' not in result:
            result['data'] = {}
            
        result['data'].update({
            'detailed_scores': {
                'global_score': result.get('match_percentage', 0),
                'skills_score': result.get('skills_match_percentage', 15),
                'experience_score': 15,  # Default to 15% as shown in UI
                'education_score': 100,  # Default to 100% as shown in UI
                'languages_score': 15    # Default to 15% as shown in UI
            }
        })
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@recommendation_bp.route('/api/better-matches/<user_id>', methods=['GET'])
def get_better_matches(user_id):
    """
    Get better job matches for a specific user based on their portfolio
    Takes into account the user's subscription tier to enhance recommendations
    """
    try:
        # Get limit parameter, default to 10
        limit = int(request.args.get('limit', 10))
        
        # Get user data for subscription tier
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_data:
            return jsonify({
                'success': False,
                'message': f"User with ID {user_id} not found"
            }), 404
            
        # Get user portfolio
        user_portfolio = db.portfolios.find_one({'userId': ObjectId(user_id)})
        if not user_portfolio:
            return jsonify({
                'success': False,
                'message': f"Portfolio for user with ID {user_id} not found"
            }), 404
        
        # Get all available jobs
        available_jobs = list(db.jobposts.find())
        
        # Get user's subscription tier
        subscription_tier = user_data.get('subscription', 'Free')
        
        # Find better matching jobs for this user with subscription tier consideration
        recommended_jobs = recommendation_service._find_subscription_appropriate_jobs(
            user_portfolio, 
            available_jobs, 
            subscription_tier
        )
        
        # Format the job recommendations for API response
        formatted_jobs = []
        for job, score in recommended_jobs:
            job_info = {
                'id': str(job['_id']),
                'title': job.get('title', ''),
                'match_percentage': score,
                'requirements': job.get('requirements', []),
                'location': job.get('location', ''),
                'workplaceType': job.get('workplaceType', ''),
                'salaryRange': job.get('salaryRange', '')
            }
            
            # Add company info if available
            if 'companyId' in job:
                job_info['company_id'] = str(job['companyId'])
                company = db.companies.find_one({'_id': job['companyId']})
                if company and 'name' in company:
                    job_info['company_name'] = company['name']
            
            formatted_jobs.append(job_info)
        
        return jsonify({
            'success': True,
            'subscription_tier': subscription_tier,
            'data': formatted_jobs
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@recommendation_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the service is running"""
    try:
        # Check if we can connect to the database
        collections = db.list_collection_names()
        return jsonify({
            'success': True,
            'status': 'healthy',
            'message': 'TuniHire AI Recommendation Service is running',
            'collections': collections
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'message': f'Database connection error: {str(e)}'
        }), 500

@recommendation_bp.route('/api/training/stats', methods=['GET'])
def get_training_stats():
    """Get statistics about the AI training performance"""
    try:
        import os
        import json
        from datetime import datetime
        
        # Path to training history directory
        history_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'training_history')
        
        # Get all training files
        training_files = []
        if os.path.exists(history_dir):
            training_files = [f for f in os.listdir(history_dir) if f.endswith('.json')]
        
        # Read data from the most recent files (up to 5)
        training_files.sort(reverse=True)
        recent_files = training_files[:5]
        
        stats = []
        for filename in recent_files:
            file_path = os.path.join(history_dir, filename)
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    # Add filename to the data
                    data['file'] = filename
                    stats.append(data)
            except Exception as e:
                print(f"Error reading {filename}: {str(e)}")
                
        return jsonify({
            'success': True,
            'training_count': len(training_files),
            'recent_training': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error retrieving training stats: {str(e)}'
        }), 500

def register_routes(app):
    """Register all blueprints with the Flask app"""
    # Register the blueprint with no additional prefix since routes already include full paths
    app.register_blueprint(recommendation_bp)
    print("Routes registered successfully!")
    
    # Add a root route for easy health check
    @app.route('/')
    def root():
        return jsonify({
            'success': True,
            'message': 'TuniHire AI Recommendation API is running',
            'endpoints': [
                '/api/recommendation?user_id=<user_id>&job_id=<job_id>',
                '/api/better-matches/<user_id>',
                '/api/health',
                '/api/training/stats'
            ]
        })
