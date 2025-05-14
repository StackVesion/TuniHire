const Meeting = require('../models/Meeting');
const User = require('../models/User');
const JobPost = require('../models/JobPost');
const WhiteTest = require('../models/WhiteTest');
const fetch = require('node-fetch');

// Start an HR bot for a meeting
exports.startHRBot = async (req, res) => {
  try {
    const { meeting_id } = req.body;
    
    // Validate meeting ID
    if (!meeting_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meeting ID is required' 
      });
    }
    
    // Get meeting with all related data
    const meeting = await Meeting.findById(meeting_id)
      .populate('job_id')
      .populate('candidate_id', 'firstName lastName email profilePicture')
      .populate({
        path: 'hr_id', 
        model: 'User',
        select: 'firstName lastName email profilePicture companyId',
        populate: {
          path: 'companyId',
          model: 'Company',
          select: 'name industry'
        }
      });
      
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: 'Meeting not found' 
      });
    }
    
    // Get the white test for this job
    const whiteTest = await WhiteTest.findOne({ job_id: meeting.job_id._id });
    
    if (!whiteTest) {
      return res.status(404).json({ 
        success: false, 
        message: 'White test not found for this job' 
      });
    }
    
    // Prepare HR name and company
    const hrName = `${meeting.hr_id.firstName} ${meeting.hr_id.lastName}`;
    const companyName = meeting.hr_id.companyId ? meeting.hr_id.companyId.name : 'the company';
    const companyIndustry = meeting.hr_id.companyId ? meeting.hr_id.companyId.industry : 'technology';
    
    // Prepare candidate name
    const candidateName = `${meeting.candidate_id.firstName} ${meeting.candidate_id.lastName}`;
    
    // Create the prompt for the HR bot
    const prompt = `You are a virtual HR recruiter named ${hrName} for ${companyName}, which is in the ${companyIndustry} industry. You're interviewing ${candidateName} for the ${meeting.job_id.title} position.

Please start by introducing yourself and explain that you're a virtual HR assistant for ${companyName} conducting this interview. Be professional, friendly, and thorough.

I want you to conduct a structured interview based on this white test:

${whiteTest.content}

Start by welcoming the candidate and making them comfortable. Then proceed with the questions from the white test in a conversational manner. Evaluate their responses and provide feedback.`;

    // Call the bot service
    const botResponse = await fetch('http://localhost:8001/start-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: prompt,
        meeting_id: meeting._id,
        job_title: meeting.job_id.title,
        company_name: companyName,
        candidate_name: candidateName,
        hr_name: hrName
      })
    });
    
    if (!botResponse.ok) {
      const errorData = await botResponse.json();
      throw new Error(`Bot service error: ${JSON.stringify(errorData)}`);
    }
    
    const botData = await botResponse.json();
    
    // Update meeting with room URL
    meeting.roomUrl = botData.room_url;
    await meeting.save();
    
    return res.status(200).json({
      success: true,
      data: botData,
      message: 'HR bot started successfully'
    });
  } catch (error) {
    console.error('Error starting HR bot:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start HR bot',
      error: error.message
    });
  }
};

// Start a preparation bot for a candidate
exports.startPrepBot = async (req, res) => {
  try {
    const { meeting_id } = req.body;
    
    // Validate meeting ID
    if (!meeting_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meeting ID is required' 
      });
    }
    
    // Get meeting with all related data
    const meeting = await Meeting.findById(meeting_id)
      .populate('job_id')
      .populate('candidate_id', 'firstName lastName email profilePicture');
      
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: 'Meeting not found' 
      });
    }
    
    // Prepare candidate name
    const candidateName = `${meeting.candidate_id.firstName} ${meeting.candidate_id.lastName}`;
    
    // Create the prompt for the preparation bot
    const prompt = `You are TuniHire AI, a preparation assistant helping ${candidateName} get ready for a job interview for the ${meeting.job_id.title} position.

Start by introducing yourself as TuniHire AI and explain that you'll be helping the candidate prepare for their upcoming interview. Be supportive, encouraging, and professional.

Cover the following aspects:
1. Common interview questions for the ${meeting.job_id.title} role
2. How to structure answers using the STAR method (Situation, Task, Action, Result)
3. Tips for demonstrating technical skills and soft skills
4. Questions the candidate might want to ask the interviewer
5. Tips for body language and presentation in a virtual interview

Ask the candidate what specific areas they'd like to focus on in their preparation and provide tailored advice.`;

    // Call the bot service
    const botResponse = await fetch('http://localhost:8001/start-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: prompt,
        meeting_id: meeting._id,
        job_title: meeting.job_id.title,
        candidate_name: candidateName,
        is_prep: true
      })
    });
    
    if (!botResponse.ok) {
      const errorData = await botResponse.json();
      throw new Error(`Bot service error: ${JSON.stringify(errorData)}`);
    }
    
    const botData = await botResponse.json();
    
    return res.status(200).json({
      success: true,
      data: botData,
      message: 'Preparation bot started successfully'
    });
  } catch (error) {
    console.error('Error starting preparation bot:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start preparation bot',
      error: error.message
    });
  }
};
