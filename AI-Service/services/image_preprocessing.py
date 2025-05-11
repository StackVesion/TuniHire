"""
Service de prétraitement d'image pour améliorer la détection de visage.
Ce module contient des fonctions pour améliorer la qualité des images avant la détection de visage.
"""
import logging
import numpy as np
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
from PIL import Image, ImageEnhance, ImageOps

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """
    Classe pour prétraiter les images avant la détection de visage.
    """
    
    @staticmethod
    def normalize_image(image_array):
        """
        Normalise une image pour améliorer la détection de visage.
        
        Args:
            image_array: Tableau numpy représentant l'image
            
        Returns:
            numpy.ndarray: Image normalisée
        """
        try:
            # Convertir en image PIL
            pil_image = Image.fromarray(image_array)
            
            # Améliorer le contraste
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(1.2)
            
            # Améliorer la luminosité si nécessaire
            brightness = ImageEnhance.Brightness(pil_image)
            pil_image = brightness.enhance(1.1)
            
            # Reconvertir en tableau numpy
            return np.array(pil_image)
        except Exception as e:
            logger.warning(f"Erreur lors de la normalisation de l'image: {str(e)}")
            return image_array
    
    @staticmethod
    def enhance_for_face_detection(image_array):
        """
        Applique une série de prétraitements pour améliorer la détection de visage.
        
        Args:
            image_array: Tableau numpy représentant l'image
            
        Returns:
            numpy.ndarray: Image améliorée pour la détection de visage
        """
        # Normaliser l'image (amélioration du contraste et luminosité)
        normalized = ImagePreprocessor.normalize_image(image_array)
        
        if CV2_AVAILABLE:
            try:
                # Convertir en RGB si nécessaire
                if len(normalized.shape) > 2 and normalized.shape[2] == 4:
                    normalized = cv2.cvtColor(normalized, cv2.COLOR_RGBA2RGB)
                
                # Convertir en niveaux de gris
                gray = cv2.cvtColor(normalized, cv2.COLOR_RGB2GRAY)
                
                # Égalisation d'histogramme pour améliorer le contraste
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                gray = clahe.apply(gray)
                
                # Appliquer un filtre bilateral pour réduire le bruit tout en préservant les bords
                bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
                
                # Reconvertir en RGB
                enhanced = cv2.cvtColor(bilateral, cv2.COLOR_GRAY2RGB)
                
                logger.info("Prétraitement avancé de l'image effectué avec succès")
                return enhanced
            except Exception as e:
                logger.warning(f"Erreur lors du prétraitement avancé: {str(e)}, utilisation de l'image normalisée")
                return normalized
        else:
            logger.warning("OpenCV (cv2) n'est pas disponible, utilisation du prétraitement de base uniquement")
            
        return normalized
    
    @staticmethod
    def resize_image_if_needed(image_array, max_size=1200):
        """
        Redimensionne l'image si elle dépasse une certaine taille.
        
        Args:
            image_array: Tableau numpy représentant l'image
            max_size: Taille maximale (hauteur ou largeur) en pixels
            
        Returns:
            numpy.ndarray: Image redimensionnée si nécessaire
        """
        try:
            height, width = image_array.shape[:2]
            
            # Vérifier si redimensionnement nécessaire
            if height <= max_size and width <= max_size:
                return image_array
            
            # Calculer le ratio de redimensionnement
            ratio = min(max_size / width, max_size / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            # Redimensionner avec PIL
            pil_image = Image.fromarray(image_array)
            resized = pil_image.resize((new_width, new_height), Image.LANCZOS)
            
            logger.info(f"Image redimensionnée de {width}x{height} à {new_width}x{new_height}")
            return np.array(resized)
        except Exception as e:
            logger.warning(f"Erreur lors du redimensionnement: {str(e)}")
            return image_array
            
    @staticmethod
    def get_image_diagnostics(image_array):
        """
        Fournit des informations de diagnostic sur une image.
        
        Args:
            image_array: Tableau numpy représentant l'image
            
        Returns:
            dict: Informations de diagnostic sur l'image
        """
        try:
            height, width = image_array.shape[:2]
            channels = 1 if len(image_array.shape) == 2 else image_array.shape[2]
            
            # Calculer les statistiques de base
            mean_brightness = image_array.mean() if channels == 1 else image_array[:,:,0].mean()
            
            # Type de l'image
            dtype = str(image_array.dtype)
            
            # Déterminer le format de couleur
            color_format = "Unknown"
            if channels == 1:
                color_format = "Grayscale"
            elif channels == 3:
                color_format = "RGB"
            elif channels == 4:
                color_format = "RGBA (with transparency)"
            
            # Vérifier si l'image est probablement trop sombre ou trop claire
            brightness_issue = None
            if mean_brightness < 50:  # Valeurs pour une image en 8 bits
                brightness_issue = "Image might be too dark"
            elif mean_brightness > 200:
                brightness_issue = "Image might be too bright"
                
            return {
                "dimensions": f"{width} x {height} pixels",
                "channels": channels,
                "color_format": color_format,
                "data_type": dtype,
                "mean_brightness": mean_brightness,
                "brightness_issue": brightness_issue,
                "size_mb": image_array.nbytes / (1024 * 1024),
                "aspect_ratio": round(width / height, 2) if height > 0 else 0
            }
        except Exception as e:
            logger.error(f"Erreur lors du diagnostic d'image: {str(e)}")
            return {"error": str(e)}
