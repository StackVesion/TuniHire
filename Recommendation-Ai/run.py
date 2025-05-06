import os
import sys
from dotenv import load_dotenv

# Add the current directory to Python path to help with imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file if it exists
load_dotenv()

if __name__ == '__main__':
    # Import the flask_app from the app package
    from app import flask_app
    
    # Get port from environment or use default 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get debug mode from environment (default to True for development)
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), 'app', 'models')
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
    
    # Ensure training history directory exists
    history_dir = os.path.join(os.path.dirname(__file__), 'training_history')
    if not os.path.exists(history_dir):
        os.makedirs(history_dir)
    
    # Print startup information
    print("\n" + "="*80)
    print("TuniHire AI Recommendation Engine")
    print("="*80)
    print(f"API running at: http://localhost:{port}")
    print("Endpoints:")
    print("- GET /api/recommendation?user_id=<user_id>&job_id=<job_id>")
    print("- GET /api/better-matches/<user_id>")
    print("- GET /api/health")
    print("- GET /api/training/stats")
    print("="*80 + "\n")
    
    # Run the Flask application
    flask_app.run(debug=debug, host='0.0.0.0', port=port)
