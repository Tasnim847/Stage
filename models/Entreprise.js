import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Entreprise = sequelize.define('Entreprise', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 128]
        }
        },
    adresse: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numeroIdentificationFiscale: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    siteWeb: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'entreprise'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    comptableId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comptables',
            key: 'id'
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active' // Spécifie explicitement le nom de la colonne
    }
}, {
    tableName: 'entreprises',
    timestamps: true
});

export default Entreprise;