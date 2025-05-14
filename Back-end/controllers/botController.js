const Meeting = require('../models/Meeting');
const User = require('../models/User');
const JobPost = require('../models/JobPost');
const WhiteTest = require('../models/WhiteTest');
const Company = require('../models/Company');
const fetch = require('node-fetch');

// Start an HR bot for a meeting
exports.startHRBot = async (req, res) => {
  try {
    const { meeting_id, dev_test_mode, force_new_room } = req.body;
    
    // Validate meeting ID
    if (!meeting_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meeting ID is required' 
      });
    }
    
    console.log(`Starting HR bot for meeting: ${meeting_id}`);
    
    // Get meeting with basic relations
    const meeting = await Meeting.findById(meeting_id)
      .populate('job_id')
      .populate('candidate_id', 'firstName lastName email');
      
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: 'Meeting not found' 
      });
    }
    
    // Populate HR separately
    const hr = await User.findById(meeting.hr_id);
    if (!hr) {
      return res.status(404).json({ 
        success: false, 
        message: 'HR user not found' 
      });
    }
    
    // Check if we should force a new room URL creation
    if (force_new_room) {
      console.log('Force creating a new room URL - ignoring any existing room URL');
      // Continue with API call to create new room
    } else if (meeting.roomUrl) {
      console.log('Using existing room URL:', meeting.roomUrl);
      // Return the existing room URL without making another API call
      return res.status(200).json({
        success: true,
        data: {
          room_url: meeting.roomUrl,
          status: 'reused',
          success: true,
        },
        message: 'Using existing room URL'
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
    
    // Get company info if available
    let companyName = 'the company';
    let companyIndustry = 'technology';
    
    if (hr.companyId) {
      try {
        const company = await Company.findById(hr.companyId);
        if (company) {
          companyName = company.name || companyName;
          companyIndustry = company.industry || companyIndustry;
        }
      } catch (companyError) {
        console.error('Error fetching company data:', companyError);
        // Continue with default values
      }
    }
    
    // Prepare HR name
    const hrName = `${hr.firstName} ${hr.lastName}`;
    
    // Prepare candidate name
    const candidateName = `${meeting.candidate_id.firstName} ${meeting.candidate_id.lastName}`;
    
    // Create the prompt for the HR bot
    const prompt = `You are a virtual HR recruiter named ${hrName} for ${companyName}, which is in the ${companyIndustry} industry. You're interviewing ${candidateName} for the ${meeting.job_id.title} position.

Please start by introducing yourself and explain that you're a virtual HR assistant for ${companyName} conducting this interview. Be professional, friendly, and thorough.

I want you to conduct a structured interview based on this white test:

${whiteTest.content}

Start by welcoming the candidate and making them comfortable. Then proceed with the questions from the white test in a conversational manner. Evaluate their responses and provide feedback.`;

    console.log('Connecting to bot service at: http://127.0.0.1:8010/start-bot');
    
    // Call the bot service
    try {
      const botResponse = await fetch('http://127.0.0.1:8010/start-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          llm_prompt: prompt,
          starting_message: `Hello, I am ${hrName} from ${companyName}. I'll be conducting your interview for the ${meeting.job_id.title} position today.`,
          meeting_id: meeting._id.toString(),
          job_title: meeting.job_id.title,
          company_name: companyName,
          candidate_name: candidateName,
          hr_name: hrName,
          create_new_room: true // Always force creation of a new room URL
        })
      });
      
      if (!botResponse.ok) {
        const errorText = await botResponse.text();
        console.error(`Bot service error (${botResponse.status}): ${errorText}`);
        
        // For dev test mode, provide a simulated response
        if (dev_test_mode) {
          console.log('Using simulated room URL for testing (after API error)');
          const simulatedData = {
            room_url: 'https://tunihire.daily.co/simulated-room-for-testing',
            status: 'started',
            success: true
          };
          
          // Update meeting with room URL
          meeting.roomUrl = simulatedData.room_url;
          await meeting.save();
          
          return res.status(200).json({
            success: true,
            data: simulatedData,
            message: 'HR bot started in simulation mode (API error)'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Bot service returned an error',
          error: `Status ${botResponse.status}: ${errorText}`
        });
      }
      
      const botData = await botResponse.json();
      console.log('Bot service response:', botData);
      
      // Update meeting with room URL if it exists
      if (botData.room_url) {
        meeting.roomUrl = botData.room_url;
        await meeting.save();
      }
      
      return res.status(200).json({
        success: true,
        data: botData,
        message: 'HR bot started successfully'
      });
      
    } catch (fetchError) {
      console.error('Error connecting to bot service:', fetchError.message);
      
      // For development purposes, provide a simulated response if testing mode
      if (dev_test_mode) {
        console.log('Using simulated room URL for testing');
        const simulatedData = {
          room_url: 'https://tunihire.daily.co/simulated-room-for-testing',
          status: 'started',
          success: true
        };
        
        // Update meeting with room URL
        meeting.roomUrl = simulatedData.room_url;
        await meeting.save();
        
        return res.status(200).json({
          success: true,
          data: simulatedData,
          message: 'HR bot started in simulation mode (API unavailable)'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to bot service',
        error: fetchError.message
      });
    }
    
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
    const { meeting_id, dev_test_mode } = req.body;
    
    // Validate meeting ID
    if (!meeting_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meeting ID is required' 
      });
    }
    
    console.log(`Starting preparation bot for meeting: ${meeting_id}`);
    
    // Get meeting with required data
    const meeting = await Meeting.findById(meeting_id)
      .populate('job_id')
      .populate('candidate_id', 'firstName lastName email');
      
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

    console.log('Connecting to bot service at: http://127.0.0.1:8010/start-bot');
    
    // Call the bot service
    try {
      const botResponse = await fetch('http://127.0.0.1:8010/start-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          llm_prompt: prompt,
          starting_message: `Hello ${candidateName}, I am TuniHire AI, your preparation assistant for the ${meeting.job_id.title} position. Let's prepare you for your upcoming interview!`,
          meeting_id: meeting._id.toString(),
          job_title: meeting.job_id.title,
          candidate_name: candidateName,
          is_prep: true,
          create_new_room: true // Always force creation of a new room URL
        })
      });
      
      if (!botResponse.ok) {
        const errorText = await botResponse.text();
        console.error(`Bot service error (${botResponse.status}): ${errorText}`);
        
        // For dev test mode, provide a simulated response
        if (dev_test_mode) {
          console.log('Using simulated room URL for testing (after API error)');
          const simulatedData = {
            room_url: 'https://tunihire.daily.co/simulated-prep-room-for-testing',
            status: 'started',
            success: true
          };
          
          return res.status(200).json({
            success: true,
            data: simulatedData,
            message: 'Preparation bot started in simulation mode (API error)'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Bot service returned an error',
          error: `Status ${botResponse.status}: ${errorText}`
        });
      }
      
      const botData = await botResponse.json();
      console.log('Bot service response:', botData);
      
      // Update meeting with room URL if it exists for prep bot too
      if (botData.room_url) {
        console.log(`Saving room URL to meeting: ${botData.room_url}`);
        meeting.roomUrl = botData.room_url;
        await meeting.save();
      } else {
        console.warn('Room URL not found in bot response');
      }
      
      return res.status(200).json({
        success: true,
        data: botData,
        message: 'Preparation bot started successfully'
      });
      
    } catch (fetchError) {
      console.error('Error connecting to bot service:', fetchError.message);
      
      // For development purposes, provide a simulated response
      if (dev_test_mode) {
        console.log('Using simulated room URL for testing');
        const simulatedData = {
          room_url: 'https://tunihire.daily.co/simulated-prep-room-for-testing',
          status: 'started',
          success: true
        };
        
        return res.status(200).json({
          success: true,
          data: simulatedData,
          message: 'Preparation bot started in simulation mode (API unavailable)'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to bot service',
        error: fetchError.message
      });
    }
    
  } catch (error) {
    console.error('Error starting preparation bot:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start preparation bot',
      error: error.message
    });
  }
};
