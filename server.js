import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import sequelize from './config/database.js';
import syncDatabase from './database/syncDatabase.js';
import entrepriseRoutes from './routes/entrepriseRoutes.js';
import setupRelations from './models/relations.js';
import { authenticateToken } from './middleware/auth.js';
import profileRoutes from './routes/profileRoutes.js';
import devisRoutes from './routes/devisRoutes.js';
import factureRoutes from "./routes/factureRoutes.js";
import dashboardRoutes from './routes/dashboardRoutes.js';
import emailRouter from './routes/email.js';
import notificationRoutes from './routes/notificationRoutes.js'; // Nouvelle route
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Configuration de l'environnement
dotenv.config();

const app = express();

// Configuration CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Création du serveur HTTP
const server = createServer(app);

// Configuration WebSocket
const wss = new WebSocketServer({ server });
const userConnections = new Map();

wss.on('connection', (ws, req) => {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const userId = params.get('userId');
    const userType = params.get('userType');

    if (userId && userType === 'comptable') {
        userConnections.set(userId, ws);
        console.log(`Nouvelle connexion WebSocket pour comptable ID: ${userId}`);

        ws.on('close', () => {
            userConnections.delete(userId);
            console.log(`Connexion WebSocket fermée pour comptable ID: ${userId}`);
        });
    }
});

// Export pour utilisation dans les contrôleurs
export const sendNotificationToComptable = (comptableId, notification) => {
    const ws = userConnections.get(comptableId.toString());
    if (ws) {
        ws.send(JSON.stringify({
            type: 'NEW_NOTIFICATION',
            data: notification
        }));
    }
};

// Vérification/Création du dossier uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Dossier uploads créé à: ${uploadDir}`);
}

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Synchronisation de la base de données
sequelize.authenticate()
    .then(() => {
        console.log('✅ Connecté à PostgreSQL');
        setupRelations();
        return syncDatabase();
    })
    .then(() => {
        startServer();
    })
    .catch(err => {
        console.error('❌ Erreur d\'initialisation:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entreprises', authenticateToken, entrepriseRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/devis', authenticateToken, devisRoutes);
app.use('/api/factures', authenticateToken, factureRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/email', emailRouter);
app.use('/api/notifications', authenticateToken, notificationRoutes); // Nouvelle route

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        wsConnections: userConnections.size
    });
});

// Gestion des erreurs
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

function startServer() {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`\n✅ Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔐 CORS allowed origin: ${corsOptions.origin}`);
        console.log(`🔄 ${userConnections.size} connexions WebSocket actives\n`);
    });
}