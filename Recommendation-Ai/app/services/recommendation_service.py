from bson.objectid import ObjectId
from app.utils.portfolio_analyzer import PortfolioAnalyzer

class RecommendationService:
    """Service for generating AI-powered job application recommendations"""
    
    # Subscription tiers and their weights for recommendations
    SUBSCRIPTION_TIERS = {
        "Free": 1.0,
        "Golden": 1.1,  # 10% bonus for Golden subscribers
        "Platinum": 1.2,  # 20% bonus for Platinum subscribers
        "Master": 1.3,   # 30% bonus for Master subscribers
    }
    
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
        - subscription_bonus: Applied bonus based on user's subscription tier
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
            
            # Apply subscription tier bonus if available
            subscription_tier = user_data.get('subscription', 'Free')
            subscription_bonus = self.SUBSCRIPTION_TIERS.get(subscription_tier, 1.0)
            
            # Apply subscription bonus to pass percentage (but cap at 100%)
            adjusted_pass_percentage = min(pass_percentage * subscription_bonus, 100)
            
            # Compare with other portfolios to get ranking
            ranking = self.analyzer.compare_portfolios(user_portfolio, other_portfolios, job_data)
            
            # Identify strengths and weaknesses
            strengths_weaknesses = self.analyzer.identify_strengths_weaknesses(user_portfolio, job_data)
            
            # Find all available jobs (excluding current one)
            available_jobs = list(self.db.jobposts.find({'_id': {'$ne': job_object_id}}))
            
            # Find better matching jobs for this user
            # Include subscription tier in the filtering logic
            recommended_jobs = self._find_subscription_appropriate_jobs(
                user_portfolio, 
                available_jobs, 
                subscription_tier
            )
            
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
                'portfolio_score': ranking['score'],
                'subscription_tier': subscription_tier
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
                'pass_percentage': round(adjusted_pass_percentage, 2),
                'base_percentage': round(pass_percentage, 2),
                'subscription_tier': subscription_tier,
                'subscription_bonus': round((subscription_bonus - 1) * 100, 1),  # Convert to percentage bonus
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
    
    def _find_subscription_appropriate_jobs(self, portfolio, all_jobs, subscription_tier):
        """
        Find jobs that match both the user's skills and their subscription tier
        Higher tier subscribers get access to more premium job recommendations
        """
        # Get basic job recommendations from analyzer
        job_matches = self.analyzer.find_best_matching_jobs(portfolio, all_jobs)
        
        # Premium job filtering based on subscription tier
        # For premium subscribers, we prioritize higher quality job matches
        if subscription_tier in ["Golden", "Platinum", "Master"]:
            # Sort by quality and salary range for premium subscribers
            premium_jobs = []
            standard_jobs = []
            
            for job, score in job_matches:
                # Check if job has premium indicators
                is_premium = False
                salary_range = job.get('salaryRange', '')
                
                # Simple heuristic to identify premium jobs (higher salary ranges)
                if salary_range:
                    try:
                        # Handle ranges like "$80K-100K" or "80,000-100,000"
                        salary_text = salary_range.replace('$', '').replace(',', '').lower()
                        if 'k' in salary_text:
                            # Handle K notation (e.g., "80K-100K")
                            max_part = salary_text.split('-')[-1].replace('k', '000')
                            max_salary = float(max_part)
                        else:
                            # Handle full numbers
                            max_part = salary_text.split('-')[-1]
                            max_salary = float(max_part)
                        
                        # Jobs with potentially higher salaries are marked as premium
                        if max_salary > 80000:  # Threshold for premium jobs
                            is_premium = True
                    except (ValueError, IndexError):
                        # If we can't parse the salary, just use other indicators
                        pass
                
                # Other premium indicators in job title or description
                premium_keywords = ['senior', 'lead', 'manager', 'director', 'architect']
                title = job.get('title', '').lower()
                if any(keyword in title for keyword in premium_keywords):
                    is_premium = True
                
                # Filter based on subscription tier and premium status
                if is_premium:
                    premium_jobs.append((job, score))
                else:
                    standard_jobs.append((job, score))
            
            # Platinum and Master subscribers get more premium jobs
            if subscription_tier == "Master":
                # Master gets mostly premium jobs
                premium_ratio = 0.8
            elif subscription_tier == "Platinum":
                # Platinum gets balanced premium/standard jobs
                premium_ratio = 0.6
            else:  # Golden
                # Golden gets some premium jobs
                premium_ratio = 0.4
                
            # Calculate how many premium jobs to include
            max_jobs = min(len(job_matches), 5)  # Cap at 5 jobs
            premium_count = int(max_jobs * premium_ratio)
            standard_count = max_jobs - premium_count
            
            # Combine premium and standard jobs based on calculated ratio
            result = premium_jobs[:premium_count] + standard_jobs[:standard_count]
            result.sort(key=lambda x: x[1], reverse=True)  # Sort by score descending
            return result
                
        # For free tier, just return standard recommendations
        return job_matches[:5]  # Cap at 5 jobs
