import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Facture = sequelize.define('Facture', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    numero: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    date_emission: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    date_paiement: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    montant_ht: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    montant_ttc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    statut_paiement: {
        type: DataTypes.ENUM('brouillon', 'payé', 'impayé'),
        defaultValue: 'brouillon',
    },
    remise: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
    },
    tva: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 20.00,
    },
    mode_paiement: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    client_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    entreprise_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'entreprises',   // <-- en minuscules ici !!
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    comptable_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comptables',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    devis_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'devis',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    }
}, {
    tableName: 'factures',
    timestamps: true,
});
export default Facture;
