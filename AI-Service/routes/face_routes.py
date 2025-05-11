"""
Routes pour les services de reconnaissance faciale.
"""
from flask import Blueprint, request, jsonify
import logging
import traceback
import base64
import json

logger = logging.getLogger(__name__)

# Création du blueprint pour les routes de reconnaissance faciale
face_bp = Blueprint('face', __name__, url_prefix='/face')

# Variable globale pour stocker le service
face_service = None

def init_face_routes(face_recognition_service):
    """
    Initialise les routes avec une instance du service de reconnaissance faciale.
    
    Args:
        face_recognition_service: Instance du service FaceRecognitionService
    """
    global face_service
    face_service = face_recognition_service
    logger.info("Routes de reconnaissance faciale initialisées")

@face_bp.route('/verify', methods=['POST'])
def verify_face():
    """
    Endpoint pour vérifier la correspondance entre deux visages.
    Attend deux images: profile_image et verification_image.
    """
    if not face_service:
        return jsonify({
            "success": False,
            "error": "Service de reconnaissance faciale non initialisé"
        }), 500

    try:
        # Vérifier si les données JSON sont présentes
        if not request.json:
            return jsonify({
                "success": False,
                "error": "Aucune donnée JSON fournie"
            }), 400
            
        # Extraire les images
        data = request.json
        profile_image = data.get('profile_image')
        verification_image = data.get('verification_image')
        
        # Vérifier que les deux images sont présentes
        if not profile_image:
            return jsonify({
                "success": False, 
                "error": "Image de profil manquante"
            }), 400
            
        if not verification_image:
            return jsonify({
                "success": False,
                "error": "Image de vérification manquante"
            }), 400

        # Effectuer la vérification faciale
        result = face_service.verify_face(profile_image, verification_image)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification faciale: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
