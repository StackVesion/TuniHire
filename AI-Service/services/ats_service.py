import re
import os
import json
import nltk
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("Warning: spaCy is not available. NLP features will be limited.")
import openai
try:
    from langdetect import detect
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("Warning: langdetect is not available. Language detection features will be limited.")
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import logging

# Télécharger les ressources NLTK nécessaires
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Charger les variables d'environnement
load_dotenv()

class ATSService:
    def __init__(self):
        # Charger la clé API OpenAI
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # Initialiser spaCy pour l'extraction d'entités
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("fr_core_news_md")
            except OSError:
                try:
                    spacy.cli.download("fr_core_news_md")
                    self.nlp = spacy.load("fr_core_news_md")
                except Exception as e:
                    print(f"Impossible de charger le modèle spaCy: {str(e)}")
            
        # Charger la liste des compétences techniques (peut être étendue)
        self.technical_skills = [
            'javascript', 'python', 'java', 'c++', 'react', 'angular', 'vue',
            'node.js', 'express', 'django', 'spring', 'sql', 'mongodb', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'git', 'jenkins', 'ci/cd',
            'html', 'css', 'typescript', 'php', 'laravel', 'symfony',
            'rest api', 'graphql', 'microservices', 'agile', 'scrum',
            'machine learning', 'deep learning', 'nlp', 'data analysis',
            'excel', 'powerpoint', 'word', 'office', 'crm', 'erp', 'sap'
        ]
        
        # Langues supportées et leur score basé sur le niveau (A1-C2)
        self.language_levels = {
            "A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6
        }
        
    def analyze_resume(self, resume_text, job_description, required_languages=None):
        """
        Analyse un CV par rapport à une description de poste
        
        Args:
            resume_text (str): Le texte du CV
            job_description (str): Description du poste
            required_languages (list): Liste des langues requises avec leur niveau
                                    [{"language": "en", "level": "B2"}]
        
        Returns:
            dict: Résultat de l'analyse avec score et détails
        """
        # Extraction de base
        resume_skills = self.extract_skills(resume_text)
        job_skills = self.extract_skills(job_description)
        experience_years = self.extract_experience_years(resume_text)
        education_info = self.extract_education(resume_text)
        languages = self.extract_languages(resume_text)
        
        # Identifier les compétences manquantes
        missing_skills = [skill for skill in job_skills if skill not in resume_skills]
        
        # Calcul de similarité entre le CV et la description du poste
        similarity_score = self.calculate_similarity(resume_text, job_description)
        
        # Analyser la maîtrise des langues requises
        language_match_score = 100
        language_analysis = {}
        
        if required_languages:
            language_match_score, language_analysis = self.analyze_language_requirements(
                languages, required_languages
            )
            
        # Utiliser l'API OpenAI pour une analyse sémantique approfondie
        ai_analysis = self.get_ai_analysis(resume_text, job_description)
        
        # Calcul du score final (pondéré)
        skills_score = (len(resume_skills) - len(missing_skills)) / max(len(job_skills), 1) * 100
        experience_score = min(experience_years / 5 * 100, 100)  # Max pour 5 ans d'expérience
        
        final_score = int(0.4 * skills_score + 0.3 * similarity_score + 0.2 * experience_score + 0.1 * language_match_score)
        # S'assurer que le score final ne dépasse pas 100
        final_score = min(final_score, 100)
        
        # Déterminer la recommandation
        recommendation = self.get_recommendation(final_score)
        
        return {
            "matchScore": final_score,
            "skillsMatched": resume_skills,
            "missingSkills": missing_skills,
            "experienceYears": experience_years,
            "education": education_info,
            "languageAnalysis": language_analysis,
            "semanticMatchScore": int(similarity_score),
            "strengths": ai_analysis.get("strengths", []),
            "weaknesses": ai_analysis.get("weaknesses", []),
            "analysis": ai_analysis.get("analysis", ""),
            "recommendation": recommendation
        }
    
    def extract_skills(self, text):
        """Extrait les compétences d'un texte"""
        text = text.lower()
        found_skills = []
        
        # Rechercher des compétences techniques connues
        for skill in self.technical_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', text):
                found_skills.append(skill)
                
        # Utiliser spaCy pour extraire des entités supplémentaires si disponible
        if SPACY_AVAILABLE and self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                if ent.label_ in ["ORG", "PRODUCT"] and ent.text.lower() not in found_skills:
                    found_skills.append(ent.text.lower())
                
        return found_skills
        
    def extract_experience_years(self, resume_text):
        """Extraire les années d'expérience du CV"""
        # Patterns pour détecter les années d'expérience
        patterns = [
            r'(\d+)\s*(?:ans?|années?)\s*d\'expérience',
            r'expérience\s*(?:de|:)?\s*(\d+)\s*ans?',
            r'(\d+)\s*(?:years?|yrs?)\s*(?:of)?\s*experience',
        ]
        
        max_years = 0
        for pattern in patterns:
            matches = re.findall(pattern, resume_text, re.IGNORECASE)
            if matches:
                for match in matches:
                    years = int(match)
                    max_years = max(max_years, years)
                    
        return max_years
        
    def extract_education(self, resume_text):
        """Extraire les informations d'éducation du CV"""
        # Liste de diplômes courants
        degrees = [
            "bac", "licence", "master", "doctorat", "phd", "mba", 
            "ingénieur", "dut", "bts", "bachelor", "diplôme", "certificat"
        ]
        
        education_info = []
        
        # Utiliser spaCy pour détecter les informations d'éducation si disponible
        if SPACY_AVAILABLE and self.nlp:
            doc = self.nlp(resume_text)
            
            # Recherche de phrases contenant des mots-clés liés à l'éducation
            sentences = [sent.text for sent in doc.sents]
            for sentence in sentences:
                sentence_lower = sentence.lower()
                for degree in degrees:
                    if degree in sentence_lower:
                        education_info.append(sentence.strip())
                        break
        else:
            # Méthode alternative si spaCy n'est pas disponible
            sentences = resume_text.split('.')
            for sentence in sentences:
                sentence_lower = sentence.lower()
                for degree in degrees:
                    if degree in sentence_lower:
                        education_info.append(sentence.strip())
                        break
                    
        return education_info
    
    def extract_languages(self, resume_text):
        """Extraire les langues et leur niveau du CV"""
        languages = {}
        
        # Liste de langues courantes
        common_languages = {
            "français": "fr", "anglais": "en", "espagnol": "es", 
            "allemand": "de", "italien": "it", "arabe": "ar",
            "french": "fr", "english": "en", "spanish": "es", 
            "german": "de", "italian": "it", "arabic": "ar"
        }
        
        # Patterns pour détecter les niveaux
        level_patterns = {
            "débutant|notions|basique|a1|a2": "A1-A2",
            "intermédiaire|courant|moyen|b1|b2": "B1-B2",
            "bilingue|natif|avancé|maternelle|c1|c2": "C1-C2"
        }
        
        # Chercher les mentions de langues dans le texte
        for language, code in common_languages.items():
            # Pattern pour trouver une langue suivie potentiellement d'un niveau
            pattern = fr'(?:{language})(?:[:\s,]+([^\.;,]+))?'
            matches = re.finditer(pattern, resume_text.lower())
            
            for match in matches:
                # La langue est trouvée
                if code not in languages:
                    languages[code] = "A2"  # Niveau par défaut
                    
                    # Vérifions s'il y a un niveau mentionné
                    if match.group(1):
                        level_context = match.group(1).lower()
                        for level_pattern, level in level_patterns.items():
                            if re.search(level_pattern, level_context):
                                languages[code] = level
                                break
        
        return languages
        
    def calculate_similarity(self, text1, text2):
        """
        Calcule la similarité entre deux textes en utilisant TF-IDF et similarité cosinus
        
        Args:
            text1 (str): Premier texte (CV)
            text2 (str): Deuxième texte (description du poste)
            
        Returns:
            float: Score de similarité en pourcentage
        """
        try:
            # Enlever la ponctuation et convertir en minuscules
            text1 = re.sub(r'[^\w\s]', ' ', text1.lower())
            text2 = re.sub(r'[^\w\s]', ' ', text2.lower())
            
            # Tokenize les textes
            tokens1 = word_tokenize(text1)
            tokens2 = word_tokenize(text2)
            
            # Supprimer les stopwords
            stop_words = set(stopwords.words('english')).union(set(stopwords.words('french')))
            tokens1 = [token for token in tokens1 if token not in stop_words]
            tokens2 = [token for token in tokens2 if token not in stop_words]
            
            # Calculer TF-IDF
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([' '.join(tokens1), ' '.join(tokens2)])
            
            # Calculer la similarité cosinus
            cos_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # S'assurer que le score ne dépasse pas 100%
            similarity_score = min(cos_similarity * 100, 100)
            
            return similarity_score
        except Exception as e:
            logging.error(f"Erreur lors du calcul de la similarité: {e}")
            return 0
        
    def analyze_language_requirements(self, candidate_languages, required_languages):
        """
        Analyse les compétences linguistiques par rapport aux exigences
        
        Args:
            candidate_languages (dict): Langues du candidat {code: niveau}
            required_languages (list): Langues requises [{"language": code, "level": niveau}]
            
        Returns:
            tuple: (score, détails d'analyse)
        """
        if not required_languages:
            return 100, {}
            
        language_analysis = {}
        total_score = 0
        
        for req in required_languages:
            lang_code = req.get("language")
            required_level = req.get("level", "B1")
            
            if lang_code in candidate_languages:
                candidate_level = candidate_languages[lang_code]
                
                # Convertir les plages de niveaux (comme "B1-B2") en niveau minimal
                candidate_min_level = candidate_level.split("-")[0]
                
                # Obtenir les scores numériques
                required_score = self.language_levels.get(required_level, 3)  # B1 par défaut
                candidate_score = self.language_levels.get(candidate_min_level, 2)  # A2 par défaut
                
                # Calculer le pourcentage de correspondance
                match_percentage = min(100, (candidate_score / required_score) * 100)
                
                language_analysis[lang_code] = {
                    "required": required_level,
                    "candidate": candidate_level,
                    "match": int(match_percentage)
                }
                
                total_score += match_percentage
            else:
                # La langue requise n'est pas présente
                language_analysis[lang_code] = {
                    "required": required_level,
                    "candidate": "Non spécifié",
                    "match": 0
                }
                
        # Moyenne des scores
        average_score = total_score / len(required_languages) if required_languages else 100
        
        return int(average_score), language_analysis
        
    def get_ai_analysis(self, resume_text, job_description):
        """Obtenir une analyse approfondie via l'API OpenAI"""
        try:
            # Construire le prompt pour l'API
            prompt = f"""
            Analyze the following resume against the job description for compatibility:
            
            RESUME:
            {resume_text[:1500]}
            
            JOB DESCRIPTION:
            {job_description[:1000]}
            
            Please provide a detailed analysis including:
            1. Top 3-5 strengths of the candidate for this role
            2. 2-3 potential weaknesses or gaps
            3. A detailed analysis (2-3 sentences)
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an AI recruitment assistant specialized in analyzing CVs against job descriptions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.5
            )
            
            analysis_text = response.choices[0].message["content"]
            
            # Extraction des parties de l'analyse
            strengths = []
            weaknesses = []
            detailed_analysis = ""
            
            # Regex pour extraire les forces et faiblesses
            strengths_pattern = r"(?:Strengths|Forces|strengths).*?(?:\n\d+\.|\n-|\*\s)(.*?)(?=Weaknesses|Potential Weaknesses|Gaps|detailed analysis|$)"
            weaknesses_pattern = r"(?:Weaknesses|Potential Weaknesses|Gaps|faiblesses).*?(?:\n\d+\.|\n-|\*\s)(.*?)(?=Detailed Analysis|Analysis|strengths|$)"
            analysis_pattern = r"(?:Detailed Analysis|Analysis|Analyse).*?(?:\n|:)(.*?)$"
            
            # Extraction des forces
            strengths_match = re.search(strengths_pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if strengths_match:
                strengths_text = strengths_match.group(1)
                # Extraire les items numérotés ou à puces
                items = re.findall(r'(?:\d+\.|\-|\*)\s*(.*?)(?=\n\d+\.|\n\-|\n\*|$)', strengths_text, re.DOTALL)
                if items:
                    strengths = [item.strip() for item in items if item.strip()]
                else:
                    # Fallback: juste prendre le texte complet
                    strengths = [s.strip() for s in strengths_text.split('\n') if s.strip()]
            
            # Extraction des faiblesses
            weaknesses_match = re.search(weaknesses_pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if weaknesses_match:
                weaknesses_text = weaknesses_match.group(1)
                items = re.findall(r'(?:\d+\.|\-|\*)\s*(.*?)(?=\n\d+\.|\n\-|\n\*|$)', weaknesses_text, re.DOTALL)
                if items:
                    weaknesses = [item.strip() for item in items if item.strip()]
                else:
                    weaknesses = [w.strip() for w in weaknesses_text.split('\n') if w.strip()]
            
            # Extraction de l'analyse détaillée
            analysis_match = re.search(analysis_pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if analysis_match:
                detailed_analysis = analysis_match.group(1).strip()
            
            # Si on n'a pas réussi à extraire l'analyse, utiliser tout le texte
            if not detailed_analysis and not strengths and not weaknesses:
                detailed_analysis = analysis_text.strip()
            
            return {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "analysis": detailed_analysis
            }
            
        except Exception as e:
            print(f"Error during AI analysis: {str(e)}")
            # Retourner une analyse par défaut en cas d'erreur
            return {
                "strengths": ["Compétences techniques mentionnées", "Expérience dans le secteur"],
                "weaknesses": ["Informations limitées pour une analyse complète"],
                "analysis": "Une analyse plus détaillée n'a pas pu être réalisée. Veuillez vérifier manuellement."
            }
    
    def get_recommendation(self, score):
        """Détermine la recommandation en fonction du score"""
        if score >= 80:
            return "Candidat très compatible - Entretien fortement recommandé"
        elif score >= 65:
            return "Bon candidat - Entretien recommandé"
        elif score >= 50:
            return "Candidat potentiel - À considérer si peu de candidats"
        else:
            return "Candidat peu compatible - Non recommandé pour ce poste" 