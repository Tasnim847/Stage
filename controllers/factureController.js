import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Devis from '../models/Devis.js';
import Facture from '../models/Facture.js';
import Entreprise from '../models/Entreprise.js';
import LigneDevis from '../models/lignesDevis.js';
import LigneFacture from "../models/LigneFacture.js";
import Comptable from "../models/Comptable.js";
import Notification from '../models/Notification.js';
import { Op } from 'sequelize';
import { sendNotificationToComptable } from '../server.js';
import { sendEmail } from '../services/emailService.js';

// Fonction utilitaire pour gérer les transactions
const executeInTransaction = async (fn) => {
    const transaction = await sequelize.transaction();
    try {
        const result = await fn(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Fonction pour créer une notification
/*
const createNotification = async (comptableId, message, type, relatedEntityId) => {
    try {
        const notification = await Notification.create({
            message,
            type,
            related_entity_id: relatedEntityId,
            comptable_id: comptableId,
            read: false
        });

        // Envoyer la notification via WebSocket
        sendNotificationToComptable(comptableId, notification);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
*/

// Fonction pour créer une notification
const createNotification = async (comptableId, message, type, relatedEntityId) => {
    try {
        // Récupérer les infos du comptable
        const comptable = await Comptable.findByPk(comptableId, {
            attributes: ['id', 'name', 'lastname', 'email']
        });

        if (!comptable) {
            throw new Error('Comptable introuvable');
        }

        const notification = await Notification.create({
            message,
            type,
            related_entity_id: relatedEntityId,
            comptable_id: comptableId,
            read: false
        });

        // Envoyer la notification via WebSocket
        sendNotificationToComptable(comptableId, notification);

        try {
            // Envoyer un email au comptable
            const emailResult = await sendEmail({
                to: comptable.email,
                subject: 'Nouvelle notification - Invoice App',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                        <h2 style="color: #2c3e50;">Nouvelle notification</h2>
                        <p>Bonjour ${comptable.name} ${comptable.lastname},</p>
                        <p>Vous avez reçu une nouvelle notification dans votre espace Invoice App :</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2c3e50;">
                            <p><strong>${message}</strong></p>
                        </div>
                        <p>Connectez-vous à votre espace pour voir les détails :</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/notifications" 
                           style="display: inline-block; padding: 12px 24px; background-color: #2c3e50; color: white; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">
                            Voir mes notifications
                        </a>
                        <p style="margin-top: 20px;">Cordialement,<br><strong>L'équipe Invoice App</strong></p>
                    </div>
                `,
                text: `Nouvelle notification\n\nBonjour ${comptable.name} ${comptable.lastname},\n\nVous avez reçu une nouvelle notification :\n\n${message}\n\nConnectez-vous à ${process.env.FRONTEND_URL || 'http://localhost:5173'}/notifications pour voir les détails.\n\nCordialement,\nL'équipe Invoice App`
            });

            if (!emailResult.success) {
                console.error('Échec envoi email:', emailResult.error);
            }
        } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
            // Ne pas bloquer le processus même si l'email échoue
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const getFacturesByEntreprise = async (req, res) => {
    try {
        // Vérification de l'authentification
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Récupération de l'entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom'],
            include: [{
                model: Comptable,
                as: 'comptableAttitre'
            }]
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise introuvable.'
            });
        }

        // Paramètres de pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Construction de la requête
        const where = { entreprise_id: entreprise.id };

        // Filtres optionnels
        if (req.query.statut) {
            where.statut_paiement = req.query.statut;
        }
        if (req.query.client) {
            where.client_name = { [Op.iLike]: `%${req.query.client}%` };
        }
        if (req.query.dateDebut || req.query.dateFin) {
            where.date_emission = {};
            if (req.query.dateDebut) {
                where.date_emission[Op.gte] = new Date(req.query.dateDebut);
            }
            if (req.query.dateFin) {
                where.date_emission[Op.lte] = new Date(req.query.dateFin);
            }
        }

        // Requête principale
        const { count, rows: factures } = await Facture.findAndCountAll({
            where,
            include: [
                {
                    model: LigneFacture,
                    as: 'lignesFacture',
                    attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite']
                },
                {
                    model: Devis,
                    as: 'devisOrigine',
                    attributes: ['id', 'numero', 'client_name']
                }
            ],
            order: [['date_emission', 'DESC']],
            limit,
            offset
        });

        // Calcul des totaux
        const facturesWithTotals = factures.map(facture => {
            const montantHT = facture.lignesFacture.reduce((sum, ligne) =>
                sum + (ligne.prix_unitaire_ht * ligne.quantite), 0);

            return {
                ...facture.get({ plain: true }),
                client_name: facture.client_name || facture.Devis?.client_name || 'Client inconnu',
                montant_ht: montantHT,
                montant_ttc: montantHT * 1.2 // TVA 20% par défaut
            };
        });

        // Réponse
        res.json({
            success: true,
            data: {
                factures: facturesWithTotals,
                pagination: {
                    totalItems: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    itemsPerPage: limit
                },
                entreprise: {
                    id: entreprise.id,
                    nom: entreprise.nom
                }
            }
        });

    } catch (error) {
        console.error('Erreur getFacturesByEntreprise:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const generateFromDevis = async (req, res) => {
    try {
        const { devis_id } = req.body;

        // Vérification de l'entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'comptableId', 'nom', 'adresse', 'telephone', 'email', 'numeroIdentificationFiscale']
        });

        if (!entreprise) {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }

        // Récupération du devis avec toutes ses lignes
        const devis = await Devis.findOne({
            where: {
                id: devis_id,
                entreprise_id: entreprise.id,
                statut: 'accepté'
            },
            include: [{
                model: LigneDevis,
                as: 'lignesDevis'
            }]
        });

        if (!devis) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé ou non éligible'
            });
        }

        // Calcul précis des montants
        const montantHT = devis.lignesDevis.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht || 0) * parseFloat(ligne.quantite || 0)), 0);

        const remiseMontant = montantHT * (parseFloat(devis.remise || 0) / 100);
        const montantApresRemise = montantHT - remiseMontant;
        const montantTVA = montantApresRemise * (parseFloat(devis.tva || 20) / 100);
        const montantTTC = montantApresRemise + montantTVA;

        // Génération du numéro de facture
        const lastFacture = await Facture.findOne({
            where: { entreprise_id: entreprise.id },
            order: [['createdAt', 'DESC']],
            attributes: ['numero']
        });

        let factureNumber = 1;
        if (lastFacture && lastFacture.numero) {
            const match = lastFacture.numero.match(/FAC-(\d+)/);
            if (match && match[1]) {
                factureNumber = parseInt(match[1]) + 1;
            }
        }

        const numeroFacture = `FAC-${factureNumber.toString().padStart(4, '0')}`;

        // Création de la facture dans une transaction
        const transaction = await sequelize.transaction();
        try {
            const facture = await Facture.create({
                numero: numeroFacture,
                date_emission: new Date(),
                statut_paiement: 'brouillon',
                client_name: devis.client_name,
                montant_ht: parseFloat(montantHT.toFixed(2)),
                montant_ttc: parseFloat(montantTTC.toFixed(2)),
                remise: parseFloat(devis.remise || 0),
                tva: parseFloat(devis.tva || 20),
                entreprise_id: entreprise.id,
                comptable_id: entreprise.comptableId,
                devis_id: devis.id,
                mode_paiement: null,
                date_paiement: null
            }, { transaction });

            // Copie de toutes les lignes du devis
            const lignesFacture = devis.lignesDevis.map(ligne => ({
                description: ligne.description,
                prix_unitaire_ht: parseFloat(ligne.prix_unitaire_ht || 0),
                quantite: parseFloat(ligne.quantite || 0),
                unite: ligne.unite || 'unité',
                facture_id: facture.id
            }));

            await LigneFacture.bulkCreate(lignesFacture, { transaction });

            // Mise à jour du statut du devis
            await devis.update({ statut: 'facturé' }, { transaction });

            await transaction.commit();

            // Récupération de la facture complète pour la réponse
            const factureComplete = await Facture.findByPk(facture.id, {
                include: [{
                    model: LigneFacture,
                    as: 'lignesFacture'
                }]
            });

            return res.status(201).json({
                success: true,
                data: {
                    ...factureComplete.get({ plain: true }),
                    montants: {
                        ht: montantHT,
                        remise: remiseMontant,
                        apres_remise: montantApresRemise,
                        tva: montantTVA,
                        ttc: montantTTC
                    }
                },
                message: 'Facture générée avec succès'
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Erreur transaction génération facture:', error);
            throw error;
        }

    } catch (error) {
        console.error('Erreur génération facture:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de la facture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/*
export const getFactureById = async (req, res) => {
    try {
        // 1. Vérifier que l'utilisateur a une entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom', 'adresse', 'telephone', 'email']
        });

        if (!entreprise) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // 2. Récupérer la facture avec toutes ses relations
        const facture = await Facture.findOne({
            where: {
                id: req.params.id,
                entreprise_id: entreprise.id
            },
            include: [
                {
                    model: Devis,
                    attributes: ['id', 'numero', 'date_creation', 'date_validite', 'remise', 'tva'],
                    include: [{
                        model: LigneDevis,
                        as: 'lignesDevis',
                        attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite', 'unite']
                    }]
                },
                {
                    model: LigneFacture,
                    as: 'lignesFacture',
                    attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite', 'unite']
                }
            ]
        });

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée ou accès non autorisé'
            });
        }

        // 3. Calculer les totaux si nécessaire
        const montantHT = facture.lignesFacture.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht) * parseFloat(ligne.quantite)), 0);

        const remise = facture.Devis?.remise || 0;
        const tva = facture.Devis?.tva || 20;

        const montantApresRemise = montantHT - (montantHT * (remise / 100));
        const montantTVA = montantApresRemise * (tva / 100);
        const montantTTC = montantApresRemise + montantTVA;

        // 4. Formater la réponse
        const response = {
            ...facture.get({ plain: true }),
            entreprise: {
                id: entreprise.id,
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email
            },
            totals: {
                montantHT,
                remise: montantHT * (remise / 100),
                montantApresRemise,
                tva: montantTVA,
                montantTTC
            }
        };

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Erreur récupération facture par ID:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
*/

export const getFactureById = async (req, res) => {
    try {
        // 1. Vérifier que l'utilisateur a une entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom', 'adresse', 'telephone', 'email']
        });

        if (!entreprise) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // 2. Récupérer la facture avec toutes ses relations
        const facture = await Facture.findOne({
            where: {
                id: req.params.id,
                entreprise_id: entreprise.id
            },
            include: [
                {
                    model: Devis,
                    as: 'devisOrigine', // Utiliser l'alias correct défini dans les relations
                    attributes: ['id', 'numero', 'date_creation', 'date_validite', 'remise', 'tva'],
                    include: [{
                        model: LigneDevis,
                        as: 'lignesDevis', // Utiliser l'alias correct
                        attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite', 'unite']
                    }]
                },
                {
                    model: LigneFacture,
                    as: 'lignesFacture', // Utiliser l'alias correct
                    attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite', 'unite']
                }
            ]
        });

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée ou accès non autorisé'
            });
        }

        // 3. Calculer les totaux si nécessaire
        const montantHT = facture.lignesFacture.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht) * parseFloat(ligne.quantite)), 0);

        const remise = facture.devisOrigine?.remise || 0; // Utiliser l'alias correct
        const tva = facture.devisOrigine?.tva || 20; // Utiliser l'alias correct

        const montantApresRemise = montantHT - (montantHT * (remise / 100));
        const montantTVA = montantApresRemise * (tva / 100);
        const montantTTC = montantApresRemise + montantTVA;

        // 4. Formater la réponse
        const response = {
            ...facture.get({ plain: true }),
            entreprise: {
                id: entreprise.id,
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email
            },
            totals: {
                montantHT,
                remise: montantHT * (remise / 100),
                montantApresRemise,
                tva: montantTVA,
                montantTTC
            }
        };

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Erreur récupération facture par ID:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateFacture = async (req, res) => {
    try {
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id']
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise introuvable.'
            });
        }

        const result = await executeInTransaction(async (transaction) => {
            // Vérifier que la facture existe et appartient à l'entreprise
            const facture = await Facture.findOne({
                where: {
                    id: req.params.id,
                    entreprise_id: entreprise.id
                },
                transaction
            });

            if (!facture) {
                throw new Error('Facture non trouvée ou accès non autorisé');
            }

            // Mettre à jour la facture
            await facture.update({
                date_paiement: req.body.date_paiement,
                statut_paiement: req.body.statut_paiement,
                mode_paiement: req.body.mode_paiement
            }, { transaction });

            return facture;
        });

        res.json({
            success: true,
            data: result,
            message: 'Facture mise à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur mise à jour facture:', error);

        if (error.message === 'Facture non trouvée ou accès non autorisé') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la facture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/*
export const generateFacturePdf = async (req, res) => {
    try {
        // 1. Vérifier que l'utilisateur a une entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom', 'adresse', 'telephone', 'email', 'numeroIdentificationFiscale']
        });

        if (!entreprise) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // 2. Récupérer la facture avec toutes ses relations
        const facture = await Facture.findOne({
            where: {
                id: req.params.id,
                entreprise_id: entreprise.id
            },
            include: [
                {
                    model: Devis,
                    attributes: ['id', 'numero', 'remise', 'tva'],
                    include: [{
                        model: LigneDevis,
                        as: 'lignesDevis'
                    }]
                },
                {
                    model: LigneFacture,
                    as: 'lignes'
                }
            ]
        });

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée ou accès non autorisé'
            });
        }

        // 3. Calculer les montants
        const montantHT = facture.lignesFacture.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht) * parseFloat(ligne.quantite)), 0);

        const remise = facture.Devis?.remise || 0;
        const tva = facture.Devis?.tva || 20;

        const montantApresRemise = montantHT - (montantHT * (remise / 100));
        const montantTVA = montantApresRemise * (tva / 100);
        const montantTTC = montantApresRemise + montantTVA;

        // 4. Préparer les données pour le template PDF
        const pdfData = {
            entreprise: {
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email,
                siret: entreprise.numeroIdentificationFiscale
            },
            facture: {
                ...facture.get({ plain: true }),
                numero: facture.numero,
                date_emission: facture.date_emission,
                date_paiement: facture.date_paiement,
                statut_paiement: facture.statut_paiement,
                client_name: facture.client_name,
                montant_ht: montantHT,
                montant_ttc: montantTTC,
                tva: montantTVA,
                remise: montantHT * (remise / 100),
                lignes: facture.lignes.map(l => ({
                    ...l.get({ plain: true }),
                    total: parseFloat(l.prix_unitaire_ht) * parseFloat(l.quantite)
                }))
            }
        };

        // 5. Retourner les données en JSON (à remplacer par la génération PDF réelle)
        res.json({
            success: true,
            data: pdfData,
            message: 'Génération PDF à implémenter'
        });

    } catch (error) {
        console.error("Erreur génération PDF facture:", error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
*/

export const generateFacturePdf = async (req, res) => {
    try {
        // 1. Vérifier que l'utilisateur a une entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom', 'adresse', 'telephone', 'email', 'numeroIdentificationFiscale']
        });

        if (!entreprise) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // 2. Récupérer la facture avec toutes ses relations
        const facture = await Facture.findOne({
            where: {
                id: req.params.id,
                entreprise_id: entreprise.id
            },
            include: [
                {
                    model: Devis,
                    as: 'devisOrigine', // Utiliser l'alias correct
                    attributes: ['id', 'numero', 'remise', 'tva'],
                    include: [{
                        model: LigneDevis,
                        as: 'lignesDevis' // Utiliser l'alias correct
                    }]
                },
                {
                    model: LigneFacture,
                    as: 'lignesFacture' // Utiliser l'alias correct
                }
            ]
        });

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée ou accès non autorisé'
            });
        }

        // 3. Calculer les montants
        const montantHT = facture.lignesFacture.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht) * parseFloat(ligne.quantite)), 0);

        const remise = facture.devisOrigine?.remise || 0; // Utiliser l'alias correct
        const tva = facture.devisOrigine?.tva || 20; // Utiliser l'alias correct

        const montantApresRemise = montantHT - (montantHT * (remise / 100));
        const montantTVA = montantApresRemise * (tva / 100);
        const montantTTC = montantApresRemise + montantTVA;

        // 4. Préparer les données pour le template PDF
        const pdfData = {
            entreprise: {
                nom: entreprise.nom,
                adresse: entreprise.adresse,
                telephone: entreprise.telephone,
                email: entreprise.email,
                siret: entreprise.numeroIdentificationFiscale
            },
            facture: {
                ...facture.get({ plain: true }),
                numero: facture.numero,
                date_emission: facture.date_emission,
                date_paiement: facture.date_paiement,
                statut_paiement: facture.statut_paiement,
                client_name: facture.client_name,
                montant_ht: montantHT,
                montant_ttc: montantTTC,
                tva: montantTVA,
                remise: montantHT * (remise / 100),
                lignes: facture.lignesFacture.map(l => ({ // Utiliser l'alias correct
                    ...l.get({ plain: true }),
                    total: parseFloat(l.prix_unitaire_ht) * parseFloat(l.quantite)
                }))
            }
        };

        // 5. Retourner les données en JSON (à remplacer par la génération PDF réelle)
        res.json({
            success: true,
            data: pdfData,
            message: 'Génération PDF à implémenter'
        });

    } catch (error) {
        console.error("Erreur génération PDF facture:", error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getFacturesByComptable = async (req, res) => {
    try {
        const comptableId = req.user.id;

        const factures = await Facture.findAll({
            where: { comptable_id: comptableId },
            include: [
                {
                    model: Entreprise,
                    as: 'entrepriseFacturee' // Utilise bien l'alias défini dans les relations
                },
                {
                    model: LigneFacture,
                    as: 'lignesFacture' // Inclut aussi les lignes de facture si nécessaire
                }
            ]
        });

        res.json({
            success: true,
            data: factures.map(facture => {
                const facturePlain = facture.get({ plain: true });

                const montantHT = facturePlain.lignesFacture?.reduce((sum, ligne) =>
                    sum + (ligne.prix_unitaire_ht * ligne.quantite), 0
                ) ?? 0;

                const montantTTC = montantHT * 1.2; // TVA 20%

                return {
                    ...facturePlain,
                    entreprise: facturePlain.entrepriseFacturee,
                    montant_ht: montantHT,
                    montant_ttc: montantTTC
                };
            })
        });
    } catch (err) {
        console.error("Erreur getFacturesByComptable:", err);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const deleteFacture = async (req, res) => {
    try {
        // 1. Vérifier que l'utilisateur a une entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id']
        });

        if (!entreprise) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // 2. Vérifier que la facture existe et appartient à l'entreprise
        const facture = await Facture.findOne({
            where: {
                id: req.params.id,
                entreprise_id: entreprise.id
            }
        });

        if (!facture) {
            return res.status(404).json({
                success: false,
                message: 'Facture non trouvée ou accès non autorisé'
            });
        }

        // 3. Supprimer dans une transaction
        const transaction = await sequelize.transaction();
        try {
            // Supprimer d'abord les lignes de facture
            await LigneFacture.destroy({
                where: { facture_id: facture.id },
                transaction
            });

            // Supprimer la facture
            await facture.destroy({ transaction });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Facture supprimée avec succès'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Erreur suppression facture:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la facture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getFacturesByEntreprise,
    getFactureById,
    generateFromDevis,
    updateFacture,
    generateFacturePdf,
    getFacturesByComptable,
    deleteFacture
};