/**
 * TuniHire Test Data Generator
 * 
 * This script generates random users (candidates and HR), companies, portfolios,
 * job posts, and applications with realistic data.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const JobPost = require('../models/JobPost');
const Application = require('../models/Application');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/TuniHireDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Could not connect to MongoDB', err);
  process.exit(1);
});

// Mock data for realistic generation
const COMPANY_NAMES = [
  'TechVision Tunisia', 'Med Software Solutions', 'Carthage IT', 'Sfax Digital', 
  'Tunis Innovations', 'Sousse Dev Labs', 'Bizerte Tech', 'Hammamet Systems',
  'Mahdia Cloud Services', 'Nabeul Networks', 'Djerba Digital', 'Kairouan Tech'
];

const COMPANY_LOGOS = [
  'https://randomuser.me/api/portraits/men/1.jpg', // Using placeholder images
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/men/5.jpg',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/men/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg'
];

const COMPANY_CATEGORIES = [
  'Information Technology', 'Software Development', 'Web Development',
  'Mobile Development', 'Data Science', 'Artificial Intelligence',
  'Cybersecurity', 'Digital Marketing', 'E-commerce', 'Education Technology'
];

const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com', 'business.tn'];

const JOB_TITLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
  'Data Scientist', 'DevOps Engineer', 'UI/UX Designer', 'Product Manager',
  'QA Engineer', 'Machine Learning Engineer', 'Cybersecurity Specialist', 'IT Support'
];

const SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'NoSQL',
  'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'MongoDB', 'Redis',
  'TypeScript', 'Angular', 'Vue.js', 'Express.js', 'Django', 'Flask', 'Laravel',
  'Spring Boot', 'TensorFlow', 'PyTorch', 'Figma', 'Adobe XD', 'Sketch'
];

const SCHOOLS = [
  'University of Tunis', 'Carthage University', 'University of Sfax',
  'University of Sousse', 'Higher School of Computer Science', 'ESPRIT',
  'INSAT', 'ENIT', 'Mediterranean School of Business', 'IHEC Carthage'
];

const DEGREES = [
  'Bachelor of Computer Science', 'Master of Information Technology',
  'Engineering Diploma in Software Development', 'PhD in Computer Engineering',
  'Bachelor of Business Information Systems', 'Master of Data Science'
];

const COMPANIES = [
  'Vermeg', 'Sopra HR', 'Expensya', 'Vistaprint', 'Cognira',
  'Proxym Group', 'Focus Corporation', 'Talan Tunisia', 'ValueDev',
  'Advyteam', 'Ooredoo', 'Orange', 'Tunisie Telecom'
];

const LOCATIONS = [
  'Tunis, Tunisia', 'Sousse, Tunisia', 'Sfax, Tunisia', 'Monastir, Tunisia',
  'Ariana, Tunisia', 'Ben Arous, Tunisia', 'Nabeul, Tunisia', 'Bizerte, Tunisia',
  'Remote'
];

const PROFILE_PICTURES = [
  'https://randomuser.me/api/portraits/men/11.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
  'https://randomuser.me/api/portraits/men/13.jpg',
  'https://randomuser.me/api/portraits/women/14.jpg',
  'https://randomuser.me/api/portraits/men/15.jpg',
  'https://randomuser.me/api/portraits/women/16.jpg',
  'https://randomuser.me/api/portraits/men/17.jpg',
  'https://randomuser.me/api/portraits/women/18.jpg',
  'https://randomuser.me/api/portraits/men/19.jpg',
  'https://randomuser.me/api/portraits/women/20.jpg'
];

const PROJECT_IMAGES = [
  'https://picsum.photos/id/237/200/300',
  'https://picsum.photos/id/238/200/300',
  'https://picsum.photos/id/239/200/300',
  'https://picsum.photos/id/240/200/300',
  'https://picsum.photos/id/241/200/300',
  'https://picsum.photos/id/242/200/300',
  'https://picsum.photos/id/243/200/300',
  'https://picsum.photos/id/244/200/300'
];

const CERTIFICATE_URLS = [
  'https://example.com/certificates/cert1.pdf',
  'https://example.com/certificates/cert2.pdf',
  'https://example.com/certificates/cert3.pdf',
  'https://example.com/certificates/cert4.pdf'
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmail(firstName, lastName, domain = null) {
  const cleanFirstName = firstName.toLowerCase().replace(/\s/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/\s/g, '');
  const emailDomain = domain || getRandomElement(DOMAINS);
  
  const formats = [
    `${cleanFirstName}.${cleanLastName}@${emailDomain}`,
    `${cleanFirstName}${cleanLastName}@${emailDomain}`,
    `${cleanFirstName}${getRandomInt(1, 99)}@${emailDomain}`,
    `${cleanFirstName.charAt(0)}${cleanLastName}@${emailDomain}`
  ];
  
  return getRandomElement(formats);
}

function generatePhoneNumber() {
  // Tunisian phone number format
  return `+216 ${getRandomInt(20, 99)} ${getRandomInt(100, 999)} ${getRandomInt(100, 999)}`;
}

// Generate test data
async function generateTestData() {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Portfolio.deleteMany({});
    await JobPost.deleteMany({});
    await Application.deleteMany({});
    
    // Create HR users and their companies
    console.log('Creating HR users and companies...');
    const hrUsers = [];
    const companies = [];
    
    // Generate HR users and companies
    for (let i = 0; i < 10; i++) {
      const firstName = ['Ahmed', 'Mohamed', 'Ali', 'Sami', 'Karim', 'Nizar', 'Rafik', 'Anis', 'Slim', 'Mehdi', 
                         'Leila', 'Fatima', 'Salma', 'Amira', 'Rania', 'Yasmine', 'Sarra', 'Emna', 'Rim', 'Lina'][i];
      const lastName = ['Ben Ali', 'Trabelsi', 'Khelifa', 'Bouazizi', 'Mejri', 'Jebali', 'Chaabane', 'Cherni', 
                        'Mansour', 'Sassi', 'Baccouche', 'Khiari', 'Chebbi', 'Zairi', 'Lahmar', 'Karaouli', 
                        'Amor', 'Jlassi', 'Daoud', 'Belaid'][i];
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const hrUser = new User({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName, 'company.tn'),
        password: hashedPassword,
        role: 'HR',
        subscription: getRandomElement(['Free', 'Golden', 'Platinum', 'Master']),
        phone: generatePhoneNumber(),
        profilePicture: getRandomElement(PROFILE_PICTURES),
        experienceYears: getRandomInt(2, 15),
        skills: getRandomElements(SKILLS, getRandomInt(3, 8)),
        isEmailVerified: true
      });
      
      await hrUser.save();
      hrUsers.push(hrUser);
      
      // Create a company for this HR user
      const company = new Company({
        name: COMPANY_NAMES[i],
        email: `info@${COMPANY_NAMES[i].toLowerCase().replace(/\s/g, '')}.tn`,
        logo: COMPANY_LOGOS[i % COMPANY_LOGOS.length],
        website: `https://www.${COMPANY_NAMES[i].toLowerCase().replace(/\s/g, '')}.tn`,
        category: getRandomElement(COMPANY_CATEGORIES),
        numberOfEmployees: getRandomInt(10, 500),
        projects: getRandomElements(['Web Development', 'Mobile App', 'E-commerce', 'AI Solutions', 
                                     'Cloud Migration', 'IoT Platform', 'Fintech Solution'], getRandomInt(1, 4)),
        createdBy: hrUser._id,
        status: 'Approved',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await company.save();
      companies.push(company);
      
      console.log(`Created HR user: ${firstName} ${lastName} with company: ${company.name}`);
    }
    
    // Create job posts
    console.log('Creating job posts...');
    const jobPosts = [];
    
    for (const company of companies) {
      const numPosts = getRandomInt(2, 5);
      
      for (let i = 0; i < numPosts; i++) {
        const jobTitle = getRandomElement(JOB_TITLES);
        const techStack = getRandomElements(SKILLS, getRandomInt(3, 8));
        
        const jobPost = new JobPost({
          title: jobTitle,
          description: `We are looking for a ${jobTitle} to join our team at ${company.name}. You will be responsible for developing and maintaining high-quality applications.`,
          requirements: [
            `${getRandomInt(1, 5)}+ years of experience with ${techStack.join(', ')}`,
            'Strong problem-solving skills',
            'Excellent communication skills',
            "Bachelor's degree in Computer Science or related field",
            'Experience with Agile development methodologies'
          ],
          salaryRange: `${getRandomInt(1500, 4000)} - ${getRandomInt(4500, 8000)} TND/month`,
          location: getRandomElement(LOCATIONS),
          workplaceType: getRandomElement(['Remote', 'Office', 'Hybrid']),
          companyId: company._id,
          createdAt: getRandomDate(new Date(2023, 0, 1), new Date())
        });
        
        await jobPost.save();
        jobPosts.push(jobPost);
        
        console.log(`Created job post: ${jobPost.title} for company: ${company.name}`);
      }
    }
    
    // Create candidate users
    console.log('Creating candidate users...');
    const candidateUsers = [];
    
    const candidateFirstNames = ['Youssef', 'Omar', 'Adam', 'Ayoub', 'Bilel', 'Marwan', 'Houssem', 'Zied', 
                                'Ghofrane', 'Meriem', 'Ines', 'Nour', 'Cyrine', 'Asma', 'Mariem', 'Eya', 
                                'Aya', 'Yassine', 'Malek', 'Moez'];
    
    const candidateLastNames = ['Abid', 'Karray', 'Nasr', 'Khalfallah', 'Hamdi', 'Boughanmi', 'Bouhlel', 
                               'Mahjoub', 'Oueslati', 'Belkadhi', 'Zaafouri', 'Chaari', 'Mrad', 'Selmi', 
                               'Ammar', 'Jelassi', 'Ferchichi', 'Kefi', 'Snoussi', 'Kamoun'];
    
    for (let i = 0; i < 20; i++) {
      const firstName = candidateFirstNames[i];
      const lastName = candidateLastNames[i];
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const candidateUser = new User({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        password: hashedPassword,
        role: 'candidate',
        subscription: getRandomElement(['Free', 'Golden', 'Platinum']),
        phone: generatePhoneNumber(),
        profilePicture: getRandomElement(PROFILE_PICTURES),
        experienceYears: getRandomInt(0, 10),
        skills: getRandomElements(SKILLS, getRandomInt(5, 15)),
        projects: [
          {
            title: `${getRandomElement(['E-commerce', 'Social Media', 'Health', 'Education', 'Finance'])} App`,
            description: 'Developed a full-featured application with modern technologies.',
            technologies: getRandomElements(SKILLS, getRandomInt(3, 6))
          },
          {
            title: `${getRandomElement(['Portfolio', 'Blog', 'Dashboard', 'Analytics', 'Booking'])} Platform`,
            description: 'Created a responsive web application with advanced features.',
            technologies: getRandomElements(SKILLS, getRandomInt(3, 6))
          }
        ],
        education: [
          {
            degree: getRandomElement(DEGREES),
            institution: getRandomElement(SCHOOLS),
            yearCompleted: getRandomInt(2010, 2023)
          }
        ],
        isEmailVerified: true
      });
      
      await candidateUser.save();
      candidateUsers.push(candidateUser);
      
      console.log(`Created candidate user: ${firstName} ${lastName}`);
    }
    
    // Create portfolios for candidates
    console.log('Creating portfolios for candidates...');
    const portfolios = [];
    
    for (const candidate of candidateUsers) {
      // Generate education history
      const educationCount = getRandomInt(1, 3);
      const education = [];
      
      for (let i = 0; i < educationCount; i++) {
        const startYear = getRandomInt(2010, 2020);
        const endYear = i === 0 && Math.random() > 0.8 ? null : startYear + getRandomInt(2, 5);
        
        education.push({
          school: getRandomElement(SCHOOLS),
          degree: getRandomElement(DEGREES),
          fieldOfStudy: getRandomElement(['Computer Science', 'Information Technology', 'Software Engineering', 
                                         'Data Science', 'Artificial Intelligence', 'Cybersecurity']),
          startDate: new Date(startYear, getRandomInt(0, 11), getRandomInt(1, 28)),
          endDate: endYear ? new Date(endYear, getRandomInt(0, 11), getRandomInt(1, 28)) : null,
          currentlyEnrolled: !endYear,
          description: 'Studied core computer science subjects and specialized in software development.',
          location: getRandomElement(LOCATIONS.filter(l => l !== 'Remote'))
        });
      }
      
      // Generate work experience
      const experienceCount = getRandomInt(1, 4);
      const experience = [];
      
      for (let i = 0; i < experienceCount; i++) {
        const startYear = getRandomInt(2015, 2022);
        const endYear = i === 0 && Math.random() > 0.7 ? null : startYear + getRandomInt(1, 3);
        
        experience.push({
          company: getRandomElement(COMPANIES),
          position: getRandomElement(JOB_TITLES),
          startDate: new Date(startYear, getRandomInt(0, 11), getRandomInt(1, 28)),
          endDate: endYear ? new Date(endYear, getRandomInt(0, 11), getRandomInt(1, 28)) : null,
          currentlyWorking: !endYear,
          description: 'Worked on developing and maintaining applications, collaborating with cross-functional teams.',
          location: getRandomElement(LOCATIONS)
        });
      }
      
      // Generate projects
      const projectCount = getRandomInt(2, 5);
      const projects = [];
      
      for (let i = 0; i < projectCount; i++) {
        projects.push({
          title: `${getRandomElement(['Smart', 'Modern', 'Advanced', 'Innovative', 'Next-Gen'])} ${
            getRandomElement(['E-commerce', 'Social Media', 'Healthcare', 'Education', 'Finance', 'Travel', 'Food Delivery'])} ${
            getRandomElement(['Platform', 'Application', 'System', 'Solution', 'Portal'])}`,
          description: 'Built a comprehensive solution with modern technologies and best practices.',
          technologies: getRandomElements(SKILLS, getRandomInt(3, 8)),
          link: `https://github.com/${candidate.firstName.toLowerCase()}${candidate.lastName.toLowerCase()}/project${i+1}`,
          image: getRandomElement(PROJECT_IMAGES)
        });
      }
      
      // Generate certificates
      const certificateCount = getRandomInt(1, 4);
      const certificates = [];
      
      for (let i = 0; i < certificateCount; i++) {
        certificates.push({
          title: getRandomElement([
            'AWS Certified Developer', 'Google Cloud Professional', 'Microsoft Azure Fundamentals',
            'React Developer Certification', 'Node.js Application Development', 'Full Stack Web Development',
            'Data Science Specialization', 'Machine Learning Engineer', 'Cybersecurity Specialist',
            'UI/UX Design Professional', 'Agile Project Management', 'DevOps Engineering'
          ]),
          description: 'Earned professional certification after completion of rigorous coursework and examination.',
          skills: getRandomElements(SKILLS, getRandomInt(2, 5)),
          certificateUrl: getRandomElement(CERTIFICATE_URLS)
        });
      }
      
      const portfolio = new Portfolio({
        userId: candidate._id,
        cvFile: {
          filename: `cv_${candidate.firstName.toLowerCase()}_${candidate.lastName.toLowerCase()}.pdf`,
          path: `/uploads/cvs/cv_${candidate.firstName.toLowerCase()}_${candidate.lastName.toLowerCase()}.pdf`,
          uploadDate: new Date(),
          fileType: 'application/pdf'
        },
        education,
        experience,
        skills: candidate.skills,
        projects,
        certificates,
        about: `Passionate ${getRandomElement(JOB_TITLES)} with ${candidate.experienceYears} years of experience. Specializing in ${
          getRandomElements(SKILLS, 3).join(', ')}. Eager to tackle new challenges and continuously learn new technologies.`,
        socialLinks: {
          linkedin: `https://linkedin.com/in/${candidate.firstName.toLowerCase()}-${candidate.lastName.toLowerCase()}`,
          github: `https://github.com/${candidate.firstName.toLowerCase()}${candidate.lastName.toLowerCase()}`,
          website: Math.random() > 0.6 ? `https://${candidate.firstName.toLowerCase()}${candidate.lastName.toLowerCase()}.com` : '',
          twitter: Math.random() > 0.7 ? `https://twitter.com/${candidate.firstName.toLowerCase()}${candidate.lastName.toLowerCase()}` : ''
        },
        createdAt: getRandomDate(new Date(2022, 0, 1), new Date()),
        updatedAt: new Date()
      });
      
      await portfolio.save();
      portfolios.push(portfolio);
      
      console.log(`Created portfolio for: ${candidate.firstName} ${candidate.lastName}`);
    }
    
    // Create applications
    console.log('Creating job applications...');
    const applications = [];
    
    // Each candidate applies to 1-3 jobs
    for (const candidate of candidateUsers) {
      const applicationCount = getRandomInt(1, 3);
      const shuffledJobs = [...jobPosts].sort(() => 0.5 - Math.random());
      const selectedJobs = shuffledJobs.slice(0, applicationCount);
      
      for (const job of selectedJobs) {
        const coverLetterIntros = [
          `I am writing to express my interest in the ${job.title} position at ${
            companies.find(c => c._id.toString() === job.companyId.toString()).name}.`,
          `I was excited to see your posting for the ${job.title} position, as my skills and experience align perfectly with your requirements.`,
          `As a passionate ${job.title} with ${candidate.experienceYears} years of experience, I am eager to bring my expertise to your team.`
        ];
        
        const coverLetterBody = [
          `With my background in ${getRandomElements(candidate.skills, 3).join(', ')}, I believe I can make significant contributions to your team.`,
          `Throughout my career, I have developed strong skills in ${getRandomElements(candidate.skills, 3).join(', ')}, which I am eager to apply to your projects.`,
          `My experience includes working on projects similar to those mentioned in your job description, and I am confident in my ability to deliver results.`
        ];
        
        const coverLetterClosing = [
          "I am excited about the opportunity to join your team and contribute to your company's success.",
          'I look forward to the possibility of discussing how my skills and experience can benefit your team.',
          'Thank you for considering my application. I am enthusiastic about the possibility of joining your innovative team.'
        ];
        
        const coverLetter = `${getRandomElement(coverLetterIntros)}\n\n${getRandomElement(coverLetterBody)}\n\n${getRandomElement(coverLetterClosing)}`;
        
        const application = new Application({
          userId: candidate._id,
          jobId: job._id,
          coverLetter,
          status: getRandomElement(['Pending', 'Accepted', 'Rejected']),
          createdAt: getRandomDate(new Date(job.createdAt), new Date()),
          updatedAt: new Date()
        });
        
        await application.save();
        applications.push(application);
        
        console.log(`Created application from ${candidate.firstName} ${candidate.lastName} for job: ${job.title}`);
      }
    }
    
    console.log('=================');
    console.log('Generation completed successfully!');
    console.log(`Generated ${hrUsers.length} HR users`);
    console.log(`Generated ${companies.length} companies`);
    console.log(`Generated ${jobPosts.length} job posts`);
    console.log(`Generated ${candidateUsers.length} candidate users`);
    console.log(`Generated ${portfolios.length} portfolios`);
    console.log(`Generated ${applications.length} applications`);
    
  } catch (error) {
    console.error('Error generating test data:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the data generation
generateTestData();
