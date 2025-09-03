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
    ville: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Non spécifiée' // Optionnel : ajouter une valeur par défaut
    },
    region: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Non spécifiée'
    },
    codePostal: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '00000',
        validate: {
            // Validation basique pour un code postal (peut être adapté selon le pays)
            is: /^\d{5}(-\d{4})?$/
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
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'entreprises',
    freezeTableName: true
});

export default Entreprise;