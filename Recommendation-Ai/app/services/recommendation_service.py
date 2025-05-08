from bson.objectid import ObjectId
from datetime import datetime
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
        Generate a detailed recommendation for a user applying to a specific job
        Includes scores for skills, experience, education, and languages
        
        Args:
            user_id (str): MongoDB ID for the user
            job_id (str): MongoDB ID for the job post
            
        Returns:
            dict: Complete recommendation data
        """
        try:
            # Convert string IDs to ObjectId
            user_id_obj = ObjectId(user_id)
            job_id_obj = ObjectId(job_id)
            
            # Get user data
            user = self.db.users.find_one({"_id": user_id_obj})
            if not user:
                return {"error": "User not found"}
            
            # Get job data
            job = self.db.jobposts.find_one({"_id": job_id_obj})
            if not job:
                return {"error": "Job not found"}
            
            # Get user portfolio
            portfolio = self.db.portfolios.find_one({"userId": user_id_obj})
            if not portfolio:
                portfolio = {}  # Default empty portfolio
            
            # Calculate match percentage
            skills_match = self._calculate_skills_match(portfolio, job)
            experience_match = self._calculate_experience_match(portfolio, job)
            education_match = self._calculate_education_match(portfolio, job)
            language_match = self._calculate_language_match(portfolio, job)
            
            # Apply weighting to each score component
            skills_weight = 0.4
            experience_weight = 0.3
            education_weight = 0.2
            language_weight = 0.1
            
            # Calculate the weighted average score
            global_score = (
                skills_match * skills_weight +
                experience_match * experience_weight +
                education_match * education_weight +
                language_match * language_weight
            )
            
            # Round to nearest integer
            global_score = round(global_score)
            
            # Get subscription tier for bonus
            subscription_tier = user.get('subscription', 'Free')
            subscription_bonus = self._calculate_subscription_bonus(subscription_tier)
            
            # Prepare recommendation result
            recommendation = {
                "match_percentage": global_score,
                "skills_match_percentage": skills_match,
                "experience_match": experience_match,
                "education_match": education_match,
                "language_match": language_match,
                "job_title": job.get("title", ""),
                "job_id": str(job["_id"]),
                "user_id": str(user["_id"]),
                "subscription_tier": subscription_tier,
                "subscription_bonus": subscription_bonus,
                "recommendation_date": datetime.now().isoformat(),
                "strengths": self._identify_strengths(portfolio, job),
                "weaknesses": self._identify_weaknesses(portfolio, job)
            }
            
            # Add company information
            if "companyId" in job:
                company = self.db.companies.find_one({"_id": job["companyId"]})
                if company:
                    recommendation["company_name"] = company.get("name", "")
                    recommendation["company_id"] = str(company["_id"])
            
            return recommendation
            
        except Exception as e:
            print(f"Error generating recommendation: {str(e)}")
            return {"error": str(e)}

    def _calculate_skills_match(self, portfolio, job):
        """Calculate percentage match between user skills and job requirements"""
        if not portfolio or "skills" not in portfolio or not portfolio["skills"]:
            return 15  # Default value if no skills in portfolio
        
        if "requirements" not in job or not job["requirements"]:
            return 15  # Default value if no requirements specified
        
        user_skills = [skill.lower() for skill in portfolio.get("skills", [])]
        job_skills = [req.lower() for req in job.get("requirements", [])]
        
        if not job_skills:
            return 15  # Default value if no skills required
        
        # Calculate matches
        matches = sum(1 for skill in job_skills if any(user_skill in skill for user_skill in user_skills))
        
        # Calculate percentage
        match_percentage = (matches / len(job_skills)) * 100
        
        # Ensure we don't go below the minimum 15%
        return max(15, min(100, round(match_percentage)))

    def _calculate_experience_match(self, portfolio, job):
        """Calculate experience match percentage"""
        # Start with base score of 15%
        experience_score = 15
        
        if not portfolio or "experience" not in portfolio or not portfolio["experience"]:
            return experience_score  # Default value
        
        if "yearsOfExperienceRequired" not in job:
            return experience_score  # Default if no experience required
        
        # Calculate user's total years of experience
        user_experience = sum(exp.get("years", 0) for exp in portfolio.get("experience", []))
        
        # Get required years of experience
        required_exp = job.get("yearsOfExperienceRequired", 0)
        
        if required_exp <= 0:
            return 100  # If no experience required, give full score
        
        # Calculate percentage
        if user_experience >= required_exp:
            experience_score = 100  # Full match
        else:
            # Partial match with minimum 15%
            experience_score = max(15, min(100, round((user_experience / required_exp) * 100)))
        
        return experience_score

    def _calculate_education_match(self, portfolio, job):
        """Calculate education match percentage"""
        # Start with full score
        education_score = 100
        
        if not portfolio or "education" not in portfolio or not portfolio["education"]:
            return 15  # Default if no education listed
        
        if "requiredEducationLevel" not in job:
            return 100  # Default if no education required
        
        # Education levels with corresponding values
        education_levels = {
            "high-school": 1,
            "associate": 2,
            "bachelor": 3,
            "master": 4,
            "phd": 5
        }
        
        # Get user's highest education level
        user_education_level = 0
        for education in portfolio.get("education", []):
            degree = education.get("degree", "").lower()
            for level, value in education_levels.items():
                if level in degree:
                    user_education_level = max(user_education_level, value)
        
        # Get job required education level
        required_level = education_levels.get(job.get("requiredEducationLevel", "").lower(), 0)
        
        # Calculate match
        if user_education_level >= required_level:
            education_score = 100  # Full match
        elif user_education_level > 0:  # Some education but not enough
            education_score = max(15, min(100, round((user_education_level / required_level) * 100)))
        else:
            education_score = 15  # Minimum score
        
        return education_score

    def _calculate_language_match(self, portfolio, job):
        """Calculate language proficiency match percentage"""
        # Start with minimum score
        language_score = 15
        
        if not portfolio or "languages" not in portfolio or not portfolio["languages"]:
            return language_score  # Default if no languages listed
        
        if "requiredLanguages" not in job or not job["requiredLanguages"]:
            return 100  # Default if no languages required
        
        # Proficiency levels with corresponding values
        proficiency_levels = {
            "basic": 1,
            "intermediate": 2,
            "advanced": 3,
            "fluent": 4,
            "native": 5
        }
        
        # Get user languages
        user_languages = {lang["name"].lower(): proficiency_levels.get(lang.get("level", "").lower(), 0) 
                         for lang in portfolio.get("languages", [])}
        
        # Get required languages
        required_languages = {lang["name"].lower(): proficiency_levels.get(lang.get("level", "").lower(), 0) 
                             for lang in job.get("requiredLanguages", [])}
        
        if not required_languages:
            return 100  # If no languages required
        
        # Calculate matches
        total_points = 0
        possible_points = 0
        
        for lang, req_level in required_languages.items():
            possible_points += req_level
            if lang in user_languages:
                user_level = user_languages[lang]
                if user_level >= req_level:
                    total_points += req_level  # Full match for this language
                else:
                    total_points += user_level  # Partial match
        
        # Calculate percentage
        if possible_points > 0:
            language_score = max(15, min(100, round((total_points / possible_points) * 100)))
        
        return language_score

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
