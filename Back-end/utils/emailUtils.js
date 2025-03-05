const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const createTransporter = () => {
  console.log("Email configuration:", {
    service: 'gmail',
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'not-set',
    pass: process.env.EMAIL_PASSWORD ? '*****' : 'not-set'
  });

  // Check if email credentials are properly set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("WARNING: Email credentials are not properly configured in .env file!");
    console.error("Set EMAIL_USER and EMAIL_PASSWORD in your .env file");
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set up in your .env file
      pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Set up in your .env file
    }
  });
};

// Create the transporter once
const transporter = createTransporter();

/**
 * Generate a random OTP with specified length
 * @param {number} length - Length of OTP
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 4) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  console.log(`Generated OTP: ${otp.substring(0, 1)}***`); // Log partial OTP for security
  return otp;
};

/**
 * Send OTP email to a user
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 * @param {string} firstName - User's first name
 * @returns {Promise<object>} - Email sending result
 */
const sendOTPEmail = async (email, otp, firstName = '') => {
  console.log(`Attempting to send OTP email to: ${email}`);
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'Your Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://yourdomain.com/logo.png" alt="TuniHire Logo" style="max-width: 150px;">
        </div>
        <h2 style="color: #333;">Login Verification Code</h2>
        <p>Hello ${firstName || 'User'},</p>
        <p>Please use the following verification code to complete your login process:</p>
        <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="font-size: 36px; margin: 0; letter-spacing: 5px; color: #4a4a4a;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email or contact support if you have any concerns.</p>
        <p style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
          &copy; ${new Date().getFullYear()} TuniHire. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    console.log('Sending email with nodemailer...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Email configuration issue - please check your .env file settings');
    console.error('For Gmail, make sure to:');
    console.error('1. Enable "Less secure app access" or');
    console.error('2. Use an App Password if 2FA is enabled');
    console.error('3. Make sure the email and password are correct');
    return { success: false, error: error.message };
  }
};

/**
 * Test the email configuration 
 * @returns {Promise<boolean>} - True if configuration is working
 */
const testEmailConfig = async () => {
  try {
    console.log('Testing email configuration...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email credentials are not set in environment variables');
      return false;
    }
    
    await transporter.verify();
    console.log('Email configuration is valid and ready to send messages');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
};

// Run the test on module load
testEmailConfig().then(isValid => {
  if (!isValid) {
    console.warn('WARNING: Email functionality may not work properly!');
  }
});

module.exports = {
  generateOTP,
  sendOTPEmail,
  testEmailConfig
};
