import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

if __name__ == '__main__':
    # Import app directly from app.py (not as a module)
    from app import app
    
    # Get port from environment or use default 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get debug mode from environment (default to True for development)
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Print startup information
    print("\n" + "="*80)
    print("TuniHire AI Recommendation Engine")
    print("="*80)
    print(f"API running at: http://localhost:{port}")
    print("Endpoints:")
    print("- GET /api/recommendation?user_id=<user_id>&job_id=<job_id>")
    print("- GET /api/better-matches/<user_id>")
    print("="*80 + "\n")
    
    # Run the Flask application
    app.run(debug=debug, host='0.0.0.0', port=port)
