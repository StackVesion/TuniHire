"""
Script de test pour la vérification faciale.

Ce script permet de tester les fonctionnalités de reconnaissance faciale
en comparant deux images pour vérifier si elles contiennent le même visage.
"""

import os
import sys
import logging
import argparse
from PIL import Image
import requests
import io
import base64

# Configurer le logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ajouter le répertoire parent au chemin de recherche pour importer les modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.face_recognition_service import FaceRecognitionService
from services.image_preprocessing import ImagePreprocessor

def test_face_verification(profile_image_path, verification_image_path):
    """
    Teste la vérification faciale entre deux images locales.
    
    Args:
        profile_image_path: Chemin vers l'image de profil
        verification_image_path: Chemin vers l'image de vérification
    
    Returns:
        dict: Résultats de la vérification
    """
    logger.info(f"Test de vérification faciale entre {profile_image_path} et {verification_image_path}")
    
    # Vérifier l'existence des fichiers
    if not os.path.isfile(profile_image_path):
        logger.error(f"L'image de profil n'existe pas: {profile_image_path}")
        return {"success": False, "error": "L'image de profil n'existe pas"}
    
    if not os.path.isfile(verification_image_path):
        logger.error(f"L'image de vérification n'existe pas: {verification_image_path}")
        return {"success": False, "error": "L'image de vérification n'existe pas"}
    
    # Vérifier les types de fichiers
    profile_ext = os.path.splitext(profile_image_path)[1].lower()
    verify_ext = os.path.splitext(verification_image_path)[1].lower()
    
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
    if profile_ext not in allowed_extensions:
        logger.warning(f"L'extension de l'image de profil n'est pas supportée: {profile_ext}")
    
    if verify_ext not in allowed_extensions:
        logger.warning(f"L'extension de l'image de vérification n'est pas supportée: {verify_ext}")
        
    # Initialiser le service de reconnaissance faciale
    try:
        face_service = FaceRecognitionService()
        if not face_service.face_recognition_available:
            logger.error("La bibliothèque face_recognition n'est pas disponible")
            return {"success": False, "error": "Service de reconnaissance faciale non disponible"}
        
        # Effectuer la vérification
        logger.info("Lancement de la vérification faciale...")
        result = face_service.verify_face(profile_image_path, verification_image_path)
        
        # Afficher les résultats
        if result["success"]:
            logger.info(f"Vérification réussie: {result['is_match']}")
            logger.info(f"Score de similarité: {result['score']}%")
        else:
            logger.error(f"Échec de la vérification: {result['error']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors du test de vérification: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e)}

def test_api_endpoint(profile_image_path, verification_image_path, api_url=None):
    """
    Teste l'endpoint API de reconnaissance faciale.
    
    Args:
        profile_image_path: Chemin vers l'image de profil
        verification_image_path: Chemin vers l'image de vérification
        api_url: URL de l'API (par défaut http://localhost:5001/api/face/verify)
    
    Returns:
        dict: Réponse de l'API
    """
    if api_url is None:
        api_url = "http://localhost:5001/api/face/verify"
        
    logger.info(f"Test de l'API à {api_url}")
    
    try:
        # Convertir les images en base64
        with open(profile_image_path, "rb") as f:
            profile_data = base64.b64encode(f.read()).decode('utf-8')
            
        with open(verification_image_path, "rb") as f:
            verification_data = base64.b64encode(f.read()).decode('utf-8')
            
        # Créer le payload
        payload = {
            "profile_image": f"data:image/jpeg;base64,{profile_data}",
            "verification_image": f"data:image/jpeg;base64,{verification_data}"
        }
        
        # Envoyer la requête
        logger.info("Envoi de la requête à l'API...")
        response = requests.post(api_url, json=payload)
        response.raise_for_status()
        
        # Traiter la réponse
        result = response.json()
        logger.info(f"Réponse API reçue: {result}")
        
        return result
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur lors de la requête API: {str(e)}")
        return {"success": False, "error": str(e)}

def main():
    """Point d'entrée principal pour le script de test."""
    parser = argparse.ArgumentParser(description='Test de vérification faciale')
    parser.add_argument('profile_image', help='Chemin vers l\'image de profil')
    parser.add_argument('verification_image', help='Chemin vers l\'image de vérification')
    parser.add_argument('--api', action='store_true', help='Tester l\'API au lieu du service direct')
    parser.add_argument('--api-url', help='URL de l\'API (utilisé uniquement avec --api)')
    
    args = parser.parse_args()
    
    if args.api:
        # Test via l'API
        result = test_api_endpoint(args.profile_image, args.verification_image, args.api_url)
    else:
        # Test direct du service
        result = test_face_verification(args.profile_image, args.verification_image)
    
    # Afficher un résumé des résultats
    if result.get("success"):
        if result.get("is_match"):
            print(f"✅ Les visages correspondent avec un score de {result.get('score', 'N/A')}%")
        else:
            print(f"❌ Les visages ne correspondent pas (score: {result.get('score', 'N/A')}%)")
    else:
        print(f"❌ Échec de la vérification: {result.get('error', 'Erreur inconnue')}")
    
    return 0 if result.get("success") else 1

if __name__ == "__main__":
    sys.exit(main())
