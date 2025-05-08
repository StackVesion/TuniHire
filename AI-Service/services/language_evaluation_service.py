"""
Service d'évaluation linguistique de base.
Ce module permet d'analyser la qualité linguistique des textes.
"""
import logging
import traceback

logger = logging.getLogger(__name__)

class LanguageEvaluationService:
    """
    Service d'évaluation linguistique qui utilise TextBlob et d'autres outils
    pour évaluer la qualité du texte.
    """

    def __init__(self):
        """Initialise le service d'évaluation linguistique."""
        self.languages_supported = ['fr', 'en']
        logger.info("Service d'évaluation linguistique initialisé")

        # Essayer d'importer TextBlob si disponible
        try:
            from textblob import TextBlob
            self.textblob_available = True
            self.TextBlob = TextBlob
            logger.info("TextBlob chargé avec succès")
        except ImportError:
            self.textblob_available = False
            logger.warning("TextBlob n'est pas disponible - fonctionnalités limitées")

    def evaluate_text(self, text, target_language='fr'):
        """
        Évalue la qualité linguistique d'un texte.
        
        Args:
            text (str): Le texte à évaluer
            target_language (str): La langue cible pour l'évaluation
            
        Returns:
            dict: Résultats de l'évaluation
        """
        if not text:
            return {
                "success": False,
                "error": "Texte vide",
                "message": "Le texte à évaluer est vide"
            }
            
        # Informations de base sur le texte
        word_count = len(text.split())
        char_count = len(text)
        
        result = {
            "success": True,
            "word_count": word_count,
            "character_count": char_count,
            "metrics": {
                "readability_score": self._calculate_readability(text),
                "language_quality": self._evaluate_language_quality(text, target_language),
            }
        }
        
        # Utiliser TextBlob pour l'analyse de sentiment si disponible
        if self.textblob_available:
            try:
                blob = self.TextBlob(text)
                result["sentiment"] = {
                    "polarity": blob.sentiment.polarity,
                    "subjectivity": blob.sentiment.subjectivity
                }
                
                # Catégorisation du sentiment
                if blob.sentiment.polarity > 0.2:
                    sentiment_category = "positif"
                elif blob.sentiment.polarity < -0.2:
                    sentiment_category = "négatif"
                else:
                    sentiment_category = "neutre"
                
                result["sentiment"]["category"] = sentiment_category
                
            except Exception as e:
                logger.error(f"Erreur lors de l'analyse du sentiment: {str(e)}")
                result["sentiment"] = {
                    "error": "Analyse impossible",
                    "polarity": 0,
                    "subjectivity": 0.5,
                    "category": "neutre"
                }
        else:
            # Valeurs par défaut si TextBlob n'est pas disponible
            result["sentiment"] = {
                "note": "TextBlob non disponible pour l'analyse de sentiment",
                "polarity": 0,
                "subjectivity": 0.5,
                "category": "neutre"
            }
            
        return result

    def _calculate_readability(self, text):
        """
        Calcule un score de lisibilité simple basé sur la longueur des phrases et des mots.
        
        Args:
            text (str): Le texte à évaluer
            
        Returns:
            float: Score de lisibilité entre 0 et 100
        """
        # Algorithme simplifié de lisibilité
        sentences = text.split('.')
        valid_sentences = [s for s in sentences if len(s.strip()) > 0]
        
        if not valid_sentences:
            return 50  # Valeur par défaut
            
        words = text.split()
        words_per_sentence = len(words) / len(valid_sentences)
        
        # Pénalité pour les phrases trop longues
        if words_per_sentence > 25:
            readability = 100 - (words_per_sentence - 25) * 3
        # Bonus pour les phrases de longueur optimale
        elif 12 <= words_per_sentence <= 20:
            readability = 80 + (20 - abs(words_per_sentence - 16)) * 2
        # Pénalité pour les phrases trop courtes
        else:
            readability = 70 - (12 - words_per_sentence) * 2 if words_per_sentence < 12 else 70
            
        # Limiter le score entre 0 et 100
        readability = max(0, min(100, readability))
        
        return round(readability, 1)
        
    def _evaluate_language_quality(self, text, target_language):
        """
        Évalue la qualité linguistique du texte.
        
        Args:
            text (str): Le texte à évaluer
            target_language (str): La langue cible
            
        Returns:
            dict: Évaluation de la qualité linguistique
        """
        # En mode simulation, générer une évaluation fictive
        common_errors = []
        quality_score = 75  # Score par défaut
        
        # Détection simple de quelques erreurs courantes en français
        if target_language == 'fr':
            if " a " in text.lower() and " à " not in text.lower():
                common_errors.append("Confusion possible entre 'a' et 'à'")
                quality_score -= 5
                
            if " ce " in text.lower() and " se " not in text.lower():
                common_errors.append("Confusion possible entre 'ce' et 'se'")
                quality_score -= 5
                
            if " ou " in text.lower() and " où " not in text.lower():
                common_errors.append("Confusion possible entre 'ou' et 'où'")
                quality_score -= 5
                
        # Détection de quelques erreurs en anglais
        elif target_language == 'en':
            if " your " in text.lower() and " you're " not in text.lower():
                common_errors.append("Confusion possible entre 'your' et 'you're'")
                quality_score -= 5
                
            if " its " in text.lower() and " it's " not in text.lower():
                common_errors.append("Confusion possible entre 'its' et 'it's'")
                quality_score -= 5
                
            if " their " in text.lower() and " there " not in text.lower():
                common_errors.append("Confusion possible entre 'their', 'there' et 'they're'")
                quality_score -= 5
                
        # Vérifications générales
        if "..." in text:
            common_errors.append("Utilisation excessive de points de suspension")
            quality_score -= 3
            
        if "!!!" in text:
            common_errors.append("Utilisation excessive de points d'exclamation")
            quality_score -= 3
            
        # Limiter le score entre 0 et 100
        quality_score = max(0, min(100, quality_score))
        
        # Déterminer la catégorie de qualité
        if quality_score >= 90:
            category = "excellent"
        elif quality_score >= 75:
            category = "bon"
        elif quality_score >= 60:
            category = "acceptable"
        elif quality_score >= 40:
            category = "médiocre"
        else:
            category = "faible"
            
        return {
            "score": quality_score,
            "category": category,
            "common_errors": common_errors,
            "improvement_tips": [
                "Relisez votre texte pour détecter les fautes d'orthographe",
                "Vérifiez la cohérence des temps verbaux",
                "Assurez-vous que les accords sont corrects"
            ] if common_errors else []
        }