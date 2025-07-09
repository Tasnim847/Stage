import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Entreprise from '../models/Entreprise.js'; // Assure-toi que ce modèle existe

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
            role: user.role,
            version: 2
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// === Middleware principal d'authentification ===
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 'INVALID_HEADER',
            //message: 'En-tête Authorization malformé (Bearer token manquant)'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({
            code: 'MISSING_OR_INVALID_TOKEN',
            message: 'Token JWT manquant ou invalide'
        });
    }

    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
        console.error('❌ Format JWT invalide');
        return res.status(403).json({
            code: 'MALFORMED_TOKEN',
            message: 'Le format du token est invalide'
        });
    }

    try {
        const decoded = await verifyToken(token);
        const user = await User.findByPk(decoded.id, {
           /* include: [{
                model: Entreprise,
                as: 'entreprises',
                required: false,
                attributes: ['id']
            }]*/
        });

        if (!user) {
            return res.status(403).json({
                code: 'USER_NOT_FOUND',
                message: 'Compte utilisateur introuvable'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            ...(user.role === 'entreprise' && user.entreprises?.length > 0 && {
                entrepriseId: user.entreprises[0].id
            })
        };

        next();
    } catch (error) {
        console.error('Erreur de vérification du token:', {
            name: error.name,
            message: error.message,
            token: token ? `${token.substring(0, 20)}...` : 'null'
        });
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

// === Vérification de rôle ===
export const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                code: 'UNAUTHORIZED',
                message: 'Authentification requise'
            });
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 'FORBIDDEN',
                message: 'Permissions insuffisantes',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// === Logger des requêtes protégées ===
export const authLogger = (req, res, next) => {
    const user = req.user ? req.user.id : 'anonymous';
    console.log(`[AUTH] ${req.method} ${req.originalUrl} - User: ${user}`);
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

// === Authentification souple (ex: afficher infos même si expiré) ===
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

// === Exports groupés ===
export default {
    authenticate: authenticateToken,
    generateToken,
    checkRole,
    authLogger,
    verifyToken: verifyTokenMiddleware,
    softAuthenticate
};
