import sequelize from '../config/database.js';
import User from '../models/User.js';
import Comptable from '../models/Comptable.js';
import Entreprise from '../models/Entreprise.js';
import Devis from "../models/Devis.js";
import LigneDevis from "../models/lignesDevis.js";
import Facture from "../models/Facture.js";
import LigneFacture from "../models/LigneFacture.js";

/*
export default async function syncDatabase() {
    try {
        // En développement, on force la recréation complète des tables
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ force: true });
            console.log('🔄 Base recréée (mode développement)');
            return;
        }

        // En production, on utilise une approche plus sécurisée
        await sequelize.query('SET session_replication_role = replica;');

        // D'abord vérifier si la table existe
        const tableExists = await sequelize.getQueryInterface().tableExists('users');

        if (!tableExists) {
            await User.sync();
            console.log('✅ Table users créée');
        } else {
            // Pour les tables existantes, on utilise alter: false
            await User.sync({ alter: false });
            console.log('✅ Table users vérifiée (sans modification)');
        }

        // Même approche pour les autres tables
        await Comptable.sync({ alter: !(await sequelize.getQueryInterface().tableExists('comptables')) });
        await Entreprise.sync({ alter: !(await sequelize.getQueryInterface().tableExists('entreprises')) });

        await sequelize.query('SET session_replication_role = default;');
        console.log('✅ Toutes les tables synchronisées');

    } catch (error) {
        console.error('❌ Erreur de synchronisation:', error);
        throw error;
    }
}
*/

export default async function syncDatabase() {
    try {
        // En développement, on force la recréation complète des tables
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ force: true });
            console.log('🔄 Base recréée (mode développement)');
            return;
        }

        await sequelize.query('SET session_replication_role = replica;');

        // Liste de toutes vos tables/models
        const models = [
            { model: User, tableName: 'users' },
            { model: Comptable, tableName: 'comptables' },
            { model: Entreprise, tableName: 'entreprises' },
            { model: Devis, tableName: 'devis' },
            { model: LigneDevis, tableName: 'lignes_devis' },
            { model: Facture, tableName: 'factures' },
            { model: LigneFacture, tableName: 'ligne_facture' }
        ];

        for (const { model, tableName } of models) {
            const tableExists = await sequelize.getQueryInterface().tableExists(tableName);

            if (!tableExists) {
                await model.sync();
                console.log(`✅ Table ${tableName} créée`);
            } else {
                await model.sync({ alter: false });
                console.log(`✅ Table ${tableName} vérifiée (sans modification)`);
            }
        }

        await sequelize.query('SET session_replication_role = default;');
        console.log('✅ Toutes les tables synchronisées');

    } catch (error) {
        console.error('❌ Erreur de synchronisation:', error);
        throw error;
    }
}