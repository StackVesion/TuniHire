import os
import json
import traceback
import logging
from datetime import datetime, timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager

# Load environment variables
load_dotenv()

# Logger configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# CORS Configuration: allow all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default-dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

# Import face recognition service (optional)
FACE_RECOGNITION_SERVICE_AVAILABLE = False
face_recognition_service = None

try:
    from services.face_recognition_service import FaceRecognitionService
    face_recognition_service = FaceRecognitionService()
    FACE_RECOGNITION_SERVICE_AVAILABLE = True
    logger.info("Service de reconnaissance faciale chargé et initialisé avec succès")
except ImportError as e:
    logger.warning("FaceRecognitionService non disponible: %s", str(e))
    logger.debug(traceback.format_exc())
except Exception as e:
    logger.error("Erreur lors de l'initialisation du service de reconnaissance faciale: %s", str(e))
    logger.debug(traceback.format_exc())

# Import and register face recognition routes if service is available
try:
    if FACE_RECOGNITION_SERVICE_AVAILABLE:
        from routes.face_routes import face_bp, init_face_routes
        app.register_blueprint(face_bp, url_prefix='/api/face')
        init_face_routes(face_recognition_service)
        logger.info("Blueprint de reconnaissance faciale enregistré")
except ImportError as e:
    logger.warning("Routes de reconnaissance faciale non disponibles: %s", str(e))
    logger.debug(traceback.format_exc())

# Ensure uploads directory exists
upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(upload_folder, exist_ok=True)

@app.route('/')
def index():
    return jsonify({
        "message": "TuniHire AI Service API",
        "status": "online",
        "services_available": {
            "face_recognition": FACE_RECOGNITION_SERVICE_AVAILABLE
        }
    })

# Run the app
if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Démarrage du serveur Flask sur {host}:{port}")
    app.run(debug=True, host=host, port=port)
