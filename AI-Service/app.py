import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from dotenv import load_dotenv
import logging
import traceback

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Tentative d'importation des services et routes
try:
    from services.ats_service import ATSService
    ATS_SERVICE_AVAILABLE = True
    logger.info("Service ATS chargé avec succès")
except ImportError as e:
    logger.warning(f"ATSService non disponible: {str(e)}")
    logger.warning(traceback.format_exc())
    ATS_SERVICE_AVAILABLE = False

try:
    from services.language_evaluation_service import LanguageEvaluationService
    LANGUAGE_SERVICE_AVAILABLE = True
    logger.info("Service d'évaluation linguistique chargé avec succès")
except ImportError as e:
    logger.warning(f"LanguageService non disponible: {str(e)}")
    LANGUAGE_SERVICE_AVAILABLE = False

try:
    from routes.ats_routes import ats_bp
    ATS_ROUTES_AVAILABLE = True
    logger.info("Routes ATS chargées avec succès")
except ImportError as e:
    logger.warning(f"Routes ATS non disponibles: {str(e)}")
    ATS_ROUTES_AVAILABLE = False

try:
    from routes.language_routes import language_bp
    LANGUAGE_ROUTES_AVAILABLE = True
    logger.info("Routes d'évaluation linguistique chargées avec succès")
except ImportError as e:
    logger.warning(f"Routes de langue non disponibles: {str(e)}")
    LANGUAGE_ROUTES_AVAILABLE = False

from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import timedelta

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)

# Configuration CORS appropriée pour permettre toutes les origines et méthodes
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": "*"}})

# Configuration JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default-dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

# Initialiser le service ATS, même si les routes ne sont pas disponibles
ats_service = None
if ATS_SERVICE_AVAILABLE:
    try:
        ats_service = ATSService()
        logger.info("Service ATS initialisé avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du service ATS: {str(e)}")
        logger.error(traceback.format_exc())
        ATS_SERVICE_AVAILABLE = False

# Initialiser le service d'évaluation linguistique si disponible
language_evaluation_service = None
if LANGUAGE_SERVICE_AVAILABLE:
    try:
        language_evaluation_service = LanguageEvaluationService()
        logger.info("Service d'évaluation linguistique initialisé avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du service d'évaluation linguistique: {str(e)}")
        LANGUAGE_SERVICE_AVAILABLE = False

# Enregistrer les blueprints si disponibles
if ATS_ROUTES_AVAILABLE:
    app.register_blueprint(ats_bp, url_prefix='/api/ats')
    logger.info("Blueprint ATS enregistré")

if LANGUAGE_ROUTES_AVAILABLE:
    app.register_blueprint(language_bp, url_prefix='/api/language')
    logger.info("Blueprint d'évaluation linguistique enregistré")

@app.route('/')
def index():
    return jsonify({
        "message": "TuniHire AI Service API",
        "status": "online",
        "services_available": {
            "ats": ATS_SERVICE_AVAILABLE,
            "language": LANGUAGE_SERVICE_AVAILABLE
        },
        "routes_available": {
            "ats": ATS_ROUTES_AVAILABLE,
            "language": LANGUAGE_ROUTES_AVAILABLE
        }
    })

@app.route('/health')
def health_check():
    """Endpoint de vérification de l'état du service"""
    return jsonify({
        "status": "healthy", 
        "message": "Le service d'IA est opérationnel",
        "services": {
            "ats": ATS_SERVICE_AVAILABLE,
            "language": LANGUAGE_SERVICE_AVAILABLE
        }
    })

# Fonctions d'extraction basiques en cas d'échec du service principal
def extract_basic_skills(resume_text, job_description):
    """Extraction basique de compétences en cas d'échec du service principal"""
    common_skills = ["javascript", "python", "java", "html", "css", "react", "angular", "vue", 
                    "node.js", "express", "django", "spring", "sql", "mongodb", "git"]
    skills_found = []
    
    for skill in common_skills:
        if skill.lower() in resume_text.lower():
            skills_found.append(skill)
    
    return skills_found[:5]  # Limiter à 5 compétences

def extract_basic_experience(resume_text):
    """Extraction basique d'années d'expérience"""
    import re
    patterns = [
        r'(\d+)\s*(?:ans|années|years|year)',
        r'expérience\s*(?:de|:)?\s*(\d+)',
        r'experience\s*(?:of)?\s*(\d+)'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, resume_text, re.IGNORECASE)
        if matches:
            try:
                return int(matches[0])
            except:
                pass
    return 1  # Valeur par défaut

def extract_basic_education(resume_text):
    """Extraction basique de formation"""
    education_keywords = ["master", "licence", "bachelor", "doctorat", "phd", "bac", "diplôme", "degree", "university"]
    education_info = []
    
    resume_lines = resume_text.split('\n')
    for line in resume_lines:
        for keyword in education_keywords:
            if keyword in line.lower():
                education_info.append(line.strip())
                break
    
    return education_info[:2]  # Limiter à 2 formations

if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Démarrage du serveur Flask sur {host}:{port}")
    app.run(debug=True, host=host, port=port) 