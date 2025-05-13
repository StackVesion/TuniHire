const nodemailer = require('nodemailer');
const getEmailTemplate = require('../templates/emailVerification');
const { getPasswordResetTemplate } = require('../templates/passwordReset');

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
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
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

// Fonction pour envoyer un email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
    try {
        // Créer l'URL de réinitialisation avec le token
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        // Obtenir le contenu HTML du template
        const htmlContent = getPasswordResetTemplate(resetUrl, firstName || 'there');

        const mailOptions = {
            from: `"TuniHire" <${process.env.EMAIL_APP_USER}>`,
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: htmlContent
        };

        console.log(`Attempting to send password reset email to: ${email}`);
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully to:', email);
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: continuing despite email failure');
            return { success: false, error: error.message };
        }
        throw error;
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };