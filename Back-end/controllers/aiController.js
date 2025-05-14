const axios = require('axios');

// Get Gemini API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Check if API key is available
if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables');
}

/**
 * Analyze candidate resume and portfolio data using Gemini AI
 */
const analyzeResume = async (req, res) => {
  try {
    const { userData, portfolioData } = req.body;
    
    if (!userData || !portfolioData) {
      return res.status(400).json({
        success: false,
        message: "User and portfolio data are required"
      });
    }

    // Create a prompt with all candidate information
    const prompt = `
    Response as a Professional Resume Analyser in TuniHire Website with a complete report about this candidate:
    
    CANDIDATE INFO:
    Name: ${userData.firstName} ${userData.lastName}
    Email: ${userData.email}
    ${userData.phone ? `Phone: ${userData.phone}` : ''}
    ${userData.location ? `Location: ${userData.location}` : ''}
    
    ABOUT:
    ${portfolioData.about || "No about information provided."}
    
    SKILLS:
    ${portfolioData.skills ? portfolioData.skills.join(", ") : "No skills provided."}
    
    EDUCATION:
    ${portfolioData.education && portfolioData.education.length > 0 
      ? portfolioData.education.map(edu => 
        `- ${edu.degree} in ${edu.fieldOfStudy || "Not specified"} at ${edu.school}, ${edu.startDate ? new Date(edu.startDate).getFullYear() : ""} ${edu.endDate ? `- ${new Date(edu.endDate).getFullYear()}` : edu.currentlyEnrolled ? "- Present" : ""}`
      ).join("\\n")
      : "No education details provided."
    }
    
    EXPERIENCE:
    ${portfolioData.experience && portfolioData.experience.length > 0 
      ? portfolioData.experience.map(exp => 
        `- ${exp.position} at ${exp.company}, ${exp.location || ""}, ${exp.startDate ? new Date(exp.startDate).getFullYear() : ""} ${exp.endDate ? `- ${new Date(exp.endDate).getFullYear()}` : exp.currentlyWorking ? "- Present" : ""}\\n  ${exp.description || ""}`
      ).join("\\n")
      : "No work experience provided."
    }
    
    PROJECTS:
    ${portfolioData.projects && portfolioData.projects.length > 0 
      ? portfolioData.projects.map(project => 
        `- ${project.title}: ${project.description}\\n  Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(", ") : project.technologies || "Not specified"}`
      ).join("\\n") 
      : "No projects provided."
    }
    
    CERTIFICATES:
    ${portfolioData.certificates && portfolioData.certificates.length > 0 
      ? portfolioData.certificates.map(cert => 
        `- ${cert.title}\\n  ${cert.description || ""}`
      ).join("\\n")
      : "No certificates provided."
    }
    
    Based on the candidate's profile, provide a detailed professional analysis including:
    1. Overall impression and candidate summary
    2. Strengths and areas of expertise
    3. Technical skills assessment
    4. Experience evaluation
    5. Education assessment
    6. Areas for improvement or skills that could complement their profile
    7. Potential job roles they might be well-suited for
    8. A final score from 1-100 with detailed justification
    
    Format your answer with clear headings, short and insightful paragraphs, and use professional language.
    `;

    // Make direct API call to Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        }
      }
    );

    // Extract the text from Gemini's response
    const text = response.data.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      analysis: text
    });
  } catch (error) {
    console.error("Error analyzing resume with AI:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze resume",
      error: error.message
    });
  }
};

module.exports = {
  analyzeResume
};
