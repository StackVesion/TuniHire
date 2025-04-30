import re
from collections import Counter
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import tensorflow as tf

class PortfolioAnalyzer:
    """Utility class for analyzing and comparing portfolios with ML capabilities"""
    
    # Model path for persistence
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'models')
    
    def __init__(self):
        """Initialize with ML models"""
        # Create models directory if it doesn't exist
        if not os.path.exists(self.MODEL_PATH):
            os.makedirs(self.MODEL_PATH)
            
        # Initialize models
        self.skill_vectorizer = self._load_or_create_vectorizer()
        self.success_predictor = self._load_or_create_predictor()
        self.recommendation_history = []
    
    def _load_or_create_vectorizer(self):
        """Load existing vectorizer or create a new one"""
        vectorizer_path = os.path.join(self.MODEL_PATH, 'skill_vectorizer.joblib')
        if os.path.exists(vectorizer_path):
            try:
                return joblib.load(vectorizer_path)
            except:
                pass
        
        # Create a new vectorizer if loading fails
        return TfidfVectorizer(stop_words='english', max_features=1000)
    
    def _load_or_create_predictor(self):
        """Load existing success predictor or create a new one"""
        predictor_path = os.path.join(self.MODEL_PATH, 'success_predictor.joblib')
        if os.path.exists(predictor_path):
            try:
                return joblib.load(predictor_path)
            except:
                pass
        
        # Create a new predictor if loading fails
        return RandomForestClassifier(n_estimators=100, random_state=42)
    
    def save_models(self):
        """Save models to disk"""
        vectorizer_path = os.path.join(self.MODEL_PATH, 'skill_vectorizer.joblib')
        predictor_path = os.path.join(self.MODEL_PATH, 'success_predictor.joblib')
        
        joblib.dump(self.skill_vectorizer, vectorizer_path)
        joblib.dump(self.success_predictor, predictor_path)
    
    def train_on_application_results(self, applications, portfolios, job_postings):
        """
        Train model based on successful and unsuccessful job applications
        
        Parameters:
        - applications: List of job applications with status information
        - portfolios: List of user portfolios
        - job_postings: List of job posting data
        """
        # Prepare training data
        X = []  # Features
        y = []  # Target (success/failure)
        
        for app in applications:
            # Find portfolio for this application
            portfolio = next((p for p in portfolios if str(p.get('userId')) == str(app.get('userId'))), None)
            # Find job posting
            job = next((j for j in job_postings if str(j.get('_id')) == str(app.get('jobId'))), None)
            
            if portfolio and job:
                # Extract features
                skill_match = self.calculate_skill_match_percentage(
                    portfolio.get('skills', []),
                    job.get('requirements', [])
                )
                
                exp_score = self.calculate_experience_score(
                    portfolio.get('experience', []),
                    job
                )
                
                edu_score = self.calculate_education_score(
                    portfolio.get('education', []),
                    job
                )
                
                # Create feature vector
                X.append([skill_match, exp_score, edu_score])
                
                # Set target (1 for successful, 0 for unsuccessful)
                is_successful = app.get('status') == 'Accepted'
                y.append(1 if is_successful else 0)
        
        # Train model if we have data
        if X and y and len(X) == len(y) and len(X) > 5:
            X = np.array(X)
            y = np.array(y)
            self.success_predictor.fit(X, y)
            self.save_models()
            return True
        
        return False
    
    def record_recommendation(self, user_id, job_id, recommendation_result, application_result=None):
        """
        Record recommendation for future learning
        
        Parameters:
        - user_id: ID of the user
        - job_id: ID of the job
        - recommendation_result: The recommendation provided
        - application_result: The actual result if available (for training)
        """
        self.recommendation_history.append({
            'user_id': user_id,
            'job_id': job_id,
            'recommendation': recommendation_result,
            'application_result': application_result,
            'timestamp': datetime.now()
        })
        
        # If we have accumulated enough history, retrain the model
        if len(self.recommendation_history) >= 10:
            # Logic to retrain based on history would go here
            pass
    
    def predict_application_success(self, portfolio, job_data):
        """
        Predict likelihood of success for a job application
        
        Parameters:
        - portfolio: User portfolio data
        - job_data: Job posting data
        
        Returns probability of successful application (0-100)
        """
        # Calculate features
        skill_match = self.calculate_skill_match_percentage(
            portfolio.get('skills', []),
            job_data.get('requirements', [])
        )
        
        exp_score = self.calculate_experience_score(
            portfolio.get('experience', []),
            job_data
        )
        
        edu_score = self.calculate_education_score(
            portfolio.get('education', []),
            job_data
        )
        
        # Create feature vector
        X = np.array([[skill_match, exp_score, edu_score]])
        
        # Try to predict probability
        try:
            proba = self.success_predictor.predict_proba(X)[0][1] * 100
            return round(proba, 2)
        except:
            # Fall back to weighted average if prediction fails
            return round(skill_match * 0.5 + exp_score * 0.3 + edu_score * 0.2, 2)
    
    def generate_job_embedding(self, job_data):
        """Generate vector embedding for a job posting"""
        text = " ".join([
            job_data.get('title', ''),
            job_data.get('description', ''),
            " ".join(job_data.get('requirements', []))
        ])
        
        return self.skill_vectorizer.transform([text])
    
    def generate_portfolio_embedding(self, portfolio):
        """Generate vector embedding for a user portfolio"""
        # Concatenate all relevant text from the portfolio
        text_parts = []
        
        # Add skills
        if portfolio.get('skills'):
            text_parts.append(" ".join(portfolio.get('skills', [])))
        
        # Add experience details
        for exp in portfolio.get('experience', []):
            if exp.get('position'):
                text_parts.append(exp.get('position', ''))
            if exp.get('description'):
                text_parts.append(exp.get('description', ''))
        
        # Add project details
        for proj in portfolio.get('projects', []):
            if proj.get('title'):
                text_parts.append(proj.get('title', ''))
            if proj.get('description'):
                text_parts.append(proj.get('description', ''))
            if proj.get('technologies'):
                text_parts.append(" ".join(proj.get('technologies', [])))
        
        # Add education details
        for edu in portfolio.get('education', []):
            if edu.get('degree'):
                text_parts.append(edu.get('degree', ''))
            if edu.get('fieldOfStudy'):
                text_parts.append(edu.get('fieldOfStudy', ''))
        
        combined_text = " ".join(text_parts)
        return self.skill_vectorizer.transform([combined_text])
    
    def find_best_matching_jobs(self, portfolio, all_jobs, limit=5):
        """
        Find the best matching jobs for a user's portfolio using ML
        
        Parameters:
        - portfolio: User portfolio
        - all_jobs: List of all available jobs
        - limit: Maximum number of jobs to return
        
        Returns list of jobs with match scores
        """
        if not all_jobs:
            return []
        
        # Generate portfolio embedding
        try:
            portfolio_embedding = self.generate_portfolio_embedding(portfolio)
            
            # Calculate similarity scores for all jobs
            job_scores = []
            for job in all_jobs:
                job_embedding = self.generate_job_embedding(job)
                similarity = cosine_similarity(portfolio_embedding, job_embedding)[0][0]
                
                # Predict success probability
                success_prob = self.predict_application_success(portfolio, job)
                
                # Combined score (70% similarity, 30% success probability)
                combined_score = similarity * 70 + success_prob * 0.3
                
                job_scores.append((job, combined_score))
            
            # Sort by score (descending)
            job_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top matches
            return [(job, round(score * 100, 2)) for job, score in job_scores[:limit]]
        except Exception as e:
            print(f"Error finding matching jobs: {str(e)}")
            # Fallback to simple skill matching if ML fails
            return self._fallback_job_matching(portfolio, all_jobs, limit)
    
    def _fallback_job_matching(self, portfolio, all_jobs, limit=5):
        """Simple fallback matching when ML approach fails"""
        user_skills = portfolio.get('skills', [])
        
        job_matches = []
        for job in all_jobs:
            match_percentage = self.calculate_skill_match_percentage(
                user_skills,
                job.get('requirements', [])
            )
            job_matches.append((job, match_percentage))
        
        # Sort by match percentage (descending)
        job_matches.sort(key=lambda x: x[1], reverse=True)
        
        # Return top matches
        return job_matches[:limit]
    
    def generate_detailed_report(self, user_data, job_data, portfolio, ranking_data, strengths, weaknesses, recommended_jobs):
        """
        Generate a detailed textual report of the recommendation
        
        Parameters:
        - user_data: User information
        - job_data: Job posting information
        - portfolio: User portfolio
        - ranking_data: Ranking information (score, rank, etc.)
        - strengths: List of strengths
        - weaknesses: List of weaknesses
        - recommended_jobs: List of recommended job matches
        
        Returns formatted report text
        """
        report = []
        
        # Introduction
        name = f"{user_data.get('firstName', '')} {user_data.get('lastName', '')}"
        report.append(f"## Applicant Analysis Report for {name}")
        report.append(f"**Job Position:** {job_data.get('title', 'Unspecified Position')}")
        
        # Add company name if available
        if job_data.get('companyName'):
            report.append(f"**Company:** {job_data.get('companyName')}")
        
        report.append("\n### Candidate Summary")
        report.append(f"Based on our analysis, you have a **{ranking_data.get('score', 0)}%** match with this position. ")
        report.append(f"This places you at rank **#{ranking_data.get('rank', 0)}** out of {ranking_data.get('total_applicants', 0)} applicants.")
        
        if ranking_data.get('percentile', 0) > 80:
            report.append("You are in the **top tier** of applicants for this position.")
        elif ranking_data.get('percentile', 0) > 50:
            report.append("You are performing **above average** compared to other applicants.")
        else:
            report.append("There is **room for improvement** in your application compared to other candidates.")
        
        # ATS Analysis
        report.append("\n### ATS System Analysis")
        report.append("Automated Tracking Systems (ATS) typically filter candidates based on keyword matching and qualification analysis.")
        report.append(f"Your application has a **{ranking_data.get('score', 0)}%** probability of passing initial ATS screening.")
        
        # Strengths Section
        report.append("\n### Key Strengths")
        if strengths:
            for strength in strengths[:5]:  # Top 5 strengths
                report.append(f"- **{strength}**")
            if len(strengths) > 5:
                report.append(f"- Plus {len(strengths) - 5} additional matching qualifications")
        else:
            report.append("No specific strengths were identified that directly match the job requirements.")
        
        # Weaknesses Section
        report.append("\n### Areas for Improvement")
        if weaknesses:
            for weakness in weaknesses[:5]:  # Top 5 weaknesses
                report.append(f"- **{weakness}**")
            if len(weaknesses) > 5:
                report.append(f"- Plus {len(weaknesses) - 5} additional skills that could strengthen your application")
        else:
            report.append("No specific improvement areas were identified.")
        
        # Recommendations
        report.append("\n### Better Job Matches")
        report.append("Based on your skills and experience, the following positions might be a better fit:")
        if recommended_jobs:
            for i, (job, score) in enumerate(recommended_jobs, 1):
                report.append(f"{i}. **{job.get('title', 'Position')}** - {score}% match")
                if job.get('companyName'):
                    report.append(f"   Company: {job.get('companyName')}")
        else:
            report.append("No better matching positions were found at this time.")
        
        # Improvement Tips
        report.append("\n### Improvement Suggestions")
        report.append("To improve your chances with similar positions, consider:")
        
        if weaknesses:
            report.append("1. **Skill Development:** Focus on acquiring these key skills:")
            for weakness in weaknesses[:3]:
                report.append(f"   - {weakness}")
        
        report.append("2. **Resume Optimization:** Ensure your resume highlights relevant experience and uses industry keywords")
        report.append("3. **Portfolio Enhancement:** Add projects that demonstrate your capabilities in the required areas")
        
        # Join all sections
        return "\n".join(report)
    
    @staticmethod
    def extract_skills_from_text(text):
        """
        Extract skills from any text content by removing common words
        and focusing on potential technical skills
        """
        if not text:
            return []
            
        # Convert text to lowercase and split into words
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Common words to remove (stop words)
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by'}
        
        # Extract potential skills by filtering out stop words and short words
        potential_skills = [word for word in words if word not in stop_words and len(word) > 2]
        
        return potential_skills
        
    @staticmethod
    def calculate_skill_match_percentage(user_skills, required_skills):
        """Calculate the percentage of required skills matched by user skills"""
        if not required_skills:
            return 100
            
        user_skills_lower = [s.lower() for s in user_skills if s]
        required_skills_lower = [s.lower() for s in required_skills if s]
        
        # Count matching skills
        matches = sum(1 for skill in required_skills_lower if any(us in skill or skill in us for us in user_skills_lower))
        
        # Calculate match percentage
        match_percentage = (matches / len(required_skills_lower)) * 100
        return round(match_percentage, 2)
    
    @staticmethod
    def calculate_experience_score(experiences, requirements):
        """Calculate an experience score based on job requirements and user experience"""
        if not experiences:
            return 0
            
        # Extract years of experience
        total_years = 0
        for exp in experiences:
            start_date = exp.get('startDate')
            end_date = exp.get('endDate')
            
            # If currently working, use current date
            if exp.get('currentlyWorking'):
                from datetime import datetime
                end_date = datetime.now()
                
            if start_date and end_date:
                # Calculate years
                delta = end_date - start_date
                years = delta.days / 365.25  # Account for leap years
                total_years += years
        
        # Base score on total years of experience
        experience_score = min(total_years * 10, 100)  # Cap at 100
        return round(experience_score, 2)
    
    @staticmethod
    def extract_keywords_from_job(job_data):
        """Extract important keywords from job posting"""
        keywords = set()
        
        # Add job title words
        if job_data.get('title'):
            keywords.update(PortfolioAnalyzer.extract_skills_from_text(job_data['title']))
        
        # Add requirements
        if job_data.get('requirements'):
            for req in job_data['requirements']:
                keywords.update(PortfolioAnalyzer.extract_skills_from_text(req))
        
        # Add from description
        if job_data.get('description'):
            keywords.update(PortfolioAnalyzer.extract_skills_from_text(job_data['description']))
        
        return list(keywords)
    
    @staticmethod
    def calculate_education_score(education, job_requirements):
        """Calculate education relevance score"""
        if not education:
            return 0
            
        # Default base score for having any education
        score = 30
        
        # Check for relevant fields
        keywords = []
        if job_requirements and job_requirements.get('requirements'):
            keywords = PortfolioAnalyzer.extract_skills_from_text(' '.join(job_requirements['requirements']))
        
        relevant_degrees = 0
        for edu in education:
            degree = edu.get('degree', '').lower()
            field = edu.get('fieldOfStudy', '').lower()
            
            # Check if any job keywords appear in the degree or field of study
            if any(kw in degree or kw in field for kw in keywords):
                relevant_degrees += 1
        
        # Add points for relevant degrees
        score += min(relevant_degrees * 20, 50)
        
        return min(score, 100)  # Cap at 100
    
    @staticmethod
    def compare_portfolios(user_portfolio, other_portfolios, job_data):
        """
        Compare a user's portfolio with other applicants
        Returns ranking and comparative metrics
        """
        scores = []
        
        # Calculate user's score
        user_score = PortfolioAnalyzer.calculate_portfolio_score(user_portfolio, job_data)
        
        # Calculate scores for all other portfolios
        for portfolio in other_portfolios:
            score = PortfolioAnalyzer.calculate_portfolio_score(portfolio, job_data)
            scores.append(score)
        
        # Sort scores in descending order
        scores.sort(reverse=True)
        
        # Find user's rank
        if scores:
            user_rank = scores.index(user_score) + 1 if user_score in scores else len(scores) + 1
            percentile = ((len(scores) - user_rank + 1) / len(scores)) * 100 if scores else 100
        else:
            user_rank = 1
            percentile = 100
        
        return {
            'score': user_score,
            'rank': user_rank,
            'total_applicants': len(scores) + 1,  # Include the user
            'percentile': round(percentile, 2)
        }
    
    @staticmethod
    def calculate_portfolio_score(portfolio, job_data):
        """Calculate an overall score for a portfolio based on job requirements"""
        # Extract skills
        user_skills = portfolio.get('skills', [])
        
        # Add skills from projects
        for project in portfolio.get('projects', []):
            if project.get('technologies'):
                user_skills.extend(project.get('technologies', []))
        
        # Add skills from certificates
        for cert in portfolio.get('certificates', []):
            if cert.get('skills'):
                user_skills.extend(cert.get('skills', []))
        
        # Get job requirements
        job_skills = job_data.get('requirements', [])
        
        # Calculate skill match score (50% of total)
        skill_score = PortfolioAnalyzer.calculate_skill_match_percentage(user_skills, job_skills) * 0.5
        
        # Calculate experience score (30% of total)
        exp_score = PortfolioAnalyzer.calculate_experience_score(portfolio.get('experience', []), job_data) * 0.3
        
        # Calculate education score (20% of total)
        edu_score = PortfolioAnalyzer.calculate_education_score(portfolio.get('education', []), job_data) * 0.2
        
        # Combined score
        total_score = skill_score + exp_score + edu_score
        
        return round(total_score, 2)
    
    @staticmethod
    def identify_strengths_weaknesses(portfolio, job_data):
        """Identify strengths and weaknesses in a user's portfolio compared to job requirements"""
        # Extract user skills from various parts of the portfolio
        user_skills = set(s.lower() for s in portfolio.get('skills', []) if s)
        
        # Add skills from projects
        for project in portfolio.get('projects', []):
            if project.get('technologies'):
                user_skills.update(t.lower() for t in project.get('technologies', []) if t)
        
        # Add skills from certificates
        for cert in portfolio.get('certificates', []):
            if cert.get('skills'):
                user_skills.update(s.lower() for s in cert.get('skills', []) if s)
        
        # Extract required skills from job
        required_skills = set(s.lower() for s in job_data.get('requirements', []) if s)
        # Add keywords from job title and description
        required_skills.update(PortfolioAnalyzer.extract_skills_from_text(job_data.get('title', '')))
        required_skills.update(PortfolioAnalyzer.extract_skills_from_text(job_data.get('description', '')))
        
        # Find matching skills (strengths)
        strengths = []
        for user_skill in user_skills:
            for req_skill in required_skills:
                if user_skill in req_skill or req_skill in user_skill:
                    strengths.append(req_skill)
                    break
        
        # Find missing skills (weaknesses)
        weaknesses = list(required_skills - set(strengths))
        
        return {
            'strengths': strengths,
            'weaknesses': weaknesses
        }
