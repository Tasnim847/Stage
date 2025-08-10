import Notification from '../models/Notification.js';
import Comptable from '../models/Comptable.js';
import { sendNotificationToComptable } from '../server.js';

export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: { comptable_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [{
                model: Comptable,
                attributes: ['id', 'name', 'lastname'] // Utilisez les bons noms de champs
            }]
        });

        const unreadCount = await Notification.count({
            where: {
                comptable_id: req.user.id,
                read: false
            }
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                comptable_id: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }

        await notification.update({ read: true });

        res.json({
            success: true,
            message: 'Notification marquée comme lue'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { read: true },
            {
                where: {
                    comptable_id: req.user.id,
                    read: false
                }
            }
        );

        res.json({
            success: true,
            message: 'Toutes les notifications marquées comme lues'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const deleted = await Notification.destroy({
            where: {
                id: req.params.id,
                comptable_id: req.user.id
            }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Notification supprimée'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

export const createNotification = async (comptableId, message, type, relatedEntityId) => {
    try {
        const notification = await Notification.create({
            message,
            type,
            related_entity_id: relatedEntityId,
            comptable_id: comptableId,  // Ce champ correspond à votre modèle
            read: false
        });

        sendNotificationToComptable(comptableId, notification);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Ajoutez cette fonction à votre contrôleur (si elle n'existe pas déjà)
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.count({
            where: {
                comptable_id: req.user.id,
                read: false
            }
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

