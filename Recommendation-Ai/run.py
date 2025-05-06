import os
import sys
import time
import json
import datetime
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Configure training history directory
TRAINING_HISTORY_DIR = os.path.join(os.path.dirname(__file__), 'training_history')
if not os.path.exists(TRAINING_HISTORY_DIR):
    os.makedirs(TRAINING_HISTORY_DIR)
    print(f"Created training history directory: {TRAINING_HISTORY_DIR}")

# Ensure models directory exists for ML model storage
models_dir = os.path.join(os.path.dirname(__file__), 'app', 'models')
if not os.path.exists(models_dir):
    os.makedirs(models_dir)
    print(f"Created models directory: {models_dir}")

if __name__ == '__main__':
    # Get port from environment or use default 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get debug mode from environment (default to True for development)
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Print startup message
    print("\n" + "="*80)
    print("TuniHire AI Recommendation Engine")
    print("="*80)
    print(f"API will be available at: http://localhost:{port}")
    print("Endpoints:")
    print("- GET /api/recommendation?user_id=<user_id>&job_id=<job_id>")
    print("- GET /api/better-matches/<user_id>")
    print("- GET /api/status")
    print("- POST /api/retrain")
    print("- POST /api/generate-test-data")
    print(f"Training history is being saved to: {TRAINING_HISTORY_DIR}")
    
    # Subscription Tier Benefits:
    print("\nSubscription Tier Benefits:")
    print("- Free: Base recommendations")
    print("- Golden: 10% ATS score bonus + Some premium job recommendations")
    print("- Platinum: 20% ATS score bonus + More premium job recommendations")
    print("- Master: 30% ATS score bonus + Mostly premium job recommendations")
    print("="*80 + "\n")
    
    # Export environment variables needed by app.py
    os.environ['PORT'] = str(port)
    os.environ['DEBUG'] = str(debug).lower()
    
    # Execute app.py directly
    print("Starting the TuniHire AI Recommendation Engine...")
    from app import app
    app.run(debug=debug, host='0.0.0.0', port=port)
