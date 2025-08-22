import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Comptable from '../models/Comptable.js';
import Entreprise from '../models/Entreprise.js';
import { sendWelcomeEmail, sendPasswordResetConfirmation, sendPasswordResetLink } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    const { username, email, password, name, lastname } = req.body;

    // Validation des champs obligatoires
    if (!username || !email || !password || !name || !lastname) {
        return res.status(400).json({
            success: false,
            message: 'Tous les champs sont obligatoires'
        });
    }

    try {
        // Vérification des doublons
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

        // Création transactionnelle
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

        // Génération du token JWT
        const token = jwt.sign({
            id: result.newUser.id,
            email: result.newUser.email,
            role: result.newUser.role
        }, JWT_SECRET, { expiresIn: '24h' });

        // Envoi email de bienvenue (asynchrone)
        await sendWelcomeEmail(email, `${name} ${lastname}`)
            .then(() => console.log('Email de bienvenue envoyé avec succès'))
            .catch(error => console.error("Erreur envoi email bienvenue:", error));

        return res.status(201).json({
            success: true,
            message: 'Comptable enregistré avec succès',
            token,
            expiresIn: 86400,
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
                { model: Comptable, as: 'comptableProfile', required: false },
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

        // Préparation des détails utilisateur selon le rôle
        let userDetails = {};
        if (user.role === 'comptable' && user.comptableProfile) {
            userDetails = {
                id: user.comptableProfile.id,
                username: user.comptableProfile.username,
                name: user.comptableProfile.name,
                lastname: user.comptableProfile.lastname
            };
        } else if (user.role === 'entreprise' && user.entreprises && user.entreprises.length > 0) {
            userDetails = {
                id: user.entreprises[0].id,
                nom: user.entreprises[0].nom,
                numeroIdentificationFiscale: user.entreprises[0].numeroIdentificationFiscale
            };
        }

        // Génération du token JWT
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

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Recherche de l'utilisateur
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
            return res.json({
                success: true,
                message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
            });
        }

        // Génération du token de réinitialisation
        const resetToken = jwt.sign(
            { id: user.id, action: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Construction du lien de réinitialisation
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Envoi email avec le lien (asynchrone)
        sendPasswordResetLink(email, resetLink)
            .catch(error => console.error("Erreur envoi email réinitialisation:", error));

        return res.json({
            success: true,
            message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
        });

    } catch (error) {
        console.error('Erreur demande réinitialisation:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        // Validation des données
        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, new password and confirmation are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Recherche de l'utilisateur
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
            return res.json({
                success: true,
                message: 'If an account exists with this email, the password has been updated'
            });
        }

        // Vérification si le nouveau mot de passe est différent de l'ancien
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Hash du nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Mise à jour transactionnelle
        await sequelize.transaction(async (t) => {
            await user.update({ password: hashedPassword }, { transaction: t });

            // Mise à jour supplémentaire pour les comptables
            if (user.role === 'comptable') {
                const comptable = await Comptable.findOne({
                    where: { userId: user.id },
                    transaction: t
                });
                if (comptable) {
                    await comptable.update({ password: hashedPassword }, { transaction: t });
                }
            }

            // Mise à jour supplémentaire pour les entreprises
            if (user.role === 'entreprise') {
                const entreprise = await Entreprise.findOne({
                    where: { userId: user.id },
                    transaction: t
                });
                if (entreprise) {
                    await entreprise.update({ password: hashedPassword }, { transaction: t });
                }
            }
        });

        // Envoi email de confirmation (asynchrone)
        sendPasswordResetConfirmation(email)
            .catch(error => console.error("Erreur envoi email confirmation:", error));

        return res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during password reset'
        });
    }
};

export const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email requis'
            });
        }

        const user = await User.findOne({ where: { email } });

        return res.json({
            success: true,
            exists: !!user
        });

    } catch (error) {
        console.error('Erreur vérification email:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};