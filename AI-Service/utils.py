"""
Module d'utilitaires pour l'API d'IA et ATS
Ce module fournit des fonctions utilitaires pour les différents services d'IA.
"""
import re
import logging
import traceback
import json
from typing import Dict, List, Any, Union, Optional
from datetime import datetime
from functools import wraps
from flask import request, jsonify, Response

# Configuration du logging
logger = logging.getLogger(__name__)

def token_required(f):
    """
    Décorateur pour vérifier le token JWT dans les requêtes.
    Version simplifiée pour le mode de secours.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Vérifier si le token est présent dans l'en-tête
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'message': 'Token manquant',
                'success': False,
                'error': 'MISSING_TOKEN'
            }), 401
        
        # Dans cette version simplifiée, nous ne vérifions pas le token
        # car le service d'authentification principal pourrait être indisponible
        # On accepte simplement tout token non vide
        
        return f(*args, **kwargs)
    
    return decorated

def extract_skills_from_text(text: str) -> List[str]:
    """
    Extrait une liste de compétences potentielles à partir d'un texte.
    Utile pour l'analyse de CV ou de descriptions de poste.
    """
    # Liste de compétences courantes en IT
    common_skills = [
        "javascript", "python", "java", "html", "css", "react", "angular", "vue", 
        "node.js", "express", "django", "spring", "sql", "mongodb", "git",
        "docker", "kubernetes", "aws", "azure", "devops", "ci/cd", "machine learning",
        "tensorflow", "pytorch", "nlp", "data science", "agile", "scrum", "jira",
        "php", "laravel", "symfony", "wordpress", "ruby", "rails", "c++", "c#",
        ".net", "junit", "jest", "mocha", "typescript", "sass", "less", "bootstrap",
        "material-ui", "tailwind", "figma", "sketch", "adobe xd", "photoshop", 
        "illustrator", "analytics", "seo", "marketing", "content", "copywriting",
        "communication", "teamwork", "leadership", "problem solving"
    ]
    
    # Convertir en lowercase pour la recherche insensible à la casse
    text_lower = text.lower()
    
    # Trouver quelles compétences sont mentionnées dans le texte
    skills_found = [skill for skill in common_skills if skill in text_lower]
    
    # Recherche de patterns comme "X years of experience in Y"
    experience_pattern = r"(\d+)[\s-]*(ans|années|an|year|years).*?(experience|expérience).*?(en|in|avec|with)\s+([a-zA-Z0-9#+\s]+)"
    for match in re.finditer(experience_pattern, text_lower):
        potential_skill = match.group(5).strip()
        # Ajouter seulement si c'est une compétence d'au moins 3 caractères
        if len(potential_skill) >= 3 and potential_skill not in skills_found:
            skills_found.append(potential_skill)
    
    return skills_found

def format_api_response(data: Any, success: bool = True, message: str = None) -> Dict:
    """
    Formate une réponse API standard.
    """
    response = {
        "success": success,
        "timestamp": datetime.now().isoformat()
    }
    
    if message:
        response["message"] = message
        
    if success:
        response["data"] = data
    else:
        response["error"] = data
        
    return response

def safe_execute(default_return: Any = None):
    """
    Décorateur pour exécuter des fonctions en toute sécurité et capturer les exceptions.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_msg = f"Error in {func.__name__}: {str(e)}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                
                if default_return is not None:
                    return default_return
                else:
                    return {
                        "success": False, 
                        "error": error_msg,
                        "message": "Une erreur s'est produite lors du traitement de votre demande"
                    }
        return wrapper
    return decorator