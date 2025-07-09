import User from './User.js';
import Comptable from './Comptable.js';
import Entreprise from './Entreprise.js';
import Devis   from './Devis.js';
import LigneDevis from './lignesDevis.js';
import Facture from './Facture.js';
import LigneFacture from "./LigneFacture.js";

export default function setupRelations() {
    try {
        // Relation User -> Comptable (One-to-One)
        User.hasOne(Comptable, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
        Comptable.belongsTo(User, {
            foreignKey: 'userId'
        });

        // Relation User -> Entreprise (One-to-Many)
        User.hasMany(Entreprise, {
            foreignKey: 'userId',
            as: 'entreprises'
        });
        Entreprise.belongsTo(User, {
            foreignKey: 'userId'
        });

        // Relation Comptable -> Entreprise (One-to-Many)
        Comptable.hasMany(Entreprise, {
            foreignKey: 'comptableId',
            as: 'managedEntreprises'
        });
        Entreprise.belongsTo(Comptable, {
            foreignKey: 'comptableId',
            as: 'comptable'
        });

        Devis.hasMany(LigneDevis, {
            foreignKey: 'devis_id',
            as: 'lignes',
            onDelete: 'CASCADE'
        });

        LigneDevis.belongsTo(Devis, {
            foreignKey: 'devis_id',
            as: 'devis'
        });

        Entreprise.hasMany(Devis, {
            foreignKey: 'entreprise_id',
            as: 'devis'
        });

        Devis.belongsTo(Entreprise, {
            foreignKey: 'entreprise_id',
            as: 'entreprise'
        });


        Devis.hasOne(Facture, { foreignKey: 'devis_id' });
        Facture.belongsTo(Devis, { foreignKey: 'devis_id' });


// La relation avec Entreprise se fait via Devis
        Facture.belongsTo(Entreprise, {
            through: Devis,
            foreignKey: 'entreprise_id'
        });

        // Association Facture -> LigneFacture (une facture a plusieurs lignes)
        Facture.hasMany(LigneFacture, {
            foreignKey: 'facture_id',
            as: 'lignes',
            onDelete: 'CASCADE'
        });

// Association LigneFacture -> Facture (une ligne appartient à une facture)
        LigneFacture.belongsTo(Facture, {
            foreignKey: 'facture_id',
            as: 'facture'
        });

        console.log('✅ Relations configurées avec succès');
    } catch (error) {
        console.error('❌ Erreur de configuration des relations:', error);
        throw error;
    }
}