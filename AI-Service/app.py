import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import traceback

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


try:
    from services.face_recognition_service import FaceRecognitionService
    FACE_RECOGNITION_SERVICE_AVAILABLE = True
    logger.info("Service de reconnaissance faciale chargé avec succès")
except ImportError as e:
    logger.warning(f"FaceRecognitionService non disponible: {str(e)}")
    logger.warning(traceback.format_exc())
    FACE_RECOGNITION_SERVICE_AVAILABLE = False

try:
    from routes.face_routes import face_bp, init_face_routes
    FACE_ROUTES_AVAILABLE = True
    logger.info("Routes de reconnaissance faciale chargées avec succès")
except ImportError as e:
    logger.warning(f"Routes de reconnaissance faciale non disponibles: {str(e)}")
    logger.warning(traceback.format_exc())
    FACE_ROUTES_AVAILABLE = False

from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import timedelta

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)

# Configuration CORS appropriée pour permettre toutes les origines et méthodes
CORS(app, resources={r"/": {"origins": "", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": "*"}})

# Configuration JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default-dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

# Initialiser le service de reconnaissance faciale si disponible
face_recognition_service = None
if FACE_RECOGNITION_SERVICE_AVAILABLE:
    try:
        face_recognition_service = FaceRecognitionService()
        logger.info("Service de reconnaissance faciale initialisé avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du service de reconnaissance faciale: {str(e)}")
        FACE_RECOGNITION_SERVICE_AVAILABLE = False

if FACE_ROUTES_AVAILABLE and face_recognition_service:
    app.register_blueprint(face_bp, url_prefix='/api/face')
    init_face_routes(face_recognition_service)
    logger.info("Blueprint de reconnaissance faciale enregistré")

@app.route('/')
def index():
    return jsonify({
        "message": "TuniHire AI Service API",
        "status": "online",
        "services_available": {
            "face_recognition": FACE_RECOGNITION_SERVICE_AVAILABLE
        }
    })

if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')  # or just hardcode '127.0.0.1'
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Démarrage du serveur Flask sur {host}:{port}")
    app.run(debug=True, host=host, port=port)
