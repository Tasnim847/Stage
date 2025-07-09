import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Devis from '../models/Devis.js';
import Facture from '../models/Facture.js';
import Entreprise from '../models/Entreprise.js';
import LigneDevis from '../models/lignesDevis.js';
import LigneFacture from "../models/LigneFacture.js";

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
// Dans factureController.js - version corrigée de getFacturesByEntreprise
export const getFacturesByEntreprise = async (req, res) => {
    try {
        // 1. Vérifier que l'utilisateur est authentifié et a une entreprise
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // 2. Récupérer l'entreprise de l'utilisateur
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom']
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise introuvable.'
            });
        }

        // 3. Paramètres de pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 4. Construire les conditions de requête
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

        // 5. Requête principale
        const { count, rows: factures } = await Facture.findAndCountAll({
            where,
            include: [
                {
                    model: LigneFacture,
                    as: 'lignes',
                    attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite']
                }
            ],
            order: [['date_emission', 'DESC']],
            limit,
            offset
        });

        // 6. Calculer les totaux pour chaque facture
        const facturesWithTotals = factures.map(facture => {
            const montantHT = facture.lignes.reduce((sum, ligne) =>
                sum + (ligne.prix_unitaire_ht * ligne.quantite), 0);

            return {
                ...facture.get({ plain: true }),
                montant_ht: montantHT,
                montant_ttc: montantHT * 1.2 // TVA 20% par défaut
            };
        });

        // 7. Réponse structurée
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
                        as: 'lignes',
                        attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite', 'unite']
                    }]
                },
                {
                    model: LigneFacture,
                    as: 'lignes',
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
        const montantHT = facture.lignes.reduce((sum, ligne) =>
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

        // 2. Récupérer le devis et vérifier qu'il appartient à l'entreprise
        const devis = await Devis.findOne({
            where: {
                id: devis_id,
                entreprise_id: entreprise.id,
                statut: 'accepté' // Seuls les devis acceptés peuvent être convertis
            },
            include: [{
                model: LigneDevis,
                as: 'lignes'
            }]
        });

        if (!devis) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé ou non éligible à la conversion'
            });
        }

        // 3. Vérifier si une facture existe déjà
        const existingFacture = await Facture.findOne({
            where: { devis_id }
        });

        if (existingFacture) {
            return res.status(400).json({
                success: false,
                message: 'Une facture existe déjà pour ce devis'
            });
        }

        // 4. Générer le numéro de facture
        const lastFacture = await Facture.findOne({
            where: { entreprise_id: entreprise.id },
            order: [['createdAt', 'DESC']]
        });

        let nextNum = 1;
        if (lastFacture) {
            const matches = lastFacture.numero.match(/\d+/);
            if (matches) nextNum = parseInt(matches[0]) + 1;
        }

        const numero = `FA-${new Date().getFullYear()}-${nextNum.toString().padStart(3, '0')}`;

        // 5. Créer la facture et ses lignes dans une transaction
        const result = await executeInTransaction(async (transaction) => {
            // Créer la facture
            const facture = await Facture.create({
                numero,
                date_emission: new Date(),
                devis_id: devis.id,
                montant_ht: devis.montant_ht,
                montant_ttc: devis.montant_ttc,
                statut_paiement: 'impayé',
                entreprise_id: entreprise.id,
                client_name: devis.client_name
            }, { transaction });

            // Créer les lignes de facture
            const lignesFacture = await LigneFacture.bulkCreate(
                devis.lignes.map(ligne => ({
                    description: ligne.description,
                    prix_unitaire_ht: ligne.prix_unitaire_ht,
                    quantite: ligne.quantite,
                    unite: ligne.unite,
                    facture_id: facture.id
                })),
                { transaction }
            );

            // Mettre à jour le statut du devis
            await devis.update({ statut: 'facturé' }, { transaction });

            return { facture, lignesFacture };
        });

        res.json({
            success: true,
            data: {
                ...result.facture.toJSON(),
                lignes: result.lignesFacture
            },
            message: 'Facture générée avec succès'
        });

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
                        as: 'lignes'
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
        const montantHT = facture.lignes.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht) * parseFloat(ligne.quantite)), 0);

        const remise = facture.Devis?.remise || 0;
        const tva = facture.Devis?.tva || 20;

        const montantApresRemise = montantHT - (montantHT * (remise / 100));
        const montantTVA = montantApresRemise * (tva / 100);
        const montantTTC = montantApresRemise + montantTVA;

        // 4. Préparer les données pour le template PDF (à adapter selon votre template)
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

        // 5. Générer le PDF (implémentation dépend de votre librairie PDF)
        // Exemple avec html-pdf:
        // const html = factureTemplate(pdfData);
        // pdf.create(html, options).toStream((err, stream) => {
        //     if (err) return res.status(500).json({ success: false, message: 'Erreur génération PDF' });
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', `inline; filename=facture-${facture.numero}.pdf`);
        //     stream.pipe(res);
        // });

        // Pour l'instant, retourner les données en JSON
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


