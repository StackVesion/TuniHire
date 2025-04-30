from flask import Flask, request, jsonify
from app.services.recommendation_service import RecommendationService
from app.utils.db_connection import get_db_connection
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

if __name__ == '__main__':
    # Get port from environment or use default 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
