#!/usr/bin/env python
"""
Test Data Generator for TuniHire AI Recommendation Engine

This script generates synthetic test data for developing and testing the
TuniHire AI recommendation system. It creates users, portfolios, job postings,
companies, and applications with realistic data.

Usage:
    python test_data_generator.py [--count N] [--clear]
    
Options:
    --count N    Generate N users, portfolios, and jobs (default: 50)
    --clear      Clear existing data before generating new data
"""

import os
import random
import json
import datetime
import argparse
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Sample data
TECH_SKILLS = [
    "JavaScript", "React", "Angular", "Vue.js", "Node.js", "Express", "MongoDB", 
    "Python", "Django", "Flask", "Java", "Spring", "C#", ".NET", "PHP", "Laravel",
    "SQL", "MySQL", "PostgreSQL", "Redis", "AWS", "Azure", "Google Cloud", 
    "Docker", "Kubernetes", "CI/CD", "Git", "GitHub", "TensorFlow", "PyTorch",
    "Machine Learning", "Data Analysis", "TypeScript", "GraphQL", "RESTful API",
    "Microservices", "DevOps", "Agile", "Scrum", "HTML", "CSS", "SASS", "Bootstrap",
    "TailwindCSS", "Redux", "MobX", "Cypress", "Jest", "Selenium", "WebSockets"
]

SOFT_SKILLS = [
    "Communication", "Teamwork", "Problem Solving", "Critical Thinking", 
    "Time Management", "Adaptability", "Leadership", "Creativity", "Project Management",
    "Attention to Detail", "Research", "Analytical Thinking", "Self-Motivation",
    "Work Ethic", "Interpersonal Skills", "Conflict Resolution", "Decision Making",
    "Negotiation", "Presentation Skills", "Stress Management"
]

JOB_TITLES = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer", 
    "Software Engineer", "DevOps Engineer", "Data Scientist", "UI/UX Designer",
    "Product Manager", "Project Manager", "QA Engineer", "Technical Writer",
    "Database Administrator", "Cloud Engineer", "Mobile Developer", "Machine Learning Engineer",
    "Systems Administrator", "Network Engineer", "Security Engineer", "Technical Support",
    "IT Manager", "CTO", "Web Developer", "Game Developer", "Business Analyst",
    "Scrum Master", "Embedded Systems Engineer", "AR/VR Developer", "Blockchain Developer"
]

COMPANIES = [
    "TechNova", "CodeCraft", "DataSphere", "WebWizards", "CloudPeak",
    "InnovateX", "DigitalDynamics", "SiliconSolutions", "CyberSystems",
    "FusionTech", "PixelPerfect", "ByteBridge", "QuantumQuest", "VirtualVision",
    "NetNode", "LogicLeap", "AppArchitects", "DevDimension", "ProtonPulse",
    "CircuitCore", "TechTrend", "AlgorithmAxis", "GenesisGear", "PulsarPath"
]

LOCATIONS = [
    "Tunis", "Sousse", "Sfax", "Monastir", "Hammamet", "Nabeul", "Bizerte",
    "Djerba", "Gabes", "Ariana", "Ben Arous", "Mahdia", "Kairouan", "Gafsa",
    "Remote", "Hybrid - Tunis", "Hybrid - Sousse", "Hybrid - Sfax"
]

UNIVERSITIES = [
    "University of Tunis", "University of Carthage", "University of Sousse",
    "University of Sfax", "University of Monastir", "University of Kairouan",
    "Mediterranean School of Business", "ESPRIT", "INSAT", "ENIT", "ISI",
    "ISET", "FST", "ENSI", "Sup'Com", "IHEC Carthage", "ESSECT", "ESSTHS",
    "EPT", "Polytechnique", "ESCT", "ESCP Tunisia", "ISG", "ESSAI", "ISSAT"
]

DEGREES = ["Bachelor's", "Master's", "PhD", "Associate's", "Certificate", "Diploma"]
FIELDS = ["Computer Science", "Software Engineering", "Information Technology", "Data Science", 
          "Electrical Engineering", "Telecommunications", "Business Informatics", 
          "Computer Engineering", "Cybersecurity", "Digital Marketing"]

class TestDataGenerator:
    """Generator for test data in the TuniHire recommendation system"""
    
    def __init__(self, db_uri=None, clear=False):
        """Initialize with database connection"""
        # Load environment variables
        load_dotenv()
        
        # Get MongoDB URI
        if db_uri is None:
            db_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/TuniHire")
        
        # Connect to MongoDB
        self.client = MongoClient(db_uri)
        self.db = self.client.get_database()
        
        # Clear existing data if requested
        if clear:
            self._clear_collections()
            
        # Create folder for training history if it doesn't exist
        history_dir = os.path.join(os.path.dirname(__file__), 'training_history')
        if not os.path.exists(history_dir):
            os.makedirs(history_dir)
    
    def _clear_collections(self):
        """Clear existing collections"""
        collections = ["users", "portfolios", "jobposts", "applications", "companies"]
        for collection in collections:
            self.db[collection].delete_many({})
        print("Cleared existing data")
    
    def generate_data(self, count=50):
        """Generate test data"""
        # Generate companies first
        company_ids = self._generate_companies(min(30, count//2))
        
        # Generate users and portfolios
        user_portfolio_ids = self._generate_users_and_portfolios(count)
        
        # Generate job postings
        job_ids = self._generate_job_postings(count, company_ids)
        
        # Generate applications
        application_count = count * 5  # Multiple applications per user
        self._generate_applications(application_count, user_portfolio_ids, job_ids)
        
        # Save metadata about the generated data
        self._save_generation_metadata(count)
        
        print(f"Generated {count} users, {count} portfolios, {len(company_ids)} companies, {len(job_ids)} jobs, and {application_count} applications")
    
    def _generate_companies(self, count):
        """Generate company data"""
        company_ids = []
        for i in range(count):
            company_name = random.choice(COMPANIES) + f" {random.randint(1, 999)}"
            company_data = {
                "name": company_name,
                "description": f"A leading tech company specializing in {random.choice(TECH_SKILLS)} and {random.choice(TECH_SKILLS)}.",
                "industry": random.choice(["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing"]),
                "location": random.choice(LOCATIONS),
                "employees": random.randint(5, 1000),
                "website": f"https://www.{company_name.lower().replace(' ', '')}.com",
                "createdAt": datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 1000))
            }
            
            result = self.db.companies.insert_one(company_data)
            company_ids.append(result.inserted_id)
        
        return company_ids
    
    def _generate_users_and_portfolios(self, count):
        """Generate user and portfolio data"""
        user_portfolio_ids = []
        
        for i in range(count):
            # Create a user
            first_name = f"User{i}"
            last_name = f"Test{i}"
            
            user_data = {
                "email": f"user{i}@example.com",
                "password": "$2a$10$randomhashforsecurity",  # Dummy hash, not real password
                "name": f"{first_name} {last_name}",
                "role": random.choice(["applicant", "company", "admin"]),
                "subscription": random.choice(["Free", "Golden", "Platinum", "Master"]),
                "verified": True,
                "createdAt": datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 365))
            }
            
            user_result = self.db.users.insert_one(user_data)
            user_id = user_result.inserted_id
            
            # Create a portfolio for the user
            portfolio_data = self._generate_portfolio(user_id)
            portfolio_result = self.db.portfolios.insert_one(portfolio_data)
            
            user_portfolio_ids.append((user_id, portfolio_result.inserted_id))
        
        return user_portfolio_ids
    
    def _generate_portfolio(self, user_id):
        """Generate portfolio data for a user"""
        # Generate skills with proficiency
        num_skills = random.randint(5, 15)
        skills = []
        for _ in range(num_skills):
            skill_type = random.choice(["technical", "soft"])
            if skill_type == "technical":
                skill_name = random.choice(TECH_SKILLS)
            else:
                skill_name = random.choice(SOFT_SKILLS)
            
            skills.append({
                "name": skill_name,
                "proficiency": random.choice(["Beginner", "Intermediate", "Advanced", "Expert"]),
                "type": skill_type
            })
        
        # Generate education
        num_educations = random.randint(1, 3)
        education = []
        for _ in range(num_educations):
            start_year = random.randint(2010, 2021)
            duration = random.randint(1, 4)
            
            education.append({
                "institution": random.choice(UNIVERSITIES),
                "degree": random.choice(DEGREES),
                "field": random.choice(FIELDS),
                "startDate": f"{start_year}-09-01",
                "endDate": f"{start_year + duration}-06-30",
                "description": f"Studied {random.choice(FIELDS)} with focus on {random.choice(TECH_SKILLS)}"
            })
        
        # Generate experience
        num_experiences = random.randint(0, 5)
        experience = []
        for _ in range(num_experiences):
            start_year = random.randint(2015, 2023)
            duration = random.randint(1, 4)
            
            experience.append({
                "title": random.choice(JOB_TITLES),
                "company": random.choice(COMPANIES),
                "location": random.choice(LOCATIONS),
                "startDate": f"{start_year}-{random.randint(1, 12):02d}-01",
                "endDate": random.choice([f"{start_year + duration}-{random.randint(1, 12):02d}-28", "Present"]),
                "description": f"Worked with {random.choice(TECH_SKILLS)}, {random.choice(TECH_SKILLS)}, and {random.choice(TECH_SKILLS)}"
            })
        
        # Generate projects
        num_projects = random.randint(0, 4)
        projects = []
        for _ in range(num_projects):
            projects.append({
                "title": f"Project {random.randint(1, 100)}",
                "description": f"Developed using {random.choice(TECH_SKILLS)} and {random.choice(TECH_SKILLS)}",
                "technologies": [random.choice(TECH_SKILLS) for _ in range(random.randint(2, 5))],
                "link": f"https://github.com/user/project{random.randint(1, 100)}"
            })
        
        # Generate certificates
        num_certificates = random.randint(0, 3)
        certificates = []
        for _ in range(num_certificates):
            year = random.randint(2018, 2024)
            
            certificates.append({
                "title": f"Certificate in {random.choice(TECH_SKILLS)}",
                "issuer": random.choice(["Coursera", "Udemy", "edX", "TuniHire", "LinkedIn Learning", "Microsoft", "Google"]),
                "date": f"{year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                "description": f"Certification demonstrating proficiency in {random.choice(TECH_SKILLS)}"
            })
        
        # Assemble the portfolio
        portfolio = {
            "userId": user_id,
            "summary": f"Professional with experience in {random.choice(TECH_SKILLS)} and {random.choice(TECH_SKILLS)}",
            "skills": skills,
            "education": education,
            "experience": experience,
            "projects": projects,
            "certificates": certificates,
            "socialLinks": {
                "linkedin": f"https://linkedin.com/in/user{random.randint(1000, 9999)}",
                "github": f"https://github.com/user{random.randint(1000, 9999)}",
                "website": f"https://user{random.randint(1000, 9999)}.com"
            },
            "createdAt": datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 200)),
            "updatedAt": datetime.datetime.now() - datetime.timedelta(days=random.randint(0, 30))
        }
        
        return portfolio
    
    def _generate_job_postings(self, count, company_ids):
        """Generate job posting data"""
        job_ids = []
        
        for i in range(count):
            job_title = random.choice(JOB_TITLES)
            
            # Generate requirements (mix of technical and soft skills)
            num_requirements = random.randint(5, 12)
            requirements = []
            for _ in range(num_requirements):
                if random.random() < 0.8:  # 80% technical skills
                    requirement = random.choice(TECH_SKILLS)
                else:
                    requirement = random.choice(SOFT_SKILLS)
                requirements.append(requirement)
            
            # Generate salary range
            min_salary = random.choice([20, 25, 30, 35, 40, 45, 50, 60, 70, 80]) * 1000
            max_salary = min_salary * (1 + random.choice([0.1, 0.2, 0.3, 0.4, 0.5]))
            
            job_data = {
                "title": job_title,
                "description": f"We are looking for a skilled {job_title} to join our team.",
                "requirements": requirements,
                "salaryRange": f"${int(min_salary//1000)}K-{int(max_salary//1000)}K",
                "location": random.choice(LOCATIONS),
                "workplaceType": random.choice(["Remote", "On-site", "Hybrid"]),
                "companyId": random.choice(company_ids),
                "createdAt": datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 60)),
                "updatedAt": datetime.datetime.now() - datetime.timedelta(days=random.randint(0, 10))
            }
            
            result = self.db.jobposts.insert_one(job_data)
            job_ids.append(result.inserted_id)
        
        return job_ids
    
    def _generate_applications(self, count, user_portfolio_ids, job_ids):
        """Generate application data"""
        for i in range(count):
            # Select a random user and job
            user_id, _ = random.choice(user_portfolio_ids)
            job_id = random.choice(job_ids)
            
            # Generate application date (between job posting and now)
            job = self.db.jobposts.find_one({"_id": job_id})
            job_created = job.get("createdAt", datetime.datetime.now() - datetime.timedelta(days=30))
            
            application_date = job_created + datetime.timedelta(
                seconds=random.randint(0, int((datetime.datetime.now() - job_created).total_seconds()))
            )
            
            # Determine application status with probabilities
            status_choices = ["Pending", "Reviewing", "Accepted", "Rejected", "Withdrawn"]
            status_weights = [0.3, 0.2, 0.2, 0.25, 0.05]  # Probabilities for each status
            
            application_data = {
                "userId": user_id,
                "jobId": job_id,
                "coverLetter": "This is a sample cover letter for the application.",
                "status": random.choices(status_choices, weights=status_weights)[0],
                "createdAt": application_date,
                "updatedAt": application_date + datetime.timedelta(days=random.randint(1, 10))
            }
            
            self.db.applications.insert_one(application_data)
    
    def _save_generation_metadata(self, count):
        """Save metadata about generated data for training history"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        metadata = {
            "timestamp": timestamp,
            "generated_count": count,
            "collections": {
                "users": self.db.users.count_documents({}),
                "portfolios": self.db.portfolios.count_documents({}),
                "companies": self.db.companies.count_documents({}),
                "jobposts": self.db.jobposts.count_documents({}),
                "applications": self.db.applications.count_documents({})
            },
            "generation_parameters": {
                "tech_skills_pool_size": len(TECH_SKILLS),
                "soft_skills_pool_size": len(SOFT_SKILLS),
                "job_titles_pool_size": len(JOB_TITLES),
            }
        }
        
        # Save to training history folder
        history_file = os.path.join(os.path.dirname(__file__), 'training_history', f'data_generation_{timestamp}.json')
        with open(history_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        print(f"Saved generation metadata to {history_file}")

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Generate test data for TuniHire AI")
    parser.add_argument("--count", type=int, default=50, help="Number of users/portfolios to generate")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before generating new data")
    
    args = parser.parse_args()
    
    # Generate test data
    generator = TestDataGenerator(clear=args.clear)
    generator.generate_data(count=args.count)
