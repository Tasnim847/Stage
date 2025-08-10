// models/Notification.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Comptable from './Comptable.js';

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    related_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    comptable_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Comptable,
            key: 'id'
        }
    }
}, {
    tableName: 'notifications', // Nom explicite de la table
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Relations
Notification.belongsTo(Comptable, {
    foreignKey: 'comptable_id',
    as: 'comptable'
});

export default Notification;