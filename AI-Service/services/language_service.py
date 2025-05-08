import os
import json
import re
import nltk
import spacy
import openai
import numpy as np
from dotenv import load_dotenv
from textblob import TextBlob
from nltk.tokenize import sent_tokenize
from google.cloud import speech_v1p1beta1 as speech
from pydub import AudioSegment
import tempfile

# Charger les variables d'environnement
load_dotenv()

# Télécharger les ressources NLTK nécessaires
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class LanguageService:
    def __init__(self):
        # Charger la clé API OpenAI
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # Initialiser le client Google Speech si la clé est disponible
        google_credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.speech_client = None
        if google_credentials_path and os.path.exists(google_credentials_path):
            try:
                self.speech_client = speech.SpeechClient()
            except Exception as e:
                print(f"Impossible d'initialiser le client Google Speech: {str(e)}")
                
        # Niveau de compétence CECR
        self.cefr_levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
        
        # Charger les modèles linguistiques si nécessaire
        self.language_models = {
            "en": self._load_spacy_model("en_core_web_md"),
            "fr": self._load_spacy_model("fr_core_news_md"),
            # Ajouter d'autres langues au besoin
        }
        
    def _load_spacy_model(self, model_name):
        """Charger un modèle spaCy"""
        try:
            return spacy.load(model_name)
        except OSError:
            try:
                spacy.cli.download(model_name)
                return spacy.load(model_name)
            except Exception as e:
                print(f"Erreur lors du chargement du modèle {model_name}: {str(e)}")
                return None
        
    def evaluate_language(self, audio_file=None, transcript=None, language="fr"):
        """
        Évalue les compétences linguistiques à partir d'un fichier audio ou d'une transcription
        
        Args:
            audio_file (file): Fichier audio de l'entretien
            transcript (str): Transcription de l'entretien si déjà disponible
            language (str): Code de la langue (fr, en, etc.)
            
        Returns:
            dict: Résultat de l'évaluation avec score CECR et détails
        """
        # Vérifier si nous avons une entrée valide
        if not audio_file and not transcript:
            return {
                "error": "Un fichier audio ou une transcription est requis pour l'évaluation."
            }
            
        # Si nous n'avons pas de transcription mais un fichier audio
        if not transcript and audio_file:
            transcript = self.transcribe_audio(audio_file, language)
            
        if not transcript:
            return {
                "error": "Impossible de transcrire l'audio ou de traiter la transcription."
            }
            
        # Analyser la transcription
        analysis_result = self.analyze_language_skills(transcript, language)
        
        # Déterminer le niveau CECR global
        cefr_level = self.determine_cefr_level(analysis_result)
        
        # Calculer un score global sur 100
        global_score = self.calculate_global_score(analysis_result)
        
        # Générer une analyse détaillée avec OpenAI
        detailed_feedback = self.get_ai_feedback(transcript, language, analysis_result)
        
        return {
            "level": cefr_level,
            "score": global_score,
            "analysis": analysis_result,
            "feedback": detailed_feedback
        }
        
    def transcribe_audio(self, audio_file, language="fr"):
        """
        Transcrit un fichier audio en texte
        
        Args:
            audio_file (file): Fichier audio à transcrire
            language (str): Code de la langue
            
        Returns:
            str: Texte transcrit
        """
        # Vérifier si Google Speech est disponible
        if self.speech_client:
            try:
                # Convertir le fichier au format attendu si nécessaire
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                    temp_path = temp_file.name
                
                try:
                    # Lire le fichier audio et le convertir en WAV mono 16kHz
                    audio = AudioSegment.from_file(audio_file)
                    audio = audio.set_channels(1)
                    audio = audio.set_frame_rate(16000)
                    audio.export(temp_path, format="wav")
                    
                    # Lire le fichier temporaire
                    with open(temp_path, 'rb') as audio_file:
                        content = audio_file.read()
                        
                    # Configurer la reconnaissance vocale
                    audio_config = speech.RecognitionConfig(
                        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                        sample_rate_hertz=16000,
                        language_code=self._get_google_language_code(language),
                        enable_automatic_punctuation=True,
                        model="latest_long"
                    )
                    
                    audio = speech.RecognitionAudio(content=content)
                    
                    # Effectuer la reconnaissance vocale
                    response = self.speech_client.recognize(config=audio_config, audio=audio)
                    
                    # Extraire la transcription
                    transcript = ""
                    for result in response.results:
                        transcript += result.alternatives[0].transcript + " "
                        
                    return transcript.strip()
                    
                finally:
                    # Supprimer le fichier temporaire
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    
            except Exception as e:
                print(f"Erreur lors de la transcription avec Google Speech: {str(e)}")
                # Fallback sur OpenAI si Google échoue
                
        # Utiliser l'API OpenAI Whisper si Google n'est pas disponible
        try:
            # Convertir le fichier au format attendu si nécessaire
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_path = temp_file.name
            
            try:
                # Lire le fichier audio et le convertir en WAV
                audio = AudioSegment.from_file(audio_file)
                audio.export(temp_path, format="wav")
                
                # Ouvrir le fichier pour l'API OpenAI
                with open(temp_path, "rb") as audio_file:
                    transcript = openai.Audio.transcribe(
                        model="whisper-1",
                        file=audio_file,
                        language=language
                    )
                    
                return transcript.get("text", "")
                
            finally:
                # Supprimer le fichier temporaire
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
        except Exception as e:
            print(f"Erreur lors de la transcription avec OpenAI: {str(e)}")
            return None
            
    def analyze_language_skills(self, text, language="fr"):
        """
        Analyse les compétences linguistiques d'un texte
        
        Args:
            text (str): Texte à analyser
            language (str): Code de la langue
            
        Returns:
            dict: Résultats d'analyse avec différentes métriques
        """
        # Vérifier si nous avons un texte
        if not text or len(text.strip()) < 10:
            return {
                "error": "Texte trop court pour une analyse pertinente."
            }
            
        # Initialiser les résultats
        results = {
            "vocabulary": {
                "diversity": 0,
                "complexity": 0,
                "score": 0
            },
            "grammar": {
                "accuracy": 0,
                "complexity": 0,
                "score": 0
            },
            "fluency": {
                "coherence": 0,
                "cohesion": 0,
                "score": 0
            },
            "pronunciation": {
                "clarity": 0,
                "accent": 0,
                "score": 0
            }
        }
        
        # Tokeniser le texte
        sentences = sent_tokenize(text)
        words = text.split()
        
        # Analyse avec spaCy si le modèle est disponible
        nlp = self.language_models.get(language)
        if nlp:
            doc = nlp(text)
            
            # Diversité du vocabulaire (TTR - Type-Token Ratio)
            unique_words = set(word.lower_ for word in doc if word.is_alpha)
            total_words = len([word for word in doc if word.is_alpha])
            vocabulary_diversity = len(unique_words) / max(1, total_words)
            
            # Complexité du vocabulaire (ratio de mots non-communs)
            common_words_count = sum(1 for word in doc if word.is_alpha and word.is_stop)
            vocabulary_complexity = 1 - (common_words_count / max(1, total_words))
            
            # Complexité grammaticale (longueur moyenne des phrases)
            avg_sentence_length = sum(len([word for word in sent if word.is_alpha]) for sent in doc.sents) / max(1, len(list(doc.sents)))
            grammar_complexity = min(1.0, avg_sentence_length / 20)  # Normaliser (20 mots → 1.0)
            
            # Variété des structures grammaticales (POS tags)
            pos_tags = [token.pos_ for token in doc]
            unique_pos_patterns = set(pos_tags[i:i+3] for i in range(len(pos_tags)-2))
            grammar_variety = min(1.0, len(unique_pos_patterns) / 50)  # Normaliser
            
            # Mettre à jour les résultats
            results["vocabulary"]["diversity"] = round(vocabulary_diversity * 100, 2)
            results["vocabulary"]["complexity"] = round(vocabulary_complexity * 100, 2)
            results["vocabulary"]["score"] = round((vocabulary_diversity * 0.5 + vocabulary_complexity * 0.5) * 100, 2)
            
            results["grammar"]["complexity"] = round(grammar_complexity * 100, 2)
            results["grammar"]["variety"] = round(grammar_variety * 100, 2)
            results["grammar"]["score"] = round((grammar_complexity * 0.5 + grammar_variety * 0.5) * 100, 2)
            
        # Analyse de la fluidité
        avg_words_per_sentence = len(words) / max(1, len(sentences))
        fluency_score = min(1.0, avg_words_per_sentence / 15) * 100  # Normaliser
        
        # Cohérence (utilisation de connecteurs logiques)
        connectors = ["mais", "donc", "ainsi", "cependant", "toutefois", "néanmoins", 
                      "car", "puisque", "parce que", "en effet", "d'ailleurs", "de plus",
                      "but", "so", "thus", "however", "nevertheless", "because", 
                      "since", "furthermore", "moreover", "in addition"]
                      
        connector_count = sum(1 for word in words if any(conn in word.lower() for conn in connectors))
        coherence_score = min(1.0, connector_count / max(1, len(sentences)) * 2) * 100  # Normaliser
        
        results["fluency"]["coherence"] = round(coherence_score, 2)
        results["fluency"]["rhythm"] = round(fluency_score, 2)
        results["fluency"]["score"] = round((coherence_score * 0.5 + fluency_score * 0.5), 2)
        
        # Comme nous n'avons pas d'audio ici, la pronunciation est estimée à partir du texte
        results["pronunciation"]["estimated"] = True
        results["pronunciation"]["score"] = 70  # Score par défaut pour un texte
        
        return results
        
    def determine_cefr_level(self, analysis_result):
        """
        Détermine le niveau CECR basé sur l'analyse linguistique
        
        Args:
            analysis_result (dict): Résultats de l'analyse
            
        Returns:
            str: Niveau CECR estimé (A1-C2)
        """
        # Si erreur dans l'analyse
        if "error" in analysis_result:
            return "Non déterminé"
            
        # Calculer un score global
        vocabulary_score = analysis_result["vocabulary"]["score"]
        grammar_score = analysis_result["grammar"]["score"]
        fluency_score = analysis_result["fluency"]["score"]
        pronunciation_score = analysis_result["pronunciation"]["score"]
        
        # Pondération
        weighted_score = (
            vocabulary_score * 0.3 +
            grammar_score * 0.3 +
            fluency_score * 0.3 +
            pronunciation_score * 0.1
        )
        
        # Déterminer le niveau CECR
        if weighted_score < 30:
            return "A1"
        elif weighted_score < 45:
            return "A2"
        elif weighted_score < 60:
            return "B1"
        elif weighted_score < 75:
            return "B2"
        elif weighted_score < 90:
            return "C1"
        else:
            return "C2"
            
    def calculate_global_score(self, analysis_result):
        """
        Calcule un score global sur 100 basé sur l'analyse
        
        Args:
            analysis_result (dict): Résultats de l'analyse
            
        Returns:
            int: Score global (0-100)
        """
        # Si erreur dans l'analyse
        if "error" in analysis_result:
            return 0
            
        # Calculer le score moyen
        vocabulary_score = analysis_result["vocabulary"]["score"]
        grammar_score = analysis_result["grammar"]["score"]
        fluency_score = analysis_result["fluency"]["score"]
        pronunciation_score = analysis_result["pronunciation"]["score"]
        
        # Pondération
        weighted_score = (
            vocabulary_score * 0.3 +
            grammar_score * 0.3 +
            fluency_score * 0.3 +
            pronunciation_score * 0.1
        )
        
        return int(round(weighted_score))
        
    def get_ai_feedback(self, text, language, analysis_result):
        """
        Obtient une analyse détaillée et des recommandations via OpenAI
        
        Args:
            text (str): Texte à analyser
            language (str): Code de la langue
            analysis_result (dict): Résultats de l'analyse quantitative
            
        Returns:
            dict: Feedback et recommandations
        """
        try:
            # Déterminer le niveau CECR
            cefr_level = self.determine_cefr_level(analysis_result)
            
            # Créer un résumé de l'analyse
            analysis_summary = f"""
            - Niveau CECR estimé: {cefr_level}
            - Score vocabulaire: {analysis_result["vocabulary"]["score"]}/100
            - Score grammaire: {analysis_result["grammar"]["score"]}/100
            - Score fluidité: {analysis_result["fluency"]["score"]}/100
            """
            
            # Construire le prompt pour l'API
            prompt = f"""
            Analysez en profondeur ce texte en {self._get_language_name(language)} (Niveau CECR estimé: {cefr_level}):
            
            TEXTE:
            {text[:1500]}
            
            ANALYSE QUANTITATIVE:
            {analysis_summary}
            
            Fournissez:
            1. 3-4 points forts linguistiques avec des exemples tirés du texte
            2. 2-3 points à améliorer avec des exemples concrets
            3. Des recommandations spécifiques pour progresser vers le niveau supérieur
            4. Une évaluation globale en 3-4 phrases
            
            Répondez en {self._get_language_name(language)} de manière professionnelle, précise et utile.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Vous êtes un professeur de langues expert du CECR avec 20 ans d'expérience."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            feedback_text = response.choices[0].message["content"]
            
            # Extraire les parties du feedback (avec regex)
            strengths = []
            weaknesses = []
            recommendations = []
            overall_assessment = ""
            
            # Regex pour extraire les sections
            strengths_pattern = r"(?:Points? forts?|Strengths?|Forces).*?(?:\n\d+\.|\n-|\*\s)(.*?)(?=Points? (?:à améliorer|faibles)|Weaknesses?|Areas? for improvement|Recommandations?|Évaluation|Assessment|Overall|$)"
            weaknesses_pattern = r"(?:Points? (?:à améliorer|faibles)|Weaknesses?|Areas? for improvement).*?(?:\n\d+\.|\n-|\*\s)(.*?)(?=Recommandations?|Suggestions?|Évaluation|Assessment|Overall|$)"
            recommendations_pattern = r"(?:Recommandations?|Suggestions?).*?(?:\n\d+\.|\n-|\*\s)(.*?)(?=Évaluation|Assessment|Overall|$)"
            assessment_pattern = r"(?:Évaluation|Assessment|Overall|Globale?).*?(?:\n|:)(.*?)$"
            
            # Extraction des forces
            strengths_match = re.search(strengths_pattern, feedback_text, re.DOTALL | re.IGNORECASE)
            if strengths_match:
                strengths_text = strengths_match.group(1)
                items = re.findall(r'(?:\d+\.|\-|\*)\s*(.*?)(?=\n\d+\.|\n\-|\n\*|$)', strengths_text, re.DOTALL)
                if items:
                    strengths = [item.strip() for item in items if item.strip()]
                else:
                    strengths = [s.strip() for s in strengths_text.split('\n') if s.strip()]
            
            # Extraction des faiblesses
            weaknesses_match = re.search(weaknesses_pattern, feedback_text, re.DOTALL | re.IGNORECASE)
            if weaknesses_match:
                weaknesses_text = weaknesses_match.group(1)
                items = re.findall(r'(?:\d+\.|\-|\*)\s*(.*?)(?=\n\d+\.|\n\-|\n\*|$)', weaknesses_text, re.DOTALL)
                if items:
                    weaknesses = [item.strip() for item in items if item.strip()]
                else:
                    weaknesses = [w.strip() for w in weaknesses_text.split('\n') if w.strip()]
            
            # Extraction des recommandations
            recommendations_match = re.search(recommendations_pattern, feedback_text, re.DOTALL | re.IGNORECASE)
            if recommendations_match:
                recommendations_text = recommendations_match.group(1)
                items = re.findall(r'(?:\d+\.|\-|\*)\s*(.*?)(?=\n\d+\.|\n\-|\n\*|$)', recommendations_text, re.DOTALL)
                if items:
                    recommendations = [item.strip() for item in items if item.strip()]
                else:
                    recommendations = [r.strip() for r in recommendations_text.split('\n') if r.strip()]
            
            # Extraction de l'évaluation globale
            assessment_match = re.search(assessment_pattern, feedback_text, re.DOTALL | re.IGNORECASE)
            if assessment_match:
                overall_assessment = assessment_match.group(1).strip()
            
            # Si on n'a pas réussi à extraire l'analyse, utiliser tout le texte
            if not overall_assessment and not strengths and not weaknesses and not recommendations:
                overall_assessment = feedback_text.strip()
            
            return {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommendations": recommendations,
                "overall": overall_assessment
            }
            
        except Exception as e:
            print(f"Error during AI feedback generation: {str(e)}")
            # Retourner un feedback par défaut en cas d'erreur
            return {
                "strengths": ["Utilisation de structures de base correctes"],
                "weaknesses": ["Des points à améliorer dans la construction des phrases complexes"],
                "recommendations": ["Pratiquer régulièrement pour développer une plus grande aisance"],
                "overall": f"L'évaluation détaillée n'a pas pu être générée. Le niveau global estimé est {self.determine_cefr_level(analysis_result)}."
            }
            
    def _get_google_language_code(self, language_code):
        """Convertit un code de langue au format Google Speech"""
        language_mapping = {
            "en": "en-US",
            "fr": "fr-FR",
            "es": "es-ES",
            "de": "de-DE",
            "it": "it-IT",
            "ar": "ar-SA"
        }
        return language_mapping.get(language_code, "en-US")
        
    def _get_language_name(self, language_code):
        """Obtient le nom de la langue à partir du code"""
        language_names = {
            "en": "anglais",
            "fr": "français",
            "es": "espagnol",
            "de": "allemand",
            "it": "italien",
            "ar": "arabe"
        }
        return language_names.get(language_code, "langue indéterminée") 