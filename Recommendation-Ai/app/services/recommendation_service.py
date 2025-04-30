from bson.objectid import ObjectId
from app.utils.portfolio_analyzer import PortfolioAnalyzer

class RecommendationService:
    """Service for generating AI-powered job application recommendations"""
    
    def __init__(self, db):
        """Initialize with database connection"""
        self.db = db
    
    def generate_recommendation(self, user_id, job_id):
        """
        Generate detailed recommendation for a user applying to a job
        
        Parameters:
        - user_id: The MongoDB ObjectId of the user
        - job_id: The MongoDB ObjectId of the job posting
        
        Returns a dictionary containing:
        - pass_percentage: Likelihood of passing ATS (0-100)
        - ranking: Position compared to other applicants
        - strengths: List of matching skills/qualifications
        - weaknesses: List of missing skills/qualifications
        - similar_jobs: List of similar job postings that match user skills
        """
        try:
            # Convert string IDs to ObjectId
            user_object_id = ObjectId(user_id)
            job_object_id = ObjectId(job_id)
            
            # Get user data
            user_data = self.db.users.find_one({'_id': user_object_id})
            if not user_data:
                raise Exception(f"User with ID {user_id} not found")
            
            # Get user portfolio
            user_portfolio = self.db.portfolios.find_one({'userId': user_object_id})
            if not user_portfolio:
                raise Exception(f"Portfolio for user with ID {user_id} not found")
            
            # Get job posting data
            job_data = self.db.jobposts.find_one({'_id': job_object_id})
            if not job_data:
                raise Exception(f"Job posting with ID {job_id} not found")
            
            # Get all applications for this job
            applications = list(self.db.applications.find({'jobId': job_object_id}))
            
            # Get all applicant portfolios (excluding current user)
            other_applicant_ids = [app['userId'] for app in applications if app['userId'] != user_object_id]
            other_portfolios = list(self.db.portfolios.find({'userId': {'$in': other_applicant_ids}}))
            
            # Calculate skill match percentage
            user_skills = user_portfolio.get('skills', [])
            job_requirements = job_data.get('requirements', [])
            
            skill_match = PortfolioAnalyzer.calculate_skill_match_percentage(user_skills, job_requirements)
            
            # Calculate experience score
            experience_score = PortfolioAnalyzer.calculate_experience_score(
                user_portfolio.get('experience', []), 
                job_data
            )
            
            # Calculate education score
            education_score = PortfolioAnalyzer.calculate_education_score(
                user_portfolio.get('education', []),
                job_data
            )
            
            # Calculate overall ATS pass percentage (weighted average)
            pass_percentage = (
                skill_match * 0.5 +       # Skills are 50% of score
                experience_score * 0.3 +   # Experience is 30% of score
                education_score * 0.2      # Education is 20% of score
            )
            
            # Compare with other portfolios to get ranking
            ranking = PortfolioAnalyzer.compare_portfolios(user_portfolio, other_portfolios, job_data)
            
            # Identify strengths and weaknesses
            strengths_weaknesses = PortfolioAnalyzer.identify_strengths_weaknesses(user_portfolio, job_data)
            
            # Find similar jobs that match user skills
            similar_jobs = self._find_similar_jobs(user_portfolio, job_id)
            
            # Prepare final recommendation result
            recommendation = {
                'pass_percentage': round(pass_percentage, 2),
                'ranking': ranking,
                'strengths': strengths_weaknesses['strengths'],
                'weaknesses': strengths_weaknesses['weaknesses'],
                'similar_jobs': similar_jobs
            }
            
            return recommendation
        
        except Exception as e:
            # Log the error
            print(f"Error generating recommendation: {str(e)}")
            # Re-raise to be handled by the API endpoint
            raise
    
    def _find_similar_jobs(self, user_portfolio, current_job_id, limit=5):
        """Find similar job postings that match user's skills and qualifications"""
        try:
            # Extract user skills
            user_skills = user_portfolio.get('skills', [])
            
            # Build a query to find jobs with matching requirements
            # Using $text search if skill fields are indexed, otherwise using $in
            query = {
                '_id': {'$ne': ObjectId(current_job_id)},  # Exclude current job
                '$or': [
                    {'requirements': {'$in': user_skills}},
                    {'title': {'$regex': '|'.join(user_skills), '$options': 'i'}}
                ]
            }
            
            # Find matching jobs, sort by relevance or recency
            similar_jobs = list(self.db.jobposts.find(query).limit(limit))
            
            # Format job data for response
            formatted_jobs = []
            for job in similar_jobs:
                formatted_jobs.append({
                    'id': str(job['_id']),
                    'title': job.get('title', ''),
                    'company_id': str(job.get('companyId', '')),
                    'match_percentage': PortfolioAnalyzer.calculate_skill_match_percentage(
                        user_skills, 
                        job.get('requirements', [])
                    )
                })
                
                # Try to get company name
                if 'companyId' in job:
                    company = self.db.companies.find_one({'_id': job['companyId']})
                    if company and 'name' in company:
                        formatted_jobs[-1]['company_name'] = company['name']
            
            return formatted_jobs
            
        except Exception as e:
            print(f"Error finding similar jobs: {str(e)}")
            return []
