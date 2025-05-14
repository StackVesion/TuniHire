import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from dotenv import load_dotenv
import logging
import traceback
from datetime import datetime

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
    from services.face_recognition_service import FaceRecognitionService
    FACE_RECOGNITION_SERVICE_AVAILABLE = True
    logger.info("Service de reconnaissance faciale chargé avec succès")
except ImportError as e:
    logger.warning(f"FaceRecognitionService non disponible: {str(e)}")
    logger.warning(traceback.format_exc())
    FACE_RECOGNITION_SERVICE_AVAILABLE = False

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

try:
    from routes.face_routes import face_bp, init_face_routes
    FACE_ROUTES_AVAILABLE = True
    logger.info("Routes de reconnaissance faciale chargées avec succès")
except ImportError as e:
    logger.warning(f"Routes de reconnaissance faciale non disponibles: {str(e)}")
    logger.warning(traceback.format_exc())
    FACE_ROUTES_AVAILABLE = False

# Import the new ATS 2025 routes
try:
    from routes.ats_routes_2025 import ats_2025_bp
    ATS_2025_ROUTES_AVAILABLE = True
    logger.info("Routes ATS 2025 chargées avec succès")
except ImportError as e:
    logger.warning(f"Routes ATS 2025 non disponibles: {str(e)}")
    logger.warning(traceback.format_exc())
    ATS_2025_ROUTES_AVAILABLE = False

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

# Initialiser le service de reconnaissance faciale si disponible
face_recognition_service = None
if FACE_RECOGNITION_SERVICE_AVAILABLE:
    try:
        face_recognition_service = FaceRecognitionService()
        logger.info("Service de reconnaissance faciale initialisé avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du service de reconnaissance faciale: {str(e)}")
        FACE_RECOGNITION_SERVICE_AVAILABLE = False

# Enregistrer les blueprints si disponibles
if ATS_ROUTES_AVAILABLE:
    app.register_blueprint(ats_bp, url_prefix='/api/ats')
    logger.info("Blueprint ATS enregistré")

if LANGUAGE_ROUTES_AVAILABLE:
    app.register_blueprint(language_bp, url_prefix='/api/language')
    logger.info("Blueprint d'évaluation linguistique enregistré")

if FACE_ROUTES_AVAILABLE and face_recognition_service:
    app.register_blueprint(face_bp, url_prefix='/api/face')
    init_face_routes(face_recognition_service)
    logger.info("Blueprint de reconnaissance faciale enregistré")

# Register the new ATS 2025 routes
if ATS_2025_ROUTES_AVAILABLE:
    app.register_blueprint(ats_2025_bp, url_prefix='/api/ats2025')
    logger.info("Blueprint ATS 2025 enregistré")
else:
    # Create a fallback for the ATS 2025 API if not available
    @app.route('/api/ats2025/analyze', methods=['POST'])
    # Removed JWT requirement for testing
    def ats_2025_analyze_fallback():
        """Fallback for ATS 2025 analysis that uses the standard ATS service"""
        logger.info("Using standard ATS analysis as fallback for 2025 endpoint")
        
        if not ATS_SERVICE_AVAILABLE:
            return jsonify({
                "success": False,
                "message": "ATS service is not available",
                "error": "Service unavailable"
            }), 503
            
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided",
                "error": "Missing data"
            }), 400
            
        resume_text = data.get('resumeText')
        job_description = data.get('jobDescription')
        
        if not resume_text:
            return jsonify({
                "success": False,
                "message": "Resume text is required",
                "error": "Missing resume text"
            }), 400
            
        if not job_description:
            return jsonify({
                "success": False,
                "message": "Job description is required",
                "error": "Missing job description"
            }), 400
            
        # Optional parameters (ignored in standard processing)
        analysis_level = data.get('analysisLevel', 'standard')
        job_metadata = data.get('jobMetadata', {})
        
        # Process request with standard ATS service
        try:
            standard_result = ats_service.analyze_resume(resume_text, job_description)
            
            # Enhance the result with simulated 2025 features
            enhanced_result = standard_result.copy()
            enhanced_result.update({
                "analysisLevel": analysis_level,
                "semanticMatch": {
                    "score": round(standard_result.get("matchScore", 0) * 0.8),
                    "details": {}
                },
                "analysis": {
                    "strengths": standard_result.get("strengths", []),
                    "weaknesses": standard_result.get("weaknesses", []),
                    "summary": standard_result.get("summary", "Analyse standard améliorée côté serveur.")
                },
                "aiInsights": {
                    "overallFit": "Analyse simulée - Service 2025 indisponible",
                    "keyStrengths": standard_result.get("strengths", []),
                    "developmentAreas": standard_result.get("weaknesses", []),
                    "culturalFit": "Non disponible dans la version fallback",
                    "growthPotential": "Non disponible dans la version fallback"
                },
                "cognitiveProfile": {
                    "soft_skills": {
                        "communication": 65,
                        "leadership": 60,
                        "problem_solving": 70,
                        "teamwork": 75,
                        "creativity": 65,
                        "adaptability": 70
                    },
                    "learning_agility": 65,
                    "analytical_thinking": 70,
                    "overall_score": 68
                },
                "careerTrajectory": {
                    "career_path": "mid_career",
                    "progression_rate": 65,
                    "stability": 70,
                    "potential_fit": 75,
                    "growth_potential": "Bon potentiel d'évolution dans ce rôle",
                    "trajectory_summary": "Parcours professionnel cohérent avec le poste visé."
                }
            })
            
            return jsonify({
                "success": True,
                "message": "Resume analyzed successfully (fallback mode)",
                "data": enhanced_result
            }), 200
            
        except Exception as e:
            logger.error(f"Error in ATS 2025 fallback analysis: {str(e)}")
            logger.error(traceback.format_exc())
            
            return jsonify({
                "success": False,
                "message": "Error analyzing resume",
                "error": str(e)
            }), 500

# Add a fallback for standard ATS route as well
@app.route('/api/ats/analyze', methods=['POST'])
def ats_analyze_fallback():
    """Fallback for standard ATS analysis"""
    logger.info("Using fallback for standard ATS endpoint")
    
    if not ATS_SERVICE_AVAILABLE:
        return jsonify({
            "success": False,
            "message": "ATS service is not available",
            "error": "Service unavailable"
        }), 503
        
    data = request.json
    
    if not data:
        return jsonify({
            "success": False,
            "message": "No data provided",
            "error": "Missing data"
        }), 400
        
    resume_text = data.get('resumeText')
    job_description = data.get('jobDescription')
    
    if not resume_text:
        return jsonify({
            "success": False,
            "message": "Resume text is required",
            "error": "Missing resume text"
        }), 400
        
    if not job_description:
        return jsonify({
            "success": False,
            "message": "Job description is required",
            "error": "Missing job description"
        }), 400
        
    # Process request with standard ATS service
    try:
        result = ats_service.analyze_resume(resume_text, job_description)
        
        return jsonify({
            "success": True,
            "message": "Resume analyzed successfully",
            "data": result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in standard ATS analysis: {str(e)}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            "success": False,
            "message": "Error analyzing resume",
            "error": str(e)
        }), 500

# Make sure the upload folder exists
upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)
    
# Set the upload folder configuration
app.config['UPLOAD_FOLDER'] = upload_folder
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

@app.route('/')
def index():
    return jsonify({
        "message": "TuniHire AI Service API",
        "status": "online",
        "services_available": {
            "ats": ATS_SERVICE_AVAILABLE,
            "language": LANGUAGE_SERVICE_AVAILABLE,
            "face_recognition": FACE_RECOGNITION_SERVICE_AVAILABLE
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

# Donner la priorité à ATS 2025
# Initialiser le service ATS 2025 pour l'analyse locale
if ATS_2025_ROUTES_AVAILABLE:
    try:
        from services.ats_service_2025 import ATSService2025
        ats_service_2025 = ATSService2025(use_ai_apis=(os.environ.get("USE_AI_APIS", "true").lower() == "true"))
        logger.info("Service ATS 2025 initialisé avec succès pour l'analyse locale")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation du service ATS 2025: {str(e)}")
        logger.error(traceback.format_exc())
        ATS_2025_ROUTES_AVAILABLE = False
else:
    # Create a fallback for the ATS 2025 API if not available
    @app.route('/api/ats2025/analyze', methods=['POST'])
    # Removed JWT requirement for testing
    def ats_2025_analyze_fallback():
        """Fallback for ATS 2025 analysis that uses the standard ATS service"""
        logger.info("Using standard ATS analysis as fallback for 2025 endpoint")
        
        if not ATS_SERVICE_AVAILABLE:
            return jsonify({
                "success": False,
                "message": "ATS service is not available",
                "error": "Service unavailable"
            }), 503
            
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided",
                "error": "Missing data"
            }), 400
            
        resume_text = data.get('resumeText')
        job_description = data.get('jobDescription')
        
        if not resume_text:
            return jsonify({
                "success": False,
                "message": "Resume text is required",
                "error": "Missing resume text"
            }), 400
            
        if not job_description:
            return jsonify({
                "success": False,
                "message": "Job description is required",
                "error": "Missing job description"
            }), 400
            
        # Optional parameters (ignored in standard processing)
        analysis_level = data.get('analysisLevel', 'standard')
        job_metadata = data.get('jobMetadata', {})
        
        # Process request with standard ATS service
        try:
            standard_result = ats_service.analyze_resume(resume_text, job_description)
            
            # Enhance the result with simulated 2025 features
            enhanced_result = standard_result.copy()
            enhanced_result.update({
                "analysisLevel": analysis_level,
                "semanticMatch": {
                    "score": round(standard_result.get("matchScore", 0) * 0.8),
                    "details": {}
                },
                "analysis": {
                    "strengths": standard_result.get("strengths", []),
                    "weaknesses": standard_result.get("weaknesses", []),
                    "summary": standard_result.get("summary", "Analyse standard améliorée côté serveur.")
                },
                "aiInsights": {
                    "overallFit": "Analyse simulée - Service 2025 indisponible",
                    "keyStrengths": standard_result.get("strengths", []),
                    "developmentAreas": standard_result.get("weaknesses", []),
                    "culturalFit": "Non disponible dans la version fallback",
                    "growthPotential": "Non disponible dans la version fallback"
                },
                "cognitiveProfile": {
                    "soft_skills": {
                        "communication": 65,
                        "leadership": 60,
                        "problem_solving": 70,
                        "teamwork": 75,
                        "creativity": 65,
                        "adaptability": 70
                    },
                    "learning_agility": 65,
                    "analytical_thinking": 70,
                    "overall_score": 68
                },
                "careerTrajectory": {
                    "career_path": "mid_career",
                    "progression_rate": 65,
                    "stability": 70,
                    "potential_fit": 75,
                    "growth_potential": "Bon potentiel d'évolution dans ce rôle",
                    "trajectory_summary": "Parcours professionnel cohérent avec le poste visé."
                }
            })
            
            return jsonify({
                "success": True,
                "message": "Resume analyzed successfully (fallback mode)",
                "data": enhanced_result
            }), 200
            
        except Exception as e:
            logger.error(f"Error in ATS 2025 fallback analysis: {str(e)}")
            logger.error(traceback.format_exc())
            
            return jsonify({
                "success": False,
                "message": "Error analyzing resume",
                "error": str(e)
            }), 500

@app.route('/api/ats/analyze-local', methods=['POST'])
def local_ats_analyze():
    """Endpoint for local ATS analysis with 2025 features for offline mode"""
    logger.info("Performing local ATS analysis with enhanced features")
    
    data = request.json
    
    if not data:
        return jsonify({
            "success": False,
            "message": "No data provided",
            "error": "Missing data"
        }), 400
        
    resume_text = data.get('resumeText')
    job_description = data.get('jobDescription')
    
    if not resume_text:
        return jsonify({
            "success": False,
            "message": "Resume text is required",
            "error": "Missing resume text"
        }), 400
        
    if not job_description:
        return jsonify({
            "success": False,
            "message": "Job description is required",
            "error": "Missing job description"
        }), 400
        
    # Optional parameters
    analysis_level = data.get('analysisLevel', 'standard')
    job_metadata = data.get('jobMetadata', {})
    required_skills = data.get('requiredSkills', [])
    required_languages = data.get('requiredLanguages', [])
    
    try:
        # Use ATS 2025 service if available
        if ATS_2025_ROUTES_AVAILABLE and 'ats_service_2025' in globals():
            logger.info("Using ATS 2025 service for local analysis")
            analysis_result = ats_service_2025.analyze_resume(
                resume_text=resume_text,
                job_description=job_description,
                required_skills=required_skills,
                job_metadata=job_metadata,
                required_languages=required_languages,
                analysis_level=analysis_level
            )
            
            result_message = "Analyse locale générée avec fonctionnalités avancées"
        
        # Fall back to standard ATS service
        elif ATS_SERVICE_AVAILABLE:
            logger.info("Using standard ATS service for local analysis")
            standard_result = ats_service.analyze_resume(resume_text, job_description)
            
            # Enhance the result with simulated 2025 features
            analysis_result = standard_result.copy()
            analysis_result.update({
                "analysisLevel": analysis_level,
                "semanticMatch": {
                    "score": round(standard_result.get("matchScore", 0) * 0.8),
                    "details": {}
                },
                "analysis": {
                    "strengths": standard_result.get("strengths", []),
                    "weaknesses": standard_result.get("weaknesses", []),
                    "summary": standard_result.get("analysis", "Analyse standard améliorée en mode local.")
                },
                "aiInsights": {
                    "overallFit": "Analyse générée localement",
                    "keyStrengths": standard_result.get("strengths", []),
                    "developmentAreas": standard_result.get("weaknesses", []),
                    "culturalFit": "Analyse locale - Fonctionnalités limitées",
                    "growthPotential": "Analyse locale - Fonctionnalités limitées"
                },
                "cognitiveProfile": {
                    "soft_skills": {
                        "communication": 65,
                        "leadership": 60,
                        "problem_solving": 70,
                        "teamwork": 75,
                        "creativity": 65,
                        "adaptability": 70
                    },
                    "learning_agility": 65,
                    "analytical_thinking": 70,
                    "overall_score": 68
                },
                "careerTrajectory": {
                    "career_path": "mid_career",
                    "progression_rate": 65,
                    "stability": 70,
                    "potential_fit": 75,
                    "growth_potential": "Bon potentiel d'évolution dans ce rôle",
                    "trajectory_summary": "Parcours professionnel cohérent avec le poste visé."
                }
            })
            
            result_message = "Analyse locale générée avec fonctionnalités limitées"
        
        else:
            # Basic fallback if no services are available
            logger.warning("No ATS services available, generating basic analysis")
            skills = extract_basic_skills(resume_text, job_description)
            experience_years = extract_basic_experience(resume_text)
            education = extract_basic_education(resume_text)
            
            # Generate a simple score based on matches
            match_score = min(len(skills) * 10, 100)
            
            analysis_result = {
                "matchScore": match_score,
                "skillsMatched": skills,
                "missingSkills": [],
                "experienceYears": experience_years,
                "education": education,
                "analysis": {
                    "summary": "Analyse basique générée localement - Fonctionnalités très limitées"
                },
                "recommendation": "Analyse automatique locale - Vérification manuelle recommandée"
            }
            
            result_message = "Analyse basique générée localement (mode dégradé)"
        
        # Add a flag to indicate this is a local analysis
        analysis_result["localAnalysis"] = True
        analysis_result["analysisTime"] = datetime.now().isoformat()
        
        return jsonify({
            "success": True,
            "message": result_message,
            "data": analysis_result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in local ATS analysis: {str(e)}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            "success": False,
            "message": "Error analyzing resume locally",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Démarrage du serveur Flask sur {host}:{port}")
    app.run(debug=True, host=host, port=port) 