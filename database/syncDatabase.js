import sequelize from '../config/database.js';

import User from '../models/User.js';
import Comptable from '../models/Comptable.js';
import Entreprise from '../models/Entreprise.js';
import Devis from "../models/Devis.js";
import LigneDevis from "../models/lignesDevis.js";
import Facture from "../models/Facture.js";
import LigneFacture from "../models/LigneFacture.js";
import Notification from "../models/Notification.js";
export default async function syncDatabase() {
    try {
        // Ne pas appeler setupRelations ici
        // Les relations doivent être configurées une seule fois, idéalement dans server.js

        // 2. Mode développement - recréation complète
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ force: true });
            console.log('🔄 Base recréée (mode développement)');
            return;
        }

        // 3. Mode production - synchronisation sécurisée

        await sequelize.sync({ force: true });
        await sequelize.query('SET session_replication_role = DEFAULT;');

        const models = [
            { model: User, tableName: 'users' },
            { model: Comptable, tableName: 'comptables' },
            { model: Entreprise, tableName: 'entreprises' },
            { model: Devis, tableName: 'devis' },
            { model: LigneDevis, tableName: 'lignes_devis' },
            { model: Facture, tableName: 'factures' },
            { model: LigneFacture, tableName: 'lignes_facture' },
            { model: Notification, tableName: 'notifications' }
        ];

        // 4. Vérifier et créer les tables si nécessaire
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

        // 5. Réactiver les contraintes
        await sequelize.query('SET session_replication_role = default;');
        console.log('✅ Toutes les tables synchronisées avec succès');

    } catch (error) {
        console.error('❌ Erreur de synchronisation:', error);
        throw error;
    }
}
