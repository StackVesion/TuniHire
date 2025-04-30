import re
from collections import Counter

class PortfolioAnalyzer:
    """Utility class for analyzing and comparing portfolios"""
    
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
