import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Devis = sequelize.define('Devis', {
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
    date_creation: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    date_validite: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    entreprise_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'entreprises',
            key: 'id',
        },
    },
    client_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    remise: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
    },
    tva: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 20.00,
    },
    montant_ht: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    montant_ttc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    statut: {
        type: DataTypes.STRING(50),
        defaultValue: 'brouillon',
    },
    signature: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'devis',
    freezeTableName: true,
    timestamps: false,
    underscored: true
});

export default Devis;