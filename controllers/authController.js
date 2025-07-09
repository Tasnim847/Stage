import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Comptable from '../models/Comptable.js';
import Entreprise from '../models/Entreprise.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
const SALT_ROUNDS = 10;

// Configuration du transporteur Mailtrap
const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
    }
});

// Fonction pour envoyer un email de bienvenue
const sendWelcomeEmail = async (email, name) => {
    try {
        const info = await transporter.sendMail({
            from: '"Votre Plateforme Comptable" <no-reply@comptable-app.com>',
            to: email,
            subject: 'Bienvenue sur notre plateforme',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Bonjour ${name},</h2>
                    <p>Merci de vous être inscrit sur notre plateforme comptable.</p>
                    <p>Vous pouvez maintenant accéder à tous nos services.</p>
                    <p style="margin-top: 30px;">Cordialement,</p>
                    <p><strong>L'équipe de la plateforme</strong></p>
                </div>
            `,
        });
        console.log('Email envoyé avec succès:', info.messageId);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
        throw error;
    }
};

// Fonction pour envoyer un email de confirmation de modification de mot de passe
const sendPasswordResetEmail = async (email) => {
    try {
        const info = await transporter.sendMail({
            from: '"Votre Plateforme Comptable" <no-reply@comptable-app.com>',
            to: email,
            subject: 'Confirmation de modification de mot de passe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Votre mot de passe a été modifié</h2>
                    <p>Nous vous confirmons que votre mot de passe a bien été mis à jour.</p>
                    <p>Si vous n'êtes pas à l'origine de cette modification, veuillez nous contacter immédiatement.</p>
                    <p style="margin-top: 30px;">Cordialement,</p>
                    <p><strong>L'équipe de la plateforme</strong></p>
                </div>
            `,
        });
        console.log('Email de réinitialisation envoyé:', info.messageId);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
        throw error;
    }
};

export const register = async (req, res) => {
    const { username, email, password, name, lastname } = req.body;

    if (!username || !email || !password || !name || !lastname) {
        return res.status(400).json({
            success: false,
            message: 'Tous les champs sont obligatoires'
        });
    }

    try {
        const [existingUser, existingComptable] = await Promise.all([
            User.findOne({ where: { email } }),
            Comptable.findOne({ where: { username } })
        ]);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        if (existingComptable) {
            return res.status(409).json({
                success: false,
                message: 'Ce pseudonyme est déjà pris'
            });
        }

        const result = await sequelize.transaction(async (t) => {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const newUser = await User.create({
                email,
                password: hashedPassword,
                role: 'comptable'
            }, { transaction: t });

            const newComptable = await Comptable.create({
                username,
                email,
                password: hashedPassword,
                name,
                lastname,
                userId: newUser.id
            }, { transaction: t });

            return { newUser, newComptable };
        });

        const token = jwt.sign({
            id: result.newUser.id,
            email: result.newUser.email,
            role: result.newUser.role
        }, JWT_SECRET, { expiresIn: '4h' });

        try {
            await sendWelcomeEmail(email, `${name} ${lastname}`);
        } catch (emailError) {
            console.error("L'email de bienvenue n'a pas pu être envoyé:", emailError);
        }

        return res.status(201).json({
            success: true,
            message: 'Comptable enregistré avec succès',
            token,
            user: {
                id: result.newUser.id,
                email: result.newUser.email,
                role: result.newUser.role,
                comptableDetails: {
                    id: result.newComptable.id,
                    username: result.newComptable.username,
                    name: result.newComptable.name,
                    lastname: result.newComptable.lastname
                }
            }
        });

    } catch (error) {
        console.error('Erreur enregistrement:', error);

        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: messages
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({
            where: { email },
            include: [
                { model: Comptable, required: false },
                { model: Entreprise, as: 'entreprises', required: false }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        let userDetails = {};
        if (user.role === 'comptable' && user.Comptable) {
            userDetails = {
                id: user.Comptable.id,
                username: user.Comptable.username,
                name: user.Comptable.name,
                lastname: user.Comptable.lastname
            };
        } else if (user.role === 'entreprise' && user.entreprises && user.entreprises.length > 0) {
            userDetails = {
                id: user.entreprises[0].id,
                nom: user.entreprises[0].nom,
                numeroIdentificationFiscale: user.entreprises[0].numeroIdentificationFiscale
            };
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role
        }, JWT_SECRET, { expiresIn: '10h' });

        return res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                ...(user.role === 'comptable' ? { comptableDetails: userDetails } : {}),
                ...(user.role === 'entreprise' ? { entrepriseDetails: userDetails } : {})
            }
        });

    } catch (error) {
        console.error('Erreur de connexion:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email et nouveau mot de passe sont requis'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await sequelize.transaction(async (t) => {
            const user = await User.findOne({
                where: { email },
                transaction: t
            });

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            await user.update({
                password: hashedPassword
            }, { transaction: t });

            const comptable = await Comptable.findOne({
                where: { userId: user.id },
                transaction: t
            });

            if (comptable) {
                await comptable.update({
                    password: hashedPassword
                }, { transaction: t });
            }
        });

        try {
            await sendPasswordResetEmail(email);
        } catch (emailError) {
            console.error("L'email de confirmation n'a pas pu être envoyé:", emailError);
        }

        return res.json({
            success: true,
            message: 'Mot de passe mis à jour avec succès'
        });

    } catch (error) {
        console.error('Reset error:', error);
        return res.status(500).json({
            success: false,
            message: 'Échec de la mise à jour',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};