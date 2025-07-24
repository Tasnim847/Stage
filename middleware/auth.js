import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Entreprise from '../models/Entreprise.js';
import Comptable from '../models/Comptable.js'; // Ajout de l'import manquant

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const OLD_JWT_SECRET = process.env.OLD_JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}

// === Génération du token ===
export const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// === Middleware principal d'authentification ===
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            code: 'MISSING_TOKEN',
            message: 'Authorization header is required'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Token must be in format: Bearer <token>'
        });
    }

    try {
        const decoded = await verifyToken(token);

        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'email', 'role']
        });

        if (!user) {
            return res.status(403).json({ code: 'USER_NOT_FOUND' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Erreur auth:', error);
        handleAuthError(error, res);
    }
};

// === Vérification flexible (support ancien secret) ===
const verifyToken = async (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (OLD_JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, OLD_JWT_SECRET);
                console.warn(`⚠️ Ancien secret utilisé pour l'utilisateur ${decoded.id}`);
                return decoded;
            } catch (oldError) {
                throw error;
            }
        }
        throw error;
    }
};

// === Gestion des erreurs JWT ===
const handleAuthError = (error, res) => {
    console.error('Auth error:', error);

    const response = {
        code: 'AUTH_ERROR',
        message: 'Échec de l\'authentification'
    };

    if (error.name === 'TokenExpiredError') {
        response.code = 'TOKEN_EXPIRED';
        response.message = 'Session expirée';
        return res.status(401).json(response);
    }

    if (error.name === 'JsonWebTokenError') {
        response.code = 'INVALID_TOKEN';
        response.message = 'Token invalide';
        return res.status(403).json(response);
    }

    res.status(500).json({
        ...response,
        message: process.env.NODE_ENV === 'development' ? error.message : response.message
    });
};

// === Middleware protect ===
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] },
                include: [
                    { model: Entreprise, as: 'entreprises' }, // Changé de 'entreprise' à 'entreprises'
                    { model: Comptable, as: 'comptableProfile' }
                ]
            });

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            next();
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            res.status(401).json({
                success: false,
                message: 'Non autorisé, token invalide'
            });
        }
    }

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Non autorisé, pas de token'
        });
    }
};

// === Vérification de rôle ===
export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé pour ce rôle'
            });
        }

        next();
    };
};

// === Logger des requêtes protégées ===
export const authLogger = (req, res, next) => {
    const user = req.user ? req.user.id : 'anonymous';
     next();
};

// === Vérification simple d'un token via body ou query ===
export const verifyTokenMiddleware = async (req, res, next) => {
    const token = req.body.token || req.query.token;

    if (!token) {
        return res.status(400).json({
            code: 'TOKEN_REQUIRED',
            message: 'Token non fourni'
        });
    }

    try {
        const decoded = await verifyToken(token);
        res.locals.decodedToken = decoded;
        next();
    } catch (error) {
        handleAuthError(error, res);
    }
};

// === Authentification souple ===
export const softAuthenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return next();

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        req.user = decoded;

        if (decoded.exp < Date.now() / 1000) {
            req.tokenExpired = true;
        }
    } catch (error) {
        console.warn('Token verification warning:', error.message);
    }

    next();
};

// === Middleware spécifique pour comptable ===
export const authenticateComptable = (req, res, next) => {
    if (req.user && req.user.role === 'comptable') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
};

// middleware/auth.js
export const authComptable = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ message: 'Token manquant' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Format de token invalide' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            include: [{
                model: Comptable,
                as: 'comptableProfile',
                attributes: ['id']
            }]
        });


        if (!user || user.role !== 'comptable') {
            return res.status(403).json({ message: 'Accès réservé aux comptables' });
        }

        req.comptableId = user.comptableProfile?.id;
        req.user = user.get({ plain: true });

        next();
    } catch (error) {
        console.error('[MIDDLEWARE] Erreur:', error);
        const message = error.name === 'TokenExpiredError'
            ? 'Session expirée'
            : 'Token invalide';
        res.status(403).json({ message });
    }
};


// === Exports groupés ===
export default {
    authenticate: authenticateToken,
    generateToken,
    checkRole,
    authLogger,
    verifyToken: verifyTokenMiddleware,
    softAuthenticate,
    authenticateComptable,
    authComptable
};