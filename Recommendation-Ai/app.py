from flask import Flask, request, jsonify
from app.services.recommendation_service import RecommendationService
from app.utils.db_connection import get_db_connection
from bson import ObjectId
import os

# Initialize Flask app
app = Flask(__name__)

# Get MongoDB connection
db = get_db_connection()

# Create recommendation service instance
recommendation_service = RecommendationService(db)

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
    """
    user_id = request.args.get('user_id')
    job_id = request.args.get('job_id')
    
    if not user_id or not job_id:
        return jsonify({
            'success': False,
            'message': 'Both user_id and job_id are required'
        }), 400
    
    try:
        result = recommendation_service.generate_recommendation(user_id, job_id)
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Add an endpoint to get better job matches for a user
@app.route('/api/better-matches/<user_id>', methods=['GET'])
def get_better_matches(user_id):
    """
    Get better job matches for a specific user
    """
    try:
        # Get limit parameter, default to 10
        limit = int(request.args.get('limit', 10))
        
        # Get user portfolio
        user_portfolio = db.portfolios.find_one({'userId': ObjectId(user_id)})
        if not user_portfolio:
            return jsonify({
                'success': False,
                'message': f"Portfolio for user with ID {user_id} not found"
            }), 404
        
        # Get all available jobs
        available_jobs = list(db.jobposts.find())
        
        # Find better matching jobs for this user
        analyzer = recommendation_service.analyzer
        recommended_jobs = analyzer.find_best_matching_jobs(user_portfolio, available_jobs, limit)
        
        # Format the job recommendations for API response
        formatted_jobs = []
        for job, score in recommended_jobs:
            job_info = {
                'id': str(job['_id']),
                'title': job.get('title', ''),
                'match_percentage': score
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
            'data': formatted_jobs
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
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

# If running the file directly
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
