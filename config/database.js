import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    }
);

// Test de connexion immédiat
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion PostgreSQL établie');
    } catch (error) {
        console.error('❌ Échec de connexion à PostgreSQL:', error.message);
        process.exit(1);
    }
})();

export default sequelize;