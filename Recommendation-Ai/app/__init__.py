"""
TuniHire AI Recommendation System
--------------------------------
Main app package that exports the Flask application
"""

from flask import Flask
from flask_cors import CORS
import os

def create_app():
    """Create and configure the Flask application"""
    # Create the Flask application
    app = Flask(__name__)
    
    # Enable CORS for all routes explicitly
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'models')
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
    
    # Ensure training history directory exists
    history_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'training_history')
    if not os.path.exists(history_dir):
        os.makedirs(history_dir)
    
    # Import routes after app is created to avoid circular imports
    from app.routes import register_routes
    register_routes(app)
    
    # Print registered routes for debugging
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule}")
    
    return app

# Create the Flask app instance
flask_app = create_app()