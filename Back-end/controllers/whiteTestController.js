const WhiteTest = require('../models/WhiteTest');
const Job = require('../models/Job');
const config = require('../config/config');
const fetch = require('node-fetch');

// Get white test for a specific job
exports.getWhiteTestByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find white test by job_id
    const whiteTest = await WhiteTest.findOne({ job_id: jobId }).populate('job_id');
    
    if (!whiteTest) {
      return res.status(404).json({
        success: false,
        message: 'White test not found for this job'
      });
    }
    
    res.status(200).json({
      success: true,
      data: whiteTest
    });
  } catch (error) {
    console.error('Error getting white test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get white test',
      error: error.message
    });
  }
};

// Create a new white test
exports.createWhiteTest = async (req, res) => {
  try {
    const { job_id, content } = req.body;
    const userId = req.user._id; // Get user ID from authenticated user
    
    // Check if job exists
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if white test already exists for this job
    const existingTest = await WhiteTest.findOne({ job_id });
    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: 'White test already exists for this job'
      });
    }
    
    // Create new white test
    const newWhiteTest = new WhiteTest({
      job_id,
      content,
      createdBy: userId
    });
    
    // Save white test
    const savedWhiteTest = await newWhiteTest.save();
    
    res.status(201).json({
      success: true,
      message: 'White test created successfully',
      data: savedWhiteTest
    });
  } catch (error) {
    console.error('Error creating white test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create white test',
      error: error.message
    });
  }
};

// Update an existing white test
exports.updateWhiteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Find white test by ID
    const whiteTest = await WhiteTest.findById(id);
    
    if (!whiteTest) {
      return res.status(404).json({
        success: false,
        message: 'White test not found'
      });
    }
    
    // Update white test content
    whiteTest.content = content;
    whiteTest.updated_at = Date.now();
    
    // Save updated white test
    const updatedWhiteTest = await whiteTest.save();
    
    res.status(200).json({
      success: true,
      message: 'White test updated successfully',
      data: updatedWhiteTest
    });
  } catch (error) {
    console.error('Error updating white test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update white test',
      error: error.message
    });
  }
};

// Delete a white test
exports.deleteWhiteTest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete white test
    const deletedWhiteTest = await WhiteTest.findByIdAndDelete(id);
    
    if (!deletedWhiteTest) {
      return res.status(404).json({
        success: false,
        message: 'White test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'White test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting white test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete white test',
      error: error.message
    });
  }
};

// Generate a white test using Gemini API directly
exports.generateWhiteTest = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Find job to get its details
    const job = await Job.findById(jobId).populate('companyId', 'name industry'); 
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Construct prompt with job details
    const prompt = `Create a comprehensive white test for a ${job.title} position in the ${job.companyId.industry || 'tech'} industry.
    
Job Description: ${job.description}
Required Skills: ${job.skills ? job.skills.join(', ') : 'Not specified'}
Experience Required: ${job.experienceLevel || 'Not specified'}
Employment Type: ${job.employmentType || 'Full-time'}
Workplace Type: ${job.workplaceType || 'On-site'}

Please generate a formal white test document that includes:
1. Technical assessment questions (5-7 questions)
2. Problem-solving scenarios (2-3 scenarios)
3. Role-specific knowledge questions (5-7 questions)
4. At least one practical exercise or coding challenge (if applicable)
5. Include clear instructions for candidates

Format the response with proper headings and numbering.`;

    try {
      // Get API key from config
      const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
      
      // Call Gemini API directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      
      // Extract generated text from response
      const generatedText = responseData.candidates[0].content.parts[0].text;
      
      res.status(200).json({
        success: true,
        data: {
          generatedContent: generatedText,
          jobTitle: job.title,
          jobId: job._id
        }
      });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      res.status(500).json({
        success: false,
        message: 'Failed to generate white test with AI',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Error in white test generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process white test generation',
      error: error.message
    });
  }
};
