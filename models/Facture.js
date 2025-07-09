import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Facture = sequelize.define('Facture', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    numero: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    date_emission: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    date_paiement: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    devis_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Assure qu'un devis ne peut avoir qu'une seule facture
        references: {
            model: 'devis',
            key: 'id',
        },
    },
    montant_ht: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Changed from false to true
    },
    montant_ttc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Changed from false to true
    },
    statut_paiement: {
        type: DataTypes.ENUM('impayé', 'partiel', 'payé'),
        defaultValue: 'impayé',
    },
    mode_paiement: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'factures',
    freezeTableName: true,
    timestamps: false,
    underscored: true
});

export default Facture;