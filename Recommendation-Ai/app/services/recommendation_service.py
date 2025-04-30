from bson.objectid import ObjectId
from app.utils.portfolio_analyzer import PortfolioAnalyzer

class RecommendationService:
    """Service for generating AI-powered job application recommendations"""
    
    def __init__(self, db):
        """Initialize with database connection"""
        self.db = db
        self.analyzer = PortfolioAnalyzer()  # Initialize the ML-capable analyzer
    
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
        - text_report: Detailed text report for human-readable insights
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
            
            # Add company name to job data if available
            if 'companyId' in job_data:
                company = self.db.companies.find_one({'_id': job_data['companyId']})
                if company and 'name' in company:
                    job_data['companyName'] = company['name']
            
            # Get all applications for this job
            applications = list(self.db.applications.find({'jobId': job_object_id}))
            
            # Get all applicant portfolios (excluding current user)
            other_applicant_ids = [app['userId'] for app in applications if str(app['userId']) != str(user_object_id)]
            other_portfolios = list(self.db.portfolios.find({'userId': {'$in': other_applicant_ids}}))
            
            # Train the model with historical application data if available
            all_applications = list(self.db.applications.find({'status': {'$in': ['Accepted', 'Rejected']}}))
            all_portfolios = list(self.db.portfolios.find())
            all_jobs = list(self.db.jobposts.find())
            
            # Try to train the model with existing data
            self.analyzer.train_on_application_results(all_applications, all_portfolios, all_jobs)
            
            # Predict success rate using ML model
            pass_percentage = self.analyzer.predict_application_success(user_portfolio, job_data)
            
            # Compare with other portfolios to get ranking
            ranking = self.analyzer.compare_portfolios(user_portfolio, other_portfolios, job_data)
            
            # Identify strengths and weaknesses
            strengths_weaknesses = self.analyzer.identify_strengths_weaknesses(user_portfolio, job_data)
            
            # Find all available jobs (excluding current one)
            available_jobs = list(self.db.jobposts.find({'_id': {'$ne': job_object_id}}))
            
            # Find better matching jobs for this user
            recommended_jobs = self.analyzer.find_best_matching_jobs(user_portfolio, available_jobs)
            
            # Generate detailed text report
            text_report = self.analyzer.generate_detailed_report(
                user_data, 
                job_data, 
                user_portfolio, 
                ranking, 
                strengths_weaknesses['strengths'], 
                strengths_weaknesses['weaknesses'],
                recommended_jobs
            )
            
            # Record this recommendation for future learning
            self.analyzer.record_recommendation(user_id, job_id, {
                'pass_percentage': pass_percentage,
                'ranking': ranking,
                'portfolio_score': ranking['score']
            })
            
            # Format the job recommendations for API response
            formatted_jobs = []
            for job, score in recommended_jobs:
                job_info = {
                    'id': str(job['_id']),
                    'title': job.get('title', ''),
                    'match_percentage': score
                }
                
                # Add company info if available
                if 'companyId' in job:
                    job_info['company_id'] = str(job['companyId'])
                    company = self.db.companies.find_one({'_id': job['companyId']})
                    if company and 'name' in company:
                        job_info['company_name'] = company['name']
                
                formatted_jobs.append(job_info)
            
            # Save the trained model
            self.analyzer.save_models()
            
            # Prepare final recommendation result
            recommendation = {
                'pass_percentage': round(pass_percentage, 2),
                'ranking': ranking,
                'strengths': strengths_weaknesses['strengths'],
                'weaknesses': strengths_weaknesses['weaknesses'],
                'similar_jobs': formatted_jobs,
                'text_report': text_report
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
