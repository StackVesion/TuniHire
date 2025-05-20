const nodemailer = require('nodemailer');
const getEmailTemplate = require('../templates/emailVerification');
const API_URL = process.env.NEXT_PUBLIC_FRONT_API_URL || 'http://localhost:3000';
// Utiliser le transporteur spécifique pour les emails de vérification
const transporter = global.verificationEmailTransporter || nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_APP_USER, // fadi6895@gmail.com
        pass: process.env.EMAIL_APP_PASSWORD
    },
    port: process.env.SMTP_PORT,
    tls: {
        rejectUnauthorized: false
    }
});

const sendVerificationEmail = async (email, verificationToken, firstName) => {
    const verificationUrl = `${API_URL}/verify-email/${verificationToken}`;
    const htmlContent = getEmailTemplate(verificationUrl, firstName || 'there');

    const mailOptions = {
        from: `"TuniHire" <${process.env.EMAIL_APP_USER}>`, // Utilisez EMAIL_APP_USER
        to: email,
        subject: 'Verify Your Email Address',
        html: htmlContent
    };

    try {
        console.log(`Attempting to send verification email to: ${email} from: ${process.env.EMAIL_APP_USER}`);
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to:', email);
        return { success: true };
    } catch (error) {
        console.error('Error sending verification email:', error);
        // En développement, on continue même si l'email échoue
        if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: continuing despite email failure');
            return { success: false, error: error.message };
        }
        throw error;
    }
};

module.exports = { sendVerificationEmail };
