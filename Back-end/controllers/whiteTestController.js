const WhiteTest = require('../models/WhiteTest');
const Job = require('../models/JobPost'); // Fixed model path
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
    
    // Get user ID from authenticated user - handle different JWT token formats
    const userId = req.user._id || req.user.userId || req.user.id;
    
    console.log('Creating white test with user ID:', userId, 'for job:', job_id);
    
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
    console.log('Generating white test for job ID:', jobId);
    
    // Find job to get its details
    const job = await Job.findById(jobId).populate('companyId', 'name industry'); 
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    console.log('Job found:', job.title);
    
    // Construct prompt with job details
    const prompt = `Create a comprehensive white test for a ${job.title} position in the ${job.companyId?.industry || 'tech'} industry.
    
Job Description: ${job.description || 'Not provided'}
Required Skills: ${job.skills && job.skills.length ? job.skills.join(', ') : 'Not specified'}
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

    // Get API key from config
    const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
    
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured. Check server environment variables.'
      });
    }
    
    console.log('Using Gemini API key:', apiKey ? '✓ Key exists' : '✗ Key missing');
    
    try {
      console.log('Making request to Gemini API...');
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
      
      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Gemini API Error: ${JSON.stringify(errorData)}`;
          console.error('Error data:', errorData);
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Received Gemini API response data', responseData ? '✓ Data received' : '✗ No data');
      
      // Extract generated text from response
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts) {
        console.error('Invalid response format from Gemini API:', responseData);
        throw new Error('Invalid response format from Gemini API');
      }
      
      const generatedText = responseData.candidates[0].content.parts[0].text;
      
      if (!generatedText) {
        throw new Error('No text was generated from the API');
      }
      
      console.log('Successfully generated white test content');
      
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
