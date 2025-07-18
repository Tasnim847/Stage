import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});


// Exportez les fonctions nécessaires
export async function sendEmail({ to, subject, text, html }) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Votre App" <no-reply@example.com>',
            to,
            subject,
            text,
            html
        });
        return {success: true};
    } catch (error) {
        console.error("Erreur d'envoi d'email:", error);
        return {
            error: "Échec d'envoi",
            details: error.response?.body || error.message
        };
    }
}

export async function sendWelcomeEmail(toEmail, userName) {
    try {
        let info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: toEmail,
            subject: "Welcome to Invoice App",
            text: `Hello ${userName}, welcome to our Invoice App platform! We're excited to have you on board.`,
            html: `
                <p>Hello <b>${userName}</b>,</p>
                <p>Welcome to <strong>Invoice App</strong>! We're thrilled to have you with us.</p>
                <p>Our platform is designed to help you simplify your invoicing and quotation management, so you can focus on growing your business.</p>
                <p>If you have any questions, feel free to reach out — we're here to help!</p>
                <p>Best regards,<br/>The Invoice App Team</p>
            `,
        });
        return info;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
}

export const sendPasswordResetLink = async (email, resetLink) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Votre Plateforme" <no-reply@example.com>',
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Réinitialisation de mot de passe</h2>
                    <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
                    <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #2c3e50; color: white; text-decoration: none; border-radius: 5px;">
                        Réinitialiser mon mot de passe
                    </a>
                    <p>Ce lien expirera dans 1 heure.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Erreur envoi email réinitialisation:', error);
        throw error;
    }
};

export const sendPasswordResetConfirmation = async (email) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Your Platform" <no-reply@example.com>',
            to: email,
            subject: 'Password Reset Confirmation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Your password has been successfully updated</h2>
                    <p>We’re writing to confirm that your password has been changed successfully.</p>
                    <p>If you did not authorize this change, please contact our support team immediately to secure your account.</p>
                    <p style="margin-top: 30px;">Best regards,</p>
                    <p><strong>The Invoice App Team</strong></p>
                </div>
            `
        });
    } catch (error) {
        console.error('Error sending password reset confirmation email:', error);
        throw error;
    }
};
