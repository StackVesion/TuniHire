"""
Routes pour le service ATS (Applicant Tracking System)
Ce module contient les endpoints API pour les fonctionnalités d'analyse de CV.
"""
import os
import logging
from flask import Blueprint, request, jsonify
from services.ats_service import ATSService
import utils
from utils import token_required, format_api_response, safe_execute

# Configuration du logging
logger = logging.getLogger(__name__)

# Création du Blueprint pour les routes ATS
ats_bp = Blueprint('ats', __name__)

# Instanciation du service ATS
ats_service = ATSService()

@ats_bp.route('/analyze', methods=['POST'])
@token_required
@safe_execute()
def analyze_resume():
    """Endpoint pour analyser un CV par rapport à une description de poste"""
    data = request.json
    
    if not data:
        return jsonify(format_api_response(
            "Aucune donnée fournie", success=False
        )), 400
        
    resume_text = data.get('resumeText')
    job_description = data.get('jobDescription')
    
    if not resume_text:
        return jsonify(format_api_response(
            "Le texte du CV est requis", success=False
        )), 400
        
    if not job_description:
        return jsonify(format_api_response(
            "La description du poste est requise", success=False
        )), 400
    
    # Identifiants optionnels
    candidate_id = data.get('candidateId', 'manual')
    job_id = data.get('jobId', 'manual')
    application_id = data.get('applicationId', 'manual')
    
    # Appel au service ATS pour l'analyse
    analysis_result = ats_service.analyze_resume(
        resume_text=resume_text,
        job_description=job_description,
        candidate_id=candidate_id,
        job_id=job_id,
        application_id=application_id
    )
    
    # Si le service renvoie un dictionnaire avec 'success': False, c'est une erreur
    if isinstance(analysis_result, dict) and analysis_result.get('success') is False:
        return jsonify(analysis_result), 400
        
    return jsonify(format_api_response(
        analysis_result,
        success=True,
        message="Analyse du CV effectuée avec succès"
    ))

@ats_bp.route('/applications/<application_id>/analysis', methods=['GET'])
@token_required
@safe_execute()
def get_application_analysis(application_id):
    """Endpoint pour récupérer l'analyse d'une candidature existante"""
    if not application_id:
        return jsonify(format_api_response(
            "ID de candidature manquant", success=False
        )), 400
    
    # Appel au service ATS pour récupérer l'analyse existante
    analysis = ats_service.get_analysis_by_application_id(application_id)
    
    if not analysis:
        # Si aucune analyse n'est trouvée, renvoyer une erreur 404
        return jsonify(format_api_response(
            f"Aucune analyse trouvée pour la candidature {application_id}", 
            success=False
        )), 404
        
    return jsonify(format_api_response(
        analysis,
        success=True,
        message="Analyse de candidature récupérée avec succès"
    ))

@ats_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint de vérification d'état du service ATS"""
    status = {
        "status": "healthy",
        "service": "ats",
        "version": "1.0.0",
        "mode": "simulation" if os.environ.get("ATS_SIMULATION_MODE") == "true" else "normal"
    }
    
    return jsonify(format_api_response(
        status,
        success=True,
        message="Service ATS opérationnel"
    ))