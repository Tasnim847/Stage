import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import sequelize from './config/database.js';
import syncDatabase from './database/syncDatabase.js';
import entrepriseRoutes from './routes/entrepriseRoutes.js';
import setupRelations from './models/relations.js';
import { authenticateToken } from './middleware/auth.js'; // Importez le middleware
import profileRoutes from './routes/profileRoutes.js';
import devisRoutes from './routes/devisRoutes.js';
import fs from 'fs';
import path from 'path';


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

/*
// Logging en développement
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        next();
    });
}
*/

// Synchronisation de la base de données
sequelize.authenticate()
    .then(() => {
        console.log('✅ Connecté à PostgreSQL');
        setupRelations(); // D'abord les relations
        return syncDatabase(); // Ensuite la synchronisation
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
app.use('/api/profile', authenticateToken, profileRoutes); // Nouvelle route
app.use('/api/devis', authenticateToken, devisRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
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
    app.listen(PORT, () => {
        console.log(`\n✅ Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔐 CORS allowed origin: ${corsOptions.origin}\n`);
    });
}
