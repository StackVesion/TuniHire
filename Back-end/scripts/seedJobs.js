const mongoose = require('mongoose');
const JobPost = require('../models/JobPost');
const Company = require('../models/Company');
require('dotenv').config({ path: '../.env' });

const seedJobs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tunihire');
    console.log('Connected to MongoDB');

    // Check existing jobs
    const jobCount = await JobPost.countDocuments();
    console.log(`Found ${jobCount} existing jobs`);

    // Get a company to associate with jobs
    const company = await Company.findOne();
    if (!company) {
      console.log('No company found. Please create a company first.');
      process.exit(1);
    }

    // Only seed if no jobs exist
    if (jobCount === 0) {
      const testJobs = [
        {
          title: "Full Stack Developer",
          description: "We are looking for an experienced Full Stack Developer to join our dynamic team.",
          requirements: ["JavaScript", "React", "Node.js", "MongoDB"],
          salaryRange: "50000-70000 TND",
          location: "Tunis",
          workplaceType: "Remote",
          companyId: company._id
        },
        {
          title: "UX/UI Designer",
          description: "Join our design team to create exceptional user experiences.",
          requirements: ["Figma", "Adobe XD", "User Research", "Prototyping"],
          salaryRange: "40000-55000 TND",
          location: "Sfax",
          workplaceType: "Hybrid",
          companyId: company._id
        },
        {
          title: "DevOps Engineer",
          description: "Looking for a DevOps engineer to improve our deployment processes.",
          requirements: ["Docker", "Kubernetes", "AWS", "CI/CD"],
          salaryRange: "60000-80000 TND",
          location: "Sousse",
          workplaceType: "Office",
          companyId: company._id
        }
      ];

      await JobPost.insertMany(testJobs);
      console.log('Test jobs created successfully!');
    }

  } catch (error) {
    console.error('Error seeding jobs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeding function
seedJobs().catch(console.error);
