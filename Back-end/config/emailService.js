const nodemailer = require('nodemailer');
const getEmailTemplate = require('../templates/emailVerification');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_APP_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
        port: process.env.SMTP_PORT,

    }
});

const sendVerificationEmail = async (email, verificationToken, firstName) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const htmlContent = getEmailTemplate(verificationUrl, firstName || 'there');

    const mailOptions = {
        from: `"TuniHire" <${process.env.EMAIL_APP_USER}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

module.exports = { sendVerificationEmail };
