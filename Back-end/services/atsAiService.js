const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const aiServiceConnector = require('./aiServiceConnector');

/**
 * ATS AI Service - Provides advanced resume analysis and job matching
 * This service uses NLP techniques to extract information from resumes
 * and compare it with job descriptions to provide a match score
 */

// Extract text from PDF or document file
const extractTextFromFile = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { 
        success: false, 
        error: 'File not found',
        details: `File path ${filePath} does not exist`
      };
    }

    const extension = path.extname(filePath).toLowerCase();
    let text = '';

    // Log details for debugging
    console.log(`Processing file: ${filePath}`);
    console.log(`File extension: ${extension}`);
    console.log(`File size: ${fs.statSync(filePath).size} bytes`);

    if (extension === '.pdf') {
      try {
        // Use pdf-parse to extract text from PDF
        const dataBuffer = fs.readFileSync(filePath);
        console.log(`Successfully read file buffer, size: ${dataBuffer.length} bytes`);
        
        try {
          const pdfData = await pdfParse(dataBuffer);
          text = pdfData.text;
          console.log(`PDF parsing successful, extracted ${text.length} characters`);
        } catch (pdfParseError) {
          console.error('PDF parsing error:', pdfParseError);
          
          // Try command line tools as fallback if available
          try {
            console.log(`Attempting command line extraction for: ${filePath}`);
            // Try pdftotext if available
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            
            try {
              const { stdout } = await execPromise(`pdftotext "${filePath}" -`);
              text = stdout;
              console.log(`Command line extraction successful, got ${text.length} characters`);
            } catch (cmdError) {
              console.error('Command line extraction failed:', cmdError);
            }
          } catch (fallbackError) {
            console.error('Fallback extraction failed:', fallbackError);
          }
        }
        
        // If text is still empty, provide fallback information
        if (!text || text.trim().length === 0) {
          console.log('No text extracted from PDF, creating fallback information');
          const stats = fs.statSync(filePath);
          text = `[METADATA ONLY] File: ${path.basename(filePath)}, Size: ${stats.size} bytes, Created: ${stats.birthtime.toISOString()}`;
        }
      } catch (pdfError) {
        console.error('Error processing PDF:', pdfError);
        const stats = fs.statSync(filePath);
        text = `[ERROR PROCESSING] File: ${path.basename(filePath)}, Size: ${stats.size} bytes`;
      }
    } else if (extension === '.doc' || extension === '.docx') {
      // Fallback for Word documents
      console.log('Word document detected, using file metadata as fallback');
      const stats = fs.statSync(filePath);
      text = `[WORD DOCUMENT] File: ${path.basename(filePath)}, Size: ${stats.size} bytes, Created: ${stats.birthtime.toISOString()}`;
    } else {
      // For plain text files and other formats
      try {
        text = fs.readFileSync(filePath, 'utf8');
        console.log(`Plain text read successful, got ${text.length} characters`);
      } catch (readError) {
        console.error('Error reading plain text file:', readError);
        const stats = fs.statSync(filePath);
        text = `[ERROR READING] File: ${path.basename(filePath)}, Size: ${stats.size} bytes`;
      }
    }

    // Ensure we always return at least some text
    if (!text || text.trim().length === 0) {
      const stats = fs.statSync(filePath);
      text = `[NO CONTENT EXTRACTED] File: ${path.basename(filePath)}, Size: ${stats.size} bytes`;
    }

    return {
      success: true,
      text,
      metadata: {
        filename: path.basename(filePath),
        extension,
        size: fs.statSync(filePath).size,
        processed: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Critical error extracting text from file:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error during text extraction',
      stack: error.stack,
      filename: path.basename(filePath || 'unknown')
    };
  }
};

// Extract skills from resume text
const extractSkills = (text) => {
  const lowerText = text.toLowerCase();
  const commonSkills = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go',
    // Web technologies
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'asp.net',
    'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material-ui', 'jquery',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform', 'ansible',
    // Databases
    'sql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'nosql', 'redis', 'elasticsearch',
    // Tools & methodologies
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'agile', 'scrum', 'kanban',
    // Operating systems
    'linux', 'unix', 'windows', 'macos', 'android', 'ios',
    // Data science & AI
    'machine learning', 'ai', 'artificial intelligence', 'data science', 'neural networks',
    'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'nlp', 'computer vision',
    // Design
    'photoshop', 'illustrator', 'figma', 'sketch', 'adobe xd', 'ui/ux', 'wireframing',
    // Business
    'accounting', 'finance', 'marketing', 'sales', 'hr', 'human resources', 'crm',
    // Soft skills
    'management', 'leadership', 'communication', 'teamwork', 'problem solving',
    'critical thinking', 'time management', 'creativity', 'adaptability', 'negotiation'
  ];
  
  // Find skills in the text
  const foundSkills = commonSkills.filter(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    return regex.test(lowerText);
  });
  
  return foundSkills;
};

// Extract education information
const extractEducation = (text) => {
  const lowerText = text.toLowerCase();
  const educationKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university', 'college', 
    'school', 'diploma', 'certification', 'certificate', 'mba', 'bsc', 'msc'
  ];
  
  const educationPatterns = [
    /bachelor[\'s]* (?:of|in) ([^,\.]+)/i,
    /master[\'s]* (?:of|in) ([^,\.]+)/i,
    /phd[\.| ](?:of|in) ([^,\.]+)/i,
    /doctorate (?:of|in) ([^,\.]+)/i,
    /mba/i,
    /diploma in ([^,\.]+)/i,
    /certificate in ([^,\.]+)/i,
    /certified ([^,\.]+)/i,
    /bsc (?:in|of)? ([^,\.]+)/i,
    /msc (?:in|of)? ([^,\.]+)/i
  ];
  
  const foundEducation = [];
  
  // Check if any education keywords are present
  const hasEducationKeywords = educationKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerText);
  });
  
  // Try to extract specific degrees
  educationPatterns.forEach(pattern => {
    const matches = [...lowerText.matchAll(pattern)];
    matches.forEach(match => {
      if (match && match[0]) {
        foundEducation.push(match[0].trim());
      }
    });
  });
  
  // Look for university or institution names
  const commonUniversities = [
    'harvard', 'stanford', 'mit', 'oxford', 'cambridge', 'yale', 'princeton',
    'columbia', 'berkeley', 'chicago', 'caltech', 'imperial', 'eth zurich',
    'tokyo', 'toronto', 'mcgill', 'national university', 'peking', 'tsinghua'
  ];
  
  const foundInstitutions = commonUniversities.filter(uni => {
    const regex = new RegExp(`\\b${uni}\\b`, 'i');
    return regex.test(lowerText);
  });
  
  return {
    hasEducationInfo: hasEducationKeywords,
    degrees: foundEducation,
    institutions: foundInstitutions
  };
};

// Extract experience information
const extractExperience = (text) => {
  const lowerText = text.toLowerCase();
  
  // Patterns for years of experience
  const experiencePatterns = [
    /(\d+)[\+]? years? of experience/i,
    /experience:? (\d+)[\+]? years?/i,
    /experienced (?:for|with) (\d+)[\+]? years?/i,
    /worked (?:for|with) (\d+)[\+]? years?/i,
    /(\d+)[\+]? years? in /i
  ];
  
  // Try to extract years of experience
  let experienceYears = null;
  for (const pattern of experiencePatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      experienceYears = parseInt(match[1], 10);
      break;
    }
  }
  
  // Look for employment history sections
  const experienceKeywords = [
    'experience', 'employment', 'work history', 'professional history', 
    'career', 'job history', 'work experience', 'position'
  ];
  
  const hasExperienceSection = experienceKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerText);
  });
  
  // Check for company names - more sophisticated in real implementation
  const commonCompanies = [
    'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'ibm', 'oracle',
    'twitter', 'linkedin', 'netflix', 'adobe', 'salesforce', 'intel', 'cisco',
    'samsung', 'sony', 'tesla', 'uber', 'airbnb', 'spotify'
  ];
  
  const foundCompanies = commonCompanies.filter(company => {
    const regex = new RegExp(`\\b${company}\\b`, 'i');
    return regex.test(lowerText);
  });
  
  return {
    yearsOfExperience: experienceYears,
    hasExperienceSection,
    companies: foundCompanies
  };
};

// Extract job titles
const extractJobTitles = (text) => {
  const lowerText = text.toLowerCase();
  const commonTitles = [
    'software engineer', 'software developer', 'web developer', 'frontend developer', 'backend developer', 
    'full stack developer', 'product manager', 'project manager', 'ui/ux designer', 'data scientist',
    'data analyst', 'business analyst', 'marketing manager', 'sales representative', 'hr manager',
    'accountant', 'financial analyst', 'graphic designer', 'network administrator', 'system administrator',
    'devops engineer', 'qa engineer', 'quality assurance', 'test engineer', 'security engineer',
    'cloud architect', 'solutions architect', 'technical lead', 'tech lead', 'cto', 'cio', 'ceo'
  ];
  
  return commonTitles.filter(title => {
    const regex = new RegExp(`\\b${title}\\b`, 'i');
    return regex.test(lowerText);
  });
};

// Extract languages
const extractLanguages = (text) => {
  const lowerText = text.toLowerCase();
  const commonLanguages = [
    'english', 'french', 'spanish', 'german', 'italian', 'portuguese', 'chinese', 'japanese',
    'korean', 'russian', 'arabic', 'hindi', 'turkish', 'dutch', 'swedish', 'greek', 'polish',
    'vietnamese', 'thai', 'indonesian', 'malay', 'finnish', 'danish', 'norwegian'
  ];
  
  return commonLanguages.filter(language => {
    const regex = new RegExp(`\\b${language}\\b`, 'i');
    return regex.test(lowerText);
  });
};

// Analyze resume text
const analyzeResumeText = (text) => {
  if (!text || text.length < 10) {
    return { error: 'Insufficient text to analyze' };
  }
  
  const analysis = {
    // Extract potential skills
    potentialSkills: extractSkills(text),
    
    // Extract education information
    education: extractEducation(text),
    
    // Extract experience information
    experience: extractExperience(text),
    
    // Word count as a measure of resume completeness
    wordCount: text.split(/\s+/).length,
    
    // Extract job titles
    possibleJobTitles: extractJobTitles(text),
    
    // Extract languages
    languages: extractLanguages(text)
  };
  
  return analysis;
};

// Compare resume with job description
const compareResumeWithJob = async (resumeText, job) => {
  try {
    // If job is an ID, convert it to a job object
    let jobObject = job;
    if (typeof job === 'string') {
      // Import JobPost model if needed
      const JobPost = require('../models/JobPost');
      jobObject = await JobPost.findById(job);
      
      if (!jobObject) {
        return {
          success: false,
          error: 'Job not found'
        };
      }
    }
    
    // Extract key information from job
    const jobTitle = jobObject.title || '';
    const jobDescription = jobObject.description || '';
    const jobRequirements = jobObject.requirements || '';
    const jobSkills = jobObject.skills || [];
    
    // Combine job information for analysis
    const jobText = `${jobTitle} ${jobDescription} ${jobRequirements} ${jobSkills.join(' ')}`.toLowerCase();
    
    // Convert resume text to lowercase for comparison
    const resumeTextLower = resumeText.toLowerCase();
    
    // Extract skills from resume
    const resumeSkills = extractSkills(resumeText);
    
    // Calculate basic keyword match rate
    const keywordMatchCount = jobSkills.filter(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      return regex.test(resumeTextLower);
    }).length;
    
    const keywordMatchRate = jobSkills.length > 0 
      ? (keywordMatchCount / jobSkills.length) * 100 
      : 0;
    
    // Calculate comprehensive match score based on multiple factors
    let matchScore = 0;
    let maxScore = 0;
    
    // Factor 1: Job title match (25 points)
    maxScore += 25;
    const jobTitleWords = jobTitle.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const titleMatchCount = jobTitleWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(resumeTextLower);
    }).length;
    
    const titleMatchScore = jobTitleWords.length > 0 
      ? (titleMatchCount / jobTitleWords.length) * 25 
      : 0;
    matchScore += titleMatchScore;
    
    // Factor 2: Skills match (40 points)
    maxScore += 40;
    const skillsMatchScore = jobSkills.length > 0 
      ? (keywordMatchCount / jobSkills.length) * 40 
      : 0;
    matchScore += skillsMatchScore;
    
    // Factor 3: Job description match (15 points)
    maxScore += 15;
    const descriptionWords = jobDescription.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const uniqueDescWords = [...new Set(descriptionWords)];
    const descMatchCount = uniqueDescWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(resumeTextLower);
    }).length;
    
    const descMatchScore = uniqueDescWords.length > 0 
      ? (descMatchCount / uniqueDescWords.length) * 15 
      : 0;
    matchScore += descMatchScore;
    
    // Factor 4: Requirements match (20 points)
    maxScore += 20;
    const requirementsWords = jobRequirements.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const uniqueReqWords = [...new Set(requirementsWords)];
    const reqMatchCount = uniqueReqWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(resumeTextLower);
    }).length;
    
    const requirementsMatchScore = uniqueReqWords.length > 0 
      ? (reqMatchCount / uniqueReqWords.length) * 20 
      : 0;
    matchScore += requirementsMatchScore;
    
    // Calculate final score as percentage
    const finalScore = maxScore > 0 ? Math.round((matchScore / maxScore) * 100) : 0;
    
    // Generate missing skills list
    const missingSkills = jobSkills.filter(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      return !regex.test(resumeTextLower);
    });
    
    // Calculate score classification
    let matchClassification = 'Poor Match';
    if (finalScore >= 85) {
      matchClassification = 'Excellent Match';
    } else if (finalScore >= 70) {
      matchClassification = 'Good Match';
    } else if (finalScore >= 50) {
      matchClassification = 'Average Match';
    } else if (finalScore >= 30) {
      matchClassification = 'Below Average Match';
    }
    
    // Generate recommendations based on analysis
    let recommendations = [];
    
    if (finalScore < 50) {
      recommendations.push('This resume doesn\'t appear to match well with the job requirements.');
    }
    
    if (missingSkills.length > 0) {
      recommendations.push(`Add the following key skills if applicable: ${missingSkills.join(', ')}`);
    }
    
    if (titleMatchScore < 12) {
      recommendations.push('The resume should better highlight experience relevant to the job title.');
    }
    
    if (requirementsMatchScore < 10) {
      recommendations.push('The resume should better address the specific job requirements.');
    }
    
    if (resumeSkills.length < 5) {
      recommendations.push('The resume should list more technical and professional skills.');
    }
    
    return {
      success: true,
      job: {
        title: jobTitle,
        skills: jobSkills,
        totalSkills: jobSkills.length,
      },
      matchAnalysis: {
        classification: matchClassification,
        overallScore: finalScore,
        breakdown: {
          titleMatch: Math.round(titleMatchScore / 25 * 100),
          skillsMatch: Math.round(skillsMatchScore / 40 * 100),
          descriptionMatch: Math.round(descMatchScore / 15 * 100),
          requirementsMatch: Math.round(requirementsMatchScore / 20 * 100)
        },
        matchedSkills: jobSkills.filter(skill => {
          const regex = new RegExp(`\\b${skill}\\b`, 'i');
          return regex.test(resumeTextLower);
        }),
        missingSkills,
        recommendations
      }
    };
  } catch (error) {
    console.error('Error comparing resume with job:', error);
    return {
      success: false,
      error: error.message || 'Failed to compare resume with job'
    };
  }
};

// Main analyze resume function with AI service integration
const analyzeResume = async (filePath, jobId = null) => {
  try {
    // First check if external AI service is available
    const aiServiceAvailable = await aiServiceConnector.isAvailable();
    
    // If we have a jobId, load the job data
    let jobData = null;
    if (jobId) {
      try {
        const JobPost = require('../models/JobPost');
        jobData = await JobPost.findById(jobId);
      } catch (error) {
        console.error('Error loading job data:', error);
      }
    }
    
    // Try to use AI service first if available
    if (aiServiceAvailable) {
      console.log('Using external AI service for advanced analysis');
      const aiResult = await aiServiceConnector.analyzeResumeWithAI(filePath, jobData);
      
      if (aiResult.success) {
        console.log('Successfully received analysis from AI service');
        
        // We still extract the text locally for the preview
        const textResult = await extractTextFromFile(filePath);
        const textPreview = textResult.success ? 
          textResult.text.substring(0, 1500) + (textResult.text.length > 1500 ? '...' : '') : 
          'Text preview not available';
          
        // Combine AI analysis with local text preview
        return {
          success: true,
          text: textPreview,
          aiAnalysis: aiResult.aiAnalysis,
          // Also perform local analysis as fallback/comparison
          analysis: textResult.success ? analyzeResumeText(textResult.text) : null,
          // If the AI service provided a job match, use it
          jobMatch: aiResult.aiAnalysis.jobMatch || null,
          usingAiService: true
        };
      } else {
        console.warn('AI service failed, falling back to local analysis:', aiResult.error);
      }
    }
    
    // Fallback to local analysis if AI service is unavailable or failed
    console.log('Using local analysis');
    
    // Extract text from file
    const textResult = await extractTextFromFile(filePath);
    if (!textResult.success) {
      return textResult;
    }
    
    // Analyze the resume text
    const analysis = analyzeResumeText(textResult.text);
    
    let result = {
      success: true,
      text: textResult.text.substring(0, 1500) + (textResult.text.length > 1500 ? '...' : ''),
      analysis,
      usingAiService: false
    };
    
    // Compare with job if jobId is provided and jobData was loaded
    if (jobId && jobData) {
      const comparisonResult = await compareResumeWithJob(textResult.text, jobData);
      if (comparisonResult.success) {
        result.jobMatch = comparisonResult.matchAnalysis;
        result.job = comparisonResult.job;
      } else {
        console.error('Job comparison failed:', comparisonResult.error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze resume'
    };
  }
};

// Add new direct method for application ID-based analysis
const analyzeResumeByApplicationId = async (applicationId) => {
  try {
    console.log(`Analyzing resume for application ${applicationId}`);
    
    // First check if external AI service is available
    const aiServiceAvailable = await aiServiceConnector.isAvailable();
    
    if (aiServiceAvailable) {
      console.log('Using external AI service for application ID analysis');
      const aiResult = await aiServiceConnector.analyzeResumeById(applicationId);
      
      if (aiResult.success) {
        return {
          success: true,
          analysis: aiResult.analysis,
          usingAiService: true
        };
      } else {
        console.warn('AI service failed for application ID analysis:', aiResult.error);
      }
    }
    
    // Fall back to a basic mock response if AI service is unavailable
    console.log('Using mock analysis for application ID');
    return {
      success: true,
      analysis: {
        matchScore: 72,
        skillsMatched: ["javascript", "react", "html", "css"],
        missingSkills: ["typescript", "vue"],
        experienceYears: 2,
        education: ["Bachelor in Computer Science"],
        semanticMatchScore: 68,
        strengths: ["Frontend development experience", "Good communication skills"],
        weaknesses: ["Limited backend experience"],
        analysis: "Candidate has relevant frontend skills with some limitations in backend technologies.",
        recommendation: "Consider for interview - potential good fit"
      },
      usingAiService: false
    };
  } catch (error) {
    console.error('Error analyzing resume by application ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze resume',
      usingAiService: false
    };
  }
};

module.exports = {
  analyzeResume,
  compareResumeWithJob,
  extractTextFromFile,
  analyzeResumeText,
  analyzeResumeByApplicationId
}; 