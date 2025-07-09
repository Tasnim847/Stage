import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LigneFacture = sequelize.define('LigneFacture', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    prix_unitaire_ht: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    quantite: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 0.01
        }
    },
    unite: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'unité'
    },
    facture_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'factures',
            key: 'id',
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'lignes_facture',
    freezeTableName: true,
    timestamps: false,
    underscored: true
});

export default LigneFacture;