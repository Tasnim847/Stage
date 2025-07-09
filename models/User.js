import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    role: {
        type: DataTypes.ENUM('comptable', 'entreprise'),
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'users',
    timestamps: true, // Génère created_at et updated_at
    paranoid: true,   // Ajoute deleted_at
    createdAt: 'created_at', // Nom de colonne personnalisé
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

export default User;