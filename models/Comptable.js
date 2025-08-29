import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comptable = sequelize.define('Comptable', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 30]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 128]
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            is: /^[a-zA-ZÀ-ÿ\s-]{2,30}$/
        }
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            is: /^[a-zA-ZÀ-ÿ\s-]{2,30}$/
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
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'comptable'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'comptables',
    timestamps: true,
    paranoid: false,
});

export default Comptable;