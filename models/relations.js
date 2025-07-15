import User from './User.js';
import Comptable from './Comptable.js';
import Entreprise from './Entreprise.js';
import Devis from './Devis.js';
import LigneDevis from './lignesDevis.js';
import Facture from './Facture.js';
import LigneFacture from "./LigneFacture.js";

export default function setupRelations() {
    try {
        // 1. Relation User -> Comptable (One-to-One)
        User.hasOne(Comptable, {
            foreignKey: 'userId',
            as: 'comptableProfile',  // Alias spécifique
            onDelete: 'CASCADE'
        });
        Comptable.belongsTo(User, {
            foreignKey: 'userId',
            as: 'user'
        });

        // 2. Relation User -> Entreprise (One-to-Many)
        User.hasMany(Entreprise, {
            foreignKey: 'userId',
            as: 'entreprises'
        });
        Entreprise.belongsTo(User, {
            foreignKey: 'userId',
            as: 'proprietaire'
        });

        // 3. Relation Comptable -> Entreprise (One-to-Many)
        Comptable.hasMany(Entreprise, {
            foreignKey: 'comptableId',
            as: 'entreprisesGerees'
        });
        Entreprise.belongsTo(Comptable, {
            foreignKey: 'comptableId',
            as: 'comptableAttitre'
        });

        // 4. Relations Devis
        Devis.hasMany(LigneDevis, {
            foreignKey: 'devis_id',
            as: 'lignesDevis',
            onDelete: 'CASCADE'
        });
        LigneDevis.belongsTo(Devis, {
            foreignKey: 'devis_id',
            as: 'devis'
        });


        // 5. Relations Entreprise -> Devis
        Entreprise.hasMany(Devis, {
            foreignKey: 'entreprise_id',
            as: 'devisEntreprise'
        });
        Devis.belongsTo(Entreprise, {
            foreignKey: 'entreprise_id',
            as: 'entreprise'
        });

        // 6. Relations Devis -> Facture
        Devis.hasOne(Facture, {
            foreignKey: 'devis_id',
            as: 'factureLiee'
        });
        Facture.belongsTo(Devis, {
            foreignKey: 'devis_id',
            as: 'devisOrigine'
        });

        // 7. Relations Entreprise -> Facture
        Entreprise.hasMany(Facture, {
            foreignKey: 'entreprise_id',
            as: 'factures'
        });
        Facture.belongsTo(Entreprise, {
            foreignKey: 'entreprise_id',
            as: 'entrepriseFacturee'
        });

        // 8. Relations Facture -> LigneFacture
        Facture.hasMany(LigneFacture, {
            foreignKey: 'facture_id',
            as: 'lignesFacture',
            onDelete: 'CASCADE'
        });
        LigneFacture.belongsTo(Facture, {
            foreignKey: 'facture_id',
            as: 'facture'
        });

        // 9. Relations Comptable -> Facture
        Comptable.hasMany(Facture, {
            foreignKey: 'comptable_id',
            as: 'facturesGenerees'
        });
        Facture.belongsTo(Comptable, {
            foreignKey: 'comptable_id',
            as: 'comptableCreateur'  // Alias modifié pour éviter le conflit
        });

        console.log('✅ Relations configurées avec succès');
    } catch (error) {
        console.error('❌ Erreur de configuration des relations:', error);
        throw error;
    }
}