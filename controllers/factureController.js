import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Devis from '../models/Devis.js';
import Facture from '../models/Facture.js';
import Entreprise from '../models/Entreprise.js';
import LigneDevis from '../models/lignesDevis.js';
import LigneFacture from "../models/LigneFacture.js";
import Comptable from "../models/Comptable.js";
import { Op } from 'sequelize';

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

/**
 * Récupère toutes les factures d'une entreprise avec pagination et filtrage
 */
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
                    as: 'lignesFacture',  // <-- alias corrigé pour correspondre à l’association
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

/**
 * Récupère une facture spécifique avec toutes ses informations
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

/**
 * Génère une facture à partir d'un devis
 */
export const generateFromDevis = async (req, res) => {
    try {
        const { devis_id } = req.body;

        // Vérification de l'entreprise
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'comptableId']
        });

        if (!entreprise) {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }

        if (!entreprise.comptableId) {
            return res.status(400).json({
                success: false,
                message: 'Aucun comptable associé à cette entreprise'
            });
        }

        // Récupération du devis
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

        // Calcul des montants HT et TTC
        const montantHT = devis.lignesDevis.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht || 0) * parseFloat(ligne.quantite || 0)), 0);

        const montantTTC = montantHT * 1.2;

        // Création de la facture
        const transaction = await sequelize.transaction();
        try {
            // Création de la facture avec les montants calculés
            const facture = await Facture.create({
                numero: `FAC-${Date.now()}`,
                date_emission: new Date(),
                statut_paiement: 'brouillon', // Or 'impayé' if that makes more sense // ou 'en_attente_de_paiement' selon ce que tu as
                client_name: devis.client_name,
                montant_ht: montantHT,
                montant_ttc: montantTTC,
                entreprise_id: entreprise.id,
                comptable_id: entreprise.comptableId,
                devis_id: devis.id
            }, { transaction });

            // Copie des lignes
            const lignesFacture = devis.lignesDevis.map(ligne => ({
                description: ligne.description,
                prix_unitaire_ht: ligne.prix_unitaire_ht,
                quantite: ligne.quantite,
                unite: ligne.unite,
                facture_id: facture.id
            }));


            await LigneFacture.bulkCreate(lignesFacture, { transaction });

            await transaction.commit();

            res.json({
                success: true,
                data: facture,
                message: 'Facture générée avec succès'
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Erreur génération facture:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de la facture',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Met à jour une facture (principalement le statut de paiement)
 */
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

/**
 * Génère un PDF pour une facture
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

/**
 * Récupère les factures associées à un comptable
 */
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
