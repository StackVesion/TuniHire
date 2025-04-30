import os
from dotenv import load_dotenv
import app as flask_app

# Load environment variables from .env file if it exists
load_dotenv()

if __name__ == '__main__':
    # Get port from environment or use default 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get debug mode from environment (default to True for development)
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Run the Flask application
    flask_app.app.run(debug=debug, host='0.0.0.0', port=port)
