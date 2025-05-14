import os
from dotenv import load_dotenv

# Load environment variables from .env file for local dev
load_dotenv()

# Import the Flask app
from app import flask_app

# Ensure models directory exists
models_dir = os.path.join(os.path.dirname(__file__), 'app', 'models')
os.makedirs(models_dir, exist_ok=True)

# Ensure training history directory exists
history_dir = os.path.join(os.path.dirname(__file__), 'training_history')
os.makedirs(history_dir, exist_ok=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Render injects PORT
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    print("\n" + "="*80)
    print("TuniHire AI Recommendation Engine")
    print("="*80)
    print(f"API running on port: {port}")
    print("Endpoints:")
    print("- GET /api/recommendation?user_id=<user_id>&job_id=<job_id>")
    print("- GET /api/better-matches/<user_id>")
    print("- GET /api/health")
    print("- GET /api/training/stats")
    print("="*80 + "\n")

    # Explicitly use the provided port
    flask_app.run(debug=debug, host='0.0.0.0', port=port)
