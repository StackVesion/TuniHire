"""
Service de reconnaissance faciale.
Ce module permet de comparer des images de visage pour la vérification de profil.
"""
import os
import logging
import traceback
import base64
import io
from PIL import Image
import numpy as np
import requests

from services.image_preprocessing import ImagePreprocessor

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    """
    Service de reconnaissance faciale qui utilise la bibliothèque face_recognition
    pour comparer des visages et vérifier l'identité des utilisateurs.
    """

    def __init__(self):
        """Initialise le service de reconnaissance faciale."""
        self.face_recognition_available = False
        
        try:
            import face_recognition
            self.face_recognition = face_recognition
            self.face_recognition_available = True
            logger.info("Service de reconnaissance faciale initialisé avec succès")
        except ImportError as e:
            logger.error(f"Erreur d'importation de face_recognition: {str(e)}")
            logger.error(traceback.format_exc())

    def verify_face(self, profile_image, verification_image):
        """
        Compare une image de profil avec une image de vérification pour confirmer l'identité.
        
        Args:
            profile_image: Image de profil originale (fichier, URL, ou base64)
            verification_image: Image capturée pour vérification (fichier, URL, ou base64)
            
        Returns:
            dict: Résultats de la vérification avec score de similarité
        """
        if not self.face_recognition_available:
            return {
                "success": False,
                "error": "Le module de reconnaissance faciale n'est pas disponible",
                "message": "Échec de la vérification faciale: service indisponible",
                "is_match": False,
                "score": 0.0
            }
        
        try:
            # Log des informations sur les images à comparer
            if isinstance(profile_image, str):
                if profile_image.startswith('http'):
                    logger.info(f"Image de profil: URL - {profile_image[:50]}...")
                elif profile_image.startswith('data:image'):
                    logger.info("Image de profil: Format Base64")
                else:
                    logger.info(f"Image de profil: Potentiellement un fichier - {profile_image[:30]}...")
            else:
                logger.info(f"Image de profil: Type non-string - {type(profile_image)}")
            
            if isinstance(verification_image, str):
                if verification_image.startswith('http'):
                    logger.info(f"Image de vérification: URL - {verification_image[:50]}...")
                elif verification_image.startswith('data:image'):
                    logger.info("Image de vérification: Format Base64")
                else:
                    logger.info(f"Image de vérification: Potentiellement un fichier - {verification_image[:30]}...")
            else:
                logger.info(f"Image de vérification: Type non-string - {type(verification_image)}")
            
            # Charger les images et détecter les visages
            logger.info("Traitement de l'image de profil...")
            profile_face_encoding = self._get_face_encoding(profile_image)
            
            logger.info("Traitement de l'image de vérification...")
            verification_face_encoding = self._get_face_encoding(verification_image)
            
            # Vérifier si des visages ont été détectés
            if profile_face_encoding is None:
                logger.error("Échec de la détection de visage dans l'image de profil")
                return {
                    "success": False,
                    "error": "Aucun visage détecté dans l'image de profil",
                    "details": "Assurez-vous que l'image de profil contient clairement un visage et que l'éclairage est adéquat",
                    "is_match": False,
                    "score": 0.0
                }
            
            if verification_face_encoding is None:
                logger.error("Échec de la détection de visage dans l'image de vérification")
                return {
                    "success": False,
                    "error": "Aucun visage détecté dans l'image de vérification",
                    "details": "Assurez-vous de bien cadrer votre visage et que l'éclairage est adéquat",
                    "is_match": False,
                    "score": 0.0
                }
            
            # Calculer la distance entre les encodages
            face_distance = self.face_recognition.face_distance([profile_face_encoding], verification_face_encoding)[0]
            # Convertir la distance en score de similarité (inversement proportionnel)
            similarity_score = round((1.0 - float(face_distance)) * 100, 2)
            
            logger.info(f"Score de similarité: {similarity_score}%")
            
            # Déterminer s'il y a correspondance (seuil de 50% de similarité)
            is_match = similarity_score >= 50
            
            result = {
                "success": True,
                "is_match": is_match,
                "score": similarity_score,
                "message": "Vérification réussie" if is_match else "Les visages ne correspondent pas"
            }
            
            logger.info(f"Résultat de vérification: {'Réussi' if is_match else 'Échoué'} (score: {similarity_score}%)")
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification faciale: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "message": "Erreur lors de la comparaison des visages",
                "is_match": False,
                "score": 0.0
            }

    def _get_face_encoding(self, image_source):
        """
        Obtient l'encodage facial à partir d'une source d'image.
        
        Args:
            image_source: Peut être un chemin de fichier, une URL ou une chaîne base64
            
        Returns:
            numpy.ndarray: Encodage du visage, ou None si aucun visage n'est détecté
        """
        try:
            # Détecter le type de source d'image
            image_array = None
            source_type = "unknown"
            
            if isinstance(image_source, str):
                if image_source.startswith('http'):
                    # Image depuis URL
                    source_type = "url"
                    logger.info(f"Traitement d'une image depuis URL: {image_source[:50]}...")
                    response = requests.get(image_source, timeout=10)
                    response.raise_for_status()  # Raise exception for 4XX/5XX errors
                    image = Image.open(io.BytesIO(response.content))
                    # Convert to RGB if image is in RGBA mode (has transparency)
                    if image.mode == 'RGBA':
                        logger.info("Conversion d'une image RGBA en RGB")
                        image = image.convert('RGB')
                    image_array = np.array(image)
                elif image_source.startswith('data:image'):
                    # Image en base64
                    source_type = "base64"
                    logger.info("Traitement d'une image en base64")
                    try:
                        header, encoded = image_source.split(",", 1)
                        image_data = base64.b64decode(encoded)
                        image = Image.open(io.BytesIO(image_data))
                        # Convert to RGB if image is in RGBA mode
                        if image.mode == 'RGBA':
                            logger.info("Conversion d'une image RGBA en RGB")
                            image = image.convert('RGB')
                        image_array = np.array(image)
                    except ValueError as e:
                        logger.error(f"Erreur lors du décodage de l'image base64: {str(e)}")
                        # Try to recover if the image doesn't have a proper header
                        if "," not in image_source and image_source.strip():
                            try:
                                logger.info("Tentative de récupération d'une image base64 sans en-tête")
                                image_data = base64.b64decode(image_source.strip())
                                image = Image.open(io.BytesIO(image_data))
                                image_array = np.array(image)
                            except Exception as e2:
                                logger.error(f"La tentative de récupération a échoué: {str(e2)}")
                elif os.path.isfile(image_source):
                    # Chemin de fichier local
                    source_type = "fichier local"
                    logger.info(f"Traitement d'une image depuis un fichier local: {image_source}")
                    image_array = self.face_recognition.load_image_file(image_source)
                else:
                    logger.warning(f"Format de source non reconnu. Début de la chaîne: {image_source[:30]}...")
            elif hasattr(image_source, 'read'):
                # Objet file-like
                source_type = "objet file"
                logger.info("Traitement d'un objet file-like")
                image = Image.open(image_source)
                # Convert to RGB if image is in RGBA mode
                if image.mode == 'RGBA':
                    logger.info("Conversion d'une image RGBA en RGB")
                    image = image.convert('RGB')
                image_array = np.array(image)
                
            if image_array is None:
                logger.error(f"Format d'image non pris en charge: {type(image_source)}, source_type: {source_type}")
                return None
            
            # Log image information and diagnostics
            logger.info(f"Image chargée avec succès. Dimensions: {image_array.shape}")
            
            # Get detailed diagnostics
            diagnostics = ImagePreprocessor.get_image_diagnostics(image_array)
            logger.info(f"Diagnostics d'image: {diagnostics}")
            
            # Log warnings for potential issues
            if diagnostics.get('brightness_issue'):
                logger.warning(f"Problème potentiel: {diagnostics.get('brightness_issue')}")
            
            # Redimensionner l'image si elle est trop grande
            image_array = ImagePreprocessor.resize_image_if_needed(image_array, max_size=1500)
                
            # Try multiple face detection models for better results
            # First try the default model (faster but less accurate)
            logger.info("Recherche de visages avec le modèle standard...")
            face_locations = self.face_recognition.face_locations(image_array)
            
            # If no face is found, try with preprocessing
            if not face_locations:
                logger.info("Aucun visage trouvé, application du prétraitement d'image...")
                enhanced_image = ImagePreprocessor.enhance_for_face_detection(image_array)
                face_locations = self.face_recognition.face_locations(enhanced_image)
                
                # If still no face is found, try with CNN model if available
                if not face_locations and hasattr(self.face_recognition, 'face_locations'):
                    try:
                        logger.info("Aucun visage trouvé avec le prétraitement, essai avec le modèle CNN...")
                        face_locations = self.face_recognition.face_locations(enhanced_image, model="cnn")
                    except Exception as e:
                        logger.warning(f"Impossible d'utiliser le modèle CNN: {str(e)}")
                
                # If a face is found with preprocessing, use the enhanced image for encoding
                if face_locations:
                    logger.info("Visage détecté après prétraitement!")
                    image_array = enhanced_image
            
            if not face_locations:
                logger.warning(f"Aucun visage détecté dans l'image, type: {source_type}")
                
                # Get detailed diagnostics to help troubleshoot
                if 'diagnostics' in locals():
                    logger.info(f"Informations de diagnostic pour l'image sans visage détecté: {diagnostics}")
                    
                    # Specific advice based on diagnostics
                    if diagnostics.get('brightness_issue') == "Image might be too dark":
                        logger.warning("L'image semble trop sombre, ce qui peut affecter la détection de visage")
                    elif diagnostics.get('brightness_issue') == "Image might be too bright":
                        logger.warning("L'image semble trop claire/surexposée, ce qui peut affecter la détection de visage")
                    
                    if diagnostics.get('dimensions'):
                        dims = diagnostics.get('dimensions', '').split('x')
                        if len(dims) == 2:
                            width = int(dims[0].strip())
                            if width < 200:
                                logger.warning("La résolution de l'image est très basse, ce qui peut affecter la détection de visage")
                
                return None
                
            logger.info(f"{len(face_locations)} visage(s) détecté(s) dans l'image")
                
            # Utiliser le premier visage détecté
            face_encodings = self.face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                logger.warning("Impossible d'extraire les encodages du visage")
                return None
                
            logger.info("Encodage du visage extrait avec succès")
            return face_encodings[0]
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de l'encodage facial: {str(e)}")
            logger.error(traceback.format_exc())
            return None
