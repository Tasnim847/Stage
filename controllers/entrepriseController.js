import Entreprise from '../models/Entreprise.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import sequelize from '../config/database.js';
import {sendWelcomeEmailWithCredentials} from '../services/emailService.js'

export const getEntreprisesForComptable = async (req, res) => {
    try {
        if (req.user.role !== 'comptable') {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const entreprises = await Entreprise.findAll({
            where: { comptableId: req.user.id },
            attributes: ['id', 'nom', 'email', 'adresse', 'telephone', 'numeroIdentificationFiscale', 'createdAt'] // Ajoutez createdAt ici
        });

        res.json(entreprises);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const createEntreprise = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { nom, email, adresse, telephone, numeroIdentificationFiscale, motDePasse } = req.body;

        if (!nom || !email || !adresse || !numeroIdentificationFiscale || !motDePasse) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être fournis',
                missingFields: {
                    nom: !nom,
                    email: !email,
                    adresse: !adresse,
                    numeroIdentificationFiscale: !numeroIdentificationFiscale,
                    motDePasse: !motDePasse
                }
            });
        }

        const [existingUser, existingEntreprise] = await Promise.all([
            User.findOne({ where: { email } }, { transaction }),
            Entreprise.findOne({ where: { email } }, { transaction })
        ]);

        if (existingUser || existingEntreprise) {
            await transaction.rollback();
            return res.status(409).json({
                success: false,
                message: 'Email déjà utilisé'
            });
        }

        const hashedPassword = await bcrypt.hash(motDePasse, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            role: 'entreprise',
            isActive: true
        }, { transaction });

        const newEntreprise = await Entreprise.create({
            nom,
            email,
            adresse,
            telephone,
            numeroIdentificationFiscale,
            password: hashedPassword,
            userId: newUser.id,
            comptableId: req.user.id
        }, { transaction });

        await transaction.commit();

        // Envoi de l'email de bienvenue avec les informations de connexion
        try {
            await sendWelcomeEmailWithCredentials(
                newEntreprise.email,
                newEntreprise.nom,
                newEntreprise.email,
                motDePasse // On envoie le mot de passe en clair (seulement dans l'email)
            );
        } catch (emailError) {
            console.error("Erreur lors de l'envoi de l'email de bienvenue:", emailError);
            // On ne bloque pas la création même si l'email échoue
        }

        return res.status(201).json({
            success: true,
            entreprise: {
                id: newEntreprise.id,
                nom: newEntreprise.nom,
                email: newEntreprise.email
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Erreur création entreprise:", error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Donnée déjà existante',
                field: error.errors[0].path
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const deleteEntreprise = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const entreprise = await Entreprise.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'proprietaire' // Utilisez le même alias que dans votre relation
            }],
            transaction
        });

        if (!entreprise) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        // Vérification des permissions
        if (entreprise.comptableId !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Hard delete de l'utilisateur associé
        if (entreprise.proprietaire) { // Utilisez le même alias ici
            await User.destroy({
                where: { id: entreprise.proprietaire.id }, // Et ici
                force: true, // Force le hard delete
                transaction
            });
        }

        // Hard delete de l'entreprise
        await entreprise.destroy({
            force: true, // Force le hard delete si Entreprise utilise aussi paranoid
            transaction
        });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Entreprise et utilisateur associé supprimés définitivement'
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Erreur lors de la suppression:", error);

        let errorMessage = 'Erreur lors de la suppression';
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            errorMessage = 'Impossible de supprimer cette entreprise car elle est référencée ailleurs';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateEntreprise = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;

        if (!id) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ID entreprise manquant'
            });
        }

        const entreprise = await Entreprise.findByPk(id, {
            include: [{ model: User }],
            transaction
        });

        if (!entreprise) {
            await transaction.rollback();
            console.error('Entreprise non trouvée pour ID:', id);
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        // Vérification des permissions
        if (entreprise.comptableId !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        const { nom, email, adresse, telephone, numeroIdentificationFiscale, motDePasse } = req.body;

        // Vérification si l'email est modifié
        if (email && email !== entreprise.email) {
            const existing = await Entreprise.findOne({
                where: { email },
                transaction
            });

            if (existing) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Email déjà utilisé par une autre entreprise'
                });
            }
        }

        // Mise à jour de l'entreprise
        await entreprise.update({
            nom,
            email,
            adresse,
            telephone,
            numeroIdentificationFiscale
        }, { transaction });

        // Mise à jour de l'utilisateur associé
        if (entreprise.User) {
            await entreprise.User.update({ email }, { transaction });

            if (motDePasse) {
                const hashedPassword = await bcrypt.hash(motDePasse, 10);
                await entreprise.User.update({
                    password: hashedPassword
                }, { transaction });
            }
        }

        await transaction.commit();

        // Retourne les données mises à jour
        const updatedEntreprise = await Entreprise.findByPk(id, {
            attributes: ['id', 'nom', 'email', 'adresse', 'telephone', 'numeroIdentificationFiscale']
        });

        return res.json({
            success: true,
            entreprise: updatedEntreprise
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Erreur détaillée:", error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
