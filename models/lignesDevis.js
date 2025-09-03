import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LigneDevis = sequelize.define('LigneDevis', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    devis_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'devis',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    prix_unitaire_ht: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    quantite: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    unite: {
        type: DataTypes.STRING(50),
        defaultValue: 'unité',
    },

}, {
    tableName: 'lignes_devis',
    freezeTableName: true,
    timestamps: false,
    underscored: true
});

export default LigneDevis;