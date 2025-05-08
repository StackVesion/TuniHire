"""
Routes pour le service d'évaluation linguistique
Ce module contient les endpoints API pour les fonctionnalités d'analyse linguistique.
"""
import logging
from flask import Blueprint, request, jsonify
from services.language_evaluation_service import LanguageEvaluationService
from utils import token_required, format_api_response, safe_execute

# Configuration du logging
logger = logging.getLogger(__name__)

# Création du Blueprint pour les routes d'évaluation linguistique
language_bp = Blueprint('language', __name__)

# Instanciation du service
language_service = LanguageEvaluationService()

@language_bp.route('/evaluate', methods=['POST'])
@token_required
@safe_execute()
def evaluate_text():
    """Endpoint pour évaluer la qualité d'un texte"""
    data = request.json
    
    if not data:
        return jsonify(format_api_response(
            "Aucune donnée fournie", success=False
        )), 400
        
    text = data.get('text')
    target_language = data.get('language', 'fr')  # Langue cible, français par défaut
    
    if not text:
        return jsonify(format_api_response(
            "Le texte à évaluer est requis", success=False
        )), 400
    
    # Appel au service d'évaluation
    evaluation_result = language_service.evaluate_text(text, target_language)
    
    # Si le service renvoie un dictionnaire avec 'success': False, c'est une erreur
    if isinstance(evaluation_result, dict) and evaluation_result.get('success') is False:
        return jsonify(evaluation_result), 400
        
    return jsonify(format_api_response(
        evaluation_result,
        success=True,
        message="Évaluation du texte effectuée avec succès"
    ))

@language_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint de vérification d'état du service d'évaluation linguistique"""
    status = {
        "status": "healthy",
        "service": "language_evaluation",
        "version": "1.0.0",
        "textblob_available": language_service.textblob_available
    }
    
    return jsonify(format_api_response(
        status,
        success=True,
        message="Service d'évaluation linguistique opérationnel"
    ))

from flask import Blueprint, request, jsonify
from services.language_service import LanguageService
import os
from werkzeug.utils import secure_filename
import tempfile
from flask_jwt_extended import jwt_required, get_jwt_identity

language_bp = Blueprint('language', __name__)
language_service = LanguageService()

@language_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_language():
    """
    Endpoint pour analyser les compétences linguistiques
    Prend en entrée un fichier audio ou une transcription
    """
    current_user = get_jwt_identity()
    
    # Vérifier les données requises
    if not request.files and not request.form.get('transcript'):
        return jsonify({
            'success': False,
            'message': 'Un fichier audio ou une transcription est requis'
        }), 400
        
    language = request.form.get('language', 'fr')
    transcript = request.form.get('transcript')
    
    # Si un fichier audio est fourni
    audio_file = None
    if 'audio_file' in request.files:
        file = request.files['audio_file']
        if file.filename != '':
            # Créer un fichier temporaire pour stocker l'audio
            temp_dir = tempfile.gettempdir()
            filename = secure_filename(file.filename)
            filepath = os.path.join(temp_dir, filename)
            file.save(filepath)
            audio_file = filepath
    
    try:
        # Appeler le service d'analyse linguistique
        analysis_result = language_service.evaluate_language(
            audio_file=audio_file,
            transcript=transcript,
            language=language
        )
        
        # Nettoyer le fichier temporaire
        if audio_file and os.path.exists(audio_file):
            os.remove(audio_file)
            
        # Vérifier si l'analyse a échoué
        if 'error' in analysis_result:
            return jsonify({
                'success': False,
                'message': analysis_result['error']
            }), 400
            
        return jsonify({
            'success': True,
            'data': analysis_result
        }), 200
        
    except Exception as e:
        # Nettoyer le fichier temporaire en cas d'erreur
        if audio_file and os.path.exists(audio_file):
            os.remove(audio_file)
            
        return jsonify({
            'success': False,
            'message': f"Erreur lors de l'analyse: {str(e)}"
        }), 500

@language_bp.route('/transcribe', methods=['POST'])
@jwt_required()
def transcribe_audio():
    """
    Endpoint pour transcrire un fichier audio
    """
    current_user = get_jwt_identity()
    
    # Vérifier si un fichier audio est fourni
    if 'audio_file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'Un fichier audio est requis'
        }), 400
        
    file = request.files['audio_file']
    if file.filename == '':
        return jsonify({
            'success': False,
            'message': 'Aucun fichier sélectionné'
        }), 400
        
    language = request.form.get('language', 'fr')
    
    # Créer un fichier temporaire pour stocker l'audio
    temp_dir = tempfile.gettempdir()
    filename = secure_filename(file.filename)
    filepath = os.path.join(temp_dir, filename)
    file.save(filepath)
    
    try:
        # Appeler le service de transcription
        transcript = language_service.transcribe_audio(
            audio_file=filepath,
            language=language
        )
        
        # Nettoyer le fichier temporaire
        if os.exists(filepath):
            os.remove(filepath)
            
        if not transcript:
            return jsonify({
                'success': False,
                'message': 'Impossible de transcrire le fichier audio'
            }), 400
            
        return jsonify({
            'success': True,
            'data': {
                'transcript': transcript
            }
        }), 200
        
    except Exception as e:
        # Nettoyer le fichier temporaire en cas d'erreur
        if os.exists(filepath):
            os.remove(filepath)
            
        return jsonify({
            'success': False,
            'message': f"Erreur lors de la transcription: {str(e)}"
        }), 500

@language_bp.route('/analyze-text', methods=['POST'])
@jwt_required()
def analyze_text():
    """
    Endpoint pour analyser un texte sans transcription audio
    """
    current_user = get_jwt_identity()
    
    # Vérifier les données requises
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({
            'success': False,
            'message': 'Le texte à analyser est requis'
        }), 400
        
    text = data.get('text')
    language = data.get('language', 'fr')
    
    try:
        # Analyser les compétences linguistiques du texte
        analysis_result = language_service.analyze_language_skills(
            text=text,
            language=language
        )
        
        # Déterminer le niveau CECR
        cefr_level = language_service.determine_cefr_level(analysis_result)
        
        # Calculer le score global
        global_score = language_service.calculate_global_score(analysis_result)
        
        # Obtenir un feedback détaillé
        detailed_feedback = language_service.get_ai_feedback(
            text=text,
            language=language,
            analysis_result=analysis_result
        )
        
        return jsonify({
            'success': True,
            'data': {
                'level': cefr_level,
                'score': global_score,
                'analysis': analysis_result,
                'feedback': detailed_feedback
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Erreur lors de l'analyse: {str(e)}"
        }), 500