/**
 * Script to add sample blog posts for a specific user
 * Run with: node scripts/add-sample-blogs.js
 */

const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection string
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/TuniHireDB';

// User ID for which to create blogs
const USER_ID = '681b12c7d0e29e3bb1a92ad4';

// Sample blog data
const sampleBlogs = [
  {
    title: 'Mastering the Technical Interview: Top 10 Tips',
    content: `
# Mastering the Technical Interview: Top 10 Tips

Technical interviews can be intimidating, but with the right preparation, you can approach them with confidence. Here are my top 10 tips for acing your next technical interview:

## 1. Understand the Fundamentals

Make sure you have a solid grasp of computer science fundamentals like data structures, algorithms, and system design. These concepts form the foundation of technical interviews.

## 2. Practice Problem-Solving Out Loud

Get comfortable explaining your thought process as you solve problems. Practice "thinking out loud" while coding to give interviewers insight into your problem-solving approach.

## 3. Study the Company's Tech Stack

Research the company's technology stack and familiarize yourself with their tools and frameworks. This shows initiative and helps you understand what skills they value.

## 4. Prepare for Behavioral Questions

Technical skills aren't everything. Be ready to discuss your past experiences, challenges you've overcome, and how you work in a team.

## 5. Review Your Own Projects

Be prepared to explain projects on your resume in detail. Understand the technical decisions you made and be able to justify them.

## 6. Mock Interviews Are Essential

Practice with friends or use online platforms for mock interviews. The more you simulate the real experience, the more comfortable you'll be.

## 7. Ask Thoughtful Questions

Prepare insightful questions about the company's engineering culture, challenges, and growth opportunities. This shows your genuine interest.

## 8. Don't Bluff

If you don't know something, it's better to admit it and explain how you would find the answer rather than making something up.

## 9. Focus on Communication

Clear communication is crucial. Practice explaining complex concepts in simple terms and be mindful of your non-verbal communication.

## 10. Follow Up After the Interview

Send a thank-you email after the interview, expressing your appreciation for the opportunity and reiterating your interest in the position.

Remember, the interview is not just about solving problems correctly—it's about demonstrating how you approach challenges and work with others. Good luck!
    `,
    summary: 'Essential strategies and preparation tips to help you succeed in technical interviews, covering both coding challenges and communication skills.',
    category: 'Career Development',
    tags: ['Interview Tips', 'Technical Interview', 'Career Advice', 'Job Search'],
    image: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    published: true
  },
  {
    title: 'How AI is Transforming the Recruitment Process',
    content: `
# How AI is Transforming the Recruitment Process

The recruitment industry is experiencing a significant shift due to artificial intelligence. AI tools are revolutionizing how companies find, assess, and hire talent. Let's explore the impact of AI on modern recruitment:

## Automated Screening and Matching

AI algorithms can now scan thousands of resumes to identify candidates who best match job requirements. These systems analyze not just keywords but also contextual information, job history patterns, and skill relevance.

## Interview Assistance and Assessment

AI-powered interview tools can conduct initial screening interviews, asking standardized questions and analyzing responses based on language, tone, and content. Some systems even assess facial expressions and body language for a more comprehensive evaluation.

## Reducing Bias in Hiring

When properly implemented, AI can help reduce unconscious bias in the hiring process. By focusing on skills and qualifications rather than demographic factors, AI systems can promote more diverse and inclusive hiring practices.

## Predictive Analytics for Success

AI tools can analyze data from successful employees to predict which candidates are likely to perform well and stay with the company long-term. This helps companies make more informed hiring decisions.

## Improved Candidate Experience

Chatbots and virtual assistants provide immediate responses to candidate queries, schedule interviews, and keep applicants updated on their status. This improves the overall candidate experience and frees up recruiters' time.

## The Human Element Remains Crucial

Despite these technological advances, the human element remains essential in recruitment. AI tools work best when they support recruiters rather than replace them. The final assessment of cultural fit and interpersonal skills still requires human judgment.

## Challenges and Considerations

As we embrace AI in recruitment, we must address challenges like potential algorithmic bias, data privacy concerns, and ensuring technology serves to enhance rather than diminish the human aspects of hiring.

The future of recruitment will likely be a blend of AI efficiency and human insight. By understanding and thoughtfully implementing AI tools, companies can build more effective, fair, and efficient hiring processes while maintaining the personal connection essential to finding the right talent.
    `,
    summary: 'An exploration of how artificial intelligence technologies are revolutionizing recruitment practices, from resume screening to interview assessments, and what this means for job seekers and employers.',
    category: 'Technology Trends',
    tags: ['AI', 'Recruitment', 'HR Tech', 'Future of Work'],
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    published: true
  },
  {
    title: 'Building a Professional Portfolio That Stands Out',
    content: `
# Building a Professional Portfolio That Stands Out

In today's competitive job market, a strong professional portfolio can set you apart from other candidates. Whether you're a designer, developer, writer, or other professional, here's how to create a portfolio that captures attention:

## Start With Your Best Work

Lead with your strongest projects. Quality trumps quantity—it's better to showcase five exceptional pieces than fifteen mediocre ones.

## Tell the Story Behind Each Project

Don't just show the final product. Explain your process, the challenges you faced, and how you overcame them. This gives insight into your problem-solving approach.

## Highlight Results and Impact

Whenever possible, include metrics and results. How did your work affect the client's business? Did it increase conversions, improve user engagement, or solve a critical problem?

## Demonstrate Range and Versatility

While specialization is valuable, showing versatility within your field can make you more marketable. Include projects that demonstrate different skills and approaches.

## Keep Design Clean and Professional

Make your portfolio visually appealing and easy to navigate. The design should complement your work, not distract from it.

## Include Client Testimonials

Social proof is powerful. Include feedback from clients or colleagues about your work ethic, skills, and professionalism.

## Make It Easily Accessible

Ensure your portfolio is responsive and works well on all devices. Consider having both an online portfolio and a downloadable PDF version.

## Update Regularly

Your portfolio should evolve as your skills and experience grow. Set a schedule to review and update it at least quarterly.

## Personalize for Specific Applications

When applying for specific roles, customize which projects you highlight based on the job requirements. This targeted approach shows attention to detail.

## Include a Strong About Me Section

Don't forget the human element. Include a compelling bio that showcases your personality, values, and what drives your work.

A well-crafted portfolio does more than showcase your skills—it tells your professional story. By thoughtfully curating and presenting your work, you can create a portfolio that not only demonstrates your capabilities but also sets you apart in a crowded job market.
    `,
    summary: 'A comprehensive guide to creating an impressive professional portfolio that highlights your skills, showcases your best work, and helps you stand out to potential employers or clients.',
    category: 'Career Development',
    tags: ['Portfolio Development', 'Personal Branding', 'Career Growth', 'Professional Development'],
    image: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    published: true
  }
];

async function addSampleBlogs() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Add author ID to each blog
    const blogsWithAuthor = sampleBlogs.map(blog => ({
      ...blog,
      author: USER_ID
    }));

    // Insert the blogs
    console.log('Adding sample blogs...');
    const result = await Blog.insertMany(blogsWithAuthor);
    console.log(`Successfully added ${result.length} sample blogs for user ${USER_ID}`);

    // Output the created blog IDs
    result.forEach((blog, index) => {
      console.log(`Blog ${index + 1}: ${blog.title} (ID: ${blog._id})`);
    });

  } catch (error) {
    console.error('Error adding sample blogs:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addSampleBlogs();
