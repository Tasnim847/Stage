import bcrypt from 'bcryptjs';
import Comptable from '../models/Comptable.js';
import Entreprise from '../models/Entreprise.js';
import User from '../models/User.js';

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Vérification basique de l'utilisateur
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'role']
        });

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        let profileData;

        if (userRole === 'comptable') {
            // Pour les comptables - inclure maintenant le champ adresse
            profileData = await Comptable.findOne({
                where: { userId: userId },
                attributes: ['id', 'name', 'lastname', 'username', 'email', 'image', 'ville', 'region', 'codePostal', 'adresse', 'telephone']
            });

            if (!profileData) {
                return res.status(404).json({
                    message: 'Profil comptable non trouvé',
                    details: `Aucun comptable trouvé pour userId: ${userId}`
                });
            }
        } else if (userRole === 'entreprise') {
            profileData = await Entreprise.findOne({
                where: { userId: userId },
                attributes: ['id', 'nom', 'adresse', 'numeroIdentificationFiscale', 'logo', 'telephone', 'ville', 'region', 'codePostal', 'siteWeb'],
                include: [{
                    model: Comptable,
                    as: 'comptableAttitre',
                    attributes: ['id', 'name', 'lastname', 'email']
                }]
            });

            if (!profileData) {
                return res.status(404).json({
                    message: 'Profil entreprise non trouvé',
                    details: `Aucune entreprise trouvée pour userId: ${userId}`
                });
            }
        } else {
            return res.status(400).json({
                message: 'Rôle utilisateur non valide',
                details: `Rôle '${userRole}' non pris en charge`
            });
        }

        // Formate la réponse
        const response = {
            ...profileData.get({ plain: true }),
            role: userRole,
            email: user.email
        };

        // Renommer comptableAttitre en comptable pour le frontend
        if (userRole === 'entreprise' && response.comptableAttitre) {
            response.comptable = response.comptableAttitre;
            delete response.comptableAttitre;
        }

        res.json(response);

    } catch (error) {
        console.error('Erreur complète:', {
            message: error.message,
            stack: error.stack,
            originalError: error
        });

        res.status(500).json({
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                type: error.name
            } : undefined
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const updateData = req.body;
        const imageFile = req.file;

        // Vérification de l'utilisateur
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Gestion du mot de passe (hachage si présent)
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);

            // Mise à jour du mot de passe dans la table User
            await User.update(
                { password: updateData.password },
                { where: { id: userId } }
            );

            // On supprime le password de updateData pour ne pas tenter de le mettre à jour dans Comptable/Entreprise
            delete updateData.password;
        }

        // Gestion de l'image
        if (imageFile) {
            const host = req.get('host').replace(/^https?:\/\//, '');
            const imageUrl = `${req.protocol}://${host}/uploads/${imageFile.filename}`;

            // Validation manuelle stricte
            if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(imageUrl)) {
                return res.status(400).json({
                    message: 'URL image invalide',
                    details: 'Le format doit être http(s)://domain/path'
                });
            }

            if (userRole === 'comptable') {
                updateData.image = imageUrl;
            } else if (userRole === 'entreprise') {
                updateData.logo = imageUrl;
            }
        }

        // Mise à jour selon le rôle (validation Sequelize désactivée)
        let updatedProfile;
        if (userRole === 'comptable') {
            // Filtrer les champs pour n'inclure que ceux existants dans le modèle Comptable
            const validComptableFields = ['name', 'lastname', 'username', 'email', 'image', 'ville', 'region', 'codePostal', 'adresse', 'telephone'];
            const filteredUpdateData = {};

            Object.keys(updateData).forEach(key => {
                if (validComptableFields.includes(key)) {
                    filteredUpdateData[key] = updateData[key];
                }
            });

            const [affectedRows] = await Comptable.update(filteredUpdateData, {
                where: { userId: userId },
                validate: false // Désactive la validation Sequelize
            });

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Profil comptable non trouvé' });
            }

            updatedProfile = await Comptable.findOne({
                where: { userId: userId },
                attributes: ['id', 'name', 'lastname', 'username', 'email', 'image', 'ville', 'region', 'codePostal', 'adresse', 'telephone']
            });
        } else if (userRole === 'entreprise') {
            const [affectedRows] = await Entreprise.update(updateData, {
                where: { userId: userId },
                validate: false // Désactive la validation Sequelize
            });

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Profil entreprise non trouvé' });
            }

            updatedProfile = await Entreprise.findOne({
                where: { userId: userId },
                attributes: ['id', 'nom', 'adresse', 'numeroIdentificationFiscale', 'logo', 'telephone', 'ville', 'region', 'codePostal', 'siteWeb'],
                include: [{
                    model: Comptable,
                    as: 'comptableAttitre',
                    attributes: ['id', 'name', 'lastname', 'email']
                }]
            });
        }

        // Formate la réponse
        const response = {
            ...updatedProfile.get({ plain: true }),
            role: userRole,
            email: user.email
        };

        // Renommer comptableAttitre en comptable pour le frontend
        if (userRole === 'entreprise' && response.comptableAttitre) {
            response.comptable = response.comptableAttitre;
            delete response.comptableAttitre;
        }

        res.json(response);

    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};