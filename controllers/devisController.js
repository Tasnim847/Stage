import Devis from '../models/Devis.js';
import LigneDevis from '../models/lignesDevis.js';
import Entreprise from '../models/Entreprise.js';
import sequelize from '../config/database.js';
import pdf from 'html-pdf';
import { devisTemplate } from '../templates/devisTemplate.js';


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

export const getDevisByEntreprise = async (req, res) => {
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

        const devis = await Devis.findAll({
            where: { entreprise_id: entreprise.id },
            include: [{
                model: LigneDevis,
                as: 'lignesDevis', // ✅ alias correct ici
                attributes: ['id', 'description', 'prix_unitaire_ht', 'quantite', 'unite']
            }],
            order: [['date_creation', 'DESC']]
        });


        res.status(200).json({
            success: true,
            data: devis
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getDevisById = async (req, res) => {
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

        const devis = await Devis.findOne({
            where: {
                id: req.params.id,
                entreprise_id: entreprise.id
            },
            include: [{
                model: LigneDevis,
                as: 'lignesDevis'
            }]

        });

        if (!devis) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé.'
            });
        }

        res.json({
            success: true,
            data: devis
        });

    } catch (error) {
        console.error('Erreur récupération devis par ID:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const createDevis = async (req, res) => {
    try {
        const {
            numero,
            date_creation,
            date_validite,
            remise = 0,
            tva = 20,
            client_name,
            montant_ttc,
            montant_ht,
            lignes = [],
            statut = 'brouillon'
        } = req.body;

        // Validation des données
        if (!numero || !date_creation || !client_name) {
            return res.status(400).json({
                success: false,
                message: 'Les champs "numero", "date_creation" et "client_name" sont obligatoires.'
            });
        }

        if (!Array.isArray(lignes) || lignes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Au moins une ligne de devis est requise.'
            });
        }

        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id']
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée pour cet utilisateur.'
            });
        }

        const result = await executeInTransaction(async (transaction) => {
            // Calcul des montants
            const montantHT = lignes.reduce((sum, ligne) =>
                sum + ((parseFloat(ligne.prix_unitaire_ht) || 0) * (parseFloat(ligne.quantite) || 0)), 0);

            const montantApresRemise = montantHT - (montantHT * (remise / 100));
            const montantTTC = montantApresRemise * (1 + (tva / 100));

            // Création du devis
            const devis = await Devis.create({
                numero,
                date_creation,
                date_validite,
                entreprise_id: entreprise.id,
                client_name,
                remise,
                tva,
                statut,
                montant_ht: montantHT,
                montant_ttc: montantTTC
            }, { transaction });

            // Création des lignes de devis
            const lignesDevis = await LigneDevis.bulkCreate(
                lignes.map(ligne => ({
                    description: ligne.description,
                    prix_unitaire_ht: parseFloat(ligne.prix_unitaire_ht) || 0,
                    quantite: parseInt(ligne.quantite) || 1,
                    unite: ligne.unite || 'unité',
                    devis_id: devis.id
                })),
                { transaction }
            );

            return { devis, lignesDevis };
        });

        return res.status(201).json({
            success: true,
            data: {
                ...result.devis.toJSON(),
                lignes: result.lignesDevis
            }
        });

    } catch (error) {
        console.error('Erreur création devis:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du devis',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateDevis = async (req, res) => {
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
            // Vérification que le devis existe et appartient à l'entreprise
            const devis = await Devis.findOne({
                where: {
                    id: req.params.id,
                    entreprise_id: entreprise.id
                },
                include: [{
                    model: LigneDevis,
                    as: 'lignesDevis'
                }],
                transaction
            });

            if (!devis) {
                throw new Error('Devis non trouvé ou accès non autorisé');
            }

            // Calcul des nouveaux montants basés sur les lignes existantes ou nouvelles
            const lignes = req.body.lignes || [];
            const montantHT = lignes.reduce((sum, ligne) =>
                sum + (parseFloat(ligne.prix_unitaire_ht || 0) * parseFloat(ligne.quantite || 0)), 0);

            const remise = parseFloat(req.body.remise || devis.remise);
            const tva = parseFloat(req.body.tva || devis.tva);

            const montantApresRemise = montantHT - (montantHT * (remise / 100));
            const montantTTC = montantApresRemise * (1 + (tva / 100));

            // Mise à jour du devis
            await devis.update({
                numero: req.body.numero || devis.numero,
                date_creation: req.body.date_creation || devis.date_creation,
                date_validite: req.body.date_validite !== undefined ? req.body.date_validite : devis.date_validite,
                client_name: req.body.client_name || devis.client_name,
                remise: remise,
                tva: tva,
                statut: req.body.statut || devis.statut,
                montant_ht: parseFloat(montantHT.toFixed(2)),
                montant_ttc: parseFloat(montantTTC.toFixed(2))
            }, { transaction });

            // Gestion des lignes - Mise à jour au lieu de supprimer et recréer
            if (lignes.length > 0) {
                // Récupérer les IDs des lignes existantes
                const existingLineIds = devis.lignesDevis.map(line => line.id);
                const newLineIds = [];

                // Traiter chaque ligne
                for (const ligne of lignes) {
                    if (ligne.id && existingLineIds.includes(ligne.id)) {
                        // Mettre à jour une ligne existante
                        await LigneDevis.update({
                            description: ligne.description,
                            prix_unitaire_ht: parseFloat(ligne.prix_unitaire_ht) || 0,
                            quantite: parseInt(ligne.quantite) || 1,
                            unite: ligne.unite || 'unité'
                        }, {
                            where: { id: ligne.id },
                            transaction
                        });
                        newLineIds.push(ligne.id);
                    } else {
                        // Créer une nouvelle ligne
                        const newLine = await LigneDevis.create({
                            description: ligne.description,
                            prix_unitaire_ht: parseFloat(ligne.prix_unitaire_ht) || 0,
                            quantite: parseInt(ligne.quantite) || 1,
                            unite: ligne.unite || 'unité',
                            devis_id: devis.id
                        }, { transaction });
                        newLineIds.push(newLine.id);
                    }
                }

                // Supprimer les lignes qui n'existent plus
                const linesToDelete = existingLineIds.filter(id => !newLineIds.includes(id));
                if (linesToDelete.length > 0) {
                    await LigneDevis.destroy({
                        where: {
                            id: linesToDelete,
                            devis_id: devis.id
                        },
                        transaction
                    });
                }
            }

            // Récupérer les lignes mises à jour
            const updatedLignes = await LigneDevis.findAll({
                where: { devis_id: devis.id },
                transaction
            });

            return { devis, lignesDevis: updatedLignes };
        });

        res.json({
            success: true,
            data: {
                ...result.devis.toJSON(),
                lignes: result.lignesDevis
            }
        });

    } catch (error) {
        console.error('Erreur mise à jour devis:', error);

        if (error.message === 'Devis non trouvé ou accès non autorisé') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du devis',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const deleteDevis = async (req, res) => {
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

        await executeInTransaction(async (transaction) => {
            const devis = await Devis.findOne({
                where: {
                    id: req.params.id,
                    entreprise_id: entreprise.id
                },
                transaction
            });

            if (!devis) {
                throw new Error('Devis non trouvé ou accès non autorisé');
            }

            await LigneDevis.destroy({
                where: { devis_id: devis.id },
                transaction
            });

            await devis.destroy({ transaction });
        });

        res.json({
            success: true,
            message: 'Devis supprimé avec succès.'
        });

    } catch (error) {
        console.error('Erreur suppression devis:', error);

        if (error.message === 'Devis non trouvé ou accès non autorisé') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du devis',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const generateDevisPdf = async (req, res) => {
    try {
        // 1. Récupérer les données nécessaires
        const entreprise = await Entreprise.findOne({
            where: { userId: req.user.id },
            attributes: ['id', 'nom', 'adresse',  'telephone', 'email', 'numeroIdentificationFiscale']
        });

        if (!entreprise) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise introuvable.'
            });
        }

        // 2. Récupérer le devis avec ses lignes
        const devis = await Devis.findOne({
            where: { id: req.params.id },
            include: [{
                model: LigneDevis,
                as: 'lignesDevis'
            }]
        });

        if (!devis) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé.'
            });
        }

        // 3. Calculer les montants si nécessaire
        const montantHT = devis.lignesDevis.reduce((sum, ligne) =>
            sum + (parseFloat(ligne.prix_unitaire_ht || 0) * parseFloat(ligne.quantite || 0), 0));
        const montantApresRemise = montantHT - (montantHT * (devis.remise / 100));
        const montantTTC = montantApresRemise * (1 + (devis.tva / 100));

        // 4. Préparer les données pour le template
        // Dans generateDevisPdf, modifiez la préparation des données pour le template
        const pdfData = {
            entreprise: {
                ...entreprise.get({ plain: true }),
                siret: entreprise.numeroIdentificationFiscale,
                adresse_complete: `${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}`
            },
            devis: {
                ...devis.get({ plain: true }),
                montant_ht: parseFloat(montantHT),
                montant_ttc: parseFloat(montantTTC),
                date_creation: formatDate(devis.date_creation),
                date_validite: devis.date_validite ? formatDate(devis.date_validite) : null,
                lignes: devis.lignesDevis.map(l => ({
                    ...l.get({ plain: true }),
                    prix_unitaire_ht: parseFloat(l.prix_unitaire_ht),
                    quantite: parseFloat(l.quantite),
                    total: parseFloat(l.prix_unitaire_ht) * parseFloat(l.quantite)
                }))
            }
        };

        // 5. Générer le HTML
        const html = devisTemplate(pdfData);

        // 6. Options PDF
        const options = {
            format: 'A4',
            border: "10mm",
            footer: {
                height: "10mm",
                contents: `<div style="text-align:center;font-size:10px;">
                    ${entreprise.nom} - N°ID: ${entreprise.numeroIdentificationFiscale} - ${entreprise.telephone}
                </div>`
            }
        };

        // 7. Créer et envoyer le PDF
        pdf.create(html, options).toStream((err, stream) => {
            if (err) {
                console.error("Erreur génération PDF:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération du PDF'
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=devis-${devis.numero}.pdf`);
            stream.pipe(res);
        });

    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Fonction helper pour le format de date
function formatDate(dateString) {
    if (!dateString) return '';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

