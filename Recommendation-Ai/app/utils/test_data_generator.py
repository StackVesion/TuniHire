import random
from datetime import datetime, timedelta
from bson import ObjectId

def generate_sample_data(db, count=10):
    """
    Generate sample data for testing the recommendation engine
    
    Args:
        db: MongoDB database connection
        count: Number of sample entries to generate
        
    Returns:
        Dict containing counts of generated data
    """
    # Check if we already have sample data
    if db.users.count_documents({}) > 0:
        print("Database already contains data, skipping sample generation")
        return {
            "message": "Database already contains data, not generating samples",
            "existing_counts": {
                "users": db.users.count_documents({}),
                "portfolios": db.portfolios.count_documents({}),
                "companies": db.companies.count_documents({}),
                "jobposts": db.jobposts.count_documents({}),
                "applications": db.applications.count_documents({})
            }
        }
    
    print(f"Generating {count} sample entries for each collection...")
    
    # Sample skills for various industries
    tech_skills = [
        "Python", "JavaScript", "React", "Node.js", "MongoDB", "SQL", "Docker", 
        "Kubernetes", "AWS", "Azure", "Git", "CI/CD", "TensorFlow", "PyTorch",
        "Java", "C#", "PHP", "Ruby", "Vue.js", "Angular", "TypeScript"
    ]
    
    business_skills = [
        "Project Management", "Budgeting", "Team Leadership", "Strategic Planning",
        "Market Analysis", "Sales", "Customer Relationship Management", "Negotiations",
        "Business Development", "Financial Analysis", "Marketing", "Public Relations"
    ]
    
    design_skills = [
        "UI Design", "UX Design", "Graphic Design", "Adobe Photoshop", "Adobe Illustrator",
        "Figma", "Sketch", "InDesign", "Animation", "Typography", "Color Theory", 
        "Design Thinking", "Wireframing", "Prototyping"
    ]
    
    # Job titles
    tech_titles = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "DevOps Engineer", "Data Scientist", "Machine Learning Engineer", "QA Engineer",
        "Mobile Developer", "Cloud Architect", "Security Engineer", "Database Administrator"
    ]
    
    business_titles = [
        "Product Manager", "Project Manager", "Business Analyst", "Marketing Manager",
        "Sales Representative", "Account Manager", "Financial Analyst", "Operations Manager",
        "HR Specialist", "Customer Success Manager", "Content Strategist"
    ]
    
    design_titles = [
        "UI Designer", "UX Designer", "Graphic Designer", "Product Designer",
        "Visual Designer", "Interaction Designer", "Art Director", "Creative Director",
        "Brand Designer", "Motion Designer", "Web Designer"
    ]
    
    # Education
    universities = [
        "University of Tunis", "Tunisia Polytechnic School", "Mediterranean School of Business",
        "University of Carthage", "Esprit School of Engineering", "University of Monastir",
        "South Mediterranean University", "University of Sfax", "International University of Tunis"
    ]
    
    degrees = [
        "Bachelor of Science", "Bachelor of Arts", "Master of Science", "Master of Business Administration",
        "Master of Arts", "PhD", "Associate's Degree", "High School Diploma", "Certificate"
    ]
    
    majors = [
        "Computer Science", "Software Engineering", "Business Administration", "Marketing",
        "Graphic Design", "Information Technology", "Finance", "Economics", "Data Science",
        "Management", "Accounting", "Psychology", "Communications", "Engineering", "Mathematics"
    ]
    
    # Companies
    company_names = [
        "TechVision", "DataWorks", "InnoSoft", "GlobalConnect", "TuniTech",
        "DigitalWave", "CloudSphere", "SmarTech", "InfinityCode", "PulseInnovation",
        "MediaMind", "CreativeEdge", "DesignHub", "ArtificialMinds", "BusinessPro",
        "FinanceGenius", "TuniTraders", "MarketPulse", "StrategyMasters", "TalentForge"
    ]
    
    company_industries = [
        "Technology", "Finance", "Healthcare", "Education", "Retail",
        "Manufacturing", "Media", "Transportation", "Energy", "Telecommunications"
    ]
    
    # Locations
    tunisia_locations = [
        "Tunis", "Sfax", "Sousse", "Monastir", "Nabeul", 
        "Ariana", "Ben Arous", "Bizerte", "Gabes", "Kairouan"
    ]
    
    # Generate Users and Portfolios
    users = []
    portfolios = []
    
    for i in range(count):
        # Randomly select a professional area
        area = random.choice(["tech", "business", "design"])
        
        if area == "tech":
            skills = random.sample(tech_skills, random.randint(5, 10))
        elif area == "business":
            skills = random.sample(business_skills, random.randint(5, 10))
        else:
            skills = random.sample(design_skills, random.randint(5, 10))
        
        # Add some random skills from other areas for diversity
        if random.random() > 0.5:
            other_skills = random.sample(tech_skills + business_skills + design_skills, random.randint(1, 5))
            for skill in other_skills:
                if skill not in skills:
                    skills.append(skill)
        
        # Create random subscription tier with weighted probabilities
        subscription_tiers = ["Free", "Golden", "Platinum", "Master"]
        subscription_weights = [0.7, 0.15, 0.1, 0.05]  # 70% free users, 15% Golden, etc.
        subscription = random.choices(subscription_tiers, weights=subscription_weights)[0]
        
        # Create user
        user_id = ObjectId()
        user = {
            "_id": user_id,
            "fullName": f"User {i+1}",
            "email": f"user{i+1}@example.com",
            "password": "hashedpassword",
            "skills": skills,
            "subscription": subscription,
            "createdAt": datetime.now() - timedelta(days=random.randint(1, 365)),
            "updatedAt": datetime.now()
        }
        users.append(user)
        
        # Create 1-4 education entries
        education = []
        for j in range(random.randint(1, 3)):
            education.append({
                "school": random.choice(universities),
                "degree": random.choice(degrees),
                "fieldOfStudy": random.choice(majors),
                "from": datetime.now().year - random.randint(5, 15),
                "to": datetime.now().year - random.randint(0, 4),
                "current": random.random() < 0.2  # 20% chance of being current education
            })
        
        # Create 1-5 experience entries
        experience = []
        for j in range(random.randint(1, 5)):
            if area == "tech":
                title = random.choice(tech_titles)
            elif area == "business":
                title = random.choice(business_titles)
            else:
                title = random.choice(design_titles)
                
            experience.append({
                "title": title,
                "company": random.choice(company_names),
                "location": random.choice(tunisia_locations),
                "from": datetime.now().year - random.randint(1, 10),
                "to": datetime.now().year - random.randint(0, 3),
                "current": random.random() < 0.3,  # 30% chance of being current job
                "description": f"Worked as a {title} with responsibilities in {', '.join(random.sample(skills, min(3, len(skills))))}"
            })
        
        # Create portfolio
        portfolio = {
            "_id": ObjectId(),
            "userId": user_id,
            "skills": skills,
            "education": education,
            "experience": experience,
            "projects": [],
            "createdAt": datetime.now() - timedelta(days=random.randint(1, 300)),
            "updatedAt": datetime.now()
        }
        portfolios.append(portfolio)
    
    # Generate Companies and Job Posts
    companies = []
    jobposts = []
    
    for i in range(count):
        # Create company
        company_id = ObjectId()
        company = {
            "_id": company_id,
            "name": random.choice(company_names),
            "industry": random.choice(company_industries),
            "location": random.choice(tunisia_locations),
            "createdAt": datetime.now() - timedelta(days=random.randint(30, 365)),
            "updatedAt": datetime.now()
        }
        companies.append(company)
        
        # Create 1-3 job posts per company
        for j in range(random.randint(1, 3)):
            # Randomly select job area
            area = random.choice(["tech", "business", "design"])
            
            if area == "tech":
                title = random.choice(tech_titles)
                requirements = random.sample(tech_skills, random.randint(5, 8))
            elif area == "business":
                title = random.choice(business_titles)
                requirements = random.sample(business_skills, random.randint(5, 8))
            else:
                title = random.choice(design_titles)
                requirements = random.sample(design_skills, random.randint(5, 8))
            
            # Add some requirements from other areas for diversity
            other_reqs = random.sample(tech_skills + business_skills + design_skills, random.randint(1, 3))
            for req in other_reqs:
                if req not in requirements:
                    requirements.append(req)
            
            # Create job post
            salary_ranges = [
                "$30K-50K", "$50K-70K", "$70K-90K", "$90K-110K", "$110K-130K", 
                "$130K-150K", "150K+"
            ]
            
            workplace_types = ["Remote", "On-Site", "Hybrid"]
            
            jobpost = {
                "_id": ObjectId(),
                "title": title,
                "companyId": company_id,
                "description": f"We are looking for a {title} to join our team. The ideal candidate will have experience with {', '.join(requirements[:3])}.",
                "requirements": requirements,
                "salaryRange": random.choice(salary_ranges),
                "location": company["location"],
                "workplaceType": random.choice(workplace_types),
                "createdAt": datetime.now() - timedelta(days=random.randint(1, 60)),
                "updatedAt": datetime.now()
            }
            jobposts.append(jobpost)
    
    # Generate Applications
    applications = []
    
    # Each user applies to 1-4 random jobs
    for user, portfolio in zip(users, portfolios):
        # Select random jobs to apply for
        num_applications = random.randint(1, 4)
        random_jobs = random.sample(jobposts, min(num_applications, len(jobposts)))
        
        for job in random_jobs:
            # Calculate skill match to determine application outcome
            user_skills = set(portfolio["skills"])
            job_skills = set(job["requirements"])
            
            skill_match = len(user_skills.intersection(job_skills)) / len(job_skills) if job_skills else 0
            
            # Status probabilities based on skill match
            if skill_match > 0.7:
                status_options = ["Pending", "Accepted", "Rejected"]
                status_weights = [0.3, 0.6, 0.1]  # 60% chance of acceptance if good match
            elif skill_match > 0.4:
                status_options = ["Pending", "Accepted", "Rejected"]
                status_weights = [0.3, 0.3, 0.4]  # 30% chance of acceptance if medium match
            else:
                status_options = ["Pending", "Accepted", "Rejected"]
                status_weights = [0.3, 0.1, 0.6]  # 10% chance of acceptance if poor match
            
            status = random.choices(status_options, weights=status_weights)[0]
            
            # Create application
            application = {
                "_id": ObjectId(),
                "userId": user["_id"],
                "jobId": job["_id"],
                "coverLetter": f"I am applying for the {job['title']} position and believe my skills in {', '.join(random.sample(user_skills, min(3, len(user_skills))))} make me a good fit.",
                "status": status,
                "createdAt": datetime.now() - timedelta(days=random.randint(1, 30)),
                "updatedAt": datetime.now()
            }
            applications.append(application)
    
    # Insert all data into database
    if users:
        db.users.insert_many(users)
    
    if portfolios:
        db.portfolios.insert_many(portfolios)
    
    if companies:
        db.companies.insert_many(companies)
    
    if jobposts:
        db.jobposts.insert_many(jobposts)
    
    if applications:
        db.applications.insert_many(applications)
    
    print("Sample data generation complete!")
    
    return {
        "message": "Sample data generated successfully",
        "counts": {
            "users": len(users),
            "portfolios": len(portfolios),
            "companies": len(companies),
            "jobposts": len(jobposts),
            "applications": len(applications)
        }
    }
