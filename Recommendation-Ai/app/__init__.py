from flask import Flask
import os

# Create Flask app
app = Flask(__name__)

# Ensure models directory exists for storing ML models
models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'models')
if not os.path.exists(models_dir):
    os.makedirs(models_dir)
    print(f"Created models directory: {models_dir}")

# Configure training history tracking
training_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'training_history')
if not os.path.exists(training_dir):
    os.makedirs(training_dir)
    print(f"Created training history directory: {training_dir}")

# Import routes at the end to avoid circular imports
from app import routes
