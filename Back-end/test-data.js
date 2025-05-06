/**
 * TuniHire Simple Test Data Generator
 * 
 * This script creates minimal test data for the TuniHire app:
 * - 2 companies
 * - 2 HR users (1 per company)
 * - 5 candidate users
 * - Portfolios for all candidates
 * - 5 job posts
 * - Some applications
 * 
 * Run with: node test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Portfolio = require('./models/Portfolio');
const Company = require('./models/Company');
const JobPost = require('./models/JobPost');
const Application = require('./models/Application');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/TuniHireDB')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Sample test data
const testData = {
  // Test companies
  companies: [
    {
      name: "Vermeg Tunisia",
      email: "contact@vermeg.com.tn",
      description: "Leading financial software company in Tunisia",
      industry: "Technology",
      location: "Tunis",
      logo: "default-company-logo.png",
      website: "https://www.vermeg.com",
      status: "Approved"
    },
    {
      name: "Expensya",
      email: "contact@expensya.com.tn",
      description: "Expense management solutions",
      industry: "Finance",
      location: "Tunis",
      logo: "default-company-logo.png",
      website: "https://www.expensya.com",
      status: "Approved"
    }
  ],
  
  // Test HR users
  hrUsers: [
    {
      firstName: "Mohamed",
      lastName: "Ben Ali",
      email: "mohamed.benali@example.com",
      password: "password123",
      role: "HR",
      subscription: "Platinum",
      phone: "+216 98765432",
      // company will be set to first company
    },
    {
      firstName: "Leila",
      lastName: "Trabelsi",
      email: "leila.trabelsi@example.com",
      password: "password123",
      role: "HR",
      subscription: "Master",
      phone: "+216 87654321",
      // company will be set to second company
    }
  ],
  
  // Test candidate users
  candidateUsers: [
    {
      firstName: "Ahmed",
      lastName: "Mejri",
      email: "ahmed.mejri@example.com",
      password: "password123",
      role: "candidate",
      subscription: "Free",
      phone: "+216 55443322",
      skills: ["JavaScript", "React", "Node.js"],
      experienceYears: 3
    },
    {
      firstName: "Yasmine",
      lastName: "Gharbi",
      email: "yasmine.gharbi@example.com",
      password: "password123",
      role: "candidate",
      subscription: "Golden",
      phone: "+216 56789012",
      skills: ["Python", "Django", "Machine Learning"],
      experienceYears: 5
    },
    {
      firstName: "Ali",
      lastName: "Mansouri",
      email: "ali.mansouri@example.com",
      password: "password123",
      role: "candidate",
      subscription: "Free",
      phone: "+216 99887766",
      skills: ["Java", "Spring Boot", "MySQL"],
      experienceYears: 2
    },
    {
      firstName: "Nour",
      lastName: "Riahi",
      email: "nour.riahi@example.com",
      password: "password123",
      role: "candidate",
      subscription: "Platinum",
      phone: "+216 54321098",
      skills: ["Angular", "TypeScript", "Firebase"],
      experienceYears: 4
    },
    {
      firstName: "Karim",
      lastName: "Chebbi",
      email: "karim.chebbi@example.com",
      password: "password123",
      role: "candidate",
      subscription: "Master",
      phone: "+216 12345678",
      skills: ["PHP", "Laravel", "Vue.js"],
      experienceYears: 6
    }
  ],
  
  // Job posts will be created after companies
  jobPosts: [
    {
      title: "Frontend Developer",
      description: "We are looking for a skilled Frontend Developer proficient in React to join our team.",
      requirements: ["JavaScript", "React", "HTML", "CSS", "Git"],
      salaryRange: "$30K-45K",
      location: "Tunis",
      workplaceType: "Hybrid"
    },
    {
      title: "Backend Developer",
      description: "Backend developer with experience in Node.js and Express to build scalable APIs.",
      requirements: ["Node.js", "Express", "MongoDB", "RESTful API", "Docker"],
      salaryRange: "$35K-50K",
      location: "Remote",
      workplaceType: "Remote"
    },
    {
      title: "Data Scientist",
      description: "Data scientist with machine learning expertise to work on innovative projects.",
      requirements: ["Python", "Machine Learning", "Data Analysis", "TensorFlow", "SQL"],
      salaryRange: "$45K-60K",
      location: "Sousse",
      workplaceType: "Office"
    },
    {
      title: "DevOps Engineer",
      description: "DevOps engineer to manage our cloud infrastructure and CI/CD pipelines.",
      requirements: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux"],
      salaryRange: "$40K-55K",
      location: "Sfax",
      workplaceType: "Hybrid"
    },
    {
      title: "Full Stack Developer",
      description: "Full Stack Developer with experience in MERN stack.",
      requirements: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
      salaryRange: "$38K-52K",
      location: "Tunis",
      workplaceType: "Office"
    }
  ]
};

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Function to populate database
async function populateDatabase() {
  try {
    // Clear existing data if user confirms
    console.log('This script will create test data. Existing data may be overwritten.');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Do you want to clear existing data? (y/n): ', async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await clearDatabase();
        console.log('Database cleared');
      } else {
        console.log('Adding data to existing database...');
      }
      
      // Create companies
      const companyIds = [];
      for (const companyData of testData.companies) {
        const company = new Company(companyData);
        const savedCompany = await company.save();
        companyIds.push(savedCompany._id);
        console.log(`Created company: ${savedCompany.name}`);
      }
      
      // Create HR users
      const hrUserIds = [];
      for (let i = 0; i < testData.hrUsers.length; i++) {
        const userData = testData.hrUsers[i];
        userData.password = await hashPassword(userData.password);
        userData.companyId = companyIds[i]; // Assign company
        
        const user = new User(userData);
        const savedUser = await user.save();
        hrUserIds.push(savedUser._id);
        console.log(`Created HR user: ${savedUser.firstName} ${savedUser.lastName}`);
      }
      
      // Create candidate users
      const candidateUserIds = [];
      for (const userData of testData.candidateUsers) {
        userData.password = await hashPassword(userData.password);
        
        const user = new User(userData);
        const savedUser = await user.save();
        candidateUserIds.push(savedUser._id);
        console.log(`Created candidate user: ${savedUser.firstName} ${savedUser.lastName}`);
      }
      
      // Create portfolios for candidates
      const portfolioIds = [];
      for (const userId of candidateUserIds) {
        const portfolio = new Portfolio({
          userId: userId,
          education: [
            {
              school: "INSAT",
              degree: "Master's in Computer Science",
              fieldOfStudy: "Software Engineering",
              startDate: new Date("2018-09-01"),
              endDate: new Date("2021-06-30"),
              currentlyEnrolled: false,
              description: "Studied software engineering with focus on web technologies",
              location: "Tunis"
            }
          ],
          experience: [
            {
              company: "Local Tech Company",
              position: "Junior Developer",
              startDate: new Date("2021-07-01"),
              endDate: new Date("2023-06-30"),
              currentlyWorking: false,
              description: "Developed web applications using modern JavaScript frameworks",
              location: "Tunis"
            },
            {
              company: "Startup",
              position: "Software Engineer",
              startDate: new Date("2023-07-01"),
              currentlyWorking: true,
              description: "Working on full-stack development with MERN stack",
              location: "Remote"
            }
          ],
          skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express", "Git", "AWS"],
          projects: [
            {
              title: "E-commerce Platform",
              description: "Built a full-stack e-commerce application",
              technologies: ["React", "Node.js", "MongoDB"],
              link: "https://github.com/user/ecommerce"
            }
          ],
          about: "Experienced developer passionate about web technologies and building scalable applications",
          socialLinks: {
            linkedin: `https://linkedin.com/in/dev${userId}`,
            github: `https://github.com/dev${userId}`,
            website: `https://dev${userId}.com`
          }
        });
        
        const savedPortfolio = await portfolio.save();
        portfolioIds.push(savedPortfolio._id);
        console.log(`Created portfolio for user ID: ${userId}`);
      }
      
      // Create job posts
      const jobPostIds = [];
      let companyIndex = 0;
      for (const jobData of testData.jobPosts) {
        jobData.companyId = companyIds[companyIndex % companyIds.length];
        companyIndex++;
        
        const jobPost = new JobPost(jobData);
        const savedJobPost = await jobPost.save();
        jobPostIds.push(savedJobPost._id);
        console.log(`Created job post: ${savedJobPost.title}`);
      }
      
      // Create applications (each candidate applies to 2 jobs)
      const applicationIds = [];
      for (let i = 0; i < candidateUserIds.length; i++) {
        for (let j = 0; j < 2; j++) {
          const jobIndex = (i + j) % jobPostIds.length;
          
          const application = new Application({
            userId: candidateUserIds[i],
            jobId: jobPostIds[jobIndex],
            coverLetter: "I am excited to apply for this position and believe my skills and experience make me a strong candidate.",
            status: ["Pending", "Accepted", "Rejected"][Math.floor(Math.random() * 3)],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          const savedApplication = await application.save();
          applicationIds.push(savedApplication._id);
          console.log(`Created application for user ID: ${candidateUserIds[i]} and job ID: ${jobPostIds[jobIndex]}`);
        }
      }
      
      // Save test credentials and IDs to a file
      const fs = require('fs');
      const testInfo = {
        timestamp: new Date().toISOString(),
        testUserCredentials: {
          hr: {
            email: testData.hrUsers[0].email,
            password: "password123"
          },
          candidate: {
            email: testData.candidateUsers[0].email,
            password: "password123"
          }
        },
        sampleIds: {
          companies: companyIds.map(id => id.toString()),
          hrUsers: hrUserIds.map(id => id.toString()),
          candidateUsers: candidateUserIds.map(id => id.toString()),
          portfolios: portfolioIds.map(id => id.toString()),
          jobPosts: jobPostIds.map(id => id.toString()),
          applications: applicationIds.map(id => id.toString())
        },
        recommendationTestEndpoint: `http://localhost:5001/api/recommendation?user_id=${candidateUserIds[0].toString()}&job_id=${jobPostIds[0].toString()}`
      };
      
      fs.writeFileSync('test-data-info.json', JSON.stringify(testInfo, null, 2));
      console.log('\nTest data created successfully!');
      console.log('Test credentials and IDs saved to test-data-info.json');
      console.log('\nTest User Credentials:');
      console.log(`HR: ${testData.hrUsers[0].email} / password123`);
      console.log(`Candidate: ${testData.candidateUsers[0].email} / password123`);
      console.log('\nRecommendation Test URL:');
      console.log(testInfo.recommendationTestEndpoint);
      
      mongoose.connection.close();
    });
  } catch (error) {
    console.error('Error populating database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Function to clear the database
async function clearDatabase() {
  await User.deleteMany({});
  await Portfolio.deleteMany({});
  await Company.deleteMany({});
  await JobPost.deleteMany({});
  await Application.deleteMany({});
}

// Run the script
populateDatabase();
